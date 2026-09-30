"""
services/rag_service.py
ChromaDB-backed Retrieval-Augmented Generation service.
Ingests markdown knowledge-base files and retrieves relevant chunks.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import List

import chromadb
import google.generativeai as genai
from chromadb.config import Settings
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
COLLECTION_NAME = "ai_curriculum"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
EMBED_MODEL = "models/text-embedding-004"


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks by character count."""
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        if end >= len(text):
            break
        start = end - overlap
    return chunks


def _embed(texts: List[str]) -> List[List[float]]:
    """Embed a list of texts using the Gemini embedding model."""
    result = genai.embed_content(
        model=EMBED_MODEL,
        content=texts,
        task_type="retrieval_document",
    )
    return result["embedding"] if isinstance(texts, str) else result["embedding"]


def _embed_query(query: str) -> List[float]:
    """Embed a single query string."""
    result = genai.embed_content(
        model=EMBED_MODEL,
        content=query,
        task_type="retrieval_query",
    )
    return result["embedding"]


class RAGService:
    """
    Manages the ChromaDB vector store for the AI curriculum knowledge base.
    """

    def __init__(self) -> None:
        os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
        self._client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

    # ------------------------------------------------------------------
    # Ingestion
    # ------------------------------------------------------------------

    def ingest_knowledge_base(self, kb_dir: str) -> int:
        """
        Read all .md files from kb_dir, chunk, embed, and upsert into ChromaDB.
        Returns the number of chunks ingested.
        """
        kb_path = Path(kb_dir)
        if not kb_path.exists():
            logger.warning("Knowledge base directory not found: %s", kb_dir)
            return 0

        md_files = list(kb_path.glob("*.md"))
        if not md_files:
            logger.warning("No .md files found in %s", kb_dir)
            return 0

        total_chunks = 0
        for md_file in md_files:
            try:
                text = md_file.read_text(encoding="utf-8")
                chunks = _chunk_text(text)
                if not chunks:
                    continue

                # Generate embeddings in batches of 100 (API limit)
                batch_size = 100
                for batch_start in range(0, len(chunks), batch_size):
                    batch = chunks[batch_start : batch_start + batch_size]
                    embeddings = _embed(batch)

                    ids = [
                        f"{md_file.stem}_chunk_{batch_start + i}"
                        for i in range(len(batch))
                    ]
                    self._collection.upsert(
                        ids=ids,
                        embeddings=embeddings,
                        documents=batch,
                        metadatas=[{"source": md_file.name, "stem": md_file.stem}] * len(batch),
                    )
                    total_chunks += len(batch)

                logger.info("Ingested %d chunks from %s", len(chunks), md_file.name)
            except Exception as exc:
                logger.error("Error ingesting %s: %s", md_file.name, exc)

        logger.info("Total chunks ingested: %d", total_chunks)
        return total_chunks

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def retrieve(self, query: str, k: int = 5) -> List[str]:
        """
        Embed the query and return the top-k most relevant document chunks.
        """
        if self._collection.count() == 0:
            logger.warning("ChromaDB collection is empty — returning no context.")
            return []

        try:
            query_embedding = _embed_query(query)
            results = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=min(k, self._collection.count()),
                include=["documents"],
            )
            docs: List[str] = results.get("documents", [[]])[0]
            return docs
        except Exception as exc:
            logger.error("RAG retrieval error: %s", exc)
            return []

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    def is_ingested(self) -> bool:
        """Returns True if the collection contains any documents."""
        try:
            return self._collection.count() > 0
        except Exception:
            return False

    def document_count(self) -> int:
        """Returns the number of chunks in the collection."""
        try:
            return self._collection.count()
        except Exception:
            return 0


# Singleton instance
rag_service = RAGService()
