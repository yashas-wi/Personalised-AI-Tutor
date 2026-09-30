"""
routers/quiz.py
Quiz generation, evaluation, hints, and history endpoints.
"""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.schemas import (
    HintRequest,
    HintResponse,
    QuizEvaluation,
    QuizGenerateRequest,
    QuizHistoryItem,
    QuizQuestion,
    QuizSubmission,
    QuestionType,
)
from services.gemini_service import gemini_service
from services.progress_service import progress_service

router = APIRouter(prefix="/api/quiz", tags=["quiz"])
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=List[QuizQuestion])
async def generate_quiz(request: QuizGenerateRequest, db: Session = Depends(get_db)):
    """
    Generate quiz questions for a topic, tailored to the user's level.
    """
    user = progress_service.get_user(db, request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    topic_name = request.topic_slug.replace("-", " ").title()

    try:
        questions_data = await gemini_service.generate_quiz_questions(
            topic=topic_name,
            level=user.level,
            num_questions=request.num_questions,
        )
    except Exception as exc:
        logger.exception("Quiz generation failed: %s", exc)
        raise HTTPException(status_code=503, detail="Quiz generation failed.")

    questions: List[QuizQuestion] = []
    for i, q in enumerate(questions_data):
        q_type_raw = q.get("type", "open_answer")
        try:
            q_type = QuestionType(q_type_raw)
        except ValueError:
            q_type = QuestionType.open_answer

        questions.append(
            QuizQuestion(
                id=q.get("id", i + 1),
                type=q_type,
                question=q.get("question", ""),
                options=q.get("options") if q_type == QuestionType.mcq else None,
                topic=q.get("topic", topic_name),
                difficulty=q.get("difficulty", "medium"),
            )
        )
    return questions


@router.post("/evaluate", response_model=QuizEvaluation)
async def evaluate_quiz_answer(submission: QuizSubmission, db: Session = Depends(get_db)):
    """
    Evaluate a student's quiz answer using Gemini, record the attempt,
    and update progress mastery score.
    """
    user = progress_service.get_user(db, submission.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    correct_context = submission.correct_context or f"Topic: {submission.topic_slug}"

    try:
        evaluation = await gemini_service.evaluate_answer(
            question=submission.question,
            user_answer=submission.user_answer,
            correct_context=correct_context,
            level=user.level,
        )
    except Exception as exc:
        logger.exception("Answer evaluation failed: %s", exc)
        raise HTTPException(status_code=503, detail="Evaluation failed. Try again.")

    score: int = evaluation.get("score", 0)
    feedback: str = evaluation.get("feedback", "")

    # Persist attempt + update mastery
    progress_service.record_quiz_attempt(
        db=db,
        user_id=submission.user_id,
        topic_slug=submission.topic_slug,
        question=submission.question,
        answer=submission.user_answer,
        score=score,
        feedback=feedback,
    )

    return QuizEvaluation(
        score=score,
        is_correct=evaluation.get("is_correct", score >= 70),
        feedback=feedback,
        explanation=evaluation.get("explanation", ""),
        correct_answer=evaluation.get("correct_answer"),
    )


@router.post("/hint", response_model=HintResponse)
async def get_hint(request: HintRequest):
    """Return a progressive hint for a quiz question."""
    try:
        hint_text = await gemini_service.generate_hint(
            question=request.question,
            hint_level=request.hint_level,
        )
        return HintResponse(hint=hint_text, hint_level=request.hint_level)
    except Exception as exc:
        logger.exception("Hint generation failed: %s", exc)
        raise HTTPException(status_code=503, detail="Hint generation failed.")


@router.get("/history/{user_id}/{topic_slug}", response_model=List[QuizHistoryItem])
async def get_quiz_history(user_id: str, topic_slug: str, db: Session = Depends(get_db)):
    """Return all past quiz attempts for a user on a specific topic."""
    attempts = progress_service.get_quiz_history(db, user_id, topic_slug)
    return [
        QuizHistoryItem(
            id=a.id,
            question_text=a.question_text,
            user_answer=a.user_answer,
            ai_score=a.ai_score,
            ai_feedback=a.ai_feedback,
            created_at=a.created_at.isoformat() if a.created_at else "",
        )
        for a in attempts
    ]
