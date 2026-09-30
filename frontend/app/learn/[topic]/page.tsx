'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Flag,
  Loader2,
  MessageCircle,
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Clock,
  Sparkles,
  ThumbsUp,
  X,
} from 'lucide-react';
import { generateLesson, completeLesson, flagContent, getUserId, getFlashcards } from '@/lib/api';
import type { LessonContent } from '@/lib/types';
import { TOPICS } from '@/lib/types';
import { cn, estimateReadTime, levelColor } from '@/lib/utils';
import ChatTutor from '@/components/ChatTutor';

function LessonSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-white/10 rounded-xl w-2/3" />
      <div className="space-y-3">
        <div className="h-4 bg-white/5 rounded-full w-full" />
        <div className="h-4 bg-white/5 rounded-full w-5/6" />
        <div className="h-4 bg-white/5 rounded-full w-4/5" />
      </div>
      <div className="h-32 bg-white/5 rounded-2xl" />
      <div className="space-y-3">
        <div className="h-4 bg-white/5 rounded-full w-full" />
        <div className="h-4 bg-white/5 rounded-full w-3/4" />
      </div>
      <div className="h-24 bg-white/5 rounded-2xl" />
    </div>
  );
}

function Toast({ message, type = 'success', onDismiss }: { message: string; type?: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border animate-slide-up',
      type === 'success'
        ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
        : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
    )}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function LearnTopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicSlug = params.topic as string;

  const topicMeta = TOPICS.find((t) => t.slug === topicSlug);
  const topicName = topicMeta?.name || topicSlug.replace(/-/g, ' ');

  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [flaggedAlt, setFlaggedAlt] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [preferAlt, setPreferAlt] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('ai_tutor_user_id') || '';
    if (!id) { router.push('/onboarding'); return; }
    setUserId(id);
    generateLessonContent(id);
  }, [topicSlug]);

  async function generateLessonContent(uid: string) {
    setLoading(true);
    setError('');
    try {
      const data = await generateLesson(uid, topicSlug, topicName);
      setLesson(data);
      setExpandedSections(new Set([0]));
    } catch (e) {
      setError('Failed to generate lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!userId) return;
    setCompleting(true);
    try {
      await completeLesson(userId, topicSlug);
      setToast({ message: 'Lesson marked as complete! 🎉', type: 'success' });
      setTimeout(() => router.push(`/quiz?topic=${topicSlug}&name=${encodeURIComponent(topicName)}`), 2000);
    } catch (e) {
      setToast({ message: 'Failed to mark complete. Try again.', type: 'error' });
    } finally {
      setCompleting(false);
    }
  }

  async function handleFlag() {
    if (!lesson || !userId) return;
    setFlagging(true);
    try {
      const fullContent = lesson.sections.map((s) => `${s.title}\n${s.content}`).join('\n\n');
      const res = await flagContent(userId, 'lesson', fullContent);
      setFlaggedAlt(res.alternative_explanation);
    } catch (e) {
      setToast({ message: 'Failed to get alternative explanation.', type: 'error' });
    } finally {
      setFlagging(false);
    }
  }

  function toggleSection(i: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const totalContent = lesson?.sections.map((s) => s.content).join(' ') || '';
  const readTime = estimateReadTime(totalContent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back nav */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{topicMeta?.icon || '📚'}</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{topicName}</h1>
              {lesson && (
                <div className="flex items-center gap-3 mt-1">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', levelColor(lesson.level))}>
                    {lesson.level}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {readTime} min read
                  </span>
                  <span className="text-xs text-slate-500">
                    {lesson.sections.length} sections
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-all text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              Ask Tutor
            </button>
            <button
              onClick={() => generateLessonContent(userId)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
              <RefreshCcw className={cn('w-4 h-4', loading && 'animate-spin')} />
              {loading ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {loading && <LessonSkeleton />}

            {error && !loading && (
              <div className="glass-card p-12 text-center border-rose-500/20">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-4" />
                <p className="text-rose-300 font-medium mb-4">{error}</p>
                <button
                  onClick={() => generateLessonContent(userId)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all mx-auto"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            )}

            {lesson && !loading && (
              <div className="space-y-4 animate-fade-in">
                {lesson.sections.map((section, i) => {
                  const isExpanded = expandedSections.has(i);
                  return (
                    <div key={i} className="glass-card overflow-hidden">
                      <button
                        onClick={() => toggleSection(i)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                            {i + 1}
                          </div>
                          <span className="font-semibold text-white">{section.title}</span>
                        </div>
                        <ChevronDown
                          className={cn('w-5 h-5 text-slate-400 transition-transform duration-200', isExpanded && 'rotate-180')}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-white/5 pt-4">
                          <div className="prose-dark">
                            <ReactMarkdown
                              components={{
                                code({ node, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const isBlock = !!(node as any)?.position && String(children).includes('\n');
                                  return match ? (
                                    <SyntaxHighlighter
                                      style={oneDark as any}
                                      language={match[1]}
                                      PreTag="div"
                                      className="rounded-xl text-sm"
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {section.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Flag Section */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-sm">Was this explanation helpful?</h3>
                      <p className="text-slate-500 text-xs mt-0.5">Flag if you found it confusing — we&apos;ll generate a better one.</p>
                    </div>
                    <button
                      onClick={handleFlag}
                      disabled={flagging || !!flaggedAlt}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 transition-all text-sm font-medium"
                    >
                      {flagging ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Flag className="w-4 h-4" />
                      )}
                      {flagging ? 'Getting alternative...' : flaggedAlt ? 'Flagged' : '🚩 Flag this explanation'}
                    </button>
                  </div>

                  {/* HITL Side-by-side comparison */}
                  {flaggedAlt && (
                    <div className="border-t border-white/5 pt-4 animate-fade-in">
                      <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        Alternative Explanation — Which is better?
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={cn(
                          'rounded-xl p-4 border transition-all',
                          !preferAlt ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/10 bg-white/3'
                        )}>
                          <div className="text-xs font-medium text-slate-400 mb-2">Original</div>
                          <div className="prose-dark text-sm">
                            <ReactMarkdown>{lesson.sections[0]?.content?.slice(0, 400) + '...'}</ReactMarkdown>
                          </div>
                          <button
                            onClick={() => setPreferAlt(false)}
                            className={cn(
                              'mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all',
                              !preferAlt ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-white'
                            )}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            {!preferAlt ? '✓ You prefer this' : 'This one is better'}
                          </button>
                        </div>
                        <div className={cn(
                          'rounded-xl p-4 border transition-all',
                          preferAlt ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/10 bg-white/3'
                        )}>
                          <div className="text-xs font-medium text-slate-400 mb-2">Alternative</div>
                          <div className="prose-dark text-sm">
                            <ReactMarkdown>{flaggedAlt}</ReactMarkdown>
                          </div>
                          <button
                            onClick={() => setPreferAlt(true)}
                            className={cn(
                              'mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all',
                              preferAlt ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-500 hover:text-white'
                            )}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            {preferAlt ? '✓ You prefer this' : 'This one is better'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Complete Lesson */}
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-lg transition-all duration-200 hover:scale-[1.01] shadow-xl shadow-emerald-500/20 disabled:opacity-60"
                >
                  {completing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {completing ? 'Saving progress...' : 'Mark as Complete → Take Quiz'}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Topics nav */}
              <div className="glass-card p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">All Topics</div>
                <div className="space-y-1">
                  {TOPICS.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/learn/${t.slug}`}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                        t.slug === topicSlug
                          ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span className="truncate">{t.name}</span>
                      {t.slug === topicSlug && <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" />}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Ask Tutor CTA */}
              <button
                onClick={() => setChatOpen(true)}
                className="w-full glass-card p-4 flex items-center gap-3 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Ask the Tutor</div>
                  <div className="text-xs text-slate-500">Get instant explanations</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-indigo-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Tutor Modal */}
      <ChatTutor
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        currentTopic={topicName}
        userId={userId}
        topicSlug={topicSlug}
      />

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
