import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, BriefcaseBusiness, Calendar, Plus, Search, Trash2, Users, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  // Wizard states
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('Frontend Developer');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState(
    'We are looking for a Frontend Developer with strong React ecosystem experience, TypeScript fluency, Redux state management, Next.js delivery experience, and production TailwindCSS practice.'
  );
  const [githubWeight, setGithubWeight] = useState(50);
  const [leetcodeWeight, setLeetcodeWeight] = useState(30);
  const [educationWeight, setEducationWeight] = useState(20);

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
    mutationFn: () => api.createJob({
      title,
      description,
      department,
      weights: {
        github: githubWeight,
        leetcode: leetcodeWeight,
        education: educationWeight
      }
    }),
    onSuccess: () => {
      setOpen(false);
      setStep(1);
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
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
          <Button onClick={() => { setOpen(true); setStep(1); }} size="lg" variant="accent">
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
          action={<Button onClick={() => { setOpen(true); setStep(1); }} variant="accent"><Plus className="h-4 w-4" />Create Job</Button>}
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

      {/* Create Job Wizard Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-3xl"
          >
            <Card className="p-6">
              {/* Modal Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <SectionTitle>Create Job Wizard</SectionTitle>
                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="flex items-center gap-1.5">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${step >= s ? 'bg-accent text-white dark:bg-darkaccent' : 'bg-gray-100 text-secondary dark:bg-darkborder'}`}>
                          {s}
                        </span>
                        <span className={`text-xs font-semibold ${step === s ? 'text-primary dark:text-darktext' : 'text-secondary dark:text-darkmuted'}`}>
                          {s === 1 ? 'Details' : s === 2 ? 'Requirements' : 'Weights'}
                        </span>
                        {s < 3 && <span className="h-px w-8 bg-border dark:bg-darkborder" />}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-secondary transition hover:bg-gray-100 hover:text-primary dark:text-darkmuted dark:hover:bg-darkborder"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Wizard Content Form */}
              <form onSubmit={submit}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 min-h-[300px]"
                    >
                      <h4 className="text-sm font-bold text-primary dark:text-darktext">Step 1: Role Details</h4>
                      <div>
                        <Caption as="label" className="mb-1.5 block font-semibold">Job Title</Caption>
                        <input
                          className="hm-input w-full"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Senior Frontend Developer"
                        />
                      </div>
                      <div>
                        <Caption as="label" className="mb-1.5 block font-semibold">Department</Caption>
                        <select
                          className="hm-input w-full"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                        >
                          {['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'HR'].map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-[1fr_280px] gap-5 min-h-[300px]"
                    >
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-primary dark:text-darktext">Step 2: Job Description</h4>
                        <div>
                          <Caption as="label" className="mb-1.5 block font-semibold">Paste Job Description</Caption>
                          <textarea
                            className="hm-textarea min-h-52 w-full"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the role requirements, technology stack, and qualifications..."
                          />
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
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 min-h-[300px]"
                    >
                      <h4 className="text-sm font-bold text-primary dark:text-darktext">Step 3: AI Scoring Weights</h4>
                      <p className="text-xs text-secondary dark:text-darkmuted">
                        Configure the relative importance of GitHub contribution activity, LeetCode problem solving metrics, and academic/education credentials in the overall AI score calculation.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-primary dark:text-darktext">GitHub Activity & Contribution Quality</span>
                            <span className="text-accent dark:text-darkaccent">{githubWeight}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={githubWeight}
                            onChange={(e) => setGithubWeight(Number(e.target.value))}
                            className="w-full accent-accent"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-primary dark:text-darktext">LeetCode Algorithmic Solving Signal</span>
                            <span className="text-accent dark:text-darkaccent">{leetcodeWeight}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={leetcodeWeight}
                            onChange={(e) => setLeetcodeWeight(Number(e.target.value))}
                            className="w-full accent-accent"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-primary dark:text-darktext">Education & Certification Value</span>
                            <span className="text-accent dark:text-darkaccent">{educationWeight}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={educationWeight}
                            onChange={(e) => setEducationWeight(Number(e.target.value))}
                            className="w-full accent-accent"
                          />
                        </div>

                        <div className="rounded-xl border border-border bg-background p-4 dark:border-darkborder dark:bg-darkbg text-xs font-semibold text-secondary dark:text-darkmuted flex justify-between">
                          <span>Sum total weight:</span>
                          <span className={`${githubWeight + leetcodeWeight + educationWeight === 100 ? 'text-success' : 'text-danger'}`}>
                            {githubWeight + leetcodeWeight + educationWeight}% (Recommended: 100%)
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Navigation */}
                <div className="mt-6 flex justify-between border-t border-border pt-4 dark:border-darkborder">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (step > 1) setStep(step - 1);
                      else setOpen(false);
                    }}
                  >
                    {step === 1 ? 'Cancel' : 'Back'}
                  </Button>
                  <div className="flex gap-2">
                    {step < 3 ? (
                      <Button
                        type="button"
                        variant="accent"
                        onClick={() => setStep(step + 1)}
                        disabled={step === 1 && !title.trim()}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" variant="accent" disabled={create.isPending}>
                        {create.isPending ? 'Analyzing & Saving…' : 'Submit Job'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </>
  );
}
