# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from datetime import datetime, timezone

from .. import models, schemas, auth as auth_utils
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])



@router.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Yeni kullanıcı kaydı.
    Şifreyi bcrypt ile hashleyip veritabanına kaydeder,
    ardından JWT access token döndürür.
    """
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kayıtlı.",
        )

    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=auth_utils.get_password_hash(user_in.password),
        role=user_in.role.value,
        faculty=user_in.faculty,
        department=user_in.department,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth_utils.create_access_token({
        "sub":     new_user.email,
        "role":    new_user.role,
        "user_id": new_user.id,
    })
    return {"access_token": token, "token_type": "bearer", "user": new_user}


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Kullanıcı girişi — OAuth2PasswordRequestForm (username = e-posta).
    Swagger UI'da 'Authorize' butonu ile doğrudan test edilebilir.
    """
    user = db.query(models.User).filter(
        models.User.email == form_data.username
    ).first()

    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı e-posta veya şifre.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız devre dışı bırakılmış. Yönetici ile iletişime geçin.",
        )

    token = auth_utils.create_access_token({
        "sub":     user.email,
        "role":    user.role,
        "user_id": user.id,
    })
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user=Depends(auth_utils.get_current_user)):
    """Token'dan mevcut kullanıcı bilgilerini döndürür."""
    return current_user


@router.post("/change-password")
def change_password(
    data: schemas.UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Kullanıcı şifresini günceller."""
    if not auth_utils.verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifreniz hatalı.",
        )
    
    current_user.hashed_password = auth_utils.get_password_hash(data.new_password)
    db.commit()
    return {"message": "Şifreniz başarıyla güncellendi."}


class UserIdRequest(BaseModel):
    user_id: int

@router.post("/user", response_model=schemas.UserOut)
def get_user_by_id(
    request: UserIdRequest,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user)
):
    """Verilen ID'ye sahip kullanıcıyı döndürür."""
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    return user

@router.post("/users/all", response_model=list[schemas.UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user)
):
    """Sistemdeki tüm kullanıcıları döndürür."""
    users = db.query(models.User).all()
    return users

@router.delete("/user/{user_id}")
def delete_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(auth_utils.require_admin)
):
    """(Sadece Admin) Verilen ID'ye sahip kullanıcıyı siler."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    
    db.delete(user)
    db.commit()
    return {"message": f"Kullanıcı (ID: {user_id}) başarıyla silindi."}
