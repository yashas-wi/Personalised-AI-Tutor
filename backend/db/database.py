"""
db/database.py
SQLAlchemy sync engine, ORM models, and FastAPI session dependency.
"""
import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, relationship, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_tutor.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# ORM Models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    level = Column(String, nullable=False, default="beginner")  # beginner/intermediate/advanced
    created_at = Column(DateTime, default=datetime.utcnow)

    progress = relationship("Progress", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    flagged_items = relationship("FlaggedItem", back_populates="user", cascade="all, delete-orphan")


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    topic_slug = Column(String, nullable=False)
    mastery_score = Column(Integer, default=0)       # 0-100
    lessons_completed = Column(Integer, default=0)
    quiz_attempts = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="progress")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    topic_slug = Column(String, nullable=False)
    question_text = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=False)
    ai_score = Column(Integer, default=0)            # 0-100
    ai_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quiz_attempts")


class FlaggedItem(Base):
    __tablename__ = "flagged_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    item_type = Column(String, nullable=False)        # 'lesson' | 'quiz'
    content_hash = Column(String, nullable=False)
    original_content = Column(Text, nullable=False)
    alternative_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="flagged_items")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create_tables() -> None:
    """Create all tables in the database (idempotent)."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a synchronous database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
