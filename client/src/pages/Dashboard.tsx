import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, BriefcaseBusiness, Clock, FilePlus2, Gauge, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useJobs } from '../hooks/queries';
import { useAuth } from '../firebase/AuthContext';
import type { Candidate, DashboardAnalytics, Job } from '../types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PipelineFunnel,
  RecommendationBadge,
  SectionHeader,
  SkeletonCard,
  StatCard,
  DisplayTitle,
  SectionTitle,
  CardTitle,
  BodyText,
  Caption,
} from '../components/ui';

// ─── Greeting helper ───────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Job Card ──────────────────────────────────────────────────────────────
function JobCard({ job }: { job: Job }) {
  const statusTone = job.status === 'active' ? 'emerald' : job.status === 'draft' ? 'yellow' : 'neutral';
  return (
    <Link to={`/jobs/${job._id}`}>
      <Card hover className="flex flex-col gap-4 p-5 cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-accent/10 dark:bg-darkaccent/10">
            <BriefcaseBusiness className="h-5 w-5 text-accent dark:text-darkaccent" />
          </div>
          <Badge tone={statusTone as any}>{job.status}</Badge>
        </div>
        <div>
          <CardTitle>{job.title}</CardTitle>
          <BodyText variant="small" color="secondary" className="mt-1">
            {job.candidateCount ?? 0} candidate{(job.candidateCount ?? 0) !== 1 ? 's' : ''}
          </BodyText>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.extractedData.skills.slice(0, 3).map((s) => (
            <Badge key={s} tone="neutral">{s}</Badge>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 dark:border-darkborder">
          <span className="text-xs text-secondary dark:text-darkmuted">
            {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-accent dark:text-darkaccent">
            Open Pipeline <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

// ─── Priority Candidate Card ────────────────────────────────────────────────
function PriorityCandidateCard({ candidate, rank }: { candidate: Candidate; rank: number }) {
  const medalColors = [
    'from-yellow-400 to-amber-500',
    'from-gray-300 to-gray-400',
    'from-amber-600 to-amber-700',
  ];
  return (
    <Link to={`/candidates/${candidate._id}`}>
      <Card hover className="flex min-w-[220px] flex-col gap-4 p-5 cursor-pointer">
        <div className="flex items-center justify-between">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${medalColors[rank] ?? 'from-border to-border'} text-sm font-bold text-white shadow-sm`}
          >
            #{rank + 1}
          </div>
          <RecommendationBadge recommendation={candidate.recommendation} />
        </div>
        <div>
          <CardTitle>{candidate.name}</CardTitle>
          <Caption className="mt-0.5 block">{candidate.email}</Caption>
          {candidate.username && (
            <span className="text-[10px] bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full mt-1.5 inline-block">
              @{candidate.username}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-xs font-medium text-secondary dark:text-darkmuted">
              <span>Match</span>
              <span className="font-bold text-primary dark:text-darktext">{candidate.matchPercentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-darkborder">
              <motion.div
                className={`h-1.5 rounded-full ${candidate.matchPercentage >= 75 ? 'bg-success' : candidate.matchPercentage >= 50 ? 'bg-warning' : 'bg-danger'}`}
                initial={{ width: 0 }}
                animate={{ width: `${candidate.matchPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: rank * 0.1 }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums text-primary dark:text-darktext">{candidate.aiScore}</div>
            <div className="text-xs text-secondary dark:text-darkmuted">AI Score</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {candidate.skillGap?.filter(s => s.candidateHas === 'match').slice(0, 2).map(s => (
            <Badge key={s.skill} tone="gold">{s.skill}</Badge>
          ))}
        </div>
      </Card>
    </Link>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
export function Dashboard() {
  const { user } = useAuth();
  const analytics = useQuery({ queryKey: ['analytics'], queryFn: () => api.analytics() as Promise<DashboardAnalytics> });
  const jobs = useJobs();
  const firstJobId = jobs.data?.jobs[0]?._id;
  const candidates = useQuery({
    queryKey: ['candidates', firstJobId],
    queryFn: () => api.candidates(firstJobId!) as Promise<{ candidates: Candidate[] }>,
    enabled: Boolean(firstJobId)
  });

  if (analytics.isLoading || jobs.isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-24 hm-skeleton rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const metrics = analytics.data?.metrics;
  const funnel = analytics.data?.funnel ?? { applied: 0, screened: 0, interviewed: 0, offered: 0, hired: 0 };
  const recentJobs = jobs.data?.jobs.slice(0, 6) ?? [];
  const priorityCandidates = (candidates.data?.candidates ?? [])
    .slice().sort((a, b) => b.aiScore - a.aiScore).slice(0, 5);
  const uploadHref = firstJobId ? `/jobs/${firstJobId}` : '/jobs';

  if (recentJobs.length === 0) {
    return (
      <EmptyState
        title="Create your first job to get started"
        body="Once a role is created, HireMind parses resumes, analyzes candidates, and explains every ranking with AI."
        icon={<BriefcaseBusiness className="h-8 w-8" />}
        action={<Link to="/jobs"><Button size="lg" variant="accent"><FilePlus2 className="h-5 w-5" />Create Job</Button></Link>}
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* ── SECTION 1: Welcome Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-6 rounded-2xl border border-border bg-gradient-to-br from-surface to-background p-6 dark:border-darkborder dark:from-darksurface dark:to-darkbg"
      >
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-secondary dark:text-darkmuted">
            <Sparkles className="h-4 w-4 text-accent dark:text-darkaccent" />
            AI Hiring Intelligence Platform
          </div>
          <DisplayTitle className="mt-1">
            {getGreeting()}, {user?.name || 'Recruiter'} 👋
          </DisplayTitle>
          <BodyText variant="large" color="secondary" className="mt-2">
            Your hiring pipeline has{' '}
            <span className="font-semibold text-primary dark:text-darktext font-sans">
              {metrics?.resumesReviewed ?? 0} active candidates
            </span>{' '}
            across{' '}
            <span className="font-semibold text-primary dark:text-darktext font-sans">
              {recentJobs.length} jobs
            </span>
            .
          </BodyText>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <Link to="/jobs">
            <Button variant="secondary" size="lg">
              <FilePlus2 className="h-4 w-4" />
              Create Job
            </Button>
          </Link>
          <Link to={uploadHref}>
            <Button variant="accent" size="lg">
              <ArrowRight className="h-4 w-4" />
              Upload Resumes
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── SECTION 2: AI Insights Strip ── */}
      <div>
        <SectionHeader title="AI Insights" action={
          <Link to="/analytics" className="flex items-center gap-1 text-sm font-medium text-accent dark:text-darkaccent hover:underline">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        } />
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Candidates Analyzed" value={metrics?.resumesReviewed ?? 0} icon={<Users className="h-4 w-4" />} trend="up" trendLabel="vs last week" />
          <StatCard label="Selected" value={metrics?.candidatesSelected ?? 0} icon={<BriefcaseBusiness className="h-4 w-4" />} trend="up" trendLabel="this month" />
          <StatCard label="Time Saved" value={`${metrics?.timeSaved ?? 0}h`} icon={<Clock className="h-4 w-4" />} trend="up" trendLabel="vs manual review" />
          <StatCard label="AI Accuracy" value={`${metrics?.decisionAccuracy ?? 100}%`} icon={<Gauge className="h-4 w-4" />} trend="neutral" trendLabel="decision accuracy" />
        </div>
      </div>

      {/* ── SECTION 3: Recruitment Pipeline ── */}
      <Card className="p-6">
        <SectionHeader title="Recruitment Pipeline" action={
          <Link to="/analytics">
            <Button variant="ghost" size="sm"><BarChart3 className="h-3.5 w-3.5" />Full Analytics</Button>
          </Link>
        } />
        <PipelineFunnel funnel={funnel} />
      </Card>

      {/* ── SECTION 4: Priority Candidates ── */}
      {priorityCandidates.length > 0 && (
        <div>
          <SectionHeader title="Priority Candidates" action={
            firstJobId ? (
              <Link to={`/jobs/${firstJobId}/candidates`} className="flex items-center gap-1 text-sm font-medium text-accent dark:text-darkaccent hover:underline">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null
          } />
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {priorityCandidates.map((candidate, i) => (
              <motion.div
                key={candidate._id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex-none"
                style={{ width: 240 }}
              >
                <PriorityCandidateCard candidate={candidate} rank={i} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 5: Recent Jobs ── */}
      <div>
        <SectionHeader title="Recent Jobs" action={
          <Link to="/jobs" className="flex items-center gap-1 text-sm font-medium text-accent dark:text-darkaccent hover:underline">
            All Jobs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        } />
        <div className="grid grid-cols-3 gap-4">
          {recentJobs.map((job, i) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <JobCard job={job} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
