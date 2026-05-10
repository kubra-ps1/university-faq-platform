# database.py  (backend/app/database.py)
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# backend/ kök dizinindeki .env dosyasını açıkça yükle
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password123@localhost:5432/university_faq"
)

engine       = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


def get_db():
    """
    FastAPI Dependency Injection için DB oturumu sağlar.
    Her request'te yeni oturum açar, bittikten sonra kapatır.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()