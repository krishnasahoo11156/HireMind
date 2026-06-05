import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, CheckCircle2, Github, Lightbulb, Send, Shield, XCircle, Download, TrendingUp } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { Candidate, Job, Resume } from '../types';
import { Badge, Button, Card, PageTitle, RecommendationBadge, ScoreGauge, SkillHeatmap, StatusCell, DisplayTitle, SectionTitle, CardTitle, BodyText, Caption } from '../components/ui';
import { BlindToggle } from '../components/BlindToggle';

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

          {/* GitHub Analysis */}
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Github className="h-5 w-5" />
              <SectionTitle>GitHub Analysis</SectionTitle>
            </div>
            <div className="mb-5 grid grid-cols-4 gap-3">
              <Metric label="Repos" value={candidate.githubAnalysis.publicRepos} />
              <Metric label="Commits" value={candidate.githubAnalysis.totalCommits} />
              <Metric label="Stars" value={candidate.githubAnalysis.stars} />
              <Metric label="Recent" value={candidate.githubAnalysis.contributions} />
            </div>
            <div className="h-40">
              <ResponsiveContainer>
                <BarChart data={candidate.githubAnalysis.languageBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="language" tick={{ fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="value" fill="#A16207" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-secondary dark:text-darkmuted">
              {candidate.githubAnalysis.aiSummary}
            </p>
          </Card>

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

          {/* Recent GitHub Activity */}
          <Card className="p-6">
            <SectionTitle className="mb-4">Recent Activity</SectionTitle>
            <div className="h-40">
              <ResponsiveContainer>
                <LineChart data={candidate.githubAnalysis.activitySeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip />
                  <Line dataKey="commits" stroke="#A16207" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

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
