# models.py  (kök dizin — backend/app/models.py ile aynı)
from sqlalchemy import (
    Column, Integer, String, Text, Boolean,
    ForeignKey, Float, DateTime, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .database import Base


# ── Enum Types ──────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    student = "student"
    staff   = "staff"
    admin   = "admin"

class QuestionStatus(str, enum.Enum):
    pending  = "pending"
    answered = "answered"
    rejected = "rejected"

class AIAction(str, enum.Enum):
    approved = "approved"
    rejected = "rejected"
    flagged  = "flagged"


# ── Tables ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    full_name       = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    faculty         = Column(String(255), nullable=True)
    department      = Column(String(255), nullable=True)
    is_active       = Column(Boolean, default=True, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    questions   = relationship("Question",  back_populates="user",  cascade="all, delete-orphan")
    saved_items = relationship("SavedItem", back_populates="user",  cascade="all, delete-orphan")
    search_logs = relationship("SearchLog", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    questions = relationship("Question", back_populates="category")


class Question(Base):
    __tablename__ = "questions"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id",      ondelete="CASCADE"), nullable=False)
    category_id      = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    question_text    = Column(Text, nullable=False)
    answer_text      = Column(Text, nullable=True)
    status           = Column(Enum(QuestionStatus), default=QuestionStatus.pending, nullable=False)
    ai_checked       = Column(Boolean, default=False, nullable=False)
    ai_reject_reason = Column(String(500), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    answered_at      = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user     = relationship("User",     back_populates="questions")
    category = relationship("Category", back_populates="questions")
    saved_by = relationship("SavedItem", back_populates="question", cascade="all, delete-orphan")
    ai_logs  = relationship("AILog",     back_populates="question", cascade="all, delete-orphan")

    @property
    def favorite_count(self) -> int:
        return len(self.saved_by)


class SavedItem(Base):
    __tablename__ = "saved_items"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id",     ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user     = relationship("User",     back_populates="saved_items")
    question = relationship("Question", back_populates="saved_by")


class SearchLog(Base):
    __tablename__ = "search_logs"

    id           = Column(Integer, primary_key=True, index=True)
    query        = Column(String(500), nullable=False)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    result_count = Column(Integer, default=0, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="search_logs")


class AILog(Base):
    """
    AI moderasyon geçmişi — diyagramdaki ai_logs tablosu.
    Her soru kontrol edildiğinde kayıt oluşturulur.
    """
    __tablename__ = "ai_logs"

    id           = Column(Integer, primary_key=True, index=True)
    question_id  = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    action       = Column(Enum(AIAction), nullable=False)
    confidence   = Column(Float,  nullable=True)   # 0.0 - 1.0 güven skoru
    reason       = Column(Text,   nullable=True)   # Red/işaretleme nedeni
    processed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    question = relationship("Question", back_populates="ai_logs")