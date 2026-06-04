import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { CandidateHas, Recommendation } from '../types';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`hm-card ${className}`}>{children}</div>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-darktext">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-relaxed text-secondary dark:text-darkmuted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'accent' | 'danger' }) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-gray-800 dark:bg-darktext dark:text-darkbg',
    secondary: 'border border-border bg-white text-primary hover:bg-gray-50 dark:border-darkborder dark:bg-darksurface dark:text-darktext',
    accent: 'bg-accent text-white hover:bg-yellow-800 dark:bg-darkaccent dark:text-darkbg',
    danger: 'bg-danger text-white hover:bg-red-800'
  };
  return (
    <button className={`hm-button ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'emerald' | 'yellow' | 'red' | 'gold' }) {
  const tones = {
    neutral: 'bg-gray-100 text-gray-700 dark:bg-darkborder dark:text-darkmuted',
    green: 'bg-green-100 text-green-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gold: 'bg-yellow-100 text-accent dark:bg-darkaccent/15 dark:text-darkaccent'
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  const tone = recommendation === 'Strong Hire' ? 'green' : recommendation === 'Hire' ? 'emerald' : recommendation === 'Maybe' ? 'yellow' : 'red';
  return <Badge tone={tone}>{recommendation}</Badge>;
}

export function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex min-w-32 items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-darkborder">
        <div className="h-2 rounded-full bg-accent dark:bg-darkaccent" style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right text-sm font-semibold text-primary dark:text-darktext">{value}</span>
    </div>
  );
}

export function StatusCell({ status }: { status: CandidateHas }) {
  const config = {
    match: ['bg-green-50 text-success', 'bg-success', 'Strong Match'],
    partial: ['bg-amber-50 text-warning', 'bg-warning', 'Partial'],
    missing: ['bg-red-50 text-danger', 'bg-danger', 'Missing']
  } as const;
  const [cell, dot, label] = config[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold ${cell}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function SkeletonCard() {
  return (
    <div className="hm-card overflow-hidden p-5">
      <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-darkborder" />
      <div className="mt-4 h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-darkborder" />
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-darkborder" />
    </div>
  );
}

export function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-secondary dark:text-darkmuted">{label}</p>
          <div className="rounded-xl border border-border bg-background p-2 text-accent dark:border-darkborder dark:bg-darkbg dark:text-darkaccent">{icon}</div>
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight text-primary dark:text-darktext">{value}</p>
      </Card>
    </motion.div>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body: string; icon: ReactNode }) {
  return (
    <Card className="flex flex-col items-center justify-center p-10 text-center">
      <div className="rounded-2xl border border-border bg-background p-4 text-accent dark:border-darkborder dark:bg-darkbg dark:text-darkaccent">{icon}</div>
      <h2 className="mt-4 text-xl font-semibold text-primary dark:text-darktext">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary dark:text-darkmuted">{body}</p>
    </Card>
  );
}
