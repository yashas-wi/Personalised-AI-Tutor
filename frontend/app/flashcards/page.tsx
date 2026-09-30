'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Brain, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  ArrowLeft,
  Layers,
  Award
} from 'lucide-react';
import { getFlashcards, getUserId } from '@/lib/api';
import { FlashCard } from '@/lib/types';

const TOPICS = [
  { slug: 'ml-fundamentals', name: 'ML Fundamentals', icon: '📊', color: 'from-blue-500 to-cyan-500' },
  { slug: 'neural-networks', name: 'Neural Networks', icon: '🧠', color: 'from-purple-500 to-indigo-500' },
  { slug: 'deep-learning', name: 'Deep Learning', icon: '⚡', color: 'from-amber-500 to-orange-500' },
  { slug: 'nlp-basics', name: 'NLP Basics', icon: '📝', color: 'from-emerald-500 to-teal-500' },
  { slug: 'transformers', name: 'Transformers & Attention', icon: '🤖', color: 'from-indigo-500 to-pink-500' },
  { slug: 'computer-vision', name: 'Computer Vision', icon: '👁️', color: 'from-rose-500 to-red-500' },
  { slug: 'reinforcement-learning', name: 'Reinforcement Learning', icon: '🎮', color: 'from-cyan-500 to-blue-500' },
  { slug: 'prompt-engineering', name: 'Prompt Engineering', icon: '✨', color: 'from-violet-500 to-purple-500' },
  { slug: 'llm-architecture', name: 'LLM Architecture', icon: '🏗️', color: 'from-fuchsia-500 to-pink-500' },
  { slug: 'ai-ethics', name: 'AI Ethics & Safety', icon: '🛡️', color: 'from-teal-500 to-green-500' },
];

export default function FlashcardsPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<number>>(new Set());

  const currentTopicObj = TOPICS.find((t) => t.slug === selectedTopic);

  const loadCards = async (topicSlug: string) => {
    setLoading(true);
    setError(null);
    setSelectedTopic(topicSlug);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
    setReviewCards(new Set());

    try {
      const data = await getFlashcards(topicSlug);
      if (data && data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
      } else {
        setError('No flashcards returned for this topic.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate flashcards. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 150);
    }
  };

  const markMastered = () => {
    setMasteredCards((prev) => new Set(prev).add(currentIndex));
    setReviewCards((prev) => {
      const next = new Set(prev);
      next.delete(currentIndex);
      return next;
    });
    handleNext();
  };

  const markNeedReview = () => {
    setReviewCards((prev) => new Set(prev).add(currentIndex));
    setMasteredCards((prev) => {
      const next = new Set(prev);
      next.delete(currentIndex);
      return next;
    });
    handleNext();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-6 h-6" />
            </span>
            AI Concept Flashcards
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Master core AI definitions, architectures, and algorithms with active recall.
          </p>
        </div>

        {selectedTopic && (
          <button
            onClick={() => setSelectedTopic(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-medium transition-all"
          >
            Change Topic
          </button>
        )}
      </div>

      {/* Topic Selection Grid */}
      {!selectedTopic && (
        <div>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Select a Domain to Review</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOPICS.map((topic) => (
              <button
                key={topic.slug}
                onClick={() => loadCards(topic.slug)}
                className="group relative p-5 bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-indigo-500/50 rounded-2xl text-left transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between h-36"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{topic.icon}</span>
                  <span className="text-xs text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                    Start &rarr;
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">AI-generated active recall deck</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-800/40 border border-white/10 rounded-3xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-lg font-medium text-slate-200">Synthesizing Adaptive Flashcard Deck...</p>
          <p className="text-sm text-slate-400 mt-1">Grounded in AI curriculum knowledge base</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <p className="text-rose-400 font-medium">{error}</p>
          <button
            onClick={() => selectedTopic && loadCards(selectedTopic)}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-semibold transition-all"
          >
            Retry Generation
          </button>
        </div>
      )}

      {/* Active Flashcard Viewer */}
      {selectedTopic && !loading && !error && flashcards.length > 0 && (
        <div className="max-w-2xl mx-auto">
          {/* Progress and Topic Bar */}
          <div className="flex items-center justify-between mb-4 bg-slate-800/60 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentTopicObj?.icon}</span>
              <span className="font-semibold text-sm">{currentTopicObj?.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>
                Card <strong className="text-white">{currentIndex + 1}</strong> of {flashcards.length}
              </span>
              <span className="text-emerald-400 font-medium">✓ {masteredCards.size} Known</span>
              <span className="text-amber-400 font-medium">↺ {reviewCards.size} Review</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden border border-white/5">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>

          {/* Interactive Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer min-h-[320px] bg-gradient-to-br from-slate-800/90 to-slate-900/90 hover:border-indigo-500/40 border border-white/15 rounded-3xl p-8 shadow-2xl flex flex-col justify-between transition-all transform duration-300 hover:shadow-indigo-500/10"
          >
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="uppercase tracking-wider font-semibold text-indigo-400">
                {isFlipped ? 'Answer & Explanation' : 'Prompt / Concept'}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <RotateCcw className="w-3.5 h-3.5" /> Click to flip
              </span>
            </div>

            <div className="my-auto py-6 text-center">
              <p className="text-xl md:text-2xl font-semibold leading-relaxed text-slate-100">
                {isFlipped ? flashcards[currentIndex].back : flashcards[currentIndex].front}
              </p>
            </div>

            <div className="text-center text-xs text-slate-500 font-medium">
              {isFlipped ? 'Click again to see question' : 'Click card to reveal answer'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 mt-6">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-2xl border border-white/10 transition-all"
              title="Previous card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 flex-1 justify-center">
              <button
                onClick={markNeedReview}
                className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-2xl font-semibold text-sm transition-all flex-1 max-w-[180px] justify-center"
              >
                <RotateCcw className="w-4 h-4" /> Study Again
              </button>

              <button
                onClick={markMastered}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl font-semibold text-sm transition-all flex-1 max-w-[180px] justify-center"
              >
                <CheckCircle className="w-4 h-4" /> I Knew This
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-2xl border border-white/10 transition-all"
              title="Next card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
