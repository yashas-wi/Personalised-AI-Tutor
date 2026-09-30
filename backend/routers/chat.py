"""
routers/chat.py
Streaming AI tutor chat endpoint using Server-Sent Events (SSE).
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from db.database import get_db
from models.schemas import ChatRequest
from services.gemini_service import gemini_service
from services.progress_service import progress_service
from services.rag_service import rag_service

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)

LEVEL_DESCRIPTIONS = {
    "beginner": (
        "The student is a beginner. Use simple language, relatable analogies, and avoid jargon. "
        "Explain every concept from first principles."
    ),
    "intermediate": (
        "The student has intermediate knowledge. You can use technical terminology but should still "
        "explain complex concepts clearly with examples."
    ),
    "advanced": (
        "The student is advanced. Use precise technical language, dive into implementation details, "
        "discuss edge cases, and reference research where appropriate."
    ),
}


def _build_system_prompt(level: str, topic_slug: str | None, context_chunks: list[str]) -> str:
    """Construct the system prompt with RAG context and user level."""
    level_desc = LEVEL_DESCRIPTIONS.get(level, LEVEL_DESCRIPTIONS["beginner"])
    context_text = "\n\n".join(context_chunks) if context_chunks else "No specific context available."
    topic_note = f"Current topic: {topic_slug}." if topic_slug else ""

    return f"""You are an expert, friendly AI tutor specialised in Artificial Intelligence and Machine Learning.

{level_desc}

{topic_note}

Reference material (ground your answers in this):
{context_text}

Guidelines:
- Be encouraging and patient.
- Correct misconceptions gently.
- Use bullet points and short paragraphs for clarity.
- Provide code examples in Python when helpful.
- If unsure, say so rather than hallucinating.
- Keep responses focused and educational.
"""


async def _sse_stream(prompt: str):
    """Async generator that yields SSE-formatted chunks."""
    try:
        async for chunk in gemini_service.generate_stream(prompt):
            payload = json.dumps({"chunk": chunk})
            yield f"data: {payload}\n\n"
    except Exception as exc:
        logger.exception("Streaming error: %s", exc)
        error_payload = json.dumps({"error": str(exc)})
        yield f"data: {error_payload}\n\n"
    finally:
        yield "data: [DONE]\n\n"


@router.post("")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Streaming chat endpoint. Returns an SSE stream (text/event-stream).
    Each event: data: {"chunk": "..."}
    Final event: data: [DONE]
    """
    user = progress_service.get_user(db, request.user_id)
    level = user.level if user else "beginner"

    # Retrieve RAG context
    rag_query = f"{request.topic_slug or ''} {request.message}".strip()
    context_chunks = rag_service.retrieve(query=rag_query, k=5)

    system_prompt = _build_system_prompt(
        level=level,
        topic_slug=request.topic_slug,
        context_chunks=context_chunks,
    )

    # Build conversation history
    history_text = ""
    for msg in request.history[-8:]:  # keep last 8 turns for context
        role_label = "Student" if msg.role == "user" else "Tutor"
        history_text += f"{role_label}: {msg.content}\n"

    full_prompt = f"{system_prompt}\n\nConversation history:\n{history_text}\nStudent: {request.message}\nTutor:"

    return StreamingResponse(
        _sse_stream(full_prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
