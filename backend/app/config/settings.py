import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL") or f"sqlite:///{BASE_DIR / 'stocksense.db'}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024


settings = Settings()
