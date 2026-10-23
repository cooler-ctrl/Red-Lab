from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import init_db
from .api.labs import router as labs_router
from .api.runs import router as runs_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(labs_router)
app.include_router(runs_router)

# Mount built frontend SPA if available
if settings.FRONTEND_DIST and (settings.FRONTEND_DIST / "index.html").exists():
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse
    from fastapi import HTTPException

    dist_dir = settings.FRONTEND_DIST
    assets_dir = dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = dist_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")


@app.on_event("startup")
def on_startup():
    init_db()
