# auth.py  (kök dizin — backend/app/auth.py ile aynı)
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os

from .database import get_db

# ── Config ───────────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY ortam değişkeni ayarlanmamış! "
        "backend/.env dosyasına SECRET_KEY=... ekleyin."
    )

ALGORITHM                   = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Şifre İşlemleri ──────────────────────────────────────────────────────────

def verify_password(plain: str, hashed: str) -> bool:
    """Düz metin şifreyi hash ile karşılaştırır."""
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    """Şifreyi bcrypt ile hash'ler."""
    return pwd_context.hash(password)


# ── JWT Token İşlemleri ───────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT access token oluşturur.
    data: {"sub": user_email, "role": user_role, "user_id": user_id}
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """
    JWT token'ı decode eder ve payload döndürür.
    Geçersiz veya süresi dolmuşsa HTTPException fırlatır.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik bilgileri doğrulanamadı.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# ── Dependency: Mevcut Kullanıcı ─────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db:    Session = Depends(get_db),
):
    """
    Bearer token'dan kullanıcıyı çeker.
    Tüm korumalı endpoint'lerde Depends(get_current_user) ile kullanılır.
    """
    from . import models  # circular import önlemek için lazy import

    payload = decode_token(token)
    email: str = payload.get("sub")

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesap devre dışı bırakılmış.",
        )
    return user


def get_current_active_user(
    current_user=Depends(get_current_user),
):
    """Aktif kullanıcı dependency'si (kısayol)."""
    return current_user


def require_admin(
    current_user=Depends(get_current_user),
):
    """Sadece admin veya staff rolüne izin verir."""
    if current_user.role not in ("admin", "staff"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gereklidir.",
        )
    return current_user


def require_student(
    current_user=Depends(get_current_user),
):
    """Sadece öğrenci rolüne izin verir."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem yalnızca öğrenciler içindir.",
        )
    return current_user