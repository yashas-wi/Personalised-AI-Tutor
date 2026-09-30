"""
services/gemini_service.py
Wrapper around the Google Generative AI SDK with retry, fallback, and
structured-output helpers for every AI Tutor feature.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import AsyncGenerator

import google.generativeai as genai
from dotenv import load_dotenv
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

load_dotenv()
logger = logging.getLogger(__name__)

_API_KEY = os.getenv("GOOGLE_API_KEY", "")
if _API_KEY:
    genai.configure(api_key=_API_KEY)

# ---------------------------------------------------------------------------
# Helper: extract JSON safely from model output
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> str:
    """Strip markdown code fences and extract raw JSON string."""
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text.strip())
    return text.strip()


# ---------------------------------------------------------------------------
# Retry decorator for Gemini quota/server errors
# ---------------------------------------------------------------------------

def _gemini_retry(func):
    return retry(
        retry=retry_if_exception_type(Exception),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )(func)


# ---------------------------------------------------------------------------
# GeminiService
# ---------------------------------------------------------------------------

class GeminiService:
    """
    High-level async interface to Gemini models.
    Uses gemini-1.5-pro by default, falls back to gemini-1.5-flash on quota
    errors or when explicitly requested.
    """

    def __init__(self) -> None:
        self.model_pro = genai.GenerativeModel("gemini-1.5-pro")
        self.model_flash = genai.GenerativeModel("gemini-1.5-flash")

    # ------------------------------------------------------------------
    # Core text generation
    # ------------------------------------------------------------------

    async def generate_text(self, prompt: str, use_flash: bool = False) -> str:
        """
        Generate text from a prompt.
        Falls back to flash model if pro returns a quota/rate error.
        """
        model = self.model_flash if use_flash else self.model_pro

        @_gemini_retry
        async def _call(m):
            loop = asyncio.get_event_loop()
            resp = await loop.run_in_executor(None, lambda: m.generate_content(prompt))
            return resp.text

        try:
            return await _call(model)
        except Exception as exc:
            if not use_flash:
                logger.warning("Pro model failed (%s), falling back to Flash.", exc)
                return await _call(self.model_flash)
            raise

    async def generate_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Async generator that yields text chunks from a streaming response.
        Runs the blocking SDK call in a thread executor then drains chunks.
        """
        loop = asyncio.get_event_loop()
        response_iter = await loop.run_in_executor(
            None,
            lambda: self.model_flash.generate_content(prompt, stream=True),
        )
        for chunk in response_iter:
            text = chunk.text if hasattr(chunk, "text") else ""
            if text:
                yield text

    # ------------------------------------------------------------------
    # Lesson generation
    # ------------------------------------------------------------------

    async def generate_lesson(
        self,
        topic: str,
        level: str,
        context_chunks: list[str],
    ) -> dict:
        """
        Generate a structured lesson as a JSON dict with keys:
        introduction, sections (list), summary, key_takeaways, estimated_minutes.
        """
        context_text = "\n\n".join(context_chunks) if context_chunks else ""
        prompt = f"""
You are an expert AI educator. Generate a detailed, engaging lesson on the topic below.

Topic: {topic}
Student level: {level}
Reference material (use this to ground your explanation):
{context_text}

Return ONLY valid JSON (no markdown fences, no extra text) with this exact structure:
{{
  "introduction": "<2-3 sentence engaging intro>",
  "sections": [
    {{
      "title": "<section title>",
      "content": "<detailed content, 3-5 paragraphs>",
      "code_example": "<optional Python/pseudocode example or null>"
    }}
  ],
  "summary": "<concise 2-3 sentence recap>",
  "key_takeaways": ["<takeaway 1>", "<takeaway 2>", "..."],
  "estimated_minutes": <integer>
}}

Include 3-4 sections covering: core concepts, how it works, real-world applications, and common pitfalls.
Tailor complexity to the {level} level.
"""
        raw = await self.generate_text(prompt)
        try:
            return json.loads(_extract_json(raw))
        except json.JSONDecodeError:
            logger.error("Failed to parse lesson JSON: %s", raw[:300])
            return {
                "introduction": f"Welcome to this lesson on {topic}.",
                "sections": [{"title": "Overview", "content": raw, "code_example": None}],
                "summary": f"That concludes the lesson on {topic}.",
                "key_takeaways": ["Review the material above."],
                "estimated_minutes": 10,
            }

    # ------------------------------------------------------------------
    # Quiz question generation
    # ------------------------------------------------------------------

    async def generate_quiz_questions(
        self,
        topic: str,
        level: str,
        num_questions: int = 5,
    ) -> list[dict]:
        """
        Generate a mix of MCQ and open-answer questions.
        Returns a list of question dicts.
        """
        mcq_count = max(1, num_questions // 2)
        open_count = num_questions - mcq_count

        prompt = f"""
You are an expert AI educator creating quiz questions on: {topic}
Student level: {level}

Generate exactly {num_questions} questions: {mcq_count} multiple-choice and {open_count} open-answer.

Return ONLY valid JSON array (no markdown fences):
[
  {{
    "id": 1,
    "type": "mcq",
    "question": "<question text>",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct_option": "A",
    "topic": "{topic}",
    "difficulty": "medium"
  }},
  {{
    "id": 2,
    "type": "open_answer",
    "question": "<question text>",
    "options": null,
    "model_answer": "<ideal answer>",
    "topic": "{topic}",
    "difficulty": "medium"
  }}
]

Make questions relevant, clear, and appropriately challenging for {level} level.
"""
        raw = await self.generate_text(prompt)
        try:
            return json.loads(_extract_json(raw))
        except json.JSONDecodeError:
            logger.error("Failed to parse quiz JSON: %s", raw[:300])
            return []

    # ------------------------------------------------------------------
    # Answer evaluation
    # ------------------------------------------------------------------

    async def evaluate_answer(
        self,
        question: str,
        user_answer: str,
        correct_context: str,
        level: str,
    ) -> dict:
        """
        Grade a user's answer (0-100) and provide feedback.
        Returns {score, is_correct, feedback, explanation, correct_answer}.
        """
        prompt = f"""
You are an AI tutor evaluating a student's answer.

Question: {question}
Student answer: {user_answer}
Reference/correct context: {correct_context}
Student level: {level}

Evaluate the answer and return ONLY valid JSON (no markdown fences):
{{
  "score": <integer 0-100>,
  "is_correct": <true|false>,
  "feedback": "<personalised, encouraging feedback>",
  "explanation": "<clear explanation of the correct answer>",
  "correct_answer": "<concise correct answer>"
}}

Be encouraging. A score >= 70 is correct. Consider partial credit.
"""
        raw = await self.generate_text(prompt, use_flash=True)
        try:
            return json.loads(_extract_json(raw))
        except json.JSONDecodeError:
            return {
                "score": 50,
                "is_correct": False,
                "feedback": "Your answer was partially correct. Keep practising!",
                "explanation": correct_context,
                "correct_answer": "See explanation above.",
            }

    # ------------------------------------------------------------------
    # Hint generation
    # ------------------------------------------------------------------

    async def generate_hint(self, question: str, hint_level: int) -> str:
        """
        Return a progressive hint.
        hint_level 1 = vague nudge, 2 = moderate, 3 = near-answer.
        """
        descriptions = {
            1: "Give a very vague conceptual nudge — don't mention the answer at all.",
            2: "Give a moderate hint that points toward the key concept without revealing the answer.",
            3: "Give a strong hint that nearly reveals the answer — just a step away.",
        }
        desc = descriptions.get(hint_level, descriptions[1])
        prompt = f"""
You are a patient AI tutor. A student is stuck on this question:

"{question}"

{desc}

Return only the hint text, no extra commentary.
"""
        return await self.generate_text(prompt, use_flash=True)

    # ------------------------------------------------------------------
    # Alternative explanation (HITL)
    # ------------------------------------------------------------------

    async def generate_alternative_explanation(
        self,
        original: str,
        level: str,
    ) -> str:
        """
        Generate an alternative explanation for flagged content.
        Keeps the same facts but uses different analogies and framing.
        """
        prompt = f"""
A student found the following explanation confusing and flagged it for review.

Original explanation:
{original}

Student level: {level}

Write an alternative explanation that:
- Covers the exact same concept
- Uses different analogies and examples
- Is clearer and more accessible for a {level} student
- Is roughly the same length

Return only the alternative explanation text.
"""
        return await self.generate_text(prompt)

    # ------------------------------------------------------------------
    # Flashcard generation
    # ------------------------------------------------------------------

    async def generate_flashcards(
        self,
        topic: str,
        level: str,
        num: int = 10,
    ) -> list[dict]:
        """
        Generate flashcards with front (question/term) and back (answer/definition).
        """
        prompt = f"""
You are an AI tutor creating flashcards on: {topic}
Student level: {level}

Generate exactly {num} flashcards. Return ONLY valid JSON array:
[
  {{
    "id": 1,
    "front": "<term or question>",
    "back": "<definition or answer>",
    "topic": "{topic}"
  }}
]

Cover key terms, concepts, formulas, and common misconceptions.
"""
        raw = await self.generate_text(prompt, use_flash=True)
        try:
            return json.loads(_extract_json(raw))
        except json.JSONDecodeError:
            logger.error("Failed to parse flashcard JSON: %s", raw[:300])
            return []

    # ------------------------------------------------------------------
    # Diagnostic assessment
    # ------------------------------------------------------------------

    async def generate_diagnostic_questions(self) -> list[dict]:
        """
        Generate 5 MCQ questions spanning different AI topics to assess student level.
        """
        prompt = """
You are an AI educator creating a diagnostic assessment to determine a student's level.

Generate exactly 5 MCQ questions, each from a different AI domain:
1. Machine Learning fundamentals
2. Neural Networks / Deep Learning
3. NLP / Transformers
4. Computer Vision
5. Reinforcement Learning / AI Ethics

Each question should discriminate between beginner, intermediate, and advanced knowledge.

Return ONLY valid JSON array:
[
  {
    "id": 1,
    "question": "<question text>",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct_option": "A",
    "topic": "<topic name>",
    "difficulty": "intermediate"
  }
]
"""
        raw = await self.generate_text(prompt)
        try:
            return json.loads(_extract_json(raw))
        except json.JSONDecodeError:
            logger.error("Failed to parse diagnostic JSON: %s", raw[:300])
            return []

    # ------------------------------------------------------------------
    # Diagnostic result analysis
    # ------------------------------------------------------------------

    async def analyze_diagnostic_results(self, answers: list[dict]) -> dict:
        """
        Analyse the diagnostic quiz answers to determine level and weak areas.
        answers: [{question_id, question_text, selected_option, correct_option, topic}]
        Returns: {level, weak_areas, strong_areas, recommended_path, message}
        """
        answers_text = json.dumps(answers, indent=2)
        prompt = f"""
You are an AI tutor analysing a student's diagnostic assessment results.

Student answers (includes selected option and correct option):
{answers_text}

Based on these results:
1. Determine the appropriate learning level: "beginner", "intermediate", or "advanced"
2. Identify weak areas (topics where they answered incorrectly)
3. Identify strong areas (topics where they answered correctly)
4. Recommend an ordered learning path using these topic slugs:
   ['ml-fundamentals', 'neural-networks', 'deep-learning', 'nlp-basics', 'transformers',
    'computer-vision', 'reinforcement-learning', 'prompt-engineering', 'llm-architecture', 'ai-ethics']

Return ONLY valid JSON (no markdown fences):
{{
  "level": "beginner",
  "weak_areas": ["<topic 1>", "<topic 2>"],
  "strong_areas": ["<topic 3>"],
  "recommended_path": ["ml-fundamentals", "neural-networks"],
  "message": "<personalised encouraging message to the student>"
}}
"""
        raw = await self.generate_text(prompt)
        try:
            return json.loads(_extract_json(raw))
        except json.JSONDecodeError:
            return {
                "level": "beginner",
                "weak_areas": [],
                "strong_areas": [],
                "recommended_path": [
                    "ml-fundamentals",
                    "neural-networks",
                    "deep-learning",
                    "nlp-basics",
                    "transformers",
                ],
                "message": "Welcome! Let's start your AI learning journey.",
            }


# Singleton instance
gemini_service = GeminiService()
