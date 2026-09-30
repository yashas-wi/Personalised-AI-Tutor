# 🧠 AI Tutor — Personalised AI Tutor for Learning AI

> **Build Fast with AI: AI Build Challenge 2026** — Track: *Personalised AI Tutor for Learning AI*

[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Gemini 1.5 Pro](https://img.shields.io/badge/AI%20Engine-Gemini%201.5%20Pro-4285F4?logo=google)](https://aistudio.google.com/)
[![ChromaDB](https://img.shields.io/badge/RAG-ChromaDB-orange)](https://www.trychroma.com/)
[![Deployment Status](https://img.shields.io/badge/Status-Live%20Online-emerald)](#-live-deployed-links)

An adaptive AI tutoring platform that creates personalized learning paths for mastering AI and Machine Learning. It adjusts difficulty, explanations, practice questions, and progressive hints in real-time based on each learner's ongoing progress.

---

## 🌐 Live Deployed Links

- 🚀 **Live Web Application (Frontend)**: [https://personalised-ai-tutor.vercel.app](https://personalised-ai-tutor-frontend.vercel.app/)
- ⚙️ **Live Backend API & Swagger Docs**: [https://personalised-ai-tutor-ep22.onrender.com/docs](https://personalised-ai-tutor-ep22.onrender.com/docs)
- 📦 **GitHub Repository**: [https://github.com/yashas-wi/Personalised-AI-Tutor](https://github.com/yashas-wi/Personalised-AI-Tutor)

---

## ✨ Key Features

1. **🎯 Diagnostic Assessment**: 5-question AI diagnostic assessment that identifies baseline strengths and categorizes learners into `Beginner`, `Intermediate`, or `Advanced` tracks.
2. **🗺️ Personalised Roadmap**: Dynamically generates topic sequences across 10 AI domains based on individual mastery.
3. **📚 RAG-Augmented Lessons**: Real-time retrieval grounded in a curated AI curriculum vector database to prevent hallucinations.
4. **💬 Context-Aware Streaming AI Chat**: In-lesson sliding drawer for asking clarifying questions with SSE live token streaming.
5. **🚩 Human-in-the-Loop (HITL) Review**: Flag confusing explanations to instantly generate alternative pedagogical perspectives.
6. **🧪 Smart Quizzes & 3-Tier Progressive Hints**: Evaluates open-ended and MCQ answers with rubric scores ($0-100\%$) and step-by-step clues.
7. **🃏 3D Active Recall Flashcards**: Interactive flip-card deck with spaced-repetition mastery classification (`Known` vs. `Study Again`).
8. **📊 Visual Progress Dashboard**: Real-time mastery ring, domain progress bars, and next recommended modules.

---

## 🛠️ Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │            Next.js 14 Frontend (App Router)             │
   │  - Tailwind CSS + Framer Motion + Lucide Icons          │
   └────────────────────────────┬────────────────────────────┘
                                │  REST APIs & SSE Streams
   ┌────────────────────────────▼────────────────────────────┐
   │                  FastAPI Backend Server                 │
   │  - Pydantic v2 Models + SQLAlchemy ORM (SQLite)        │
   └───┬────────────────────────┬────────────────────────┬───┘
       │                        │                        │
┌──────▼────────┐       ┌───────▼────────┐       ┌───────▼────────┐
│ Gemini 1.5 Pro│       │Gemini 1.5 Flash│       │ ChromaDB (RAG) │
│ Primary Engine│       │Quota Fallback  │       │text-embedding04│
└───────────────┘       └────────────────┘       └────────────────┘
```

| Component | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **AI LLM** | Google Gemini 1.5 Pro & Gemini 1.5 Flash |
| **Vector DB & RAG** | ChromaDB + Google `text-embedding-004` |
| **Database** | SQLite via SQLAlchemy |
| **Deployment** | Vercel (Frontend) + Render (Backend) + Docker |

---

## 🤖 AI Tools & Models Disclosed

- **Google Gemini 1.5 Pro**: Primary reasoning model for structured lesson generation, intelligent rubric scoring, and diagnostic analysis.
- **Google Gemini 1.5 Flash**: Low-latency model for real-time chat streaming and progressive hints.
- **Google text-embedding-004**: High-density semantic vector embeddings for knowledge retrieval.
- **ChromaDB**: Embedded vector database for local and cloud RAG search.

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.11+
- Google AI Studio API Key ([https://aistudio.google.com](https://aistudio.google.com))

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
copy .env.example .env       # Add your GOOGLE_API_KEY inside .env
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker 1-Click Run

```bash
docker-compose up --build
```

---

## 📝 License
MIT License — Built for **Build Fast with AI: AI Build Challenge 2026**
