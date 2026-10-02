"""
services/progress_service.py
Business logic for user progress tracking and topic recommendations.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from db.database import FlaggedItem, Progress, QuizAttempt, User

# Canonical list of AI topics (order defines default learning path)
AI_TOPICS: List[str] = [
    "ml-fundamentals",
    "neural-networks",
    "deep-learning",
    "nlp-basics",
    "transformers",
    "computer-vision",
    "reinforcement-learning",
    "prompt-engineering",
    "llm-architecture",
    "ai-ethics",
]


class ProgressService:
    """Handles all user progress CRUD operations."""

    # ------------------------------------------------------------------
    # User helpers
    # ------------------------------------------------------------------

    def get_or_create_user(
        self,
        db: Session,
        user_id: str,
        name: str,
        email: Optional[str] = None,
        level: str = "beginner",
    ) -> User:
        """Fetch an existing user or create a new one."""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return user

        user = User(
            id=user_id,
            name=name,
            email=email,
            level=level,
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def create_user(
        self,
        db: Session,
        name: str,
        email: Optional[str] = None,
        level: str = "beginner",
    ) -> User:
        """Create a brand-new user with a generated UUID."""
        user = User(
            id=str(uuid.uuid4()),
            name=name,
            email=email,
            level=level,
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def get_user(self, db: Session, user_id: str) -> User:
        """Fetch user by id; if not found, create a default learner profile."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = self.get_or_create_user(db, user_id=user_id, name="Learner", level="beginner")
        return user

    def update_user_level(self, db: Session, user_id: str, level: str) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.level = level
            db.commit()
            db.refresh(user)
        return user

    # ------------------------------------------------------------------
    # Progress helpers
    # ------------------------------------------------------------------

    def _get_or_create_progress(
        self, db: Session, user_id: str, topic_slug: str
    ) -> Progress:
        progress = (
            db.query(Progress)
            .filter(Progress.user_id == user_id, Progress.topic_slug == topic_slug)
            .first()
        )
        if not progress:
            progress = Progress(
                user_id=user_id,
                topic_slug=topic_slug,
                mastery_score=0,
                lessons_completed=0,
                quiz_attempts=0,
                last_activity=datetime.utcnow(),
            )
            db.add(progress)
            db.commit()
            db.refresh(progress)
        return progress

    def get_progress(self, db: Session, user_id: str) -> List[Progress]:
        """Return all Progress rows for the user."""
        return db.query(Progress).filter(Progress.user_id == user_id).all()

    def update_topic_mastery(
        self,
        db: Session,
        user_id: str,
        topic_slug: str,
        delta: int,
    ) -> Progress:
        """Increment (or decrement) mastery score, clamped to [0, 100]."""
        progress = self._get_or_create_progress(db, user_id, topic_slug)
        progress.mastery_score = max(0, min(100, progress.mastery_score + delta))
        progress.last_activity = datetime.utcnow()
        db.commit()
        db.refresh(progress)
        return progress

    def mark_lesson_complete(
        self,
        db: Session,
        user_id: str,
        topic_slug: str,
    ) -> Progress:
        """Mark a lesson as completed and award mastery points."""
        progress = self._get_or_create_progress(db, user_id, topic_slug)
        progress.lessons_completed += 1
        progress.mastery_score = max(0, min(100, progress.mastery_score + 10))
        progress.last_activity = datetime.utcnow()
        db.commit()
        db.refresh(progress)
        return progress

    def record_quiz_attempt(
        self,
        db: Session,
        user_id: str,
        topic_slug: str,
        question: str,
        answer: str,
        score: int,
        feedback: str,
    ) -> QuizAttempt:
        """Persist a quiz attempt and update progress mastery."""
        attempt = QuizAttempt(
            user_id=user_id,
            topic_slug=topic_slug,
            question_text=question,
            user_answer=answer,
            ai_score=score,
            ai_feedback=feedback,
            created_at=datetime.utcnow(),
        )
        db.add(attempt)

        # Update progress stats
        progress = self._get_or_create_progress(db, user_id, topic_slug)
        progress.quiz_attempts += 1

        # Adjust mastery: +5 for passing (>=70), -2 for failing
        if score >= 70:
            progress.mastery_score = min(100, progress.mastery_score + 5)
        else:
            progress.mastery_score = max(0, progress.mastery_score - 2)
        progress.last_activity = datetime.utcnow()

        db.commit()
        db.refresh(attempt)
        return attempt

    def get_quiz_history(
        self,
        db: Session,
        user_id: str,
        topic_slug: str,
    ) -> List[QuizAttempt]:
        return (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.user_id == user_id,
                QuizAttempt.topic_slug == topic_slug,
            )
            .order_by(QuizAttempt.created_at.desc())
            .all()
        )

    # ------------------------------------------------------------------
    # Recommendation engine
    # ------------------------------------------------------------------

    def get_recommended_topics(
        self,
        db: Session,
        user_id: str,
        level: str,
    ) -> List[str]:
        """
        Returns topic slugs in priority order:
        1. Topics not yet started
        2. Topics with low mastery (<50)
        3. Topics with medium mastery (50-79)
        4. Topics mastered (>=80) — for revision
        """
        existing: dict[str, Progress] = {
            p.topic_slug: p
            for p in db.query(Progress).filter(Progress.user_id == user_id).all()
        }

        not_started = [t for t in AI_TOPICS if t not in existing]
        low_mastery = [
            t for t, p in existing.items() if p.mastery_score < 50
        ]
        medium_mastery = [
            t for t, p in existing.items() if 50 <= p.mastery_score < 80
        ]
        mastered = [
            t for t, p in existing.items() if p.mastery_score >= 80
        ]

        # Keep canonical order within each group
        def ordered(slugs):
            return [t for t in AI_TOPICS if t in slugs]

        return (
            ordered(not_started)
            + ordered(low_mastery)
            + ordered(medium_mastery)
            + ordered(mastered)
        )

    def get_next_topic(self, db: Session, user_id: str, level: str) -> Optional[str]:
        """Return the single highest-priority recommended topic."""
        recommendations = self.get_recommended_topics(db, user_id, level)
        return recommendations[0] if recommendations else None

    # ------------------------------------------------------------------
    # Overall mastery
    # ------------------------------------------------------------------

    def calculate_overall_mastery(self, db: Session, user_id: str) -> float:
        """
        Returns average mastery score across all AI_TOPICS (0-100).
        Topics with no progress count as 0.
        """
        existing: dict[str, Progress] = {
            p.topic_slug: p
            for p in db.query(Progress).filter(Progress.user_id == user_id).all()
        }
        total = sum(
            existing[t].mastery_score if t in existing else 0
            for t in AI_TOPICS
        )
        return round(total / len(AI_TOPICS), 2)

    # ------------------------------------------------------------------
    # Flagged items
    # ------------------------------------------------------------------

    def save_flagged_item(
        self,
        db: Session,
        user_id: str,
        item_type: str,
        content_hash: str,
        original_content: str,
        alternative_content: str,
    ) -> FlaggedItem:
        item = FlaggedItem(
            user_id=user_id,
            item_type=item_type,
            content_hash=content_hash,
            original_content=original_content,
            alternative_content=alternative_content,
            created_at=datetime.utcnow(),
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item


# Singleton instance
progress_service = ProgressService()
