import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

export function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function levelColor(level: string): string {
  switch (level?.toLowerCase()) {
    case 'beginner': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    case 'intermediate': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    case 'advanced': return 'text-rose-400 bg-rose-400/10 border-rose-400/30';
    default: return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30';
  }
}

export function masteryColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

export function masteryBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}
