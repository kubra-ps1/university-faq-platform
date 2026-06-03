# routers/categories.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth as auth_utils
from ..database import get_db

router = APIRouter(prefix="/api", tags=["Categories"])


@router.get("/categories", tags=["Public"])
def get_categories(db: Session = Depends(get_db)):
    
    cats = db.query(models.Category).all()
    return [
        {
            "id":              c.id,
            "name":            c.name,
            "total_questions": len([q for q in c.questions if q.status == "answered"]),
        }
        for c in cats
    ]


@router.get("/categories/counts", tags=["Public"])
def get_categories_counts(db: Session = Depends(get_db)):
    
    cats = db.query(models.Category).all()
    return [
        {
            "category_id": c.id,
            "count": len([q for q in c.questions if q.status == models.QuestionStatus.answered])
        }
        for c in cats
    ]


@router.post("/categories", response_model=schemas.CategoryOut)
def create_category(
    cat: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
):
    
    if db.query(models.Category).filter(models.Category.name == cat.name).first():
        raise HTTPException(status_code=400, detail="Bu kategori zaten mevcut.")
    new_cat = models.Category(name=cat.name)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return {"id": new_cat.id, "name": new_cat.name, "total_questions": 0}


@router.put("/categories/{category_id}", response_model=schemas.CategoryOut)
def update_category(
    category_id: int,
    cat_in: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin),
):
    
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı.")
        
    existing_cat = db.query(models.Category).filter(models.Category.name == cat_in.name).first()
    if existing_cat and existing_cat.id != category_id:
        raise HTTPException(status_code=400, detail="Bu isimde bir kategori zaten mevcut.")
        
    cat.name = cat_in.name
    db.commit()
    db.refresh(cat)
    return {
        "id": cat.id,
        "name": cat.name,
        "total_questions": len([q for q in cat.questions if q.status == "answered"]),
    }
