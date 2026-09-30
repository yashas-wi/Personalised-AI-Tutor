"""
routers/lessons.py
Lesson generation, completion tracking, flagging, and flashcard endpoints.
"""
from __future__ import annotations

import hashlib
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.schemas import (
    FlagRequest,
    FlagResponse,
    FlashCard,
    FlashCardResponse,
    LessonCompleteRequest,
    LessonContent,
    LessonRequest,
    LessonSection,
    TopicProgress,
    UserLevel,
)
from services.gemini_service import gemini_service
from services.progress_service import progress_service
from services.rag_service import rag_service

router = APIRouter(prefix="/api/lessons", tags=["lessons"])
logger = logging.getLogger(__name__)

# Slug → display name mapping
TOPIC_NAMES: dict[str, str] = {
    "ml-fundamentals": "Machine Learning Fundamentals",
    "neural-networks": "Neural Networks",
    "deep-learning": "Deep Learning",
    "nlp-basics": "NLP Basics",
    "transformers": "Transformers & Attention",
    "computer-vision": "Computer Vision",
    "reinforcement-learning": "Reinforcement Learning",
    "prompt-engineering": "Prompt Engineering",
    "llm-architecture": "LLM Architecture",
    "ai-ethics": "AI Ethics",
}


@router.get("/{user_id}/next")
async def get_next_topic(user_id: str, db: Session = Depends(get_db)):
    """Return the highest-priority next topic for the user."""
    user = progress_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    next_slug = progress_service.get_next_topic(db, user_id, user.level)
    if not next_slug:
        return {"message": "All topics completed!", "topic_slug": None, "topic_name": None}

    return {
        "topic_slug": next_slug,
        "topic_name": TOPIC_NAMES.get(next_slug, next_slug.replace("-", " ").title()),
    }


@router.post("/generate", response_model=LessonContent)
async def generate_lesson(request: LessonRequest, db: Session = Depends(get_db)):
    """
    Generate a full lesson for the given topic using RAG context + Gemini.
    """
    user = progress_service.get_user(db, request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    level = user.level

    # Retrieve relevant knowledge base chunks
    context_chunks = rag_service.retrieve(
        query=f"{request.topic_name} {request.topic_slug}",
        k=6,
    )

    try:
        lesson_data = await gemini_service.generate_lesson(
            topic=request.topic_name,
            level=level,
            context_chunks=context_chunks,
        )
    except Exception as exc:
        logger.exception("Lesson generation failed: %s", exc)
        raise HTTPException(status_code=503, detail="Lesson generation failed. Try again.")

    sections = [
        LessonSection(
            title=s.get("title", "Section"),
            content=s.get("content", ""),
            code_example=s.get("code_example"),
        )
        for s in lesson_data.get("sections", [])
    ]

    return LessonContent(
        topic_slug=request.topic_slug,
        topic_name=request.topic_name,
        level=UserLevel(level),
        introduction=lesson_data.get("introduction", ""),
        sections=sections,
        summary=lesson_data.get("summary", ""),
        key_takeaways=lesson_data.get("key_takeaways", []),
        estimated_minutes=lesson_data.get("estimated_minutes", 10),
    )


@router.post("/{user_id}/complete", response_model=TopicProgress)
async def complete_lesson(
    user_id: str,
    body: LessonCompleteRequest,
    db: Session = Depends(get_db),
):
    """Mark a lesson as completed for the user and award mastery points."""
    user = progress_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    progress = progress_service.mark_lesson_complete(db, user_id, body.topic_slug)
    return TopicProgress(
        topic_slug=progress.topic_slug,
        mastery_score=progress.mastery_score,
        lessons_completed=progress.lessons_completed,
        quiz_attempts=progress.quiz_attempts,
        last_activity=progress.last_activity.isoformat() if progress.last_activity else None,
    )


@router.post("/flag", response_model=FlagResponse)
async def flag_content(request: FlagRequest, db: Session = Depends(get_db)):
    """
    Flag confusing content and generate an alternative explanation (HITL flow).
    """
    user = progress_service.get_user(db, request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    content_hash = hashlib.sha256(request.content.encode()).hexdigest()[:16]

    try:
        alternative = await gemini_service.generate_alternative_explanation(
            original=request.content,
            level=user.level,
        )
    except Exception as exc:
        logger.exception("Alternative explanation generation failed: %s", exc)
        raise HTTPException(status_code=503, detail="Could not generate alternative. Try again.")

    flagged = progress_service.save_flagged_item(
        db=db,
        user_id=request.user_id,
        item_type=request.item_type.value,
        content_hash=content_hash,
        original_content=request.content,
        alternative_content=alternative,
    )

    return FlagResponse(
        flag_id=flagged.id,
        original_content=request.content,
        alternative_content=alternative,
        message="Alternative explanation generated successfully.",
    )


@router.get("/flashcards/{topic_slug}", response_model=FlashCardResponse)
async def get_flashcards(topic_slug: str, user_id: str, db: Session = Depends(get_db)):
    """Generate flashcards for a topic, tailored to the user's level."""
    user = progress_service.get_user(db, user_id)
    level = user.level if user else "beginner"
    topic_name = TOPIC_NAMES.get(topic_slug, topic_slug.replace("-", " ").title())

    try:
        cards_data = await gemini_service.generate_flashcards(
            topic=topic_name, level=level, num=10
        )
    except Exception as exc:
        logger.exception("Flashcard generation failed: %s", exc)
        raise HTTPException(status_code=503, detail="Flashcard generation failed.")

    cards = [
        FlashCard(
            id=c.get("id", i + 1),
            front=c.get("front", ""),
            back=c.get("back", ""),
            topic=c.get("topic", topic_name),
        )
        for i, c in enumerate(cards_data)
    ]

    return FlashCardResponse(topic_slug=topic_slug, cards=cards)
