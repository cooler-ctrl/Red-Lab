import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def get_default_database_url() -> str:
    if "REDLAB_DATABASE_URL" in os.environ:
        return os.environ["REDLAB_DATABASE_URL"]
    if "REDLAB_DATA_DIR" in os.environ:
        data_dir = Path(os.environ["REDLAB_DATA_DIR"])
        data_dir.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{data_dir / 'redlab.db'}"
    return f"sqlite:///{BASE_DIR / 'redlab.db'}"


def get_frontend_dist() -> Path | None:
    if "REDLAB_FRONTEND_DIST" in os.environ:
        candidate = Path(os.environ["REDLAB_FRONTEND_DIST"])
        if candidate.exists():
            return candidate

    # PyInstaller bundled location
    if hasattr(sys, "_MEIPASS"):
        candidate = Path(sys._MEIPASS) / "frontend" / "dist"
        if candidate.exists():
            return candidate

    # Next to executable location
    exec_candidate = Path(sys.executable).parent / "frontend" / "dist"
    if exec_candidate.exists():
        return exec_candidate

    # Development repository location
    repo_candidate = BASE_DIR.parent / "frontend" / "dist"
    if repo_candidate.exists():
        return repo_candidate

    return None


class Settings:
    APP_NAME: str = "RedLab"
    VERSION: str = "1.1.0"
    DEBUG: bool = os.environ.get("REDLAB_DEBUG", "True").lower() in ("true", "1")
    DATABASE_URL: str = get_default_database_url()
    FRONTEND_DIST: Path | None = get_frontend_dist()
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "app://-",
        "http://localhost",
        "http://127.0.0.1",
    ]


settings = Settings()

