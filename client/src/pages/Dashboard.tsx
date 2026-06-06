import { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io as connectSocket, Socket } from 'socket.io-client';
import { ArrowRight, BarChart3, BriefcaseBusiness, Clock, FilePlus2, Gauge, Sparkles, Users, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useJobs } from '../hooks/queries';
import { useRecruiterAuth } from '../firebase/AuthContext';
import type { Candidate, DashboardAnalytics, Job } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
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

interface Toast {
  id: string;
  message: string;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5001');

// ─── Greeting helper ───────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Job Card ──────────────────────────────────────────────────────────────
function JobCard({ job, applicationsCount }: { job: Job; applicationsCount: number }) {
  const statusTone = job.status === 'active' ? 'emerald' : job.status === 'draft' ? 'yellow' : 'neutral';
  return (
    <Link to={`/recruiter/jobs/${job._id}`}>
      <Card hover className="flex flex-col gap-4 p-5 cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-accent/10 dark:bg-darkaccent/10">
            <BriefcaseBusiness className="h-5 w-5 text-accent dark:text-darkaccent" />
          </div>
          <Badge tone={statusTone as any}>{job.status}</Badge>
        </div>
        <div>
          <CardTitle>{job.title}</CardTitle>
          <div className="mt-1 flex flex-col gap-0.5">
            <BodyText variant="small" color="secondary">
              {applicationsCount} application{applicationsCount !== 1 ? 's' : ''} received
            </BodyText>
            <BodyText variant="small" color="secondary" className="flex items-center gap-1 text-[11px]">
              <Sparkles className="h-3 w-3 text-accent dark:text-darkaccent" />
              {job.candidateCount ?? 0} candidate{(job.candidateCount ?? 0) !== 1 ? 's' : ''} analyzed
            </BodyText>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(job.requiredSkills?.length ? job.requiredSkills : job.extractedData.skills).slice(0, 3).map((s) => (
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
    <Link to={`/recruiter/candidates/${candidate._id}`}>
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
  const { user } = useRecruiterAuth();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const [realtimeApplicationsCount, setRealtimeApplicationsCount] = useState(0);
  const [realtimeApplications, setRealtimeApplications] = useState<any[]>([]);

  const analytics = useQuery({ queryKey: ['analytics'], queryFn: () => api.analytics() as Promise<DashboardAnalytics> });
  const jobs = useJobs();
  const firstJobId = jobs.data?.jobs[0]?._id;
  const candidates = useQuery({
    queryKey: ['candidates', firstJobId],
    queryFn: () => api.candidates(firstJobId!) as Promise<{ candidates: Candidate[] }>,
    enabled: Boolean(firstJobId)
  });

  // Real-time Firestore query for recruiter applications
  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, 'applications'),
      where('recruiterId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRealtimeApplicationsCount(snapshot.size);
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });

      // Show toast notifications for newly added docs
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newApp = change.doc.data();
          const appliedTime = newApp.appliedAt ? (newApp.appliedAt.toDate ? newApp.appliedAt.toDate().getTime() : new Date(newApp.appliedAt).getTime()) : Date.now();
          const now = Date.now();
          if (now - appliedTime < 10000) {
            const toastId = Math.random().toString();
            setToasts((prev) => [
              ...prev,
              {
                id: toastId,
                message: `New application from ${newApp.candidateName || 'Candidate'}!`
              }
            ]);
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== toastId));
            }, 5000);
          }
        }
      });

      setRealtimeApplications(list);
    });

    return unsubscribe;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const socket: Socket = connectSocket(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[dashboard-socket] Connected. Joining recruiter room: recruiter-${user.id}`);
      socket.emit('join_recruiter', user.id);
    });

    socket.on('new_application', (payload: { candidateId: string; candidateName: string; jobId: string; jobTitle: string }) => {
      console.log('[dashboard-socket] Received new_application:', payload);
      
      // Invalidate queries
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      if (firstJobId) {
        void queryClient.invalidateQueries({ queryKey: ['candidates', firstJobId] });
      }
    });

    return () => {
      socket.emit('leave_recruiter', user.id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, firstJobId, queryClient]);

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
  const uploadHref = firstJobId ? `/recruiter/jobs/${firstJobId}` : '/recruiter/jobs';

  if (recentJobs.length === 0) {
    return (
      <EmptyState
        title="Create your first job to get started"
        body="Once a role is created, HireMind parses resumes, analyzes candidates, and explains every ranking with AI."
        icon={<BriefcaseBusiness className="h-8 w-8" />}
        action={<Link to="/recruiter/jobs"><Button size="lg" variant="accent"><FilePlus2 className="h-5 w-5" />Create Job</Button></Link>}
      />
    );
  }

  return (
    <div className="space-y-10 relative">
      {/* Live Toasts Container */}
      <div className="fixed top-6 right-6 z-50 space-y-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-surface/95 dark:bg-darksurface/95 shadow-xl p-4 backdrop-blur-md"
            >
              <Bell className="h-5 w-5 text-emerald-500 flex-shrink-0 animate-bounce" />
              <div className="text-sm font-semibold text-primary dark:text-darktext">
                {t.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
          <StatCard label="Applications Received" value={realtimeApplicationsCount} icon={<Users className="h-4 w-4" />} trend="up" trendLabel="vs last week" />
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
              <Link to={`/recruiter/jobs/${firstJobId}/candidates`} className="flex items-center gap-1 text-sm font-medium text-accent dark:text-darkaccent hover:underline">
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
          {recentJobs.map((job, i) => {
            const count = realtimeApplications.filter((app) => app.jobId === job._id).length;
            return (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <JobCard job={job} applicationsCount={count} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
