# routers/questions.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session

from .. import models, schemas, auth as auth_utils
from ..database import get_db
from .. import ai_service

router = APIRouter(prefix="/api", tags=["Student"])




@router.get("/faq/search", tags=["Public"])
def search_faq(
    q: str = Query(..., min_length=2, description="Arama sorgusu"),
    db: Session = Depends(get_db),
):

    all_questions = (
        db.query(models.Question)
        .filter(models.Question.status != models.QuestionStatus.rejected)
        .order_by(models.Question.created_at.desc())
        .limit(200) 
        .all()
    )

    questions_payload = [
        {
            "id":            q.id,
            "question_text": q.question_text,
            "answer_text":   q.answer_text,
            "status":        q.status.value,
        }
        for q in all_questions
    ]

    result = ai_service.semantic_search(q, questions_payload)

   
    matched_ids = {item["id"] for item in result["data"]}
    matched_questions = [qq for qq in all_questions if qq.id in matched_ids]

    return {
        "scenario": result["scenario"],
        "type":     result["type"],
        "query":    q,
        "data":     [
            {
                "id":            mq.id,
                "question_text": mq.question_text,
                "answer_text":   mq.answer_text,
                "status":        mq.status.value,
                "category":      mq.category.name if mq.category else None,
                "favorite_count": len(mq.saved_by),
            }
            for mq in matched_questions
        ],
    }


@router.get("/faq/all", tags=["Public"])
def get_all_faq(db: Session = Depends(get_db)):
    """Kategorilere göre gruplandırılmış tüm cevaplanmış soruları döndürür."""
    categories = db.query(models.Category).all()
    return [
        {
            "id":        cat.id,
            "category":  cat.name,
            "questions": [
                q for q in cat.questions
                if q.status == models.QuestionStatus.answered
            ],
        }
        for cat in categories
    ]




@router.post("/questions", response_model=schemas.QuestionDetail)
async def ask_question(
    question: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):

    existing = db.query(models.Question).filter(
        models.Question.question_text == question.question_text
    ).first()
    if existing:
        if existing.status == models.QuestionStatus.rejected:
            raise HTTPException(
                status_code=400,
                detail=existing.ai_reject_reason or "Bu soru daha önce güvenlik politikasına uymadığı için reddedilmiş."
            )
        return existing

  
    moderation = await ai_service.moderate_question(question.question_text)

    if not moderation["isAppropriate"]:
        
        rejected_q = models.Question(
            user_id=current_user.id,
            question_text=question.question_text,
            category_id=question.category_id,
            status=models.QuestionStatus.rejected,
            ai_checked=True,
            ai_reject_reason=moderation.get("reason"),
        )
        db.add(rejected_q)
        db.flush()
        db.add(models.AILog(
            question_id=rejected_q.id,
            action=models.AIAction.rejected,
            confidence=1.0,
            reason=moderation.get("reason"),
        ))
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=moderation.get("reason") or "Sorunuz güvenlik politikasına uymadığı için gönderilemedi."
        )

    
    new_q = models.Question(
        user_id=current_user.id,
        question_text=question.question_text,
        category_id=question.category_id,
        status=models.QuestionStatus.pending,
        ai_checked=True, 
    )
    db.add(new_q)
    db.flush()

    db.add(models.AILog(
        question_id=new_q.id,
        action=models.AIAction.approved,
        confidence=1.0,
        reason=None,
    ))
    db.commit()
    db.refresh(new_q)

   
    ai_service.upsert_question(new_q.id, new_q.question_text, new_q.status.value)

    return new_q


@router.get("/my-questions", response_model=list[schemas.QuestionDetail])
def get_my_questions(
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    
    return db.query(models.Question).filter(
        models.Question.user_id == current_user.id
    ).order_by(models.Question.created_at.desc()).all()


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
   
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Soru bulunamadı.")

    if q.user_id != current_user.id and current_user.role not in ("admin", "staff"):
        raise HTTPException(status_code=403, detail="Bu soruyu silme yetkiniz yok.")

    if q.status == models.QuestionStatus.answered and current_user.role not in ("admin", "staff"):
        raise HTTPException(status_code=400, detail="Cevaplanmış sorular silinemez.")

    db.delete(q)
    db.commit()
    
    
    ai_service.delete_question_from_db(question_id)
    
    return {"message": "Soru silindi.", "id": question_id}




@router.get("/saved-items", response_model=list[schemas.SavedItemOut])
def get_saved_items(
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    
    return db.query(models.SavedItem).filter(
        models.SavedItem.user_id == current_user.id
    ).order_by(models.SavedItem.created_at.desc()).all()


@router.post("/saved-items/{question_id}")
def save_item(
    question_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    
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


@router.delete("/saved-items/{question_id}")
def unsave_item(
    question_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    
    saved = db.query(models.SavedItem).filter(
        models.SavedItem.user_id     == current_user.id,
        models.SavedItem.question_id == question_id,
    ).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Kayıtlı soru bulunamadı.")

    db.delete(saved)
    db.commit()
    return {"message": "Favoriden çıkarıldı.", "question_id": question_id}
