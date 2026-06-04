import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { Candidate, Recommendation } from '../types';
import { Badge, Button, Card, PageTitle, RecommendationBadge, ScoreBar } from '../components/ui';
import { BlindToggle } from '../components/BlindToggle';

export function CandidateDashboard() {
  const { id = 'job_frontend' } = useParams();
  const blindMode = useAppStore((state) => state.blindMode);
  const [query, setQuery] = useState('');
  const [recommendation, setRecommendation] = useState<'All' | Recommendation>('All');
  const [minScore, setMinScore] = useState(0);
  const candidates = useQuery({ queryKey: ['candidates', id], queryFn: () => api.candidates(id) as Promise<{ candidates: Candidate[] }> });

  const filtered = useMemo(() => {
    return (candidates.data?.candidates ?? [])
      .filter((candidate) => recommendation === 'All' || candidate.recommendation === recommendation)
      .filter((candidate) => candidate.aiScore >= minScore)
      .filter((candidate) => `${candidate.name} ${candidate.blindId}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.aiScore - a.aiScore);
  }, [candidates.data, minScore, query, recommendation]);

  return (
    <>
      <PageTitle title="Candidate Rankings" subtitle="Sortable, explainable candidate intelligence for the Frontend Developer role." action={<BlindToggle />} />
      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary dark:text-darkmuted" />
            <input className="hm-input w-full pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or blind ID" />
          </div>
          <select className="hm-input w-48" value={recommendation} onChange={(event) => setRecommendation(event.target.value as 'All' | Recommendation)}>
            {['All', 'Strong Hire', 'Hire', 'Maybe', 'Reject'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <div className="flex h-12 items-center gap-3 rounded-xl border border-border px-3 dark:border-darkborder">
            <SlidersHorizontal className="h-4 w-4 text-secondary dark:text-darkmuted" />
            <input aria-label="Minimum score" type="range" min={0} max={100} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} />
            <span className="w-10 text-sm font-semibold">{minScore}+</span>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-16 bg-background text-xs uppercase text-secondary dark:bg-darkbg dark:text-darkmuted">
            <tr><th className="px-4 py-3">Rank</th><th>Candidate</th><th>Match %</th><th>Score</th><th>Recommendation</th><th className="pr-4 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((candidate, index) => (
              <tr key={candidate._id} className="border-t border-border transition hover:bg-gray-50 dark:border-darkborder dark:hover:bg-darkborder/30">
                <td className="px-4 py-3"><RankBadge rank={index + 1} /></td>
                <td>
                  <div className="font-semibold text-primary dark:text-darktext">{blindMode ? candidate.blindId : candidate.name}</div>
                  {!blindMode ? <div className="text-xs text-secondary dark:text-darkmuted">{candidate.email}</div> : <div className="text-xs text-secondary dark:text-darkmuted">PII hidden</div>}
                </td>
                <td className="font-semibold">{candidate.matchPercentage}%</td>
                <td><ScoreBar value={candidate.aiScore} /></td>
                <td>
                  <div className="flex items-center gap-2">
                    <RecommendationBadge recommendation={candidate.recommendation} />
                    {candidate.recruiterDecision.startsWith('override') ? <Badge tone="gold">AI: {candidate.recommendation} | You: {candidate.recruiterDecision === 'override_select' ? 'Select' : 'Reject'}</Badge> : null}
                  </div>
                </td>
                <td className="pr-4 text-right"><Link to={`/candidates/${candidate._id}`}><Button variant="secondary">Open</Button></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const tone = rank === 1 ? 'bg-yellow-100 text-accent' : rank === 2 ? 'bg-gray-100 text-gray-700' : rank === 3 ? 'bg-amber-100 text-amber-800' : 'bg-gray-50 text-secondary';
  return <span className={`inline-flex h-8 min-w-10 items-center justify-center gap-1 rounded-full px-2 text-sm font-bold ${tone}`}>{rank <= 3 ? <Trophy className="h-3.5 w-3.5" /> : null}#{rank}</span>;
}
