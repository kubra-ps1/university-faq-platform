# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────────────

class UserRoleEnum(str, Enum):
    student = "student"
    staff   = "staff"
    admin   = "admin"

class QuestionStatusEnum(str, Enum):
    pending  = "pending"
    answered = "answered"
    rejected = "rejected"

class AIActionEnum(str, Enum):
    approved = "approved"
    rejected = "rejected"
    flagged  = "flagged"


# ── User Schemas ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email:      EmailStr
    password:   str
    full_name:  str
    role:       UserRoleEnum = UserRoleEnum.student
    faculty:    Optional[str] = None
    department: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Şifre en az 6 karakter olmalıdır.")
        return v


class UserLogin(BaseModel):
    email:    EmailStr
    password: str
    role:     UserRoleEnum = UserRoleEnum.student


class UserOut(BaseModel):
    id:         int
    email:      str
    full_name:  str
    role:       str
    faculty:    Optional[str] = None
    department: Optional[str] = None
    is_active:  bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type:   str
    user:         UserOut


# ── Category Schemas ──────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    id:              int
    name:            str
    total_questions: int = 0

    class Config:
        from_attributes = True


# ── Question Schemas ──────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    question_text: str
    category_id:   Optional[int] = None

    @field_validator("question_text")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Soru en az 10 karakter olmalıdır.")
        return v.strip()


class QuestionResponse(BaseModel):
    id:              int
    question_text:   str
    answer_text:     Optional[str] = None
    status:          str
    ai_checked:      bool
    category_id:     Optional[int] = None
    created_at:      datetime
    answered_at:     Optional[datetime] = None

    class Config:
        from_attributes = True


class QuestionDetail(QuestionResponse):
    """Daha fazla bilgi içeren detaylı soru — öğrenci ve admin için"""
    user_id:         int
    ai_reject_reason: Optional[str] = None

    class Config:
        from_attributes = True


class QuestionAnswer(BaseModel):
    answer_text: str


class QuestionReject(BaseModel):
    reason: Optional[str] = None


# ── SavedItem Schemas ─────────────────────────────────────────────────────────

class SavedItemOut(BaseModel):
    id:          int
    question_id: int
    created_at:  datetime
    question:    QuestionResponse

    class Config:
        from_attributes = True


# ── AILog Schemas ─────────────────────────────────────────────────────────────

class AILogOut(BaseModel):
    id:           int
    question_id:  int
    action:       str
    confidence:   Optional[float] = None
    reason:       Optional[str]   = None
    processed_at: datetime

    class Config:
        from_attributes = True


# ── SearchLog Schemas ─────────────────────────────────────────────────────────

class SearchLogOut(BaseModel):
    id:           int
    query:        str
    result_count: int
    created_at:   datetime

    class Config:
        from_attributes = True


# ── Stats Schemas (Admin Dashboard) ──────────────────────────────────────────

class WordCount(BaseModel):
    word:  str
    count: int

class TrafficDay(BaseModel):
    date:  str
    count: int

class Stats(BaseModel):
    total_questions:     int
    pending_questions:   int
    answered_questions:  int
    rejected_questions:  int
    total_students:      int
    most_searched_words: List[WordCount]
    weekly_traffic:      List[TrafficDay]