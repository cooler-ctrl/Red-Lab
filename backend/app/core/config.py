from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    APP_NAME: str = "RedLab"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'redlab.db'}"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

settings = Settings()
