import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, CheckCircle2, Github, Lightbulb, Send, Shield, XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { Candidate, Job, Resume } from '../types';
import { Badge, Button, Card, PageTitle, RecommendationBadge, ScoreBar, StatusCell } from '../components/ui';
import { BlindToggle } from '../components/BlindToggle';

export function CandidateProfile() {
  const { id = 'candidate_sarah' } = useParams();
  const blindMode = useAppStore((state) => state.blindMode);
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<'override_select' | 'override_reject' | 'agree' | ''>('');
  const [reason, setReason] = useState('Strong backend skills transferable to frontend');
  const data = useQuery({ queryKey: ['candidate', id], queryFn: () => api.candidate(id) as Promise<{ candidate: Candidate; resume: Resume; job: Job; feedback: Array<{ reason: string; createdAt: string }> }> });
  const feedback = useMutation({
    mutationFn: () => api.feedback(id, { decision, reason }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['candidate', id] })
  });

  const candidate = data.data?.candidate;
  const resume = data.data?.resume;
  if (!candidate || !resume) return <Card className="p-8">Loading candidate intelligence...</Card>;

  const displayName = blindMode ? candidate.blindId : candidate.name;

  return (
    <>
      <PageTitle title={displayName} subtitle={blindMode ? 'Blind screening active. PII and institution names are hidden.' : `${candidate.email} | ${data.data?.job.title}`} action={<BlindToggle />} />
      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-white dark:bg-darkaccent dark:text-darkbg">{blindMode ? <Shield className="h-5 w-5" /> : candidate.name.split(' ').map((part) => part[0]).join('')}</div>
                  <div>
                    <h2 className="text-xl font-semibold">{displayName}</h2>
                    {!blindMode ? <p className="text-sm text-secondary dark:text-darkmuted">{candidate.email}</p> : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="gold">{candidate.matchPercentage}% Match</Badge>
                  <Badge tone="neutral">Score {candidate.aiScore}/100</Badge>
                  <RecommendationBadge recommendation={candidate.recommendation} />
                </div>
              </div>
              <Button variant="accent" onClick={() => setDecision('override_select')}>Override Decision</Button>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-xl font-semibold">Resume Summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold">Experience</h3>
                {resume.parsedData.experience.map((item) => <p key={item.title} className="mt-2 text-sm leading-relaxed text-secondary dark:text-darkmuted">{item.title}, {item.duration}. {item.description}</p>)}
              </div>
              <div>
                <h3 className="text-sm font-semibold">Education</h3>
                {resume.parsedData.education.map((item) => <p key={item.degree} className="mt-2 text-sm text-secondary dark:text-darkmuted">{item.degree}, {blindMode ? item.year : `${item.institution}, ${item.year}`}</p>)}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{resume.parsedData.skills.map((skill) => <Badge key={skill} tone="neutral">{skill}</Badge>)}</div>
          </Card>
          <Card className="overflow-hidden">
            <div className="border-b border-border px-5 py-4 dark:border-darkborder"><h2 className="text-xl font-semibold">Skill Gap Heatmap</h2></div>
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-xs uppercase text-secondary dark:bg-darkbg dark:text-darkmuted"><tr><th className="px-5 py-3">Skill</th><th>Required</th><th>Candidate</th></tr></thead>
              <tbody>{candidate.skillGap.map((gap) => <tr key={gap.skill} className="border-t border-border dark:border-darkborder"><td className="px-5 py-3 font-semibold">{gap.skill}</td><td>{gap.isRequired ? 'Yes' : 'No'}</td><td><StatusCell status={gap.candidateHas} /></td></tr>)}</tbody>
            </table>
          </Card>
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2"><Github className="h-5 w-5 text-accent dark:text-darkaccent" /><h2 className="text-xl font-semibold">GitHub Analysis</h2></div>
            <div className="grid grid-cols-4 gap-3">
              <Metric label="Repos" value={candidate.githubAnalysis.publicRepos} />
              <Metric label="Commits" value={candidate.githubAnalysis.totalCommits} />
              <Metric label="Stars" value={candidate.githubAnalysis.stars} />
              <Metric label="Recent" value={candidate.githubAnalysis.contributions} />
            </div>
            <div className="mt-5 h-44"><ResponsiveContainer><BarChart data={candidate.githubAnalysis.languageBreakdown}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="language" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#A16207" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
            <p className="mt-4 text-sm leading-relaxed text-secondary dark:text-darkmuted">{candidate.githubAnalysis.aiSummary}</p>
          </Card>
          <Card className="p-5">
            <h2 className="text-xl font-semibold">LeetCode Analysis</h2>
            <div className="mt-4 grid grid-cols-4 gap-3">
              <Metric label="Solved" value={candidate.leetcodeAnalysis.problemsSolved} />
              <Metric label="Rating" value={candidate.leetcodeAnalysis.contestRating} />
              <Metric label="Ranking" value={candidate.leetcodeAnalysis.globalRanking.toLocaleString()} />
              <Metric label="Percentile" value={candidate.leetcodeAnalysis.percentile} />
            </div>
            <div className="mt-5 h-36"><ResponsiveContainer><BarChart data={[candidate.leetcodeAnalysis]} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="username" hide /><Tooltip /><Bar dataKey="easy" stackId="a" fill="#166534" /><Bar dataKey="medium" stackId="a" fill="#B45309" /><Bar dataKey="hard" stackId="a" fill="#B91C1C" /></BarChart></ResponsiveContainer></div>
            <p className="text-sm leading-relaxed text-secondary dark:text-darkmuted">{candidate.leetcodeAnalysis.aiSummary}</p>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="bg-accent/5 p-5 dark:bg-darkaccent/10">
            <div className="mb-4 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-accent dark:text-darkaccent" /><h2 className="text-xl font-semibold">Why this ranking?</h2></div>
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
              <p className="text-sm font-semibold">Ranked because:</p>
              {candidate.explanation.map((line) => (
                <motion.div key={line} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} className="flex gap-2 rounded-xl border border-border bg-white p-3 text-sm leading-relaxed text-secondary dark:border-darkborder dark:bg-darksurface dark:text-darkmuted">
                  <BrainCircuit className="mt-0.5 h-4 w-4 flex-none text-accent dark:text-darkaccent" />
                  {line}
                </motion.div>
              ))}
            </motion.div>
          </Card>
          <Card className="p-5">
            <h2 className="text-xl font-semibold">Recruiter Feedback Loop</h2>
            <div className="mt-4 rounded-2xl border border-border bg-background p-4 dark:border-darkborder dark:bg-darkbg">
              <p className="text-xs font-semibold uppercase text-secondary dark:text-darkmuted">Current AI Decision</p>
              <div className="mt-2 flex items-center gap-3"><RecommendationBadge recommendation={candidate.recommendation} /><ScoreBar value={candidate.aiScore} /></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setDecision('override_select')}><CheckCircle2 className="h-4 w-4" />Select Anyway</Button>
              <Button variant="danger" onClick={() => setDecision('override_reject')}><XCircle className="h-4 w-4" />Reject Anyway</Button>
            </div>
            {decision ? (
              <div className="mt-4 space-y-3">
                <textarea className="hm-textarea min-h-24 w-full" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why are you overriding the AI?" />
                <Button className="w-full" onClick={() => feedback.mutate()} disabled={feedback.isPending || reason.length < 10}><Send className="h-4 w-4" />Submit Feedback</Button>
              </div>
            ) : null}
            {candidate.recruiterReason ? <div className="mt-4 rounded-2xl bg-yellow-50 p-3 text-sm text-accent">Previous feedback: {candidate.recruiterReason}</div> : null}
          </Card>
          <Card className="p-5">
            <h2 className="text-xl font-semibold">Recent GitHub Activity</h2>
            <div className="mt-4 h-44"><ResponsiveContainer><LineChart data={candidate.githubAnalysis.activitySeries}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" /><YAxis /><Tooltip /><Line dataKey="commits" stroke="#A16207" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-border bg-background p-3 dark:border-darkborder dark:bg-darkbg"><p className="text-xs text-secondary dark:text-darkmuted">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>;
}
