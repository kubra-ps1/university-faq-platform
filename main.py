# main.py  (kök dizin — backend/app/main.py ile aynı)
from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import os

from . import models, schemas, auth
from .database import engine, get_db, SessionLocal


# ── Uygulama Başlatma ─────────────────────────────────────────────────────────

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


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup_event():
    """Uygulama başladığında tabloları oluştur ve seed verisini yükle."""
    models.Base.metadata.create_all(bind=engine)
    _seed_db()


def _seed_db():
    """Başlangıç verisi — sadece yoksa ekler (idempotent)."""
    db = SessionLocal()
    try:
        # Admin kullanıcısı
        if not db.query(models.User).filter(models.User.email == "admin@dpu.edu.tr").first():
            db.add(models.User(
                email="admin@dpu.edu.tr",
                full_name="Sistem Yöneticisi",
                hashed_password=auth.get_password_hash("admin123"),
                role=models.UserRole.admin,
                is_active=True,
            ))

        # Test öğrencisi
        if not db.query(models.User).filter(models.User.email == "ogrenci@dpu.edu.tr").first():
            db.add(models.User(
                email="ogrenci@dpu.edu.tr",
                full_name="Ahmet Yılmaz",
                faculty="Mühendislik Fakültesi",
                department="Bilgisayar Mühendisliği",
                hashed_password=auth.get_password_hash("ogrenci123"),
                role=models.UserRole.student,
                is_active=True,
            ))

        # Kategoriler
        for cat_name in ["Kayıt İşlemleri", "Yemekhane", "Kütüphane", "Burslar", "Yurtlar", "Sınav Takvimi"]:
            if not db.query(models.Category).filter(models.Category.name == cat_name).first():
                db.add(models.Category(name=cat_name))

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Seed hatası: {e}")
    finally:
        db.close()


# ── Yardımcı Fonksiyonlar ──────────────────────────────────────────────────────

BAD_WORDS = ["aptal", "gerizekalı", "salak", "mal", "eşek", "ahmak"]

def _check_rudeness(text: str) -> bool:
    """Kaba dil kontrolü yapar."""
    return any(word in text.lower() for word in BAD_WORDS)


def _find_similar_questions(text: str, db: Session):
    """Basit keyword eşleştirme ile benzer cevaplanmış soruları bulur."""
    keywords = [w for w in text.lower().split() if len(w) > 3]
    all_answered = db.query(models.Question).filter(
        models.Question.status == models.QuestionStatus.answered
    ).all()

    scored = []
    for q in all_answered:
        score = sum(1 for kw in keywords if kw in q.question_text.lower())
        if score > 0:
            scored.append((q, score))

    return [q for q, _ in sorted(scored, key=lambda x: x[1], reverse=True)[:10]]


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/register", response_model=schemas.Token, tags=["Auth"])
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """Yeni kullanıcı kaydı."""
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kayıtlı.",
        )

    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=auth.get_password_hash(user_in.password),
        role=user_in.role.value,
        faculty=user_in.faculty,
        department=user_in.department,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token({
        "sub":     new_user.email,
        "role":    new_user.role,
        "user_id": new_user.id,
    })
    return {"access_token": token, "token_type": "bearer", "user": new_user}


@app.post("/api/login", response_model=schemas.Token, tags=["Auth"])
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """Kullanıcı girişi — JWT token döndürür."""
    user = db.query(models.User).filter(models.User.email == form_data.email).first()

    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı e-posta veya şifre.",
        )

    if user.role != form_data.role.value:
        role_tr = "Öğrenci" if user.role == "student" else "Yönetici"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Bu hesap bir {role_tr} hesabı. Lütfen doğru giriş sekmesini kullanın.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız devre dışı bırakılmış. Yönetici ile iletişime geçin.",
        )

    token = auth.create_access_token({
        "sub":     user.email,
        "role":    user.role,
        "user_id": user.id,
    })
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/api/me", response_model=schemas.UserOut, tags=["Auth"])
def get_me(current_user=Depends(auth.get_current_user)):
    """Token'dan mevcut kullanıcı bilgilerini döndürür."""
    return current_user


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/faq/search", tags=["Public"])
def search_faq(q: str, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    """Benzer cevaplanmış soruları arar ve arama kaydeder."""
    similar = _find_similar_questions(q, db)

    log = models.SearchLog(
        query=q,
        user_id=current_user.id,
        result_count=len(similar),
    )
    db.add(log)
    db.commit()

    return similar


@app.get("/api/faq/search/public", tags=["Public"])
def search_faq_public(q: str, db: Session = Depends(get_db)):
    """Giriş yapmadan arama — kayıt tutulmaz."""
    return _find_similar_questions(q, db)


@app.get("/api/faq/all", tags=["Public"])
def get_all_faq(db: Session = Depends(get_db)):
    """Kategorilere göre gruplandırılmış tüm cevaplanmış soruları döndürür."""
    categories = db.query(models.Category).all()
    return [
        {
            "id":       cat.id,
            "category": cat.name,
            "questions": [
                q for q in cat.questions
                if q.status == models.QuestionStatus.answered
            ],
        }
        for cat in categories
    ]


@app.get("/api/categories", tags=["Public"])
def get_categories(db: Session = Depends(get_db)):
    """Tüm kategorileri ve soru sayılarını döndürür."""
    cats = db.query(models.Category).all()
    return [
        {
            "id":              c.id,
            "name":            c.name,
            "total_questions": len(c.questions),
        }
        for c in cats
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# STUDENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/questions", response_model=schemas.QuestionDetail, tags=["Student"])
def ask_question(
    question:     schemas.QuestionCreate,
    db:           Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    """Öğrenci soru sorar. Kaba dil ve tekrar kontrolü yapılır."""
    if _check_rudeness(question.question_text):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sorunuzda uygunsuz ifadeler tespit edildi. Lütfen nazik bir dil kullanın.",
        )

    # Tam kopya kontrolü
    existing = db.query(models.Question).filter(
        models.Question.question_text == question.question_text
    ).first()
    if existing:
        return existing

    # Yeni soru oluştur
    new_q = models.Question(
        user_id=current_user.id,
        question_text=question.question_text,
        category_id=question.category_id,
        status=models.QuestionStatus.pending,
        ai_checked=True,
    )
    db.add(new_q)
    db.flush()

    # AI log kaydı
    db.add(models.AILog(
        question_id=new_q.id,
        action=models.AIAction.approved,
        confidence=1.0,
        reason=None,
    ))
    db.commit()
    db.refresh(new_q)
    return new_q


@app.get("/api/my-questions", response_model=list[schemas.QuestionDetail], tags=["Student"])
def get_my_questions(
    db:           Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    """Giriş yapmış öğrencinin sorularını döndürür."""
    return db.query(models.Question).filter(
        models.Question.user_id == current_user.id
    ).order_by(models.Question.created_at.desc()).all()


@app.delete("/api/questions/{question_id}", tags=["Student"])
def delete_question(
    question_id:  int,
    db:           Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    """Öğrenci kendi sorusunu siler (sadece pending iken)."""
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    if q.user_id != current_user.id and current_user.role not in ("admin", "staff"):
        raise HTTPException(status_code=403, detail="Bu soruyu silme yetkiniz yok.")

    if q.status == models.QuestionStatus.answered and current_user.role not in ("admin", "staff"):
        raise HTTPException(status_code=400, detail="Cevaplanmış sorular silinemez.")

    db.delete(q)
    db.commit()
    return {"message": "Soru silindi.", "id": question_id}


@app.get("/api/saved-items", response_model=list[schemas.SavedItemOut], tags=["Student"])
def get_saved_items(
    db:           Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    """Öğrencinin kaydettiği soruları döndürür."""
    return db.query(models.SavedItem).filter(
        models.SavedItem.user_id == current_user.id
    ).order_by(models.SavedItem.created_at.desc()).all()


@app.post("/api/saved-items/{question_id}", tags=["Student"])
def save_item(
    question_id:  int,
    db:           Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    """Soruyu favorilere ekler."""
    existing = db.query(models.SavedItem).filter(
        models.SavedItem.user_id     == current_user.id,
        models.SavedItem.question_id == question_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu soru zaten kaydedilmiş.")

    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    saved = models.SavedItem(user_id=current_user.id, question_id=question_id)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved


@app.delete("/api/saved-items/{question_id}", tags=["Student"])
def unsave_item(
    question_id:  int,
    db:           Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    """Soruyu favorilerden çıkarır."""
    saved = db.query(models.SavedItem).filter(
        models.SavedItem.user_id     == current_user.id,
        models.SavedItem.question_id == question_id,
    ).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Kayıtlı soru bulunamadı.")

    db.delete(saved)
    db.commit()
    return {"message": "Favoriden çıkarıldı.", "question_id": question_id}


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/admin/stats", response_model=schemas.Stats, tags=["Admin"])
def get_stats(
    db:    Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
):
    """Admin istatistik paneli."""
    total_q    = db.query(models.Question).count()
    pending_q  = db.query(models.Question).filter(models.Question.status == "pending").count()
    answered_q = db.query(models.Question).filter(models.Question.status == "answered").count()
    rejected_q = db.query(models.Question).filter(models.Question.status == "rejected").count()
    total_s    = db.query(models.User).filter(models.User.role == "student").count()

    # En çok aranan kelimeler
    words = db.query(models.SearchLog.query).all()
    word_counts: dict = {}
    for (w,) in words:
        for word in w.lower().split():
            if len(word) > 2:
                word_counts[word] = word_counts.get(word, 0) + 1
    most_searched = [
        {"word": k, "count": v}
        for k, v in sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    # Son 7 günlük gerçek trafik
    traffic = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        count = db.query(models.SearchLog).filter(
            models.SearchLog.created_at >= day.replace(hour=0, minute=0, second=0),
            models.SearchLog.created_at <  day.replace(hour=23, minute=59, second=59),
        ).count()
        traffic.append({"date": day_str, "count": count})

    return {
        "total_questions":     total_q,
        "pending_questions":   pending_q,
        "answered_questions":  answered_q,
        "rejected_questions":  rejected_q,
        "total_students":      total_s,
        "most_searched_words": most_searched,
        "weekly_traffic":      traffic,
    }


@app.get("/api/admin/pending", tags=["Admin"])
def get_admin_pending(
    db:    Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
):
    """Bekleyen soruları döndürür — admin incelemesi için."""
    questions = db.query(models.Question).filter(
        models.Question.status == models.QuestionStatus.pending
    ).order_by(models.Question.created_at.asc()).all()

    return [
        {
            "id":            q.id,
            "question_text": q.question_text,
            "student_name":  q.user.full_name if q.user else "Bilinmiyor",
            "faculty":       q.user.faculty if q.user else None,
            "department":    q.user.department if q.user else None,
            "category":      q.category.name if q.category else None,
            "date":          q.created_at,
            "ai_checked":    q.ai_checked,
        }
        for q in questions
    ]


@app.patch("/api/questions/{question_id}/answer", response_model=schemas.QuestionDetail, tags=["Admin"])
def answer_question(
    question_id: int,
    answer:      schemas.QuestionAnswer,
    db:          Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
):
    """Admin soruyu cevaplar."""
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    q.answer_text = answer.answer_text
    q.status      = models.QuestionStatus.answered
    q.answered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(q)
    return q


@app.patch("/api/questions/{question_id}/reject", response_model=schemas.QuestionDetail, tags=["Admin"])
def reject_question(
    question_id: int,
    body:        schemas.QuestionReject = schemas.QuestionReject(),
    db:          Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
):
    """Admin soruyu reddeder."""
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    q.status           = models.QuestionStatus.rejected
    q.ai_reject_reason = body.reason
    db.commit()
    db.refresh(q)
    return q


@app.get("/api/pool", tags=["Admin"])
def get_question_pool(
    db:    Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
    skip:  int = 0,
    limit: int = 50,
):
    """Tüm soruların havuzunu döndürür — admin yönetim ekranı."""
    questions = db.query(models.Question).order_by(
        models.Question.created_at.desc()
    ).offset(skip).limit(limit).all()

    return [
        {
            "id":            q.id,
            "question_text": q.question_text,
            "answer_text":   q.answer_text,
            "student_name":  q.user.full_name if q.user else "Bilinmiyor",
            "category":      q.category.name if q.category else None,
            "date":          q.created_at,
            "answered_at":   q.answered_at,
            "status":        q.status,
            "ai_checked":    q.ai_checked,
        }
        for q in questions
    ]


# ── Kategori Yönetimi ─────────────────────────────────────────────────────────

@app.post("/api/categories", response_model=schemas.CategoryOut, tags=["Admin"])
def create_category(
    cat:   schemas.CategoryCreate,
    db:    Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
):
    """Yeni kategori oluşturur."""
    if db.query(models.Category).filter(models.Category.name == cat.name).first():
        raise HTTPException(status_code=400, detail="Bu kategori zaten mevcut.")
    new_cat = models.Category(name=cat.name)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return {"id": new_cat.id, "name": new_cat.name, "total_questions": 0}


@app.delete("/api/categories/{category_id}", tags=["Admin"])
def delete_category(
    category_id: int,
    db:          Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
):
    """Kategoriyi siler."""
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı.")
    db.delete(cat)
    db.commit()
    return {"message": "Kategori silindi.", "id": category_id}


# ── AI Logs ───────────────────────────────────────────────────────────────────

@app.get("/api/admin/ai-logs", response_model=list[schemas.AILogOut], tags=["Admin"])
def get_ai_logs(
    db:    Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
    skip:  int = 0,
    limit: int = 100,
):
    """AI moderasyon geçmişini döndürür."""
    return db.query(models.AILog).order_by(
        models.AILog.processed_at.desc()
    ).offset(skip).limit(limit).all()


# ── Sağlık Kontrolü ───────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "DPÜ SSS Platform API"}