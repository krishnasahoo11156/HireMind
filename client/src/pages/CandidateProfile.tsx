import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, CheckCircle2, Github, Lightbulb, Send, Shield, XCircle, Download, TrendingUp, RefreshCw, Wifi, WifiOff, Star, GitFork } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { Candidate, GitHubProfile, Job, Resume } from '../types';
import { Badge, Button, Card, PageTitle, RecommendationBadge, ScoreGauge, SkillHeatmap, StatusCell, DisplayTitle, SectionTitle, CardTitle, BodyText, Caption } from '../components/ui';
import { BlindToggle } from '../components/BlindToggle';

// Language palette for pie chart slices
const LANG_COLORS = ['#A16207', '#D97706', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'];

// ─── GitHub Analysis Sub-components ───────────────────────────────────────────
function GHLiveTag({ isLive }: { isLive: boolean }) {
  return (
    <span
      title={isLive ? 'Live data from GitHub API' : 'Mock fallback data'}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isLive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      }`}
    >
      {isLive ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
      {isLive ? 'Live' : 'Mock'}
    </span>
  );
}

function RepoCard({ name, stars, language }: { name: string; stars: number; language: string }) {
  return (
    <a
      href={`https://github.com/${name}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs transition-colors hover:border-accent/50 hover:bg-accent/5 dark:border-darkborder dark:bg-darkbg dark:hover:border-darkaccent/50"
    >
      <span className="truncate font-medium text-primary dark:text-darktext">{name}</span>
      <div className="ml-2 flex shrink-0 items-center gap-2 text-secondary dark:text-darkmuted">
        {language && (
          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent dark:bg-darkaccent/10 dark:text-darkaccent">
            {language}
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <Star className="h-3 w-3 text-amber-500" />
          {stars}
        </span>
      </div>
    </a>
  );
}

// ─── Metric tile ───────────────────────────────────────────────────────────
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3.5 dark:border-darkborder dark:bg-darkbg">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary dark:text-darkmuted">{label}</p>
      <p className="mt-1.5 text-xl font-bold tabular-nums text-primary dark:text-darktext">{value}</p>
    </div>
  );
}

// ─── Confidence dot ────────────────────────────────────────────────────────
function ConfidenceDot({ level }: { level: number }) {
  const color = level >= 75 ? 'bg-success' : level >= 50 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className={`h-1.5 w-4 rounded-full ${i < (level >= 75 ? 3 : level >= 50 ? 2 : 1) ? color : 'bg-gray-200 dark:bg-darkborder'}`} />
      ))}
    </div>
  );
}

// ─── GitHub Analysis Card (proper component so hooks are valid) ────────────
function GitHubAnalysisCard({
  fallback,
  queryClient
}: {
  fallback: Candidate['githubAnalysis'];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const ghUsername = fallback.username;
  const ghQuery = useQuery({
    queryKey: ['github', ghUsername],
    queryFn: () => api.githubProfile(ghUsername).then((r) => r.profile),
    enabled: !!ghUsername,
    staleTime: 10 * 60 * 1000,
    retry: 1
  });
  const ghData: GitHubProfile = ghQuery.data ?? (fallback as unknown as GitHubProfile);
  const isLive = ghQuery.data?.isLive ?? false;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          <SectionTitle>GitHub Analysis</SectionTitle>
          <GHLiveTag isLive={isLive} />
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={ghQuery.isFetching}
          onClick={() => {
            api.refreshGithubCache(ghUsername).finally(() =>
              queryClient.invalidateQueries({ queryKey: ['github', ghUsername] })
            );
          }}
        >
          <RefreshCw className={`h-3 w-3 ${ghQuery.isFetching ? 'animate-spin' : ''}`} />
          {ghQuery.isFetching ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {/* Metric tiles */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        <Metric label="Repos" value={ghData.publicRepos} />
        <Metric label="Commits" value={ghData.totalCommits.toLocaleString()} />
        <Metric label="Stars" value={ghData.stars.toLocaleString()} />
        <Metric label="30-day" value={ghData.contributions} />
      </div>

      {/* Language pie chart */}
      {ghData.languageBreakdown?.length > 0 && (
        <>
          <Caption className="mb-2 block font-semibold uppercase tracking-wider">Language Breakdown</Caption>
          <div className="mb-4 h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={ghData.languageBreakdown}
                  dataKey="value"
                  nameKey="language"
                  cx="50%"
                  cy="50%"
                  outerRadius={64}
                  innerRadius={36}
                  paddingAngle={3}
                  label={({ language, value }: { language: string; value: number }) => `${language} ${value}%`}
                  labelLine={false}
                >
                  {ghData.languageBreakdown.map((_entry, idx) => (
                    <Cell key={idx} fill={LANG_COLORS[idx % LANG_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Top Repos */}
      {ghData.repos?.length > 0 && (
        <>
          <Caption className="mb-2 block font-semibold uppercase tracking-wider">Top Repositories</Caption>
          <div className="mb-4 space-y-1.5">
            {ghData.repos.slice(0, 4).map((repo) => (
              <RepoCard key={repo.name} name={repo.name} stars={repo.stars} language={repo.language} />
            ))}
          </div>
        </>
      )}

      {/* AI Summary */}
      <div className="rounded-xl border border-border bg-background p-3.5 dark:border-darkborder dark:bg-darkbg">
        <Caption className="mb-1 block font-semibold uppercase tracking-wider">AI Summary</Caption>
        <p className="text-sm leading-relaxed text-secondary dark:text-darkmuted">{ghData.aiSummary}</p>
      </div>
    </Card>
  );
}

// ─── Commit Activity Card ──────────────────────────────────────────────────
function CommitActivityCard({ fallback }: { fallback: Candidate['githubAnalysis'] }) {
  const ghUsername = fallback.username;
  const ghQuery = useQuery({
    queryKey: ['github', ghUsername],
    queryFn: () => api.githubProfile(ghUsername).then((r) => r.profile),
    enabled: !!ghUsername,
    staleTime: 10 * 60 * 1000,
    retry: 1
  });
  const activityData = ghQuery.data?.activitySeries ?? fallback.activitySeries;
  const subtitle = ghQuery.data?.recentActivity ?? fallback.recentActivity;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>Commit Activity</SectionTitle>
        <Caption className="text-secondary dark:text-darkmuted">{subtitle}</Caption>
      </div>
      <div className="h-44">
        <ResponsiveContainer>
          <BarChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis hide />
            <Tooltip
              formatter={(v: number) => [`${v} commits`, 'Commits']}
              contentStyle={{
                background: 'var(--color-surface, #fff)',
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: 8,
                fontSize: 12
              }}
            />
            <Bar dataKey="commits" fill="#A16207" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── CandidateProfile ──────────────────────────────────────────────────────
export function CandidateProfile() {
  const { id = 'candidate_sarah' } = useParams();
  const blindMode = useAppStore((state) => state.blindMode);
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<'override_select' | 'override_reject' | 'agree' | ''>('');
  const [reason, setReason] = useState('Strong backend skills transferable to frontend');

  const data = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => api.candidate(id) as Promise<{ candidate: Candidate; resume: Resume; job: Job; feedback: Array<{ reason: string; createdAt: string }> }>
  });
  const feedback = useMutation({
    mutationFn: () => api.feedback(id, { decision, reason }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['candidate', id] })
  });

  const candidate = data.data?.candidate;
  const resume = data.data?.resume;

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

  const displayName = blindMode ? candidate.blindId : candidate.name;
  const initials = candidate.name.split(' ').map((p) => p[0]).join('').slice(0, 2);

  return (
    <>
      <PageTitle
        title={displayName}
        subtitle={blindMode ? 'Blind screening active — PII and institutions hidden.' : `${candidate.email} · ${data.data?.job.title}`}
        action={<BlindToggle />}
      />

      {/* 3-column grid */}
      <div className="grid grid-cols-[260px_1fr_320px] gap-6">
        {/* ── COLUMN 1: Candidate Overview ── */}
        <div className="space-y-5">
          {/* Avatar & identity */}
          <Card className="p-5 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-yellow-600 text-2xl font-bold text-white shadow-lg">
                {blindMode ? <Shield className="h-8 w-8" /> : initials}
              </div>
            </div>
            <CardTitle>{displayName}</CardTitle>
            {!blindMode && (
              <Caption className="mt-0.5 block">{candidate.email}</Caption>
            )}
            <div className="mt-3 flex justify-center gap-2">
              <RecommendationBadge recommendation={candidate.recommendation} />
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <Badge tone="gold">{candidate.matchPercentage}% Match</Badge>
            </div>
            <Button variant="secondary" size="sm" className="mt-4 w-full">
              <Download className="h-3.5 w-3.5" />
              Resume
            </Button>
          </Card>

          {/* Skills */}
          <Card className="p-5">
            <Caption className="mb-3 block font-semibold uppercase tracking-wider">Skills</Caption>
            <div className="flex flex-wrap gap-1.5">
              {resume.parsedData.skills.map((skill) => (
                <Badge key={skill} tone="neutral">{skill}</Badge>
              ))}
            </div>
          </Card>

          {/* Experience */}
          <Card className="p-5">
            <Caption className="mb-3 block font-semibold uppercase tracking-wider">Experience</Caption>
            <div className="space-y-3">
              {resume.parsedData.experience.map((exp) => (
                <div key={exp.title} className="border-l-2 border-accent/30 pl-3 dark:border-darkaccent/30">
                  <div className="text-sm font-semibold text-primary dark:text-darktext">{exp.title}</div>
                  <div className="mt-0.5 text-xs text-secondary dark:text-darkmuted">{exp.duration}</div>
                  <p className="mt-1 text-xs leading-relaxed text-secondary dark:text-darkmuted line-clamp-2">{exp.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Education */}
          <Card className="p-5">
            <Caption className="mb-3 block font-semibold uppercase tracking-wider">Education</Caption>
            <div className="space-y-2">
              {resume.parsedData.education.map((edu) => (
                <div key={edu.degree}>
                  <div className="text-sm font-semibold text-primary dark:text-darktext">{edu.degree}</div>
                  <div className="text-xs text-secondary dark:text-darkmuted">
                    {blindMode ? edu.year : `${edu.institution}, ${edu.year}`}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── COLUMN 2: AI Analysis ── */}
        <div className="space-y-5">
          {/* Score gauge */}
          <Card className="p-6">
            <div className="flex items-center gap-8">
              <ScoreGauge value={candidate.aiScore} label="AI Score" />
              <div>
                <h2 className="font-heading text-[48px] font-bold leading-none tracking-tight text-primary dark:text-darktext">
                  {candidate.matchPercentage}% Match
                </h2>
                <BodyText variant="default" color="secondary" className="mt-1">
                  vs required job skills
                </BodyText>
                <div className="mt-4">
                  <RecommendationBadge recommendation={candidate.recommendation} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDecision('override_select')}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Select
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDecision('override_reject')}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Skill Gap Heatmap */}
          <Card className="p-6">
            <SectionTitle className="mb-5">Skill Gap Analysis</SectionTitle>
            <SkillHeatmap skillGap={candidate.skillGap} />
          </Card>

          <GitHubAnalysisCard fallback={candidate.githubAnalysis} queryClient={queryClient} />

          {/* LeetCode Analysis */}
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent dark:text-darkaccent" />
              <SectionTitle>LeetCode Analysis</SectionTitle>
            </div>
            <div className="mb-5 grid grid-cols-4 gap-3">
              <Metric label="Solved" value={candidate.leetcodeAnalysis.problemsSolved} />
              <Metric label="Rating" value={candidate.leetcodeAnalysis.contestRating} />
              <Metric label="Ranking" value={candidate.leetcodeAnalysis.globalRanking.toLocaleString()} />
              <Metric label="Percentile" value={candidate.leetcodeAnalysis.percentile} />
            </div>
            <div className="flex gap-2">
              {[
                { label: 'Easy', value: candidate.leetcodeAnalysis.easy, color: 'bg-success' },
                { label: 'Medium', value: candidate.leetcodeAnalysis.medium, color: 'bg-warning' },
                { label: 'Hard', value: candidate.leetcodeAnalysis.hard, color: 'bg-danger' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex-1 rounded-xl border border-border bg-background p-3 text-center dark:border-darkborder dark:bg-darkbg">
                  <div className={`mx-auto mb-2 h-1.5 w-full rounded-full ${color} opacity-80`} />
                  <div className="text-lg font-bold tabular-nums text-primary dark:text-darktext">{value}</div>
                  <div className="text-xs text-secondary dark:text-darkmuted">{label}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-secondary dark:text-darkmuted">
              {candidate.leetcodeAnalysis.aiSummary}
            </p>
          </Card>

          <CommitActivityCard fallback={candidate.githubAnalysis} />

          {/* Recruiter Feedback */}
          {decision ? (
            <Card className="p-6">
              <SectionTitle className="mb-4">Recruiter Override</SectionTitle>
              <div className="mb-3 rounded-xl border border-border bg-background p-3 text-sm dark:border-darkborder dark:bg-darkbg">
                Decision: <span className={`font-semibold ${decision === 'override_select' ? 'text-success' : 'text-danger'}`}>
                  {decision === 'override_select' ? 'Select Anyway' : 'Reject Anyway'}
                </span>
              </div>
              <textarea
                className="hm-textarea min-h-20 w-full"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you overriding the AI?"
              />
              <Button
                className="mt-3 w-full"
                variant="accent"
                onClick={() => feedback.mutate()}
                disabled={feedback.isPending || reason.length < 10}
              >
                <Send className="h-4 w-4" />
                {feedback.isPending ? 'Submitting…' : 'Submit Feedback'}
              </Button>
            </Card>
          ) : null}

          {candidate.recruiterReason ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800/40 dark:bg-amber-950/20">
              <span className="font-semibold text-accent dark:text-darkaccent">Previous feedback: </span>
              <span className="text-secondary dark:text-darkmuted">{candidate.recruiterReason}</span>
            </div>
          ) : null}
        </div>

        {/* ── COLUMN 3: Explainable AI (sticky) ── */}
        <div className="sticky top-[88px] h-fit space-y-5">
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-surface p-6 dark:border-darkaccent/20 dark:from-darkaccent/5 dark:to-darksurface">
            <div className="mb-5 flex items-center gap-2">
              <div className="rounded-xl bg-accent/15 p-2 dark:bg-darkaccent/15">
                <Lightbulb className="h-5 w-5 text-accent dark:text-darkaccent" />
              </div>
              <div>
                <CardTitle>Why Hire This Candidate?</CardTitle>
                <Caption>AI-generated insight</Caption>
              </div>
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
              className="space-y-3"
            >
              {candidate.explanation.map((line, i) => (
                <motion.div
                  key={line}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                  }}
                  className="rounded-xl border border-border bg-surface p-3.5 dark:border-darkborder dark:bg-darksurface"
                >
                  <div className="mb-2 flex items-start gap-2">
                    <BrainCircuit className="mt-0.5 h-3.5 w-3.5 flex-none text-accent dark:text-darkaccent" />
                    <p className="text-xs leading-relaxed text-secondary dark:text-darkmuted">{line}</p>
                  </div>
                  <ConfidenceDot level={85 - i * 8} />
                </motion.div>
              ))}
            </motion.div>

            {/* Breakdown categories */}
            <div className="mt-5 space-y-2.5 border-t border-border pt-5 dark:border-darkborder">
              {[
                { label: 'Skills Alignment', value: candidate.matchPercentage },
                { label: 'Experience Match', value: Math.min(100, candidate.aiScore + 5) },
                { label: 'Problem Solving', value: Math.min(100, candidate.leetcodeAnalysis?.contestRating ? 80 : 60) },
                { label: 'GitHub Activity', value: Math.min(100, (candidate.githubAnalysis?.contributions ?? 0) * 2) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs font-medium">
                    <span className="text-secondary dark:text-darkmuted">{label}</span>
                    <span className="font-semibold text-primary dark:text-darktext">{value}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-darkborder">
                    <motion.div
                      className={`h-1.5 rounded-full ${value >= 75 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-danger'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
