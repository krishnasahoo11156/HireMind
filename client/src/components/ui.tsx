import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CandidateHas, Recommendation } from '../types';
import { DisplayTitle, PageTitleText, SectionTitle, CardTitle, BodyText, Caption, PageTitle } from './Typography';

export { DisplayTitle, PageTitleText, SectionTitle, CardTitle, BodyText, Caption, PageTitle };

// ─────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────
export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`${hover ? 'hm-card-hover' : 'hm-card'} ${className}`}>
      {children}
    </div>
  );
}

// PageTitle component is now imported and re-exported from Typography.tsx above.

// ─────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-gray-800 dark:bg-darktext dark:text-darkbg dark:hover:bg-gray-100',
    secondary: 'border border-border bg-surface text-primary hover:bg-gray-50 dark:border-darkborder dark:bg-darksurface dark:text-darktext dark:hover:bg-darkborder/50',
    accent: 'bg-accent text-white hover:bg-yellow-800 shadow-sm dark:bg-darkaccent dark:text-darkbg dark:hover:bg-yellow-500',
    danger: 'bg-danger text-white hover:bg-red-700',
    ghost: 'text-secondary hover:bg-gray-100 hover:text-primary dark:text-darkmuted dark:hover:bg-darkborder/50 dark:hover:text-darktext'
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
    md: 'h-10 px-4 text-sm font-semibold rounded-xl gap-2',
    lg: 'h-12 px-6 text-[15px] font-semibold rounded-xl gap-2'
  };
  return (
    <button className={`hm-button ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────
export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'emerald' | 'yellow' | 'red' | 'gold' | 'blue' | 'purple'; className?: string }) {
  const tones = {
    neutral: 'bg-gray-100 text-gray-600 dark:bg-darkborder dark:text-darkmuted',
    green: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/40',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    red: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40',
    gold: 'bg-yellow-50 text-accent border border-yellow-200 dark:bg-darkaccent/10 dark:text-darkaccent dark:border-darkaccent/20',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40'
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// RECOMMENDATION BADGE
// ─────────────────────────────────────────────
export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  const tone =
    recommendation === 'Strong Hire' ? 'green' :
    recommendation === 'Hire' ? 'emerald' :
    recommendation === 'Maybe' ? 'yellow' : 'red';
  const tones = {
    neutral: 'bg-gray-100 text-gray-600 dark:bg-darkborder dark:text-darkmuted',
    green: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/40',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    red: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40',
    gold: 'bg-yellow-50 text-accent border border-yellow-200 dark:bg-darkaccent/10 dark:text-darkaccent dark:border-darkaccent/20',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40'
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[14px] font-semibold ${tones[tone]}`}>
      {recommendation}
    </span>
  );
}

// ─────────────────────────────────────────────
// SCORE BAR
// ─────────────────────────────────────────────
export function ScoreBar({ value }: { value: number }) {
  const color = value >= 75 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="flex min-w-[8rem] items-center gap-3">
      <div className="hm-score-track flex-1">
        <motion.div
          className={`h-1.5 rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span className="w-8 text-right text-sm font-semibold tabular-nums text-primary dark:text-darktext">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCORE GAUGE (circular)
// ─────────────────────────────────────────────
export function ScoreGauge({ value, label = 'AI Score' }: { value: number; label?: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 75 ? '#15803D' : value >= 50 ? '#B45309' : '#B91C1C';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <svg className="-rotate-90" viewBox="0 0 100 100" width="112" height="112">
          <circle cx="50" cy="50" r={r} stroke="#E5E7EB" strokeWidth="8" fill="none" className="dark:stroke-darkborder" />
          <motion.circle
            cx="50" cy="50" r={r}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-primary dark:text-darktext">{value}</span>
          <span className="text-xs text-secondary dark:text-darkmuted">/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-secondary dark:text-darkmuted">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// STATUS CELL
// ─────────────────────────────────────────────
export function StatusCell({ status }: { status: CandidateHas }) {
  const config = {
    match: { cell: 'hm-heat-match', dot: 'bg-emerald-500', label: 'Strong Match' },
    partial: { cell: 'hm-heat-partial', dot: 'bg-amber-500', label: 'Partial' },
    missing: { cell: 'hm-heat-missing', dot: 'bg-red-500', label: 'Missing' }
  } as const;
  const { cell, dot, label } = config[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold ${cell}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="hm-card overflow-hidden p-5">
      <div className="hm-skeleton h-3 w-24 rounded-full" />
      <div className="mt-5 hm-skeleton h-9 w-16 rounded-xl" />
      <div className="mt-5 space-y-2">
        <div className="hm-skeleton h-2 w-full rounded-full" />
        <div className="hm-skeleton h-2 w-3/4 rounded-full" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
export function StatCard({
  label, value, icon, trend, trendLabel
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card hover className="p-6">
        <div className="flex items-start justify-between">
          <p className="text-[13px] font-medium text-secondary dark:text-darkmuted">{label}</p>
          <div className="rounded-xl border border-border bg-background p-2 text-accent dark:border-darkborder dark:bg-darkbg dark:text-darkaccent">
            {icon}
          </div>
        </div>
        <p className="mt-4 font-heading text-[40px] font-bold leading-[1.1] tracking-[-0.04em] tabular-nums text-primary dark:text-darktext">{value}</p>
        {trendLabel && (
          <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-secondary dark:text-darkmuted'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
          </p>
        )}
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
export function EmptyState({ title, body, icon, action }: { title: string; body: string; icon: ReactNode; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 rounded-2xl border border-border bg-background p-5 text-accent dark:border-darkborder dark:bg-darkbg dark:text-darkaccent">
        {icon}
      </div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-primary dark:text-darktext">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary dark:text-darkmuted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

// ─────────────────────────────────────────────
// PIPELINE FUNNEL
// ─────────────────────────────────────────────
const FUNNEL_STAGES = [
  { key: 'applied', label: 'Applied', color: 'from-blue-500 to-blue-400', textColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { key: 'screened', label: 'Screened', color: 'from-violet-500 to-violet-400', textColor: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  { key: 'interviewed', label: 'Interviewed', color: 'from-amber-500 to-amber-400', textColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { key: 'offered', label: 'Offered', color: 'from-orange-500 to-orange-400', textColor: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  { key: 'hired', label: 'Hired', color: 'from-green-500 to-green-400', textColor: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
];

export function PipelineFunnel({ funnel }: { funnel: Record<string, number> }) {
  const max = Math.max(...Object.values(funnel), 1);
  return (
    <div className="flex items-end gap-3">
      {FUNNEL_STAGES.map((stage, i) => {
        const count = funnel[stage.key] ?? 0;
        const pct = Math.max((count / max) * 100, 12);
        return (
          <motion.div
            key={stage.key}
            className="flex flex-1 flex-col items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <div className="text-center">
              <span className={`text-2xl font-bold tabular-nums ${stage.textColor}`}>{count}</span>
            </div>
            <div
              className={`w-full rounded-t-xl bg-gradient-to-b ${stage.color} opacity-90 transition-all`}
              style={{ height: `${pct * 1.2}px`, minHeight: '24px' }}
            />
            <span className="text-xs font-semibold text-secondary dark:text-darkmuted">{stage.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// SKILL HEATMAP
// ─────────────────────────────────────────────
export function SkillHeatmap({ skillGap }: { skillGap: Array<{ skill: string; isRequired: boolean; candidateHas: CandidateHas; evidence: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {skillGap.map((gap, i) => (
        <motion.div
          key={gap.skill}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04 }}
          title={gap.evidence}
          className={`flex flex-col gap-1.5 p-3 cursor-default rounded-xl transition-all ${
            gap.candidateHas === 'match' ? 'hm-heat-match' :
            gap.candidateHas === 'partial' ? 'hm-heat-partial' :
            'hm-heat-missing'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold leading-snug">{gap.skill}</span>
            <span className={`h-2.5 w-2.5 flex-none rounded-full ${
              gap.candidateHas === 'match' ? 'bg-emerald-500' :
              gap.candidateHas === 'partial' ? 'bg-amber-500' :
              'bg-red-500'
            }`} />
          </div>
          <span className="text-xs font-medium opacity-80">
            {gap.isRequired ? 'Required' : 'Nice to have'} ·{' '}
            {gap.candidateHas === 'match' ? 'Strong Match' : gap.candidateHas === 'partial' ? 'Partial' : 'Missing'}
          </span>
          {gap.evidence && (
            <p className="mt-1.5 border-t border-current/10 pt-1 text-[10.5px] leading-relaxed opacity-90 font-normal">
              {gap.evidence}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// RANK BADGE
// ─────────────────────────────────────────────
export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-sm font-black text-white shadow-md">
      🥇
    </span>
  );
  if (rank === 2) return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-sm font-black text-white shadow-md">
      🥈
    </span>
  );
  if (rank === 3) return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-sm font-black text-white shadow-md">
      🥉
    </span>
  );
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-secondary dark:border-darkborder dark:bg-darkbg dark:text-darkmuted">
      #{rank}
    </span>
  );
}

// ─────────────────────────────────────────────
// SECTION HEADER (internal helper)
// ─────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="font-heading text-xl font-semibold tracking-tight text-primary dark:text-darktext">{title}</h2>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB BAR
// ─────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-background p-1 dark:border-darkborder dark:bg-darkbg">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
            active === tab
              ? 'bg-surface text-primary shadow-sm dark:bg-darksurface dark:text-darktext'
              : 'text-secondary hover:text-primary dark:text-darkmuted dark:hover:text-darktext'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────
export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    const start = ref.current;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = end;
    }
    requestAnimationFrame(step);
  }, [value]);

  return <>{display}</>;
}
