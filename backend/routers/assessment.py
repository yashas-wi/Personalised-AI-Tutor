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


@router.get("/start", response_model=List[AssessmentQuestion])
@router.post("/start", response_model=List[AssessmentQuestion])
async def start_assessment():
    """
    Generate 5 diagnostic MCQ questions across different AI domains.
    Used to determine the student's starting level.
    """
    fallback_questions = [
        {
            "id": 1,
            "question": "What is the primary difference between Supervised and Unsupervised Learning?",
            "options": [
                "Supervised learning requires labeled training data, while unsupervised finds patterns in unlabeled data.",
                "Supervised learning only works on images, unsupervised works on text.",
                "Supervised learning is faster to train than unsupervised learning.",
                "Unsupervised learning always produces higher accuracy models."
            ],
            "topic": "ml-fundamentals"
        },
        {
            "id": 2,
            "question": "In a Neural Network, what is the role of an Activation Function?",
            "options": [
                "To introduce non-linearity so the network can learn complex arbitrary patterns.",
                "To compress the dataset into fewer dimensions.",
                "To calculate the final cost loss function.",
                "To initialize weights to zero."
            ],
            "topic": "neural-networks"
        },
        {
            "id": 3,
            "question": "In the Transformer architecture, what is the purpose of the Self-Attention mechanism?",
            "options": [
                "To weigh the contextual importance of all tokens in a sequence relative to each other.",
                "To eliminate the need for GPU acceleration during training.",
                "To compress word embeddings down to a single scalar value.",
                "To convert continuous audio signals into discrete spectrograms."
            ],
            "topic": "transformers"
        },
        {
            "id": 4,
            "question": "What is the primary operation performed by a Convolutional Layer in a CNN?",
            "options": [
                "Sliding a filter/kernel across the input to compute dot products and extract spatial features.",
                "Flattening pixel values into a 1D vector.",
                "Sorting color intensities in descending order.",
                "Randomly zeroing out 50% of the input image pixels."
            ],
            "topic": "computer-vision"
        },
        {
            "id": 5,
            "question": "In Reinforcement Learning, what does the Discount Factor (γ) control?",
            "options": [
                "The balance and relative importance of immediate rewards versus future cumulative rewards.",
                "The total number of training epochs in the environment.",
                "The learning rate decay schedule.",
                "The penalty for illegal moves."
            ],
            "topic": "reinforcement-learning"
        }
    ]

    try:
        questions = await gemini_service.generate_diagnostic_questions()
        if not questions:
            questions = fallback_questions

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
    except Exception as exc:
        logger.warning("Error generating diagnostic questions with Gemini, using fallback: %s", exc)
        return [
            AssessmentQuestion(
                id=q["id"],
                question=q["question"],
                options=q["options"],
                topic=q["topic"]
            )
            for q in fallback_questions
        ]


@router.post("/submit", response_model=AssessmentResult)
async def submit_assessment(submission: AssessmentSubmission, db: Session = Depends(get_db)):
    """
    Accept student answers, analyse them with Gemini, create/update the user
    in the database, and return the determined level + recommended learning path.
    """
    try:
        answers_for_analysis = submission.answers
        
        try:
            analysis = await gemini_service.analyze_diagnostic_results(answers_for_analysis)
        except Exception as ai_err:
            logger.warning("AI analysis failed, defaulting level: %s", ai_err)
            analysis = {
                "level": "beginner",
                "weak_areas": ["transformers", "reinforcement-learning"],
                "strong_areas": ["ml-fundamentals"],
                "recommended_path": ["ml-fundamentals", "neural-networks", "deep-learning", "transformers"],
                "message": "Welcome! We've prepared a comprehensive beginner-to-advanced learning track for you."
            }

        level_str: str = analysis.get("level", "beginner")
        try:
            level = UserLevel(level_str)
        except ValueError:
            level = UserLevel.beginner

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
                ["ml-fundamentals", "neural-networks", "deep-learning", "transformers", "computer-vision"],
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
