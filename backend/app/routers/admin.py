# routers/admin.py
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas, auth as auth_utils
from ..database import get_db
from .. import ai_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=schemas.Stats)
def get_stats(
    min_favorites: int = Query(2, description="Minimum favori sayısı"),
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
):
    """Admin istatistik paneli."""
    from sqlalchemy import func

    total_q    = db.query(models.Question).count()
    total_s    = db.query(models.User).filter(models.User.role == "student").count()

    # Favori sayısı en az min_favorites olan, cevaplanmayı bekleyen sorular
    subq = (
        db.query(models.SavedItem.question_id)
        .group_by(models.SavedItem.question_id)
        .having(func.count(models.SavedItem.id) >= min_favorites)
        .subquery()
    )
    pending_q = (
        db.query(models.Question)
        .join(subq, models.Question.id == subq.c.question_id)
        .filter(models.Question.status == "pending")
        .count()
    )

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

    traffic = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        # haftalık soru sayısını günlere göre veren çizgi grafiği
        count = db.query(models.Question).filter(
            models.Question.created_at >= day.replace(hour=0, minute=0, second=0),
            models.Question.created_at <  day.replace(hour=23, minute=59, second=59),
        ).count()
        traffic.append({"date": day_str, "count": count})

    return {
        "total_questions":     total_q,
        "pending_questions":   pending_q,
        "total_students":      total_s,
        "most_searched_words": most_searched,
        "weekly_traffic":      traffic,
    }


@router.get("/pending", response_model=list[schemas.AdminQuestionOut])
def get_admin_pending(
    min_favorites: int = Query(2, description="Minimum favori sayısı"),
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
):
    """Bekleyen soruları döndürür — admin incelemesi için."""
    from sqlalchemy import func

    subq = (
        db.query(models.SavedItem.question_id)
        .group_by(models.SavedItem.question_id)
        .having(func.count(models.SavedItem.id) >= min_favorites)
        .subquery()
    )

    questions = (
        db.query(models.Question, func.count(models.SavedItem.id).label('favorite_count'))
        .join(subq, models.Question.id == subq.c.question_id)
        .outerjoin(models.SavedItem, models.Question.id == models.SavedItem.question_id)
        .filter(models.Question.status == models.QuestionStatus.pending)
        .group_by(models.Question.id)
        .order_by(models.Question.created_at.asc())
        .all()
    )

    return [
        {
            "id":            q.Question.id,
            "question_text": q.Question.question_text,
            "answer_text":   q.Question.answer_text,
            "student_name":  q.Question.user.full_name if q.Question.user else "Bilinmiyor",
            "faculty":       q.Question.user.faculty if q.Question.user else None,
            "department":    q.Question.user.department if q.Question.user else None,
            "category":      q.Question.category.name if q.Question.category else None,
            "date":          q.Question.created_at,
            "answered_at":   q.Question.answered_at,
            "status":        q.Question.status,
            "ai_checked":    q.Question.ai_checked,
            "favorite_count": q.favorite_count,
        }
        for q in questions
    ]


@router.patch("/questions/{question_id}/answer", response_model=schemas.QuestionDetail)
def answer_question(
    question_id: int,
    answer: schemas.QuestionAnswer,
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
):
    """Admin soruyu cevaplar."""
    from .. import models as _m
    q = db.query(_m.Question).filter(_m.Question.id == question_id).first()
    if not q:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    q.answer_text = answer.answer_text
    q.status      = _m.QuestionStatus.answered
    q.answered_at = datetime.now(timezone.utc)

    # Admin'in normalize ettiği soru metnini kaydet
    if answer.normalized_text and answer.normalized_text.strip():
        q.question_text = answer.normalized_text.strip()

    # Admin'in seçtiği kategoriyi kaydet
    if answer.category_id is not None:
        q.category_id = answer.category_id

    db.commit()
    db.refresh(q)
    
    # ChromaDB'ye normalize metni indexle
    ai_service.upsert_question(q.id, q.question_text, q.status.value)
    
    return q


@router.patch("/questions/{question_id}/reject", response_model=schemas.QuestionDetail)
def reject_question(
    question_id: int,
    body: schemas.QuestionReject = schemas.QuestionReject(),
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
):
    """Admin soruyu reddeder."""
    from .. import models as _m
    from fastapi import HTTPException
    q = db.query(_m.Question).filter(_m.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    q.status           = _m.QuestionStatus.rejected
    q.ai_reject_reason = body.reason
    db.commit()
    db.refresh(q)
    
    # Reddedilen soruyu arama havuzundan (ChromaDB) çıkar
    ai_service.delete_question_from_db(question_id)
    
    return q


@router.get("/pool", response_model=list[schemas.AdminQuestionOut])
def get_question_pool(
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
    skip: int = 0,
    limit: int = 50,
):
    """Tüm soruların havuzunu (sadece pending) döndürür — admin yönetim ekranı."""
    from sqlalchemy import func
    questions = (
        db.query(models.Question, func.count(models.SavedItem.id).label('favorite_count'))
        .outerjoin(models.SavedItem, models.Question.id == models.SavedItem.question_id)
        .filter(models.Question.status == models.QuestionStatus.pending)
        .group_by(models.Question.id)
        .order_by(models.Question.created_at.desc())
        .offset(skip).limit(limit).all()
    )

    return [
        {
            "id":            q.Question.id,
            "question_text": q.Question.question_text,
            "answer_text":   q.Question.answer_text,
            "student_name":  q.Question.user.full_name if q.Question.user else "Bilinmiyor",
            "faculty":       q.Question.user.faculty if q.Question.user else None,
            "department":    q.Question.user.department if q.Question.user else None,
            "category":      q.Question.category.name if q.Question.category else None,
            "date":          q.Question.created_at,
            "answered_at":   q.Question.answered_at,
            "status":        q.Question.status,
            "ai_checked":    q.Question.ai_checked,
            "favorite_count": q.favorite_count,
        }
        for q in questions
    ]


@router.get("/faq", response_model=list[schemas.AdminQuestionOut])
def get_admin_faq(
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
    skip: int = 0,
    limit: int = 50,
):
    """Sadece cevaplanmış SSS'leri döndürür — admin paneli için."""
    from sqlalchemy import func
    questions = (
        db.query(models.Question, func.count(models.SavedItem.id).label('favorite_count'))
        .outerjoin(models.SavedItem, models.Question.id == models.SavedItem.question_id)
        .filter(models.Question.status == models.QuestionStatus.answered)
        .group_by(models.Question.id)
        .order_by(models.Question.created_at.desc())
        .offset(skip).limit(limit).all()
    )

    return [
        {
            "id":            q.Question.id,
            "question_text": q.Question.question_text,
            "answer_text":   q.Question.answer_text,
            "student_name":  q.Question.user.full_name if q.Question.user else "Bilinmiyor",
            "faculty":       q.Question.user.faculty if q.Question.user else None,
            "department":    q.Question.user.department if q.Question.user else None,
            "category":      q.Question.category.name if q.Question.category else None,
            "date":          q.Question.created_at,
            "answered_at":   q.Question.answered_at,
            "status":        q.Question.status,
            "ai_checked":    q.Question.ai_checked,
            "favorite_count": q.favorite_count,
        }
        for q in questions
    ]


@router.post("/faq", response_model=schemas.QuestionDetail)
def create_admin_faq(
    faq_in: schemas.AdminFAQCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Admin tarafından doğrudan SSS oluşturulur."""
    if current_user.role not in ("admin", "staff"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Yetkiniz yok.")
        
    new_q = models.Question(
        user_id=current_user.id,
        question_text=faq_in.question_text,
        answer_text=faq_in.answer_text,
        category_id=faq_in.category_id,
        status=models.QuestionStatus.answered,
        ai_checked=True,
        answered_at=datetime.now(timezone.utc)
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    
    ai_service.upsert_question(new_q.id, new_q.question_text, new_q.status.value)
    
    return new_q


@router.put("/questions/{question_id}", response_model=schemas.QuestionDetail)
def update_admin_question(
    question_id: int,
    faq_in: schemas.AdminFAQUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
):
    """Mevcut bir soruyu (SSS veya havuz) düzenler."""
    from fastapi import HTTPException
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    if faq_in.question_text is not None:
        q.question_text = faq_in.question_text
    if faq_in.answer_text is not None:
        q.answer_text = faq_in.answer_text
        if q.status != models.QuestionStatus.answered:
            q.status = models.QuestionStatus.answered
            q.answered_at = datetime.now(timezone.utc)
    if faq_in.category_id is not None:
        q.category_id = faq_in.category_id

    db.commit()
    db.refresh(q)
    
    ai_service.upsert_question(q.id, q.question_text, q.status.value)
    
    return q


@router.delete("/questions/{question_id}")
def delete_admin_question(
    question_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
):
    """Admin yetkisiyle soruyu siler."""
    from fastapi import HTTPException
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    db.delete(q)
    db.commit()
    
    ai_service.delete_question_from_db(question_id)
    
    return {"message": "Soru başarıyla silindi.", "id": question_id}


@router.get("/ai-logs", response_model=list[schemas.AILogOut])
def get_ai_logs(
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
    skip: int = 0,
    limit: int = 100,
):
    """AI moderasyon geçmişini döndürür."""
    return db.query(models.AILog).order_by(
        models.AILog.processed_at.desc()
    ).offset(skip).limit(limit).all()


@router.get("/ai/prepare/{question_id}")
async def prepare_question_for_admin(
    question_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
):
    """
    Admin "Cevapla" butonuna bastığında çağrılır.
    Gemini'den normalize edilmiş soru metni + kategori önerisi alır.
    Admin her iki alanı da düzenleyebilir.
    """
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    # Mevcut kategorileri çek
    categories = db.query(models.Category).all()
    category_names = [c.name for c in categories]
    category_map   = {c.name: c.id for c in categories}

    # Gemini'ye gönder (Asenkron)
    result = await ai_service.prepare_for_admin(q.question_text, category_names)

    # Önerilen kategorinin ID'sini bul
    suggested_name = result["suggestedCategory"]
    suggested_id   = category_map.get(suggested_name)

    return {
        "question_id":         question_id,
        "original_text":       q.question_text,
        "normalizedQuestion":  result["normalizedQuestion"],
        "suggestedCategory":   suggested_name,
        "suggestedCategoryId": suggested_id,
        "isNewCategory":       result.get("isNewCategory", False),
        "confidence":          result["confidence"],
    }
