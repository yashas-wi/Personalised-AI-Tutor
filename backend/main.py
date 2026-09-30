"""
main.py
FastAPI application entry point for the AI Tutor backend.
"""
from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from db.database import create_tables
from routers import assessment, chat, lessons, progress, quiz
from services.rag_service import rag_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Tutor API",
    version="1.0.0",
    description="Personalised AI Tutor powered by Gemini 1.5 Pro + ChromaDB RAG",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow Next.js frontend
# ---------------------------------------------------------------------------

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(assessment.router)
app.include_router(lessons.router)
app.include_router(quiz.router)
app.include_router(progress.router)
app.include_router(chat.router)

# ---------------------------------------------------------------------------
# Lifecycle events
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup() -> None:
    logger.info("🚀 Starting AI Tutor API...")

    # 1. Initialise database tables
    create_tables()
    logger.info("✅ Database tables ready.")

    # 2. Ingest knowledge base into ChromaDB (only if not already done)
    kb_dir = os.path.join(os.path.dirname(__file__), "knowledge_base")
    if not rag_service.is_ingested():
        logger.info("📚 Ingesting knowledge base from: %s", kb_dir)
        try:
            count = rag_service.ingest_knowledge_base(kb_dir)
            logger.info("✅ Ingested %d chunks into ChromaDB.", count)
        except Exception as exc:
            logger.warning(
                "⚠️  Knowledge base ingestion failed (RAG will be unavailable): %s", exc
            )
    else:
        logger.info(
            "✅ ChromaDB already ingested (%d chunks).", rag_service.document_count()
        )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("👋 AI Tutor API shutting down.")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"])
async def health_check():
    """Liveness probe — returns service status and RAG info."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "rag_ingested": rag_service.is_ingested(),
        "rag_chunks": rag_service.document_count(),
    }


@app.get("/", tags=["root"])
async def root():
    return {
        "message": "AI Tutor API is running.",
        "docs": "/docs",
        "health": "/health",
    }
