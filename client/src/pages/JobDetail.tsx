import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, FileUp, Loader2, Play, Tag, Users, BrainCircuit, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { api } from '../lib/api';
import { useRetryAnalysis } from '../hooks/queries';
import type { Candidate, Job, Resume } from '../types';
import {
  Badge,
  Button,
  Card,
  PageTitle,
  RecommendationBadge,
  ScoreBar,
  TabBar,
  DisplayTitle,
  SectionTitle,
  CardTitle,
  BodyText,
  Caption
} from '../components/ui';
import { useResumeSocket } from '../hooks/useResumeSocket';
import { ResumeProcessingPanel } from '../components/ResumeProcessingPanel';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export function JobDetail() {
  const { id = 'job_frontend' } = useParams();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  const [realtimeApps, setRealtimeApps] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // ── Live socket state ────────────────────────────────────────────────────
  const socketState = useResumeSocket(id);

  const job = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.job(id) as Promise<{ job: Job; resumes: Resume[]; candidates: Candidate[] }>
  });

  // Real-time Firestore query for this job's applications
  useEffect(() => {
    const q = query(
      collection(db, 'applications'),
      where('jobId', '==', id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRealtimeApps(list);
      setLoadingApps(false);
    });

    return unsubscribe;
  }, [id]);

  const upload = useMutation({
    mutationFn: (files?: File[]) => api.uploadBatch(files, id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['job', id] })
  });

  const generate = useMutation({
    mutationFn: () => api.generateRanking(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['job', id] })
  });

  const retryMutation = useRetryAnalysis({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    }
  });

  const handleRetry = (app: any) => {
    const formData = new FormData();
    formData.append('applicationId', app._id ?? app.id);
    formData.append('jobId', id);
    formData.append('name', app.candidateName || '');
    formData.append('whyApplying', app.whyApplying || '');
    retryMutation.mutate(formData);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 20,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        upload.mutate(acceptedFiles);
      }
    }
  });

  async function runProcessing() {
    setProcessing(true);
    await upload.mutateAsync(undefined);
    await new Promise((r) => setTimeout(r, 900));
    await generate.mutateAsync();
    setProcessing(false);
  }

  const data = job.data;
  const statusTone =
    data?.job.status === 'active'
      ? 'emerald'
      : data?.job.status === 'draft'
      ? 'yellow'
      : 'neutral';

  // Merge live candidates with fetched candidates (live takes precedence)
  const mergedCandidates = (() => {
    const fetched = data?.candidates ?? [];
    if (socketState.liveCandidates.length === 0) return fetched;
    // Build map from fetched, overwrite with live
    const map = new Map<string, Candidate>();
    fetched.forEach((c) => map.set(c._id, c));
    socketState.liveCandidates.forEach((c) => map.set(c._id, c));
    return Array.from(map.values()).sort((a, b) => b.aiScore - a.aiScore);
  })();

  return (
    <>
      {/* ── Job Header ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge tone={statusTone as any}>{data?.job.status ?? 'draft'}</Badge>
              <span className="text-sm text-secondary dark:text-darkmuted">
                Created{' '}
                {data?.job.createdAt
                  ? new Date(data.job.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : '—'}
              </span>
            </div>
            <DisplayTitle>{data?.job.title ?? 'Job Detail'}</DisplayTitle>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary dark:text-darkmuted">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-accent dark:text-darkaccent" />
                <span className="font-semibold text-primary dark:text-darktext">{realtimeApps.length}</span> Applications Received
              </span>
              <span className="text-border dark:text-darkborder">|</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="font-semibold text-primary dark:text-darktext">{data?.candidates.length ?? 0}</span> Candidates Analyzed
              </span>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => upload.mutate(undefined)}
              disabled={upload.isPending}
            >
              {upload.isPending ? 'Uploading…' : 'Upload Resumes'}
            </Button>
            <Button variant="accent" onClick={runProcessing} disabled={processing}>
              <Play className="h-4 w-4" />
              {processing ? 'Processing…' : 'Analyze Candidates'}
            </Button>
            <Link to={`/recruiter/jobs/${id}/candidates`}>
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
                <SectionTitle>Job Intelligence</SectionTitle>
              </div>
              <p className="text-[0.9375rem] leading-relaxed text-secondary dark:text-darkmuted">
                {data?.job.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(data?.job.requiredSkills?.length ? data.job.requiredSkills : data?.job.extractedData.skills ?? []).map((skill) => (
                  <Badge key={skill} tone="gold">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <InfoCard label="Experience" value={data?.job.extractedData.experience ?? '3-5 Years'} />
                <InfoCard label="Education" value={data?.job.extractedData.education ?? 'Equivalent'} />
                <InfoCard
                  label="Keywords"
                  value={`${data?.job.extractedData.keywords.length ?? 0} extracted`}
                />
              </div>
            </Card>

            {/* JD Quality Card */}
            {data?.job.extractedData.clarity_score !== undefined && (
              <Card className="p-6 border-accent/10 bg-gradient-to-br from-accent/[0.02] to-surface dark:from-darkaccent/[0.02]">
                <div className="mb-5 flex items-center justify-between border-b border-border pb-3 dark:border-darkborder">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-accent/10 p-2 text-accent dark:bg-darkaccent/10 dark:text-darkaccent">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <SectionTitle>JD Quality Analysis</SectionTitle>
                      <Caption>AI-powered feedback on JD clarity & detail</Caption>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-secondary dark:text-darkmuted">Clarity Score</span>
                    <span className={`rounded-xl px-2.5 py-1 text-sm font-bold ${
                      data.job.extractedData.clarity_score >= 80 ? 'bg-success/15 text-success' :
                      data.job.extractedData.clarity_score >= 50 ? 'bg-warning/15 text-warning' :
                      'bg-danger/15 text-danger'
                    }`}>
                      {data.job.extractedData.clarity_score}/100
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Nice to haves & Red Flags */}
                  <div className="space-y-4">
                    <div>
                      <Caption className="mb-2 block font-bold uppercase tracking-wider text-success">Nice-To-Have Skills</Caption>
                      {data.job.extractedData.nice_to_have && data.job.extractedData.nice_to_have.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {data.job.extractedData.nice_to_have.map((s) => (
                            <Badge key={s} tone="emerald">{s}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-secondary dark:text-darkmuted">None extracted</p>
                      )}
                    </div>

                    <div>
                      <Caption className="mb-2 block font-bold uppercase tracking-wider text-danger">Red Flags</Caption>
                      {data.job.extractedData.red_flags && data.job.extractedData.red_flags.length > 0 ? (
                        <ul className="list-disc ml-4 space-y-1">
                          {data.job.extractedData.red_flags.map((r, idx) => (
                            <li key={idx} className="text-xs text-danger leading-relaxed">{r}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-secondary dark:text-darkmuted">No red flags identified</p>
                      )}
                    </div>
                  </div>

                  {/* Ambiguous Areas */}
                  <div>
                    <Caption className="mb-2 block font-bold uppercase tracking-wider text-warning">Ambiguous Areas & Suggested Improvements</Caption>
                    {data.job.extractedData.ambiguous_areas && data.job.extractedData.ambiguous_areas.length > 0 ? (
                      <ul className="list-disc ml-4 space-y-1.5">
                        {data.job.extractedData.ambiguous_areas.map((a, idx) => (
                          <li key={idx} className="text-xs text-secondary dark:text-darkmuted leading-relaxed">{a}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-secondary dark:text-darkmuted">The job description is highly clear and specific.</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Live Processing Panel — appears when socket emits */}
            <AnimatePresence>
              {(socketState.total > 0 || socketState.items.length > 0) && (
                <ResumeProcessingPanel state={socketState} />
              )}
            </AnimatePresence>

            {/* Upload Zone */}
            <Card className="p-6">
              <SectionTitle className="mb-4">Upload Resumes</SectionTitle>
              <div
                {...getRootProps()}
                className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors ${
                  isDragActive
                    ? 'border-accent bg-accent/[0.04] dark:border-darkaccent'
                    : 'border-border hover:border-accent hover:bg-accent/[0.02] dark:border-darkborder dark:hover:border-darkaccent'
                }`}
              >
                <input {...getInputProps()} />
                <div className="mb-4 rounded-2xl border border-border bg-background p-4 dark:border-darkborder dark:bg-darkbg">
                  <FileUp className="h-8 w-8 text-accent dark:text-darkaccent" />
                </div>
                <p className="text-sm font-semibold text-primary dark:text-darktext">
                  {isDragActive ? 'Drop the files here…' : 'Drag & drop PDF / DOCX files, or click to select'}
                </p>
                <p className="mt-1 text-xs text-secondary dark:text-darkmuted">
                  Supports up to 20 files at once · Demo loads 5 seeded resumes
                </p>
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      upload.mutate(undefined);
                    }}
                    disabled={upload.isPending}
                  >
                    {upload.isPending ? 'Uploading…' : 'Load Demo Resumes'}
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      runProcessing();
                    }}
                    disabled={processing}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {processing ? 'Processing…' : 'Analyze All'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Resume Queue */}
            {(data?.resumes ?? []).length > 0 && (
              <Card className="overflow-hidden">
                <div className="border-b border-border px-6 py-4 dark:border-darkborder">
                  <CardTitle>Upload Queue ({data?.resumes.length ?? 0})</CardTitle>
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
                        <div className="text-sm font-medium text-primary dark:text-darktext">
                          {resume.fileName}
                        </div>
                        <div className="text-xs text-secondary dark:text-darkmuted">
                          {resume.parsedData.name}
                        </div>
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
            <div className="mb-5 flex items-center justify-between">
              <SectionTitle>Live Ranking Preview</SectionTitle>
              {socketState.liveCandidates.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success"
                >
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-success"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  Live
                </motion.span>
              )}
            </div>

            {mergedCandidates.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 rounded-xl border border-border bg-background p-3 dark:border-darkborder dark:bg-darkbg">
                  <Users className="h-6 w-6 text-secondary dark:text-darkmuted" />
                </div>
                <p className="text-sm font-medium text-secondary dark:text-darkmuted">
                  No candidates yet. Upload &amp; analyze to see rankings.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {mergedCandidates.map((candidate, i) => (
                    <Link key={candidate._id} to={`/recruiter/candidates/${candidate._id}`}>
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: i * 0.04, layout: { duration: 0.3 } }}
                        className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5 transition hover:border-accent dark:border-darkborder dark:bg-darkbg dark:hover:border-darkaccent"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-yellow-600/20 text-xs font-bold text-accent dark:text-darkaccent">
                            #{i + 1}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-primary dark:text-darktext">
                              {candidate.name}
                            </div>
                            <div className="mt-0.5">
                              <RecommendationBadge recommendation={candidate.recommendation} />
                            </div>
                          </div>
                        </div>
                        <ScoreBar value={candidate.aiScore} />
                      </motion.div>
                    </Link>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'Candidates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <SectionTitle>Applied Candidates ({realtimeApps.length})</SectionTitle>
            <Link to={`/recruiter/jobs/${id}/candidates`}>
              <Button size="sm">
                <ArrowRight className="h-4 w-4" />
                View Rankings Dashboard
              </Button>
            </Link>
          </div>

          {loadingApps ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-24 hm-skeleton rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !(realtimeApps && realtimeApps.length > 0) ? (
            <Card className="p-16 text-center flex flex-col items-center justify-center">
              <Users className="h-10 w-10 text-secondary dark:text-darkmuted mb-3" />
              <p className="text-secondary dark:text-darkmuted">
                No candidates have applied for this role yet.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {(() => {
                const formatAppliedDate = (appliedAt: any) => {
                  if (!appliedAt) return 'Pending';
                  if (typeof appliedAt.toDate === 'function') {
                    return appliedAt.toDate().toLocaleDateString();
                  }
                  return new Date(appliedAt).toLocaleDateString();
                };

                const list = [...realtimeApps];
                list.sort((a, b) => {
                  const timeA = a.appliedAt ? (a.appliedAt.toDate ? a.appliedAt.toDate().getTime() : new Date(a.appliedAt).getTime()) : 0;
                  const timeB = b.appliedAt ? (b.appliedAt.toDate ? b.appliedAt.toDate().getTime() : new Date(b.appliedAt).getTime()) : 0;
                  return timeB - timeA;
                });
                return list.map((app, i) => {
                  const candidateEmailStr = app.candidateEmail || app.email || '';
                  const candidate = candidateEmailStr
                    ? mergedCandidates.find((c) => c.email.toLowerCase() === candidateEmailStr.toLowerCase())
                    : mergedCandidates.find((c) => c.name.toLowerCase() === app.candidateName?.toLowerCase());
                  const isFailed = app.analysisStatus === 'failed';
                  const isAnalyzing = app.analysisStatus === 'analyzing' || app.analysisStatus === 'parsing' || app.analysisStatus === 'pending';
                  
                  const statusTone = 
                    isFailed ? 'red' :
                    isAnalyzing ? 'yellow' :
                    app.status === 'Shortlisted' || app.status === 'Selected' ? 'emerald' :
                    app.status === 'Rejected' ? 'danger' : 'neutral';
                  
                  return (
                    <Card key={app.applicationId || app._id} className="p-5 flex flex-col justify-between hover:border-accent/30 dark:hover:border-darkaccent/30 transition-all border border-border dark:border-darkborder">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 dark:bg-darkaccent/10 text-accent dark:text-darkaccent text-sm font-bold">
                            #{i + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {candidate ? (
                                <Link to={`/recruiter/candidates/${candidate._id}`} className="hover:underline">
                                  <h3 className="text-base font-bold text-primary dark:text-darktext">
                                    {app.candidateName}
                                  </h3>
                                </Link>
                              ) : (
                                <h3 className="text-base font-bold text-primary dark:text-darktext">
                                  {app.candidateName}
                                </h3>
                              )}
                              <Badge tone={statusTone as any}>
                                {isFailed ? 'Analysis Failed' : isAnalyzing ? `Analyzing (${app.progress ?? 10}%)` : app.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-secondary dark:text-darkmuted mt-1 flex flex-col gap-0.5">
                              <span>{app.candidateEmail || app.email || 'No email provided'}</span>
                              <span className="text-[10px] text-secondary/70 dark:text-darkmuted/70">
                                Applied: {formatAppliedDate(app.appliedAt)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-center">
                            <div className="text-base font-bold text-primary dark:text-darktext">
                              {candidate ? `${candidate.matchPercentage}%` : '—'}
                            </div>
                            <div className="text-[9px] font-semibold text-secondary dark:text-darkmuted uppercase tracking-wider">Match</div>
                          </div>

                          <div className="text-center">
                            <div className="text-base font-bold text-primary dark:text-darktext">
                              {candidate ? candidate.aiScore : '—'}
                            </div>
                            <div className="text-[9px] font-semibold text-secondary dark:text-darkmuted uppercase tracking-wider">AI Score</div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1">
                            {candidate ? (
                              <RecommendationBadge recommendation={candidate.recommendation} />
                            ) : isFailed ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/30 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                                Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning animate-pulse">
                                Processing
                              </span>
                            )}
                            {app.resumeUrl && (
                              <a
                                href={app.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline dark:text-darkaccent mt-1"
                              >
                                <FileText className="h-3 w-3" />
                                View Resume
                              </a>
                            )}
                          </div>

                          {candidate ? (
                            <Link to={`/recruiter/candidates/${candidate._id}`}>
                              <Button variant="secondary" size="sm">
                                View Details
                              </Button>
                            </Link>
                          ) : isFailed ? (
                            <Button 
                              variant="accent" 
                              size="sm" 
                              onClick={() => handleRetry(app)}
                              disabled={retryMutation.isPending}
                            >
                              {retryMutation.isPending ? 'Retrying...' : 'Retry Analysis'}
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" disabled>
                              Analyzing…
                            </Button>
                          )}
                        </div>
                      </div>

                      {isFailed && app.errorMessage && (
                        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-50/50 p-3 text-xs text-red-700 dark:bg-red-950/10 dark:text-red-400">
                          <span className="font-bold">Error:</span> {app.errorMessage}
                        </div>
                      )}

                      {candidate?.whyApplying && (
                        <div className="mt-4 border-t border-border dark:border-darkborder pt-3">
                          <span className="text-[10px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider block mb-1">
                            Candidate Statement:
                          </span>
                          <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed whitespace-pre-line italic">
                            "{candidate.whyApplying}"
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                });
              })()}
            </div>
          )}
        </div>
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
      <Caption className="block font-semibold uppercase tracking-wider">{label}</Caption>
      <BodyText variant="default" className="mt-1.5 font-semibold">
        {value}
      </BodyText>
    </div>
  );
}
