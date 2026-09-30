'use client';

import React from 'react';
import { ProgressSummary } from '@/lib/types';
import { Award, Target, BookOpen, Brain, Zap } from 'lucide-react';
import Link from 'next/link';

interface ProgressDashboardProps {
  summary: ProgressSummary;
}

export default function ProgressDashboard({ summary }: ProgressDashboardProps) {
  const { user, overall_mastery, topics } = summary;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300 capitalize">
              {user.level} Track
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Welcome, {user.name}!
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Your personalized AI learning path is active and adapting to your quiz performance.
          </p>
        </div>

        {/* Overall Mastery Circle */}
        <div className="flex items-center gap-4 bg-slate-900/80 border border-white/10 p-4 rounded-2xl">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-500"
                strokeDasharray={`${overall_mastery}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-sm font-bold text-white">
              {Math.round(overall_mastery)}%
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Mastery</div>
            <div className="text-sm font-semibold text-slate-200">Across Curriculum</div>
          </div>
        </div>
      </div>

      {/* Topic Grid */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          Domain Mastery Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((t) => (
            <div
              key={t.topic_slug}
              className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white text-sm">{t.topic_name}</h4>
                <span className="text-xs font-bold text-indigo-400">
                  {t.mastery_score}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${t.mastery_score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>{t.lessons_completed} Lessons Completed</span>
                <Link
                  href={`/learn/${t.topic_slug}`}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Continue &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
