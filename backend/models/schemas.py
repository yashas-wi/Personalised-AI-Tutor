"""
models/schemas.py
Pydantic v2 request/response schemas for the AI Tutor API.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class UserLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class QuestionType(str, Enum):
    mcq = "mcq"
    open_answer = "open_answer"


class ItemType(str, Enum):
    lesson = "lesson"
    quiz = "quiz"


# ---------------------------------------------------------------------------
# User schemas
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    level: UserLevel = UserLevel.beginner


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: Optional[str] = None
    level: UserLevel
    created_at: str  # ISO format string

    @classmethod
    def from_orm_user(cls, user: Any) -> "UserResponse":
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            level=UserLevel(user.level),
            created_at=user.created_at.isoformat() if user.created_at else "",
        )


# ---------------------------------------------------------------------------
# Assessment schemas
# ---------------------------------------------------------------------------

class AssessmentQuestion(BaseModel):
    id: int
    question: str
    options: List[str]          # A, B, C, D options
    topic: str                  # which AI topic this tests


class AssessmentSubmission(BaseModel):
    user_id: Optional[str] = None
    name: str
    email: Optional[str] = None
    answers: Any


class AssessmentResult(BaseModel):
    user_id: str
    level: UserLevel
    weak_areas: List[str]
    strong_areas: List[str]
    recommended_path: List[str]     # ordered list of topic slugs
    message: str


# ---------------------------------------------------------------------------
# Lesson schemas
# ---------------------------------------------------------------------------

class LessonSection(BaseModel):
    title: str
    content: str
    code_example: Optional[str] = None


class LessonContent(BaseModel):
    topic_slug: str
    topic_name: str
    level: UserLevel
    introduction: str
    sections: List[LessonSection]
    summary: str
    key_takeaways: List[str]
    estimated_minutes: int = 10


class LessonRequest(BaseModel):
    user_id: str
    topic_slug: str
    topic_name: str


class LessonCompleteRequest(BaseModel):
    topic_slug: str


# ---------------------------------------------------------------------------
# Quiz schemas
# ---------------------------------------------------------------------------

class QuizQuestion(BaseModel):
    id: int
    type: QuestionType
    question: str
    options: Optional[List[str]] = None   # None for open_answer
    topic: str
    difficulty: str = "medium"


class QuizSubmission(BaseModel):
    user_id: str
    topic_slug: str
    question: str
    question_type: QuestionType = QuestionType.open_answer
    user_answer: str
    correct_context: Optional[str] = None


class QuizEvaluation(BaseModel):
    score: int                   # 0-100
    is_correct: bool
    feedback: str
    explanation: str
    correct_answer: Optional[str] = None


class HintRequest(BaseModel):
    question: str
    hint_level: int = Field(default=1, ge=1, le=3)


class HintResponse(BaseModel):
    hint: str
    hint_level: int


class QuizGenerateRequest(BaseModel):
    user_id: str
    topic_slug: str
    num_questions: int = Field(default=5, ge=1, le=10)


class QuizHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_text: str
    user_answer: str
    ai_score: int
    ai_feedback: Optional[str]
    created_at: str


# ---------------------------------------------------------------------------
# Progress schemas
# ---------------------------------------------------------------------------

class TopicProgress(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    topic_slug: str
    mastery_score: int
    lessons_completed: int
    quiz_attempts: int
    last_activity: Optional[str] = None


class ProgressResponse(BaseModel):
    user_id: str
    topics: List[TopicProgress]
    overall_mastery: float
    level: UserLevel


class ProgressSummary(BaseModel):
    user_id: str
    overall_mastery: float
    level: UserLevel
    total_topics: int
    topics_started: int
    topics_mastered: int           # mastery_score >= 80
    topic_breakdown: List[TopicProgress]
    topics: Optional[List[TopicProgress]] = None


class UpdateLevelRequest(BaseModel):
    level: UserLevel


# ---------------------------------------------------------------------------
# Chat schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str   # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    user_id: str
    message: str
    topic_slug: Optional[str] = None
    history: List[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    topic_slug: Optional[str] = None


# ---------------------------------------------------------------------------
# Flag / HITL schemas
# ---------------------------------------------------------------------------

class FlagRequest(BaseModel):
    user_id: str
    item_type: ItemType
    content: str
    topic_slug: Optional[str] = None


class FlagResponse(BaseModel):
    flag_id: int
    original_content: str
    alternative_content: str
    message: str


# ---------------------------------------------------------------------------
# Flashcard schemas
# ---------------------------------------------------------------------------

class FlashCard(BaseModel):
    id: int
    front: str
    back: str
    topic: str


class FlashCardResponse(BaseModel):
    topic_slug: str
    cards: List[FlashCard]
