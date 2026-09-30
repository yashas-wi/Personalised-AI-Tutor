'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  BookOpen,
  Target,
  Zap,
  ChevronRight,
  TrendingUp,
  Award,
  MessageCircle,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Play,
} from 'lucide-react';
import { getUserId, getProgressSummary, getNextTopic } from '@/lib/api';
import type { ProgressSummary, NextTopicResponse } from '@/lib/types';
import { TOPICS } from '@/lib/types';
import { cn, levelColor, masteryBarColor, masteryColor, formatPercent } from '@/lib/utils';

function ProgressRing({ value, size = 120 }: { value: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(value)}%</span>
        <span className="text-xs text-slate-400">Mastery</span>
      </div>
    </div>
  );
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={cn('glass-card p-6 animate-pulse', className)}>
      <div className="h-4 bg-white/10 rounded-full w-1/3 mb-3" />
      <div className="h-8 bg-white/10 rounded-full w-1/2 mb-2" />
      <div className="h-3 bg-white/5 rounded-full w-full" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [nextTopic, setNextTopic] = useState<NextTopicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [userLevel, setUserLevel] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('ai_tutor_user_id');
    if (!id) {
      router.push('/onboarding');
      return;
    }
    setUserName(localStorage.getItem('ai_tutor_user_name') || 'Learner');
    setUserLevel(localStorage.getItem('ai_tutor_user_level') || 'beginner');
    loadData(id);
  }, []);

  async function loadData(userId: string) {
    setLoading(true);
    setError('');
    try {
      const [summaryData, nextData] = await Promise.allSettled([
        getProgressSummary(userId),
        getNextTopic(userId),
      ]);
      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      if (nextData.status === 'fulfilled') setNextTopic(nextData.value);
    } catch (e) {
      setError('Failed to load your progress. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const userId = typeof window !== 'undefined' ? localStorage.getItem('ai_tutor_user_id') || '' : '';

  const topicMap = new Map(TOPICS.map((t) => [t.slug, t]));

  const topicsList = summary?.topics || (summary as any)?.topic_breakdown || [];
  const displayTopics = TOPICS.map((t) => {
    const progress = topicsList.find((p: any) => p.topic_slug === t.slug);
    return { ...t, progress };
  });

  const overallMastery = summary?.overall_mastery ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 bg-white/5 rounded-2xl w-1/3 mb-6 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SkeletonCard />
            <SkeletonCard className="md:col-span-2" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, <span className="text-indigo-400">{userName}</span>! 👋
            </h1>
            <p className="text-slate-400 mt-1">Here&apos;s your learning progress overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('px-3 py-1.5 rounded-full text-sm font-medium border capitalize', levelColor(userLevel))}>
              {userLevel} Level
            </span>
            <button
              onClick={() => loadData(userId)}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="glass-card p-4 border-rose-500/20 bg-rose-500/5 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="text-rose-300 text-sm">{error}</span>
            <button onClick={() => loadData(userId)} className="ml-auto text-rose-400 hover:text-rose-300 text-sm underline">
              Retry
            </button>
          </div>
        )}

        {/* Top row: Progress Ring + Continue Learning */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Ring Card */}
          <div className="glass-card p-6 flex flex-col items-center justify-center gap-4 animate-fade-in">
            <ProgressRing value={overallMastery} size={140} />
            <div className="text-center">
              <div className="text-slate-300 font-medium">Overall Progress</div>
              <div className="text-slate-500 text-sm mt-0.5">
                {summary?.topics.filter((t) => t.mastery_score > 0).length ?? 0} of {TOPICS.length} topics started
              </div>
            </div>
          </div>

          {/* Continue Learning Card */}
          <div className="lg:col-span-2 glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border-indigo-500/20 animate-fade-in">
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium mb-4">
              <Play className="w-4 h-4" />
              Continue Learning
            </div>
            {nextTopic ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {nextTopic.topic_name || nextTopic.topic_slug?.replace(/-/g, ' ')}
                </h3>
                {nextTopic.reason && (
                  <p className="text-slate-400 text-sm mb-6">{nextTopic.reason}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/learn/${nextTopic.topic_slug}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all hover:scale-105"
                  >
                    <BookOpen className="w-4 h-4" />
                    Start Lesson
                  </Link>
                  <Link
                    href={`/quiz?topic=${nextTopic.topic_slug}&name=${encodeURIComponent(nextTopic.topic_name || '')}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 font-medium transition-all"
                  >
                    <Target className="w-4 h-4" />
                    Take Quiz
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Brain className="w-10 h-10 text-indigo-400 mb-3" />
                <p className="text-slate-300 font-medium">Start your first lesson!</p>
                <p className="text-slate-500 text-sm mt-1">Choose any topic below to begin learning.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { href: '/quiz', icon: Target, label: 'Take a Quiz', color: 'from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400' },
            { href: '/flashcards', icon: Zap, label: 'Review Flashcards', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400' },
            { href: '#chat', icon: MessageCircle, label: 'Chat with Tutor', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400' },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'glass-card p-4 flex flex-col items-center justify-center gap-2 text-center hover:-translate-y-1 transition-all duration-200 bg-gradient-to-br border',
                color
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium text-white">{label}</span>
            </Link>
          ))}
        </div>

        {/* Topic Progress Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Topic Progress
          </h2>

          {displayTopics.every((t) => !t.progress || t.progress.mastery_score === 0) ? (
            <div className="glass-card p-12 text-center">
              <Award className="w-12 h-12 text-indigo-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">Start your first lesson!</h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Pick a topic below, generate a lesson, and begin your AI mastery journey. Progress will appear here.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayTopics.map((topic) => {
              const mastery = topic.progress?.mastery_score ?? 0;
              const completed = topic.progress?.lessons_completed ?? 0;
              return (
                <div
                  key={topic.slug}
                  className="glass-card p-5 hover:border-white/20 hover:-translate-y-1 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{topic.icon}</div>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        mastery > 0 ? masteryColor(mastery) : 'text-slate-600'
                      )}
                    >
                      {mastery > 0 ? formatPercent(mastery) : 'Not started'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{topic.name}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{topic.description}</p>
                  <div className="h-1.5 bg-white/5 rounded-full mb-3">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        mastery > 0 ? masteryBarColor(mastery) : 'bg-white/10'
                      )}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{completed} lesson{completed !== 1 ? 's' : ''} done</span>
                    <Link
                      href={`/learn/${topic.slug}`}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Study <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
