import sys
import os
import argparse
import multiprocessing

# Required for PyInstaller frozen execution (especially on Windows)
if __name__ == "__main__":
    multiprocessing.freeze_support()

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def main():
    parser = argparse.ArgumentParser(description="RedLab Desktop Server")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)), help="Port to bind to")
    parser.add_argument("--host", type=str, default=os.environ.get("HOST", "127.0.0.1"), help="Host to bind to")
    parser.add_argument("--data-dir", type=str, default=None, help="Directory to store redlab.db")
    parser.add_argument("--frontend-dist", type=str, default=None, help="Path to built frontend dist directory")
    args = parser.parse_args()

    if args.data_dir:
        os.environ["REDLAB_DATA_DIR"] = os.path.abspath(args.data_dir)
    if args.frontend_dist:
        os.environ["REDLAB_FRONTEND_DIST"] = os.path.abspath(args.frontend_dist)
    os.environ["PORT"] = str(args.port)
    os.environ["HOST"] = args.host

    # Lazy import app and uvicorn after environment variables are populated
    import uvicorn
    from app.main import app

    print(f"[RedLab Backend] Starting server on http://{args.host}:{args.port} (PID: {os.getpid()})", flush=True)
    uvicorn.run(app, host=args.host, port=args.port, log_level="warning", access_log=False)


if __name__ == "__main__":
    main()
