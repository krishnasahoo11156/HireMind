import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BrainCircuit,
  CheckCircle2,
  Github,
  Linkedin,
  Lightbulb,
  Send,
  Shield,
  XCircle,
  Download,
  TrendingUp,
  RefreshCw,
  Wifi,
  WifiOff,
  Star,
  Check,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { Candidate, GitHubProfile, Job, Resume } from '../types';
import { Badge, Button, Card, RecommendationBadge, SectionTitle } from '../components/ui';
import { BlindToggle } from '../components/BlindToggle';

const LANG_COLORS = ['#A16207', '#D97706', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'];

// Helper for dynamic question generation based on missing/partial skills
function getSuggestedQuestions(skillGap: Candidate['skillGap']): string[] {
  const missingSkills = (skillGap || [])
    .filter((g) => g.candidateHas === 'missing' || g.candidateHas === 'partial')
    .map((g) => g.skill.toLowerCase());

  const questions: string[] = [];

  for (const skill of missingSkills) {
    if (skill.includes('redux') && questions.length < 3) {
      questions.push('Explain Redux architecture, store/reducers design patterns, and middleware usage.');
    } else if ((skill.includes('next.js') || skill.includes('nextjs')) && questions.length < 3) {
      questions.push('Describe Next.js Server-Side Rendering (SSR) vs Static Site Generation (SSG), and how routing behaves.');
    } else if (skill.includes('react') && questions.length < 3) {
      questions.push('Explain React Hooks rules, custom hooks patterns, and rendering optimizations.');
    } else if (skill.includes('typescript') && questions.length < 3) {
      questions.push('Discuss type vs interface in TypeScript, and how generics promote type safety.');
    } else if (skill.includes('tailwind') && questions.length < 3) {
      questions.push('Describe Tailwind CSS utility-first approach and how compilation purges unused CSS.');
    } else if (skill.includes('node') && questions.length < 3) {
      questions.push('Explain the Node.js event loop, macro vs microtasks, and async non-blocking operations.');
    } else if (
      (skill.includes('docker') ||
        skill.includes('kubernetes') ||
        skill.includes('aws') ||
        skill.includes('production') ||
        skill.includes('ci/cd') ||
        skill.includes('deployment')) &&
      questions.length < 3
    ) {
      questions.push('Walk through a production deployment flow you set up and how you monitor runtime errors.');
    }
  }

  const defaultQuestions = [
    'Explain how you would design a scalable API architecture and handle db pooling under high traffic.',
    'Describe a difficult technical challenge you solved recently and how you debugged its root cause.',
    'Discuss your preference between SQL and NoSQL databases, and when you would select one over the other.'
  ];

  while (questions.length < 3) {
    const nextQ = defaultQuestions.find((q) => !questions.includes(q));
    if (nextQ) {
      questions.push(nextQ);
    } else {
      break;
    }
  }

  return questions;
}

export function CandidateProfile() {
  const { id = 'candidate_sarah' } = useParams();
  const blindMode = useAppStore((state) => state.blindMode);
  const queryClient = useQueryClient();

  const [decision, setDecision] = useState<'override_select' | 'override_reject' | 'agree' | ''>('');
  const [reason, setReason] = useState('Strong backend skills transferable to frontend');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [localId, setLocalId] = useState(id);

  // Reset state if active candidate switches
  if (id !== localId) {
    setLocalId(id);
    setDecision('');
    setReason('Strong backend skills transferable to frontend');
    setShowOverrideForm(false);
  }

  const data = useQuery({
    queryKey: ['candidate', id],
    queryFn: () =>
      api.candidate(id) as Promise<{
        candidate: Candidate;
        resume: Resume;
        job: Job;
        feedback: Array<{ reason: string; createdAt: string }>;
      }>
  });

  const candidate = data.data?.candidate;
  const resume = data.data?.resume;

  const ghUsername = candidate?.githubAnalysis?.username;
  const ghQuery = useQuery({
    queryKey: ['github', ghUsername],
    queryFn: () => api.githubProfile(ghUsername!).then((r) => r.profile),
    enabled: !!ghUsername,
    staleTime: 10 * 60 * 1000,
    retry: 1
  });

  const feedback = useMutation({
    mutationFn: () => api.feedback(id, { decision, reason }),
    onSuccess: () => {
      setShowOverrideForm(false);
      void queryClient.invalidateQueries({ queryKey: ['candidate', id] });
    }
  });

  if (!candidate || !resume) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent dark:border-darkborder dark:border-t-darkaccent" />
          <p className="text-sm text-secondary dark:text-darkmuted">Loading candidate intelligence…</p>
        </div>
      </div>
    );
  }

  const ghData: GitHubProfile = ghQuery.data ?? (candidate.githubAnalysis as unknown as GitHubProfile);
  const isLive = ghQuery.data?.isLive ?? false;

  const displayName = blindMode ? candidate.blindId : candidate.name;
  const initials = candidate.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  const hasSubmittedDecision =
    candidate.recruiterDecision && candidate.recruiterDecision !== 'pending';

  const suggestedQuestions = getSuggestedQuestions(candidate.skillGap);

  const handleTriggerDecision = (dec: 'override_select' | 'override_reject') => {
    setDecision(dec);
    setShowOverrideForm(true);
    // Focus or scroll to override panel logic
    setTimeout(() => {
      const el = document.getElementById('override-input-area');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* ── STICKY CONTROL & EXECUTIVE HEADER ── */}
      <div className="sticky top-[68px] z-10 -mx-8 px-8 py-3 border-b border-border bg-[#F8FAFC]/95 backdrop-blur-md dark:border-darkborder dark:bg-darkbg/95 flex flex-wrap items-center justify-between gap-4 transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-secondary dark:text-darkmuted">
                Candidate Profile
              </span>
              <span className="h-1 w-1 rounded-full bg-secondary/50 dark:bg-darkmuted/50" />
              <span className="text-[10px] font-semibold text-secondary dark:text-darkmuted">
                {data.data?.job.title}
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-primary dark:text-darktext mt-0.5">
              {displayName}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 border-r border-border pr-4 dark:border-darkborder">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-semibold text-secondary dark:text-darkmuted uppercase tracking-wider">
                Overall Match
              </span>
              <span
                className={`text-sm font-bold mt-0.5 ${
                  candidate.matchPercentage >= 75
                    ? 'text-success'
                    : candidate.matchPercentage >= 50
                    ? 'text-warning'
                    : 'text-danger'
                }`}
              >
                {candidate.matchPercentage}%
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-semibold text-secondary dark:text-darkmuted uppercase tracking-wider">
                AI Recommendation
              </span>
              <span className="mt-0.5">
                <RecommendationBadge recommendation={candidate.recommendation} />
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-semibold text-secondary dark:text-darkmuted uppercase tracking-wider">
                Confidence
              </span>
              <span className="text-sm font-semibold text-primary dark:text-darktext mt-0.5">
                {candidate.confidence ?? 92}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Resume */}
            {resume.fileUrl && (
              <a
                href={resume.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-primary shadow-sm hover:bg-gray-50 dark:border-darkborder dark:bg-darksurface dark:text-darktext dark:hover:bg-darkborder/50"
              >
                <Download className="h-3.5 w-3.5" />
                Download Resume
              </a>
            )}

            {/* Decision Actions */}
            {hasSubmittedDecision ? (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    candidate.recruiterDecision === 'override_select' ||
                    candidate.recruiterDecision === 'agree'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                      : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40'
                  }`}
                >
                  Recruiter:{' '}
                  {candidate.recruiterDecision === 'override_select' ||
                  candidate.recruiterDecision === 'agree'
                    ? 'Selected'
                    : 'Rejected'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-secondary hover:text-primary dark:text-darkmuted dark:hover:text-darktext"
                  onClick={() => {
                    setDecision('');
                    setShowOverrideForm(false);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-xs border border-border bg-surface text-secondary hover:bg-red-50 hover:text-danger hover:border-danger/20 dark:border-darkborder dark:bg-darksurface dark:text-darkmuted dark:hover:bg-red-950/20 dark:hover:text-red-400"
                  onClick={() => handleTriggerDecision('override_reject')}
                >
                  <XCircle className="h-3.5 w-3.5 text-danger" />
                  Reject
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  onClick={() => handleTriggerDecision('override_select')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Select Candidate
                </Button>
              </div>
            )}

            <div className="border-l border-border pl-2 dark:border-darkborder">
              <BlindToggle />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN DESKTOP GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── COLUMN 1: CANDIDATE OVERVIEW (20% -> col-span-2) ── */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5 flex flex-col space-y-4">
            <div className="flex flex-col items-center text-center pb-4 border-b border-border dark:border-darkborder">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent/10 to-yellow-600/10 text-xl font-bold text-accent dark:from-darkaccent/10 dark:to-yellow-500/10 dark:text-darkaccent shadow-sm border border-accent/20">
                {blindMode ? <Shield className="h-6 w-6" /> : initials}
              </div>
              <h2 className="mt-3 text-sm font-bold text-primary dark:text-darktext">
                {displayName}
              </h2>
              {!blindMode && (
                <span className="text-[11px] text-secondary dark:text-darkmuted block truncate max-w-full">
                  {candidate.email}
                </span>
              )}
              {candidate.githubAnalysis.username && (
                <span className="mt-1 text-[10px] font-medium text-secondary/70 dark:text-darkmuted/70 bg-accent/5 dark:bg-darkaccent/5 px-2 py-0.5 rounded-full border border-border dark:border-darkborder">
                  @{candidate.githubAnalysis.username}
                </span>
              )}
            </div>

            {/* Experience Snapshot */}
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">
                Experience
              </span>
              <span className="text-xs font-semibold text-primary dark:text-darktext">
                {resume.parsedData.experience.length > 0
                  ? `${resume.parsedData.experience.length} roles total`
                  : 'No direct experience listed'}
              </span>
              <div className="mt-1.5 space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                {resume.parsedData.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] leading-tight text-secondary dark:text-darkmuted border-l border-border pl-2 dark:border-darkborder"
                  >
                    <div className="font-semibold text-primary dark:text-darktext truncate">
                      {exp.title}
                    </div>
                    <div className="text-[9px] text-secondary/80 dark:text-darkmuted/80 truncate">
                      {exp.company} • {exp.duration}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education Snapshot */}
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">
                Education
              </span>
              <div className="space-y-1.5">
                {resume.parsedData.education.map((edu, idx) => (
                  <div key={idx} className="text-[11px] leading-tight text-primary dark:text-darktext">
                    <div className="font-semibold">{edu.degree}</div>
                    <div className="text-[9px] text-secondary dark:text-darkmuted font-normal mt-0.5 truncate">
                      {blindMode ? edu.year : `${edu.institution}, ${edu.year}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Skills Snapshot */}
            <div className="flex flex-col space-y-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">
                Core Skills
              </span>
              <div className="flex flex-wrap gap-1">
                {resume.parsedData.skills.slice(0, 10).map((skill) => (
                  <span
                    key={skill}
                    className="text-[9px] font-medium bg-gray-50 border border-border/60 text-primary dark:bg-darkborder/30 dark:border-darkborder/50 dark:text-darktext px-1.5 py-0.5 rounded"
                  >
                    {skill}
                  </span>
                ))}
                {resume.parsedData.skills.length > 10 && (
                  <span className="text-[9px] font-medium text-secondary dark:text-darkmuted px-1 py-0.5">
                    +{resume.parsedData.skills.length - 10} more
                  </span>
                )}
              </div>
            </div>

            {/* Verification Statuses */}
            <div className="flex flex-col space-y-1.5 pt-2 border-t border-border dark:border-darkborder">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-secondary dark:text-darkmuted flex items-center gap-1">
                  <Github className="h-3 w-3" />
                  GitHub
                </span>
                <span
                  className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${
                    candidate.githubAnalysis.username
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-darkborder dark:text-darkmuted'
                  }`}
                >
                  {candidate.githubAnalysis.username ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-secondary dark:text-darkmuted flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  LeetCode
                </span>
                <span
                  className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${
                    candidate.leetcodeAnalysis.username
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-darkborder dark:text-darkmuted'
                  }`}
                >
                  {candidate.leetcodeAnalysis.username ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-secondary dark:text-darkmuted flex items-center gap-1">
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </span>
                <span
                  className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${
                    candidate.linkedinUrl
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-darkborder dark:text-darkmuted'
                  }`}
                >
                  {candidate.linkedinUrl ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── COLUMN 2: PRIMARY DECISION AREA (55% -> col-span-7) ── */}
        <div className="space-y-6 lg:col-span-7">
          {/* Section 1: Match Overview (Hero Component) */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Radial Score visualization */}
              <div className="relative flex items-center justify-center w-36 h-36 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="var(--color-border, #f1f5f9)"
                    strokeWidth="6"
                    fill="transparent"
                    className="stroke-gray-100 dark:stroke-gray-800"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={
                      candidate.matchPercentage >= 75
                        ? '#16A34A'
                        : candidate.matchPercentage >= 50
                        ? '#F59E0B'
                        : '#DC2626'
                    }
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={251.2}
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{
                      strokeDashoffset: 251.2 - (candidate.matchPercentage / 100) * 251.2
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold tracking-tight text-primary dark:text-darktext">
                    {candidate.matchPercentage}%
                  </span>
                  <span className="text-[9px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider mt-0.5">
                    Overall Match
                  </span>
                </div>
              </div>

              {/* Sub-scores details */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Skills Alignment', value: candidate.matchPercentage },
                  { label: 'Experience Match', value: candidate.experienceScore ?? Math.min(100, candidate.aiScore + 5) },
                  {
                    label: 'Problem Solving',
                    value: candidate.leetcodeScore ?? Math.min(100, candidate.leetcodeAnalysis?.contestRating ? 80 : 60)
                  },
                  {
                    label: 'GitHub Activity',
                    value: candidate.githubScore ?? Math.min(100, (candidate.githubAnalysis?.contributions ?? 0) * 2)
                  }
                ].map((sub) => (
                  <div key={sub.label} className="flex flex-col space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-secondary dark:text-darkmuted">{sub.label}</span>
                      <span className="text-primary dark:text-darktext tabular-nums">
                        {sub.value}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          sub.value >= 75 ? 'bg-success' : sub.value >= 50 ? 'bg-warning' : 'bg-danger'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${sub.value}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Section 2: Strengths vs Gaps */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-border dark:border-darkborder pb-1.5">
                  <Check className="h-4 w-4 stroke-[3]" />
                  Strengths (
                  {candidate.skillGap?.filter((g) => g.candidateHas === 'match').length ?? 0})
                </div>
                <ul className="space-y-2">
                  {candidate.skillGap
                    ?.filter((g) => g.candidateHas === 'match')
                    .map((g) => (
                      <li
                        key={g.skill}
                        className="flex items-start gap-2 text-xs text-primary dark:text-darktext font-medium leading-tight"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <div className="flex flex-col">
                          <span>{g.skill}</span>
                          {g.evidence && (
                            <span className="text-[10px] text-secondary dark:text-darkmuted font-normal mt-0.5">
                              {g.evidence}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  {(candidate.skillGap?.filter((g) => g.candidateHas === 'match').length ?? 0) ===
                    0 && <li className="text-xs text-secondary dark:text-darkmuted italic">None</li>}
                </ul>
              </div>

              {/* Missing / Gaps */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider border-b border-border dark:border-darkborder pb-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Missing / Gaps (
                  {candidate.skillGap?.filter(
                    (g) => g.candidateHas === 'missing' || g.candidateHas === 'partial'
                  ).length ?? 0}
                  )
                </div>
                <ul className="space-y-2.5">
                  {candidate.skillGap
                    ?.filter((g) => g.candidateHas === 'missing' || g.candidateHas === 'partial')
                    .map((g) => {
                      const isMissing = g.candidateHas === 'missing';
                      return (
                        <li
                          key={g.skill}
                          className="flex items-start gap-2 text-xs text-primary dark:text-darktext font-medium leading-tight"
                        >
                          <span
                            className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                              isMissing ? 'bg-danger' : 'bg-warning'
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="flex items-center gap-2">
                              {g.skill}
                              <span
                                className={`text-[9px] font-bold px-1 rounded uppercase tracking-wider ${
                                  isMissing
                                    ? 'bg-red-50 text-danger border border-red-200/50 dark:bg-red-950/20 dark:border-red-900/20'
                                    : 'bg-amber-50 text-warning border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/20'
                                }`}
                              >
                                {g.candidateHas}
                              </span>
                            </span>
                            {g.evidence && (
                              <span className="text-[10px] text-secondary dark:text-darkmuted font-normal mt-0.5">
                                {g.evidence}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  {(candidate.skillGap?.filter(
                    (g) => g.candidateHas === 'missing' || g.candidateHas === 'partial'
                  ).length ?? 0) === 0 && (
                    <li className="text-xs text-secondary dark:text-darkmuted italic">None</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>

          {/* Section 3: Evidence Blocks */}
          <Card className="p-6">
            <SectionTitle className="mb-6">Timeline Evidence</SectionTitle>

            <div className="relative border-l border-border dark:border-darkborder pl-6 space-y-8 ml-3">
              {/* GitHub Block */}
              <div className="relative">
                <div className="absolute -left-[35px] top-0.5 bg-background dark:bg-darkbg p-1 rounded-full border border-border dark:border-darkborder">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent">
                    <Github className="h-3 w-3" />
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-primary dark:text-darktext">
                      GitHub Analysis
                    </h4>
                    <span className="text-[10px] text-secondary dark:text-darkmuted">
                      Synced Profile Metrics
                    </span>
                  </div>

                  {candidate.githubAnalysis.username && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] gap-1 border border-border bg-surface text-secondary hover:text-primary dark:border-darkborder dark:bg-darksurface dark:hover:bg-darkborder/50"
                      disabled={ghQuery.isFetching}
                      onClick={() => {
                        api
                          .refreshGithubCache(candidate.githubAnalysis.username)
                          .finally(() =>
                            queryClient.invalidateQueries({
                              queryKey: ['github', candidate.githubAnalysis.username]
                            })
                          );
                      }}
                    >
                      <RefreshCw
                        className={`h-2.5 w-2.5 ${ghQuery.isFetching ? 'animate-spin' : ''}`}
                      />
                      {ghQuery.isFetching ? 'Syncing…' : 'Sync'}
                    </Button>
                  )}
                </div>

                {/* Metrics */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Repos', value: ghData.publicRepos },
                    { label: 'Commits', value: ghData.totalCommits.toLocaleString() },
                    { label: 'Stars Recd', value: ghData.stars.toLocaleString() },
                    { label: '30-day Cont.', value: ghData.contributions }
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gray-50/50 dark:bg-gray-900/10 p-2 rounded-lg border border-border/60 dark:border-darkborder/40 text-center"
                    >
                      <span className="block text-[9px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <span className="text-xs font-bold text-primary dark:text-darktext tabular-nums mt-0.5 block">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Languages Breakdown */}
                {ghData.languageBreakdown?.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[9px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider block mb-1">
                      Languages
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ghData.languageBreakdown.slice(0, 5).map((entry, idx) => (
                        <span
                          key={entry.language}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-semibold border border-border bg-surface dark:border-darkborder dark:bg-darksurface text-primary dark:text-darktext"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: LANG_COLORS[idx % LANG_COLORS.length] }}
                          />
                          {entry.language} <span className="opacity-75">{entry.value}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mini Graph */}
                {ghData.activitySeries?.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[9px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider block mb-1.5">
                      Weekly Activity trend
                    </span>
                    <div className="h-16 w-full">
                      <ResponsiveContainer>
                        <BarChart data={ghData.activitySeries}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                          <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            formatter={(v: number) => [`${v} commits`, 'Commits']}
                            contentStyle={{
                              background: 'var(--color-surface, #fff)',
                              border: '1px solid var(--color-border, #e2e8f0)',
                              borderRadius: 6,
                              fontSize: 10
                            }}
                          />
                          <Bar dataKey="commits" fill="#A16207" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {ghData.aiSummary && (
                  <p className="mt-3 text-xs leading-relaxed text-secondary dark:text-darkmuted italic border-l-2 border-accent/20 pl-3 dark:border-darkaccent/20">
                    "{ghData.aiSummary}"
                  </p>
                )}
              </div>

              {/* LeetCode Block */}
              <div className="relative">
                <div className="absolute -left-[35px] top-0.5 bg-background dark:bg-darkbg p-1 rounded-full border border-border dark:border-darkborder">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                </div>

                <h4 className="text-sm font-bold text-primary dark:text-darktext">
                  LeetCode Profile
                </h4>
                <span className="text-[10px] text-secondary dark:text-darkmuted">
                  Competitive Problem Solving
                </span>

                {/* Metrics */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Solved', value: candidate.leetcodeAnalysis.problemsSolved },
                    { label: 'Rating', value: candidate.leetcodeAnalysis.contestRating },
                    {
                      label: 'Global Rank',
                      value: candidate.leetcodeAnalysis.globalRanking.toLocaleString()
                    },
                    { label: 'Percentile', value: candidate.leetcodeAnalysis.percentile }
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gray-50/50 dark:bg-gray-900/10 p-2 rounded-lg border border-border/60 dark:border-darkborder/40 text-center"
                    >
                      <span className="block text-[9px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <span className="text-xs font-bold text-primary dark:text-darktext tabular-nums mt-0.5 block">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Solved details */}
                <div className="mt-3 flex gap-2">
                  {[
                    { label: 'Easy', value: candidate.leetcodeAnalysis.easy, color: 'bg-emerald-500' },
                    { label: 'Medium', value: candidate.leetcodeAnalysis.medium, color: 'bg-amber-500' },
                    { label: 'Hard', value: candidate.leetcodeAnalysis.hard, color: 'bg-red-500' }
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex-1 bg-gray-50/20 dark:bg-gray-900/5 p-1.5 rounded-lg border border-border dark:border-darkborder/50 text-center flex items-center justify-between"
                    >
                      <span className="text-[11px] text-secondary dark:text-darkmuted flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
                        {label}
                      </span>
                      <span className="text-xs font-bold text-primary dark:text-darktext tabular-nums">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {candidate.leetcodeAnalysis.aiSummary && (
                  <p className="mt-3 text-xs leading-relaxed text-secondary dark:text-darkmuted italic border-l-2 border-accent/20 pl-3 dark:border-darkaccent/20">
                    "{candidate.leetcodeAnalysis.aiSummary}"
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── COLUMN 3: AI HIRING COPILOT (25% -> col-span-3) ── */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6 relative overflow-hidden flex flex-col space-y-5 h-full">
            {/* Copilot Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-border dark:border-darkborder">
              <BrainCircuit className="h-5 w-5 text-accent dark:text-darkaccent" />
              <div>
                <h3 className="font-heading text-sm font-bold text-primary dark:text-darktext">
                  AI Hiring Copilot
                </h3>
                <span className="text-[10px] text-secondary dark:text-darkmuted">
                  Hiring Intelligence Summary
                </span>
              </div>
            </div>

            {/* Score / Recommendation */}
            <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/10 p-3 rounded-xl border border-border/60 dark:border-darkborder/40">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider">
                  AI Recommendation
                </span>
                <span className="mt-1">
                  <RecommendationBadge recommendation={candidate.recommendation} />
                </span>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-[9px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider">
                  Confidence
                </span>
                <span className="text-sm font-bold text-primary dark:text-darktext mt-1">{candidate.confidence ?? 92}%</span>
              </div>
            </div>

            {/* Reasoning Bullet Points */}
            <div className="flex flex-col space-y-2">
              <span className="text-[9px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider">
                Reasoning Highlights
              </span>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {candidate.explanation.map((line, idx) => (
                  <li
                    key={idx}
                    className="text-xs leading-relaxed text-secondary dark:text-darkmuted flex items-start gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-darkaccent mt-1.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Questions */}
            <div className="flex flex-col space-y-2">
              <span className="text-[9px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider">
                Suggested Questions
              </span>
              <ul className="space-y-2">
                {suggestedQuestions.map((q, idx) => (
                  <li
                    key={idx}
                    className="bg-[#F8FAFC]/50 dark:bg-darkbg/30 p-2.5 rounded-lg border border-border/60 dark:border-darkborder/40 text-xs text-primary dark:text-darktext relative pl-7 font-medium leading-normal"
                  >
                    <span className="absolute left-2 top-2.5 text-[9px] font-bold text-accent dark:text-darkaccent bg-accent/15 dark:bg-darkaccent/15 h-4 w-4 rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recruiter Decision Form / Override Log */}
            <div id="override-input-area" className="pt-4 border-t border-border dark:border-darkborder">
              {hasSubmittedDecision ? (
                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 p-3.5 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-accent dark:text-darkaccent">
                      Recruiter Override
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                        candidate.recruiterDecision === 'override_select' ||
                        candidate.recruiterDecision === 'agree'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      }`}
                    >
                      {candidate.recruiterDecision === 'override_select' ||
                      candidate.recruiterDecision === 'agree'
                        ? 'Select'
                        : 'Reject'}
                    </span>
                  </div>
                  {candidate.recruiterReason && (
                    <p className="text-secondary dark:text-darkmuted italic leading-relaxed">
                      "{candidate.recruiterReason}"
                    </p>
                  )}
                </div>
              ) : showOverrideForm ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-secondary dark:text-darkmuted uppercase tracking-wider">
                      Override Justification
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        decision === 'override_select'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/30'
                      }`}
                    >
                      {decision === 'override_select' ? 'Select Override' : 'Reject Override'}
                    </span>
                  </div>
                  <textarea
                    className="hm-textarea min-h-16 w-full text-xs"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter short confirmation reasoning to finalize candidate decision Override…"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 h-8 text-xs font-semibold"
                      variant="secondary"
                      onClick={() => {
                        setDecision('');
                        setShowOverrideForm(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 h-8 text-xs font-semibold"
                      variant="accent"
                      disabled={feedback.isPending || reason.trim().length < 10}
                      onClick={() => {
                        feedback.mutate();
                      }}
                    >
                      {feedback.isPending ? 'Submitting…' : 'Submit Decision'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-secondary dark:text-darkmuted font-medium bg-gray-50/50 dark:bg-gray-900/10 rounded-xl border border-border/40 p-3">
                  Click Select or Reject in sticky header to set recruiter evaluation decision.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
