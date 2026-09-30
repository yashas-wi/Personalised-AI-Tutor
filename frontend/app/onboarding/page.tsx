'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  RefreshCcw,
  Sparkles,
  GraduationCap,
  Code2,
  Microscope,
} from 'lucide-react';
import { startAssessment, submitAssessment, getUserId } from '@/lib/api';
import type { AssessmentQuestion } from '@/lib/types';
import { cn, levelColor } from '@/lib/utils';

const EXPERIENCE_LEVELS = [
  {
    id: 'beginner',
    icon: GraduationCap,
    title: 'Just Starting Out',
    description: 'New to AI and machine learning. I want to learn from scratch.',
    color: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'intermediate',
    icon: Code2,
    title: 'Some Programming Experience',
    description: 'I know Python and basic statistics. Familiar with some ML concepts.',
    color: 'from-amber-500 to-orange-500',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'advanced',
    icon: Microscope,
    title: 'ML Practitioner',
    description: "I've trained models before. Looking to deepen expertise.",
    color: 'from-rose-500 to-pink-500',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ level: string; recommended_topics: string[] } | null>(null);

  // Load assessment questions when entering step 3
  useEffect(() => {
    if (step === 3 && questions.length === 0) {
      loadQuestions();
    }
  }, [step]);

  async function loadQuestions() {
    setLoading(true);
    setError('');
    try {
      const qs = await startAssessment();
      setQuestions(qs);
    } catch (e) {
      setError('Failed to load quiz questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerSelect(option: string) {
    setSelectedAnswer(option);
  }

  function handleNextQuestion() {
    if (!selectedAnswer) return;
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: selectedAnswer }));
    setSelectedAnswer('');
    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1);
    } else {
      handleSubmitAssessment({ ...answers, [q.id]: selectedAnswer });
    }
  }

  async function handleSubmitAssessment(finalAnswers: Record<string, string>) {
    setLoading(true);
    setError('');
    try {
      const res = await submitAssessment(name, finalAnswers);
      localStorage.setItem('ai_tutor_user_id', res.user_id);
      localStorage.setItem('ai_tutor_user_name', name);
      localStorage.setItem('ai_tutor_user_level', res.level);
      setResult({ level: res.level, recommended_topics: res.recommended_topics });
      setStep(4);
    } catch (e) {
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen animated-gradient flex flex-col">
      {/* Top progress bar */}
      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl animate-slide-up">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    s < step
                      ? 'bg-indigo-600 text-white'
                      : s === step
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-slate-900'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  )}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      'w-12 h-0.5 rounded-full transition-all duration-500',
                      s < step ? 'bg-indigo-500' : 'bg-white/10'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Name */}
          {step === 1 && (
            <div className="glass-card p-8 text-center animate-fade-in">
              <div className="text-6xl mb-6">🧠</div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to AI Tutor</h1>
              <p className="text-slate-400 mb-8">
                Your personalised AI learning journey starts here. Let&apos;s get to know you.
              </p>
              <div className="text-left mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(2)}
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 hover:scale-[1.02]"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Background */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  What&apos;s your background, {name}?
                </h2>
                <p className="text-slate-400">
                  We&apos;ll personalise your learning path based on your experience level.
                </p>
              </div>
              <div className="space-y-4">
                {EXPERIENCE_LEVELS.map(({ id, icon: Icon, title, description, color, border, bg }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedLevel(id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left hover:scale-[1.01]',
                      selectedLevel === id
                        ? `${border} ${bg} scale-[1.01]`
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br',
                        color
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{title}</div>
                      <div className="text-sm text-slate-400 mt-0.5">{description}</div>
                    </div>
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        selectedLevel === id
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-slate-600'
                      )}
                    >
                      {selectedLevel === id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedLevel}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-indigo-500 hover:to-violet-500 transition-all hover:scale-[1.01]"
                >
                  Take Diagnostic Quiz
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Diagnostic Quiz */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Diagnostic Quiz</h2>
                <p className="text-slate-400">We&apos;ll assess your knowledge to create the perfect learning path.</p>
              </div>

              {loading && questions.length === 0 && (
                <div className="glass-card p-12 text-center">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
                  <div className="text-slate-300 font-medium">Generating personalised questions...</div>
                  <div className="text-slate-500 text-sm mt-1">This takes just a moment</div>
                  {/* Skeleton */}
                  <div className="mt-8 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-12 rounded-xl bg-white/5 animate-pulse"
                        style={{ opacity: 1 - i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="glass-card p-8 text-center border-rose-500/20 bg-rose-500/5">
                  <div className="text-rose-400 mb-4">{error}</div>
                  <button
                    onClick={loadQuestions}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all mx-auto"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && questions.length > 0 && (
                <div className="glass-card p-8">
                  {/* Progress */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">
                      Question {currentQ + 1} of {questions.length}
                    </span>
                    <span className="text-sm text-indigo-400 font-medium">
                      {Math.round(((currentQ) / questions.length) * 100)}% complete
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full mb-6">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${((currentQ) / questions.length) * 100}%` }}
                    />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-6">
                    {questions[currentQ].question}
                  </h3>

                  <div className="space-y-3 mb-6">
                    {questions[currentQ].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswerSelect(opt)}
                        className={cn(
                          'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-150 hover:scale-[1.01]',
                          selectedAnswer === opt
                            ? 'border-indigo-500 bg-indigo-500/15 text-white'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                        )}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all',
                            selectedAnswer === opt
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white/10 text-slate-400'
                          )}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        {opt}
                      </button>
                    ))}
                  </div>

                  {loading && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </div>
                  )}

                  <button
                    onClick={handleNextQuestion}
                    disabled={!selectedAnswer || loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-indigo-500 hover:to-violet-500 transition-all hover:scale-[1.01]"
                  >
                    {currentQ === questions.length - 1 ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {loading ? 'Submitting...' : 'Submit & See Results'}
                      </>
                    ) : (
                      <>
                        Next Question
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && result && (
            <div className="animate-fade-in text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">You&apos;re all set, {name}!</h2>
              <p className="text-slate-400 mb-8">
                Based on your assessment, here&apos;s your personalised learning plan.
              </p>

              <div className="glass-card p-8 mb-6 text-left">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-300 font-medium">Detected Level</span>
                  <span
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-semibold border capitalize',
                      levelColor(result.level)
                    )}
                  >
                    {result.level}
                  </span>
                </div>

                <div>
                  <div className="text-slate-400 text-sm font-medium mb-3">
                    Recommended Topics for You
                  </div>
                  <div className="space-y-2">
                    {(result.recommended_topics || ['ml-fundamentals', 'neural-networks', 'deep-learning']).map(
                      (topic, i) => (
                        <div
                          key={topic}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                        >
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <span className="text-slate-200 capitalize">
                            {topic.replace(/-/g, ' ')}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 hover:scale-[1.02] shadow-2xl shadow-indigo-500/30"
              >
                <Brain className="w-5 h-5" />
                Start Learning
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
