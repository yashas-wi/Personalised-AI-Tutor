"""
routers/progress.py
User progress retrieval and level-update endpoints.
"""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.schemas import (
    ProgressResponse,
    ProgressSummary,
    TopicProgress,
    UpdateLevelRequest,
    UserLevel,
    UserResponse,
)
from services.progress_service import AI_TOPICS, progress_service

router = APIRouter(prefix="/api/progress", tags=["progress"])
logger = logging.getLogger(__name__)


@router.get("/{user_id}", response_model=ProgressResponse)
async def get_progress(user_id: str, db: Session = Depends(get_db)):
    """Return full topic-by-topic progress for a user."""
    user = progress_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    progress_rows = progress_service.get_progress(db, user_id)
    topics = [
        TopicProgress(
            topic_slug=p.topic_slug,
            mastery_score=p.mastery_score,
            lessons_completed=p.lessons_completed,
            quiz_attempts=p.quiz_attempts,
            last_activity=p.last_activity.isoformat() if p.last_activity else None,
        )
        for p in progress_rows
    ]

    overall = progress_service.calculate_overall_mastery(db, user_id)

    return ProgressResponse(
        user_id=user_id,
        topics=topics,
        overall_mastery=overall,
        level=UserLevel(user.level),
    )


@router.get("/{user_id}/summary", response_model=ProgressSummary)
async def get_progress_summary(user_id: str, db: Session = Depends(get_db)):
    """Return a summary with aggregate stats and topic breakdown."""
    user = progress_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    progress_rows = progress_service.get_progress(db, user_id)
    progress_map = {p.topic_slug: p for p in progress_rows}

    topic_breakdown: List[TopicProgress] = []
    topics_started = 0
    topics_mastered = 0

    for slug in AI_TOPICS:
        p = progress_map.get(slug)
        if p:
            topics_started += 1
            if p.mastery_score >= 80:
                topics_mastered += 1
            topic_breakdown.append(
                TopicProgress(
                    topic_slug=slug,
                    mastery_score=p.mastery_score,
                    lessons_completed=p.lessons_completed,
                    quiz_attempts=p.quiz_attempts,
                    last_activity=p.last_activity.isoformat() if p.last_activity else None,
                )
            )
        else:
            topic_breakdown.append(
                TopicProgress(
                    topic_slug=slug,
                    mastery_score=0,
                    lessons_completed=0,
                    quiz_attempts=0,
                    last_activity=None,
                )
            )

    overall = progress_service.calculate_overall_mastery(db, user_id)

    return ProgressSummary(
        user_id=user_id,
        overall_mastery=overall,
        level=UserLevel(user.level),
        total_topics=len(AI_TOPICS),
        topics_started=topics_started,
        topics_mastered=topics_mastered,
        topic_breakdown=topic_breakdown,
    )


@router.patch("/{user_id}/level", response_model=UserResponse)
async def update_level(
    user_id: str,
    body: UpdateLevelRequest,
    db: Session = Depends(get_db),
):
    """Update the user's learning level."""
    updated = progress_service.update_user_level(db, user_id, body.level.value)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserResponse.from_orm_user(updated)
