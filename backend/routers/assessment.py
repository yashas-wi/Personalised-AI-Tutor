"""
routers/assessment.py
Diagnostic assessment endpoints: start a quiz and submit answers.
"""
from __future__ import annotations

import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.schemas import AssessmentResult, AssessmentSubmission, AssessmentQuestion, UserLevel
from services.gemini_service import gemini_service
from services.progress_service import progress_service

router = APIRouter(prefix="/api/assessment", tags=["assessment"])
logger = logging.getLogger(__name__)


@router.post("/start", response_model=List[AssessmentQuestion])
async def start_assessment():
    """
    Generate 5 diagnostic MCQ questions across different AI domains.
    Used to determine the student's starting level.
    """
    try:
        questions = await gemini_service.generate_diagnostic_questions()
        if not questions:
            raise HTTPException(status_code=503, detail="Failed to generate assessment questions.")
        # Normalise to AssessmentQuestion schema
        result = []
        for i, q in enumerate(questions):
            result.append(
                AssessmentQuestion(
                    id=q.get("id", i + 1),
                    question=q.get("question", ""),
                    options=q.get("options", []),
                    topic=q.get("topic", "general"),
                )
            )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error generating diagnostic questions: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/submit", response_model=AssessmentResult)
async def submit_assessment(submission: AssessmentSubmission, db: Session = Depends(get_db)):
    """
    Accept student answers, analyse them with Gemini, create/update the user
    in the database, and return the determined level + recommended learning path.
    """
    try:
        # Enrich answers with question metadata for analysis
        answers_for_analysis = submission.answers  # list of dicts

        analysis = await gemini_service.analyze_diagnostic_results(answers_for_analysis)

        level_str: str = analysis.get("level", "beginner")
        # Validate level
        try:
            level = UserLevel(level_str)
        except ValueError:
            level = UserLevel.beginner

        # Create or fetch user
        user_id = submission.user_id or str(uuid.uuid4())
        progress_service.get_or_create_user(
            db=db,
            user_id=user_id,
            name=submission.name,
            email=submission.email,
            level=level.value,
        )

        return AssessmentResult(
            user_id=user_id,
            level=level,
            weak_areas=analysis.get("weak_areas", []),
            strong_areas=analysis.get("strong_areas", []),
            recommended_path=analysis.get(
                "recommended_path",
                ["ml-fundamentals", "neural-networks", "deep-learning"],
            ),
            message=analysis.get(
                "message",
                f"Welcome! Based on your assessment, you're at {level.value} level.",
            ),
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error submitting assessment: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
