// API client for AI Tutor backend
import type {
  AssessmentQuestion,
  ChatMessage,
  FlashCard,
  FlagResponse,
  HintResponse,
  LessonContent,
  NextTopicResponse,
  ProgressSummary,
  QuizEvaluation,
  QuizQuestion,
} from './types';

export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── User ID ──────────────────────────────────────────────────────────────────

export function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('ai_tutor_user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ai_tutor_user_id', id);
  }
  return id;
}

export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ai_tutor_user_id');
  }
}

// ─── Generic fetch helper ─────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export async function startAssessment(): Promise<AssessmentQuestion[]> {
  return apiFetch<AssessmentQuestion[]>('/api/assessment/start');
}

export async function submitAssessment(
  name: string,
  answers: Record<string, string>
): Promise<{ user_id: string; level: string; recommended_topics: string[] }> {
  const userId = getUserId();
  return apiFetch('/api/assessment/submit', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, name, answers }),
  });
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function getProgress(userId: string): Promise<ProgressSummary> {
  return apiFetch<ProgressSummary>(`/api/progress/${userId}`);
}

export async function getProgressSummary(userId: string): Promise<ProgressSummary> {
  return apiFetch<ProgressSummary>(`/api/progress/${userId}/summary`);
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

export async function generateLesson(
  userId: string,
  topicSlug: string,
  topicName: string
): Promise<LessonContent> {
  return apiFetch<LessonContent>('/api/lessons/generate', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, topic_slug: topicSlug, topic_name: topicName }),
  });
}

export async function completeLesson(
  userId: string,
  topicSlug: string
): Promise<{ message: string }> {
  return apiFetch(`/api/lessons/${userId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ topic_slug: topicSlug }),
  });
}

export async function getNextTopic(userId: string): Promise<NextTopicResponse> {
  return apiFetch<NextTopicResponse>(`/api/lessons/${userId}/next`);
}

export async function flagContent(
  userId: string,
  itemType: string,
  originalContent: string
): Promise<FlagResponse> {
  return apiFetch<FlagResponse>('/api/lessons/flag', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, item_type: itemType, original_content: originalContent }),
  });
}

export async function getFlashcards(topicSlug: string): Promise<FlashCard[]> {
  return apiFetch<FlashCard[]>(`/api/lessons/flashcards/${topicSlug}`);
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export async function generateQuiz(
  userId: string,
  topicSlug: string,
  numQuestions: number = 5
): Promise<QuizQuestion[]> {
  return apiFetch<QuizQuestion[]>('/api/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, topic_slug: topicSlug, num_questions: numQuestions }),
  });
}

export async function evaluateAnswer(
  userId: string,
  topicSlug: string,
  question: QuizQuestion,
  answer: string
): Promise<QuizEvaluation> {
  return apiFetch<QuizEvaluation>('/api/quiz/evaluate', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, topic_slug: topicSlug, question, answer }),
  });
}

export async function getHint(
  question: string,
  hintLevel: number
): Promise<HintResponse> {
  return apiFetch<HintResponse>('/api/quiz/hint', {
    method: 'POST',
    body: JSON.stringify({ question, hint_level: hintLevel }),
  });
}

// ─── Chat (SSE streaming) ─────────────────────────────────────────────────────

export async function sendChatMessage(
  userId: string,
  message: string,
  topicSlug: string | undefined,
  history: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      message,
      topic_slug: topicSlug,
      history,
    }),
  });
  if (!res.ok) {
    throw new Error(`Chat API error ${res.status}`);
  }
  if (!res.body) throw new Error('No response body');
  return res.body;
}
