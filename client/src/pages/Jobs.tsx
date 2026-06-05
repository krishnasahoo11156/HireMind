import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, BriefcaseBusiness, Calendar, Plus, Search, Trash2, Users, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import type { Job } from '../types';
import { Badge, Button, Card, EmptyState, PageTitle, DisplayTitle, SectionTitle, CardTitle, BodyText, Caption } from '../components/ui';

// ─── Job Card ──────────────────────────────────────────────────────────────
function JobCard({ job, onDelete }: { job: Job; onDelete?: () => void }) {
  const statusTone = job.status === 'active' ? 'emerald' : job.status === 'draft' ? 'yellow' : 'neutral';
  const readiness = job.candidateCount ? Math.min(100, (job.candidateCount ?? 0) * 20) : 0;

  return (
    <Card hover className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent/10 dark:bg-darkaccent/10">
          <BriefcaseBusiness className="h-5 w-5 text-accent dark:text-darkaccent" />
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone as any}>{job.status}</Badge>
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(); }}
              aria-label="Delete job"
              className="rounded-lg p-1.5 text-secondary transition hover:bg-red-50 hover:text-danger dark:text-darkmuted dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        <CardTitle>{job.title}</CardTitle>
        <BodyText variant="default" color="secondary" className="mt-1 line-clamp-2">
          {job.description?.slice(0, 100)}…
        </BodyText>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.extractedData.skills.slice(0, 4).map((s) => (
          <Badge key={s} tone="neutral">{s}</Badge>
        ))}
        {job.extractedData.skills.length > 4 && (
          <Badge tone="neutral">+{job.extractedData.skills.length - 4}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm dark:border-darkborder dark:bg-darkbg">
        <div className="flex items-center gap-2 text-secondary dark:text-darkmuted">
          <Users className="h-3.5 w-3.5" />
          <span className="font-medium text-primary dark:text-darktext">{job.candidateCount ?? 0}</span> candidates
        </div>
        <div className="flex items-center gap-2 text-secondary dark:text-darkmuted">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* AI readiness indicator */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-medium text-secondary dark:text-darkmuted">
            <Zap className="h-3 w-3" /> AI Readiness
          </span>
          <span className="font-semibold text-primary dark:text-darktext">{readiness}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-darkborder">
          <div
            className={`h-1.5 rounded-full transition-all ${readiness > 60 ? 'bg-success' : readiness > 30 ? 'bg-warning' : 'bg-accent dark:bg-darkaccent'}`}
            style={{ width: `${readiness}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-border pt-4 dark:border-darkborder">
        <Link to={`/jobs/${job._id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">View</Button>
        </Link>
        <Link to={`/jobs/${job._id}`} className="flex-1">
          <Button variant="accent" size="sm" className="w-full">
            <Zap className="h-3.5 w-3.5" />Analyze
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// ─── Preview helper ─────────────────────────────────────────────────────────
function Preview({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-4">
      <Caption className="mb-2 block font-semibold uppercase tracking-wider">{label}</Caption>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => <Badge key={item} tone="gold">{item}</Badge>)}
      </div>
    </div>
  );
}

// ─── Jobs Page ─────────────────────────────────────────────────────────────
export function Jobs() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [title, setTitle] = useState('Frontend Developer');
  const [description, setDescription] = useState(
    'We are looking for a Frontend Developer with strong React ecosystem experience, TypeScript fluency, Redux state management, Next.js delivery experience, and production TailwindCSS practice.'
  );
  const extracted = useMemo(() => ({
    skills: ['React', 'TypeScript', 'Redux', 'Next.js', 'TailwindCSS'].filter((skill) =>
      description.toLowerCase().includes(skill.toLowerCase())
    ),
    experience: '3-5 Years',
    education: 'Computer Science or equivalent practical experience',
    keywords: ['React ecosystem', 'component architecture', 'state management', 'responsive UI']
  }), [description]);

  const jobs = useQuery({ queryKey: ['jobs'], queryFn: () => api.jobs() as Promise<{ jobs: Job[] }> });
  const create = useMutation({
    mutationFn: () => api.createJob({ title, description }),
    onSuccess: () => { setOpen(false); void queryClient.invalidateQueries({ queryKey: ['jobs'] }); }
  });

  const filtered = useMemo(() => {
    return (jobs.data?.jobs ?? [])
      .filter((j) => statusFilter === 'all' || j.status === statusFilter)
      .filter((j) => j.title.toLowerCase().includes(query.toLowerCase()));
  }, [jobs.data, statusFilter, query]);

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <>
      <PageTitle
        title="Jobs"
        subtitle="Create roles, upload descriptions, and let AI analyze every candidate."
        action={
          <Button onClick={() => setOpen(true)} size="lg" variant="accent">
            <Plus className="h-4 w-4" />New Job
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary dark:text-darkmuted" />
          <input
            className="hm-input w-full pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs…"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-background p-1 dark:border-darkborder dark:bg-darkbg">
          {(['all', 'active', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-all ${statusFilter === s ? 'bg-surface text-primary shadow-sm dark:bg-darksurface dark:text-darktext' : 'text-secondary hover:text-primary dark:text-darkmuted'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Job grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          body="Create a job to begin analyzing candidates with AI."
          icon={<BriefcaseBusiness className="h-8 w-8" />}
          action={<Button onClick={() => setOpen(true)} variant="accent"><Plus className="h-4 w-4" />Create Job</Button>}
        />
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filtered.map((job, i) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <JobCard job={job} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-3xl"
          >
            <Card className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <SectionTitle>Create Job</SectionTitle>
                  <p className="mt-1 text-sm text-secondary dark:text-darkmuted">
                    Paste the JD or write it directly. AI extracts requirements automatically.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-secondary transition hover:bg-gray-100 hover:text-primary dark:text-darkmuted dark:hover:bg-darkborder"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form className="grid grid-cols-[1fr_280px] gap-5" onSubmit={submit}>
                <div className="space-y-4">
                  <input
                    className="hm-input w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Job title"
                  />
                  <textarea
                    className="hm-textarea min-h-52 w-full"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Paste job description…"
                  />
                  <div className="flex min-h-24 items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm font-medium text-secondary transition hover:border-accent dark:border-darkborder dark:text-darkmuted dark:hover:border-darkaccent">
                    Drop PDF / DOCX
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4 dark:border-darkborder dark:bg-darkbg">
                  <div className="mb-4 flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-accent dark:text-darkaccent" />
                    <CardTitle>AI Extraction Preview</CardTitle>
                  </div>
                  <Preview label="Skills" items={extracted.skills.length ? extracted.skills : ['React', 'TypeScript']} />
                  <Preview label="Experience" items={[extracted.experience]} />
                  <Preview label="Education" items={[extracted.education]} />
                  <Preview label="Keywords" items={extracted.keywords} />
                </div>

                <div className="col-span-2 flex justify-end gap-3 border-t border-border pt-4 dark:border-darkborder">
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="accent" disabled={create.isPending}>
                    {create.isPending ? 'Saving…' : 'Save Job'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </>
  );
}
