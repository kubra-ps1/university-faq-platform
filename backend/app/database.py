# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://dpu_user:dpu_pass@db:5432/dpu_faq"
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