'use client';

import React from 'react';
import { BookOpen, CheckCircle, Flag, Sparkles } from 'lucide-react';
import { LessonContent } from '@/lib/types';

interface LessonViewerProps {
  lesson: LessonContent;
  onFlag?: () => void;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export default function LessonViewer({
  lesson,
  onFlag,
  onComplete,
  isCompleted,
}: LessonViewerProps) {
  return (
    <div className="space-y-6">
      {/* Lesson Metadata */}
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Level: {lesson.level}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white">{lesson.topic_name}</h2>
        </div>

        <div className="flex items-center gap-3">
          {onFlag && (
            <button
              onClick={onFlag}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              Flag / Alternative
            </button>
          )}

          {onComplete && (
            <button
              onClick={onComplete}
              disabled={isCompleted}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              {isCompleted ? 'Completed' : 'Mark as Complete'}
            </button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {lesson.sections &&
          lesson.sections.map((sec, idx) => (
            <div
              key={idx}
              className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 space-y-3"
            >
              <h3 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-400">
                  {idx + 1}
                </span>
                {sec.title}
              </h3>
              <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {sec.content}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
