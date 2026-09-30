'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brain,
  BookOpen,
  Target,
  Zap,
  ChevronRight,
  TrendingUp,
  Shield,
  Award,
} from 'lucide-react';
import { getUserId } from '@/lib/api';

const features = [
  {
    icon: Brain,
    title: 'Adaptive Learning',
    description:
      'Our AI adjusts difficulty and content based on your performance, ensuring you\'re always learning at the perfect pace.',
    color: 'from-indigo-500 to-indigo-600',
    glow: 'shadow-indigo-500/20',
  },
  {
    icon: Zap,
    title: 'AI-Powered Explanations',
    description:
      'Get instant, personalised explanations for any concept. Ask follow-up questions and get real-time feedback.',
    color: 'from-violet-500 to-violet-600',
    glow: 'shadow-violet-500/20',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description:
      'Visualise your mastery across topics with detailed analytics, quiz scores, and learning streaks.',
    color: 'from-emerald-500 to-emerald-600',
    glow: 'shadow-emerald-500/20',
  },
];

const stats = [
  { label: 'AI Topics', value: '10+', icon: BookOpen },
  { label: 'Adaptive Difficulty', value: '3 Levels', icon: Target },
  { label: 'Real-time Feedback', value: 'Instant', icon: Zap },
  { label: 'Human-in-the-Loop', value: 'HITL', icon: Shield },
];

export default function LandingPage() {
  const router = useRouter();
  const [hasUser, setHasUser] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = typeof window !== 'undefined' ? localStorage.getItem('ai_tutor_user_id') : null;
    setHasUser(!!id);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 animated-gradient -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15)_0%,transparent_60%)] -z-10" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center animate-fade-in">
          {/* Hackathon badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-8">
            <Award className="w-4 h-4" />
            🏆 Build Fast with AI Hackathon
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            Learn AI with Your
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Personal AI Tutor
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Adaptive learning paths that evolve with you. Master machine learning, deep learning,
            and modern AI — at your own pace.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            {mounted && hasUser ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 hover:scale-105 shadow-2xl shadow-indigo-500/30"
              >
                Continue Learning
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 hover:scale-105 shadow-2xl shadow-indigo-500/30"
              >
                Start Learning Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 text-white text-lg font-semibold hover:bg-white/5 transition-all duration-300"
            >
              View Demo
            </a>
          </div>

          <p className="text-slate-500 text-sm">No credit card required · Free forever · HITL powered</p>
        </div>

        {/* Hero visual */}
        <div className="mt-20 relative">
          <div className="max-w-4xl mx-auto glass-card p-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-slate-500 text-sm font-mono">ai-tutor.app</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-3">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-300">AI Tutor</span>
                    <span className="ml-auto text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">● Live</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Great question! A transformer works by using <span className="text-indigo-300 font-medium">self-attention mechanisms</span> to weigh
                    the importance of different parts of the input...
                  </p>
                  <div className="mt-3 flex gap-2">
                    <div className="h-2 bg-indigo-500/30 rounded-full flex-1" />
                    <div className="h-2 bg-indigo-500/50 rounded-full w-2/3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card p-3">
                    <div className="text-xs text-slate-500 mb-1">Topic Mastery</div>
                    <div className="text-2xl font-bold text-white">78%</div>
                    <div className="text-xs text-emerald-400 mt-1">↑ +12% this week</div>
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full">
                      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-xs text-slate-500 mb-1">Next Topic</div>
                    <div className="text-sm font-semibold text-white">Transformers</div>
                    <div className="text-xs text-slate-400 mt-1">5 sections ready</div>
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 font-medium">
                      Start <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="glass-card p-3">
                  <div className="text-xs text-slate-500 mb-2">Flashcards</div>
                  <div className="aspect-square flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-2xl">
                    🔄
                  </div>
                  <div className="text-xs text-center text-slate-400 mt-2">12 / 20</div>
                </div>
                <div className="glass-card p-3">
                  <div className="text-xs text-slate-500 mb-1">Quiz Score</div>
                  <div className="text-xl font-bold text-emerald-400">92</div>
                  <div className="text-xs text-slate-500">Transformers</div>
                </div>
                <div className="glass-card p-3 bg-indigo-500/10 border-indigo-500/20">
                  <div className="text-xs text-indigo-300 font-medium">Level</div>
                  <div className="text-sm font-bold text-white mt-0.5">Intermediate</div>
                  <div className="flex mt-1.5 gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i <= 3 ? 'bg-amber-500' : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 mb-3">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              master AI
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Powered by state-of-the-art language models with a human-in-the-loop quality layer.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description, color, glow }) => (
            <div
              key={title}
              className="glass-card p-8 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${color} mb-6 shadow-xl ${glow} group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="glass-card p-12 text-center bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start your AI journey?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Take a short diagnostic quiz and get a personalised learning path in under 2 minutes.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 hover:scale-105 shadow-2xl shadow-indigo-500/30"
          >
            <Zap className="w-5 h-5" />
            Start for Free
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
