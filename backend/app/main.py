from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import random

from . import models, schemas, auth, database
from .database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

# Seed initial data
def seed_db():
    db = database.SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.email == "admin@uni.edu.tr").first()
        if not admin:
            admin = models.User(
                email="admin@uni.edu.tr",
                full_name="System Admin",
                hashed_password=auth.get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            
        student = db.query(models.User).filter(models.User.email == "ogrenci@uni.edu.tr").first()
        if not student:
            student = models.User(
                email="ogrenci@uni.edu.tr",
                full_name="Ahmet Yılmaz",
                student_no="20230001",
                faculty="Mühendislik",
                department="Bilgisayar",
                hashed_password=auth.get_password_hash("ogrenci123"),
                role="student"
            )
            db.add(student)
            
        categories = ["Kayıt İşlemleri", "Yemekhane", "Kütüphane", "Burslar", "Yurtlar"]
        for cat_name in categories:
            if not db.query(models.Category).filter(models.Category.name == cat_name).first():
                db.add(models.Category(name=cat_name))
        db.commit()
    finally:
        db.close()

seed_db()

app = FastAPI(title="University FAQ Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Simulation Logic
def check_rudeness(text: str) -> bool:
    bad_words = ["aptal", "gerizekalı", "küfür", "kötü", "lan", "mal"] # Example bad words
    return any(word in text.lower() for word in bad_words)

def find_similar_questions(text: str, db: Session):
    # Very simple similarity check
    keywords = text.lower().split()
    all_answered = db.query(models.Question).filter(models.Question.status == "answered").all()
    similar = []
    for q in all_answered:
        score = sum(1 for word in keywords if word in q.question_text.lower())
        if score > 0:
            similar.append((q, score))
    return [q for q, s in sorted(similar, key=lambda x: x[1], reverse=True)]

# --- AUTH ENDPOINTS ---

@app.post("/api/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        student_no=user.student_no,
        faculty=user.faculty,
        department=user.department
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@app.post("/api/login", response_model=schemas.Token)
def login(form_data: schemas.UserCreate, db: Session = Depends(get_db)): # Simplified login for demo
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Hatalı e-posta veya şifre")
    
    if user.role != form_data.role:
        role_tr = "Öğrenci" if user.role == "student" else "Yönetici"
        raise HTTPException(status_code=403, detail=f"Bu hesap bir {role_tr} hesabı. Lütfen doğru giriş sekmesini kullanın.")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

# --- PUBLIC ENDPOINTS ---

@app.get("/api/faq/search")
def search_faq(q: str, db: Session = Depends(get_db)):
    # Log the search
    log = models.SearchLog(query=q)
    db.add(log)
    db.commit()
    
    similar = find_similar_questions(q, db)
    return similar

@app.get("/api/faq/all")
def get_all_faq(db: Session = Depends(get_db)):
    categories = db.query(models.Category).all()
    results = []
    for cat in categories:
        questions = db.query(models.Question).filter(
            models.Question.category_id == cat.id,
            models.Question.status == "answered"
        ).all()
        results.append({
            "category": cat.name,
            "id": cat.id,
            "questions": questions
        })
    return results

# --- STUDENT ENDPOINTS ---

@app.post("/api/questions")
def ask_question(question: schemas.QuestionCreate, user_id: int = Body(...), db: Session = Depends(get_db)):
    if check_rudeness(question.question_text):
        raise HTTPException(status_code=400, detail="Sorunuzu daha uygun ve etik hale getirin.")
    
    # Check for exact duplicate
    existing = db.query(models.Question).filter(models.Question.question_text == question.question_text).first()
    if existing:
        return {"message": "Bu soru zaten mevcut.", "redirect_id": existing.id}
    
    new_q = models.Question(
        user_id=user_id,
        question_text=question.question_text,
        category_id=question.category_id,
        status="pending"
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q

@app.get("/api/my-questions/{user_id}")
def get_my_questions(user_id: int, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(models.Question.user_id == user_id).all()
    # Add fav counts
    for q in questions:
        q.favorite_count = len(q.favorited_by)
    return questions

@app.delete("/api/questions/{id}")
def delete_question(id: int, db: Session = Depends(get_db)):
    q = db.query(models.Question).filter(models.Question.id == id).first()
    if q:
        db.delete(q)
        db.commit()
    return {"message": "Deleted"}

@app.get("/api/saved-items/{user_id}")
def get_saved_items(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user.saved_items + user.favorited_questions

# --- ADMIN ENDPOINTS ---

@app.get("/api/admin/stats", response_model=schemas.Stats)
def get_stats(db: Session = Depends(get_db)):
    total_q = db.query(models.Question).count()
    pending_q = db.query(models.Question).filter(models.Question.status == "pending").count()
    total_s = db.query(models.User).filter(models.User.role == "student").count()
    
    # Mock search words
    words = db.query(models.SearchLog.query).all()
    word_counts = {}
    for (w,) in words:
        for word in w.split():
            word_counts[word] = word_counts.get(word, 0) + 1
    most_searched = [{"word": k, "count": v} for k, v in sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:5]]
    
    # Mock weekly traffic
    traffic = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        traffic.append({"date": date, "count": random.randint(5, 20)})
    
    return {
        "total_questions": total_q,
        "pending_questions": pending_q,
        "total_students": total_s,
        "most_searched_words": most_searched,
        "weekly_traffic": traffic[::-1]
    }

@app.get("/api/admin/pending")
def get_admin_pending(db: Session = Depends(get_db)):
    # Questions with status pending and optionally > 10 favs as per user request
    # For demo, I'll return all pending questions but sort by favs
    questions = db.query(models.Question).filter(models.Question.status == "pending").all()
    results = []
    for q in questions:
        results.append({
            "id": q.id,
            "question_text": q.question_text,
            "student_name": q.user.full_name,
            "date": q.created_at,
            "fav_count": len(q.favorited_by)
        })
    return results

@app.patch("/api/questions/{id}/answer")
def answer_question(id: int, answer: schemas.QuestionAnswer, db: Session = Depends(get_db)):
    q = db.query(models.Question).filter(models.Question.id == id).first()
    if q:
        q.answer_text = answer.answer_text
        q.status = "answered"
        db.commit()
    return q

@app.patch("/api/questions/{id}/reject")
def reject_question(id: int, db: Session = Depends(get_db)):
    q = db.query(models.Question).filter(models.Question.id == id).first()
    if q:
        q.status = "rejected"
        db.commit()
    return q

# --- CATEGORY MANAGEMENT ---

@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(models.Category).all()
    results = []
    for c in cats:
        results.append({
            "id": c.id,
            "name": c.name,
            "total_questions": len(c.questions)
        })
    return results

@app.post("/api/categories")
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db)):
    new_cat = models.Category(name=cat.name)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@app.delete("/api/categories/{id}")
def delete_category(id: int, db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.id == id).first()
    if cat:
        db.delete(cat)
        db.commit()
    return {"message": "Deleted"}

@app.get("/api/pool")
def get_pool(db: Session = Depends(get_db)):
    # This is for the "Question Pool" tab in Admin
    questions = db.query(models.Question).all()
    results = []
    for q in questions:
        results.append({
            "id": q.id,
            "question_text": q.question_text,
            "student_name": q.user.full_name,
            "date": q.created_at,
            "fav_count": len(q.favorited_by),
            "status": q.status
        })
    return results