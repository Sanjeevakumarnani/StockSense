from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config.settings import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
