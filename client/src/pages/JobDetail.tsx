import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, FileUp, Loader2, Play, Tag, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import type { Candidate, Job, Resume } from '../types';
import { Badge, Button, Card, PageTitle, RecommendationBadge, ScoreBar, TabBar } from '../components/ui';

export function JobDetail() {
  const { id = 'job_frontend' } = useParams();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const job = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.job(id) as Promise<{ job: Job; resumes: Resume[]; candidates: Candidate[] }>
  });
  const upload = useMutation({
    mutationFn: () => api.uploadBatch(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['job', id] })
  });
  const generate = useMutation({
    mutationFn: () => api.generateRanking(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['job', id] })
  });

  async function runProcessing() {
    setProcessing(true);
    await upload.mutateAsync();
    await new Promise((r) => setTimeout(r, 900));
    await generate.mutateAsync();
    setProcessing(false);
  }

  const data = job.data;
  const statusTone = data?.job.status === 'active' ? 'emerald' : data?.job.status === 'draft' ? 'yellow' : 'neutral';

  return (
    <>
      {/* ── Job Header ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge tone={statusTone as any}>{data?.job.status ?? 'draft'}</Badge>
              <span className="text-sm text-secondary dark:text-darkmuted">
                Created {data?.job.createdAt ? new Date(data.job.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
              </span>
            </div>
            <h1 className="text-[2rem] font-bold tracking-tight text-primary dark:text-darktext">
              {data?.job.title ?? 'Job Detail'}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-secondary dark:text-darkmuted">
              <Users className="h-4 w-4" />
              {data?.candidates.length ?? 0} candidates analyzed
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <Button variant="secondary" onClick={() => upload.mutate()} disabled={upload.isPending}>
              {upload.isPending ? 'Uploading…' : 'Upload Resumes'}
            </Button>
            <Button variant="accent" onClick={runProcessing} disabled={processing}>
              <Play className="h-4 w-4" />
              {processing ? 'Processing…' : 'Analyze Candidates'}
            </Button>
            <Link to={`/jobs/${id}/candidates`}>
              <Button>
                <ArrowRight className="h-4 w-4" />
                View Rankings
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <TabBar
            tabs={['Overview', 'Candidates', 'Activity']}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            {/* Job Intelligence */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-xl bg-accent/10 p-2 dark:bg-darkaccent/10">
                  <Tag className="h-4 w-4 text-accent dark:text-darkaccent" />
                </div>
                <h2 className="text-lg font-semibold text-primary dark:text-darktext">Job Intelligence</h2>
              </div>
              <p className="text-[0.9375rem] leading-relaxed text-secondary dark:text-darkmuted">
                {data?.job.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {data?.job.extractedData.skills.map((skill) => (
                  <Badge key={skill} tone="gold">{skill}</Badge>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <InfoCard label="Experience" value={data?.job.extractedData.experience ?? '3-5 Years'} />
                <InfoCard label="Education" value={data?.job.extractedData.education ?? 'Equivalent'} />
                <InfoCard label="Keywords" value={`${data?.job.extractedData.keywords.length ?? 0} extracted`} />
              </div>
            </Card>

            {/* Upload Zone */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary dark:text-darktext">Upload Resumes</h2>
              <motion.div
                whileHover={{ scale: 1.005 }}
                className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-center transition-colors hover:border-accent hover:bg-accent/[0.02] dark:border-darkborder dark:hover:border-darkaccent"
              >
                <div className="mb-4 rounded-2xl border border-border bg-background p-4 dark:border-darkborder dark:bg-darkbg">
                  <FileUp className="h-8 w-8 text-accent dark:text-darkaccent" />
                </div>
                <p className="text-sm font-semibold text-primary dark:text-darktext">
                  Drag & drop PDF / DOCX files
                </p>
                <p className="mt-1 text-xs text-secondary dark:text-darkmuted">
                  Supports up to 20 files at once · Demo loads 5 seeded resumes
                </p>
                <div className="mt-4 flex gap-3">
                  <Button variant="secondary" size="sm" onClick={() => upload.mutate()} disabled={upload.isPending}>
                    {upload.isPending ? 'Uploading…' : 'Load Demo Resumes'}
                  </Button>
                  <Button variant="accent" size="sm" onClick={runProcessing} disabled={processing}>
                    <Play className="h-3.5 w-3.5" />
                    {processing ? 'Processing…' : 'Analyze All'}
                  </Button>
                </div>
              </motion.div>
            </Card>

            {/* Resume Queue */}
            {(data?.resumes ?? []).length > 0 && (
              <Card className="overflow-hidden">
                <div className="border-b border-border px-6 py-4 dark:border-darkborder">
                  <h2 className="text-base font-semibold text-primary dark:text-darktext">
                    Upload Queue ({data?.resumes.length ?? 0})
                  </h2>
                </div>
                <div className="divide-y divide-border dark:divide-darkborder">
                  {(data?.resumes ?? []).map((resume, i) => (
                    <motion.div
                      key={resume._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between px-6 py-3.5"
                    >
                      <div>
                        <div className="text-sm font-medium text-primary dark:text-darktext">{resume.fileName}</div>
                        <div className="text-xs text-secondary dark:text-darkmuted">{resume.parsedData.name}</div>
                      </div>
                      {processing && i > 1 ? (
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-warning">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Processing…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Parsed
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Live Ranking Preview */}
          <Card className="p-6">
            <h2 className="mb-5 text-lg font-semibold text-primary dark:text-darktext">Live Ranking Preview</h2>
            {(data?.candidates ?? []).length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 rounded-xl border border-border bg-background p-3 dark:border-darkborder dark:bg-darkbg">
                  <Users className="h-6 w-6 text-secondary dark:text-darkmuted" />
                </div>
                <p className="text-sm font-medium text-secondary dark:text-darkmuted">
                  No candidates yet. Upload & analyze to see rankings.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.candidates ?? [])
                  .slice()
                  .sort((a, b) => b.aiScore - a.aiScore)
                  .map((candidate, i) => (
                    <Link key={candidate._id} to={`/candidates/${candidate._id}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5 transition hover:border-accent dark:border-darkborder dark:bg-darkbg dark:hover:border-darkaccent"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-yellow-600/20 text-xs font-bold text-accent dark:text-darkaccent">
                            #{i + 1}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-primary dark:text-darktext">{candidate.name}</div>
                            <div className="mt-0.5">
                              <RecommendationBadge recommendation={candidate.recommendation} />
                            </div>
                          </div>
                        </div>
                        <ScoreBar value={candidate.aiScore} />
                      </motion.div>
                    </Link>
                  ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'Candidates' && (
        <Card className="flex items-center justify-center p-16 text-center">
          <div>
            <p className="text-secondary dark:text-darkmuted">View the full candidate dashboard for this role.</p>
            <div className="mt-4">
              <Link to={`/jobs/${id}/candidates`}>
                <Button variant="accent">
                  <ArrowRight className="h-4 w-4" />
                  Open Rankings
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'Activity' && (
        <Card className="flex items-center justify-center p-16 text-center">
          <p className="text-secondary dark:text-darkmuted">Activity feed coming soon.</p>
        </Card>
      )}
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3.5 dark:border-darkborder dark:bg-darkbg">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary dark:text-darkmuted">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-primary dark:text-darktext">{value}</p>
    </div>
  );
}
