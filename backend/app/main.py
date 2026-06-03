# main.py  (backend/app/main.py)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from . import models, auth
from .database import engine, SessionLocal
from .routers import auth as auth_router
from .routers import questions as questions_router
from .routers import categories as categories_router
from .routers import admin as admin_router
from .seed import run_seed




app = FastAPI(
    title="DPÜ SSS Platform API",
    description="Dumlupınar Üniversitesi Sık Sorulan Sorular Platformu Backend API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(auth_router.router)
app.include_router(questions_router.router)
app.include_router(categories_router.router)
app.include_router(admin_router.router)



@app.on_event("startup")
def startup_event():
    """Uygulama başladığında tabloları oluştur ve seed verisini yükle."""
    models.Base.metadata.create_all(bind=engine)
    run_seed()


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "DPÜ SSS Platform API"}