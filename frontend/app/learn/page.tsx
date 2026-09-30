'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  GraduationCap, 
  Layers,
  Brain,
  Search,
  Filter
} from 'lucide-react';
import { TOPICS } from '@/lib/types';
import { getProgressSummary, getUserId } from '@/lib/api';

export default function LearnIndexPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLevel, setUserLevel] = useState('beginner');

  useEffect(() => {
    const userId = getUserId();
    const storedLevel = localStorage.getItem('ai_tutor_user_level') || 'beginner';
    setUserLevel(storedLevel);

    if (userId) {
      getProgressSummary(userId)
        .then((data) => setSummary(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const topicsList = summary?.topics || summary?.topic_breakdown || [];

  const filteredTopics = TOPICS.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold capitalize">
              {userLevel} Curriculum
            </span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </span>
            Interactive AI Curriculum
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Choose any AI/ML domain below to generate an adaptive lesson with live AI tutoring.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AI topics..."
            className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTopics.map((topic, index) => {
          const progress = topicsList.find((p: any) => p.topic_slug === topic.slug);
          const mastery = progress?.mastery_score || 0;
          const completed = progress?.lessons_completed || 0;

          return (
            <Link
              key={topic.slug}
              href={`/learn/${topic.slug}`}
              className="group relative bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-indigo-500/50 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl">
                    {topic.icon}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    Module {index + 1}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {topic.name}
                </h3>
                <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                  {topic.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                {/* Mastery Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Mastery</span>
                    <span className="font-semibold text-indigo-400">{mastery}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>{completed > 0 ? 'Continue Lesson' : 'Start Lesson'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
