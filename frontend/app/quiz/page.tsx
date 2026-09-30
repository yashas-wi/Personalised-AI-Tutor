'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Target,
  Loader2,
  CheckCircle,
  XCircle,
  Lightbulb,
  ChevronRight,
  ArrowLeft,
  RefreshCcw,
  Award,
  AlertCircle,
  X,
  BookOpen,
} from 'lucide-react';
import { generateQuiz, evaluateAnswer, getHint, getUserId } from '@/lib/api';
import type { QuizQuestion, QuizEvaluation } from '@/lib/types';
import { TOPICS } from '@/lib/types';
import { cn, levelColor } from '@/lib/utils';

function HintModal({
  question,
  onClose,
}: {
  question: string;
  onClose: () => void;
}) {
  const [hints, setHints] = useState<string[]>([]);
  const [hintLevel, setHintLevel] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHint(1);
  }, []);

  async function loadHint(level: number) {
    setLoading(true);
    try {
      const res = await getHint(question, level);
      setHints((prev) => [...prev, res.hint]);
      setHintLevel(level + 1);
    } catch {
      setHints((prev) => [...prev, 'Could not load hint. Try again.']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card w-full max-w-md mx-4 p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Lightbulb className="w-5 h-5" />
            <span className="font-semibold">Hints</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {hints.map((hint, i) => (
            <div key={i} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
              <span className="font-medium text-amber-400 text-xs uppercase tracking-wide">Hint {i + 1}</span>
              <p className="mt-1">{hint}</p>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-sm p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading hint...
            </div>
          )}
        </div>
        {hintLevel <= 3 && (
          <button
            onClick={() => loadHint(hintLevel)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all text-sm font-medium disabled:opacity-40"
          >
            <Lightbulb className="w-4 h-4" />
            {loading ? 'Loading...' : 'Another Hint (Deeper)'}
          </button>
        )}
      </div>
    </div>
  );
}

function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicSlug = searchParams.get('topic') || '';
  const topicName = searchParams.get('name') || topicSlug.replace(/-/g, ' ');

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [openAnswer, setOpenAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('ai_tutor_user_id') || '';
    setUserId(id);
    if (topicSlug && id) loadQuiz(id);
  }, [topicSlug]);

  async function loadQuiz(uid: string) {
    setLoading(true);
    setError('');
    setQuestions([]);
    setCurrentIdx(0);
    setScores([]);
    setDone(false);
    try {
      const qs = await generateQuiz(uid, topicSlug, 5);
      setQuestions(qs);
    } catch {
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!questions[currentIdx] || !userId) return;
    const q = questions[currentIdx];
    const answer = q.type === 'mcq' ? selectedAnswer : openAnswer;
    if (!answer.trim()) return;
    setEvaluating(true);
    setEvaluation(null);
    try {
      const result = await evaluateAnswer(userId, topicSlug, q, answer);
      setEvaluation(result);
      setScores((prev) => [...prev, result.score]);
    } catch {
      setError('Failed to evaluate answer. Please try again.');
    } finally {
      setEvaluating(false);
    }
  }

  function handleNext() {
    setEvaluation(null);
    setSelectedAnswer('');
    setOpenAnswer('');
    setError('');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((p) => p + 1);
    } else {
      setDone(true);
    }
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const q = questions[currentIdx];

  // Topic selector screen
  if (!topicSlug) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Target className="w-8 h-8 text-indigo-400" />
          Choose a Topic to Quiz
        </h1>
        <p className="text-slate-400 mb-8">Select a topic to test your knowledge.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {TOPICS.map((t) => (
            <button
              key={t.slug}
              onClick={() => router.push(`/quiz?topic=${t.slug}&name=${encodeURIComponent(t.name)}`)}
              className="glass-card p-5 flex flex-col items-center gap-3 text-center hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-200"
            >
              <span className="text-3xl">{t.icon}</span>
              <span className="text-sm font-medium text-white">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Loading quiz
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
        <div className="text-slate-300 font-semibold text-lg">Generating quiz questions...</div>
        <div className="text-slate-500 text-sm mt-2">AI is crafting personalised questions for you</div>
        <div className="mt-8 space-y-3 max-w-lg mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Done screen
  if (done) {
    const badge = avgScore >= 80 ? '🏆 Expert' : avgScore >= 60 ? '⭐ Good Job' : '📚 Keep Studying';
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="text-6xl mb-4">
          {avgScore >= 80 ? '🏆' : avgScore >= 60 ? '⭐' : '📚'}
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-slate-400 mb-8">You&apos;ve finished the {topicName} quiz.</p>
        <div className="glass-card p-8 mb-6">
          <div className="text-6xl font-black mb-2" style={{ color: avgScore >= 80 ? '#34d399' : avgScore >= 60 ? '#fbbf24' : '#f87171' }}>
            {avgScore}
          </div>
          <div className="text-slate-400 text-sm mb-4">Average Score</div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">
            <Award className="w-4 h-4" />
            {badge}
          </div>
          <div className="mt-6 grid grid-cols-5 gap-2">
            {scores.map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="h-16 rounded-lg flex items-end justify-center pb-1"
                  style={{ background: `rgba(99,102,241,${s / 100 * 0.4 + 0.1})` }}
                >
                  <span className="text-xs font-bold text-white">{s}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Q{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/flashcards?topic=${topicSlug}&name=${encodeURIComponent(topicName)}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 font-medium transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Review Flashcards
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all"
          >
            Back to Dashboard
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/quiz" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Change Topic
        </Link>
        <span className="text-sm text-slate-400 font-medium">{topicName}</span>
        <button
          onClick={() => loadQuiz(userId)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>

      {error && (
        <div className="glass-card p-4 border-rose-500/20 bg-rose-500/5 flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span className="text-rose-300 text-sm">{error}</span>
        </div>
      )}

      {questions.length > 0 && q && (
        <>
          {/* Progress */}
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-slate-400">Question {currentIdx + 1} of {questions.length}</span>
            <span className="text-indigo-400 font-medium">{Math.round((currentIdx / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full mb-6">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentIdx / questions.length) * 100}%` }}
            />
          </div>

          <div className="glass-card p-6">
            {/* Question type badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full border',
                q.type === 'mcq' ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : 'text-violet-400 border-violet-500/30 bg-violet-500/10'
              )}>
                {q.type === 'mcq' ? 'Multiple Choice' : 'Open Answer'}
              </span>
              <button
                onClick={() => setShowHint(true)}
                disabled={!!evaluation}
                className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 disabled:opacity-30 transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                Hint
              </button>
            </div>

            <h3 className="text-lg font-semibold text-white mb-6">{q.question}</h3>

            {/* MCQ */}
            {q.type === 'mcq' && q.options && (
              <div className="space-y-3 mb-6">
                {q.options.map((opt, i) => {
                  let variant = 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10';
                  if (evaluation) {
                    if (opt === selectedAnswer) {
                      variant = evaluation.score >= 50
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                        : 'border-rose-500/50 bg-rose-500/10 text-rose-200';
                    }
                  } else if (opt === selectedAnswer) {
                    variant = 'border-indigo-500 bg-indigo-500/15 text-white';
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => !evaluation && setSelectedAnswer(opt)}
                      disabled={!!evaluation}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-150',
                        variant,
                        !evaluation && 'hover:scale-[1.01] cursor-pointer'
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all',
                        opt === selectedAnswer && !evaluation ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'
                      )}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      {opt}
                      {evaluation && opt === selectedAnswer && (
                        <span className="ml-auto">
                          {evaluation.score >= 50 ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400" />
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Open answer */}
            {q.type === 'open' && (
              <textarea
                value={openAnswer}
                onChange={(e) => setOpenAnswer(e.target.value)}
                disabled={!!evaluation}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all mb-6 disabled:opacity-60"
              />
            )}

            {/* Evaluation result */}
            {evaluating && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4 text-indigo-300">
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                <span className="text-sm font-medium">AI is grading your answer...</span>
              </div>
            )}

            {evaluation && !evaluating && (
              <div className={cn(
                'p-5 rounded-xl border mb-4 animate-fade-in',
                evaluation.score >= 70
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : evaluation.score >= 40
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              )}>
                <div className="flex items-center gap-3 mb-3">
                  {evaluation.score >= 70 ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-white text-lg">{evaluation.score}/100</div>
                    <div className="text-sm text-slate-400">{evaluation.feedback}</div>
                  </div>
                </div>
                {evaluation.explanation && (
                  <div className="text-sm text-slate-300 border-t border-white/10 pt-3 mt-3">
                    <span className="font-medium text-slate-200">Explanation: </span>
                    {evaluation.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            {!evaluation ? (
              <button
                onClick={handleSubmit}
                disabled={evaluating || (q.type === 'mcq' ? !selectedAnswer : !openAnswer.trim())}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01]"
              >
                {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold transition-all hover:scale-[1.01]"
              >
                {currentIdx < questions.length - 1 ? (
                  <>Next Question <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>See Results <Award className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </>
      )}

      {showHint && q && (
        <HintModal question={q.question} onClose={() => setShowHint(false)} />
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-8">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      }>
        <QuizContent />
      </Suspense>
    </div>
  );
}
