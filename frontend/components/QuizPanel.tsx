'use client';

import React, { useState } from 'react';
import { HelpCircle, Sparkles, CheckCircle2, XCircle, ChevronRight, Lightbulb } from 'lucide-react';
import { QuizQuestion, QuizEvaluation } from '@/lib/types';
import { evaluateAnswer, getHint } from '@/lib/api';

interface QuizPanelProps {
  questions: QuizQuestion[];
  topicSlug: string;
  userId: string;
  onFinish?: (finalScore: number) => void;
}

export default function QuizPanel({
  questions,
  topicSlug,
  userId,
  onFinish,
}: QuizPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [openAnswer, setOpenAnswer] = useState<string>('');
  const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [loadingHint, setLoadingHint] = useState(false);
  const [scores, setScores] = useState<number[]>([]);

  const currentQ = questions[currentIndex];

  const handleSubmit = async () => {
    const answer = currentQ.type === 'mcq' ? selectedOption : openAnswer;
    if (!answer) return;

    setEvaluating(true);
    try {
      const res = await evaluateAnswer(userId, topicSlug, currentQ.question, answer);
      setEvaluation(res);
      setScores((prev) => [...prev, res.score || 0]);
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleFetchHint = async () => {
    setLoadingHint(true);
    try {
      const res = await getHint(currentQ.question, hintLevel);
      setHint(res.hint);
      setHintLevel((prev) => Math.min(prev + 1, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHint(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption('');
      setOpenAnswer('');
      setEvaluation(null);
      setHint(null);
      setHintLevel(1);
    } else {
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      onFinish?.(avg);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
      {/* Top indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="capitalize px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
          {currentQ.type.toUpperCase()}
        </span>
      </div>

      {/* Question */}
      <h3 className="text-lg md:text-xl font-semibold text-white leading-snug">
        {currentQ.question}
      </h3>

      {/* Answer Options */}
      {currentQ.type === 'mcq' && currentQ.options && (
        <div className="space-y-3">
          {currentQ.options.map((opt, i) => (
            <button
              key={i}
              disabled={!!evaluation}
              onClick={() => setSelectedOption(opt)}
              className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all ${
                selectedOption === opt
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                  : 'bg-slate-800/40 border-white/10 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {currentQ.type === 'open' && (
        <textarea
          disabled={!!evaluation}
          value={openAnswer}
          onChange={(e) => setOpenAnswer(e.target.value)}
          placeholder="Type your explanation or answer here..."
          className="w-full bg-slate-900 border border-white/15 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[120px]"
        />
      )}

      {/* Hint section */}
      {hint && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Progressive Hint:</span> {hint}
          </div>
        </div>
      )}

      {/* Evaluation Feedback */}
      {evaluation && (
        <div
          className={`p-5 rounded-2xl border ${
            evaluation.score >= 70
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">
              Score: {evaluation.score} / 100
            </span>
            {evaluation.score >= 70 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <p className="text-sm">{evaluation.feedback}</p>
          {evaluation.explanation && (
            <p className="text-xs mt-2 text-slate-400">
              <strong className="text-slate-300">Explanation: </strong>
              {evaluation.explanation}
            </p>
          )}
        </div>
      )}

      {/* Action footer */}
      <div className="flex items-center justify-between pt-2">
        {!evaluation ? (
          <>
            <button
              onClick={handleFetchHint}
              disabled={loadingHint}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {loadingHint ? 'Generating Hint...' : 'Need a Hint?'}
            </button>

            <button
              onClick={handleSubmit}
              disabled={evaluating || (!selectedOption && !openAnswer)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              {evaluating ? 'Evaluating...' : 'Submit Answer'}
            </button>
          </>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
