import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, Search, SlidersHorizontal, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { Candidate, Recommendation } from '../types';
import { Badge, Button, Card, EmptyState, PageTitle, RankBadge, RecommendationBadge, Caption } from '../components/ui';
import { BlindToggle } from '../components/BlindToggle';
import { ExplanationPanel } from '../components/ExplanationPanel';

export function CandidateDashboard() {
  const { id = 'job_frontend' } = useParams();
  const blindMode = useAppStore((state) => state.blindMode);
  const [query, setQuery] = useState('');
  const [recommendation, setRecommendation] = useState<'All' | Recommendation>('All');
  const [minScore, setMinScore] = useState(0);
  const [selectedExplain, setSelectedExplain] = useState<{ id: string; name: string } | null>(null);

  const candidates = useQuery({
    queryKey: ['candidates', id],
    queryFn: () => api.candidates(id) as Promise<{ candidates: Candidate[] }>
  });

  const filtered = useMemo(() => {
    return (candidates.data?.candidates ?? [])
      .filter((c) => recommendation === 'All' || c.recommendation === recommendation)
      .filter((c) => c.aiScore >= minScore)
      .filter((c) => `${c.name} ${c.blindId}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.aiScore - a.aiScore);
  }, [candidates.data, minScore, query, recommendation]);

  return (
    <>
      <PageTitle
        title="Candidate Rankings"
        subtitle="AI-ranked candidates with explainable scores, strengths, and skill alignment."
        action={<BlindToggle />}
      />

      {/* Filter bar */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary dark:text-darkmuted" />
            <input
              className="hm-input w-full pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or blind ID…"
            />
          </div>
          <div className="flex w-full md:w-auto items-center gap-3 flex-wrap sm:flex-nowrap">
            <select
              className="hm-input flex-1 md:w-44 bg-white dark:bg-darkbg"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value as 'All' | Recommendation)}
            >
              {['All', 'Strong Hire', 'Hire', 'Maybe', 'Reject'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <div className="flex h-12 flex-1 md:w-auto items-center gap-3 rounded-xl border border-border px-3 dark:border-darkborder bg-white dark:bg-darkbg">
              <SlidersHorizontal className="h-4 w-4 text-secondary dark:text-darkmuted" />
              <input
                aria-label="Minimum score"
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="accent-accent flex-1 min-w-[60px]"
              />
              <span className="w-10 text-right text-xs font-bold text-primary dark:text-darktext">{minScore}+</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary chips */}
      {filtered.length > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <span className="text-sm font-medium text-secondary dark:text-darkmuted">
            {filtered.length} candidate{filtered.length !== 1 ? 's' : ''}
          </span>
          {(['Strong Hire', 'Hire', 'Maybe', 'Reject'] as const).map((r) => {
            const count = filtered.filter((c) => c.recommendation === r).length;
            if (!count) return null;
            const tone = r === 'Strong Hire' ? 'green' : r === 'Hire' ? 'emerald' : r === 'Maybe' ? 'yellow' : 'red';
            return <Badge key={r} tone={tone}>{count} {r}</Badge>;
          })}
        </div>
      )}

      {/* Ranked Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No candidates match your filters"
          body="Adjust the search, recommendation filter, or score threshold."
          icon={<Search className="h-7 w-7" />}
        />
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border dark:border-darkborder bg-gray-50/50 dark:bg-darkbg/50">
                  <th className="sticky top-0 z-10 bg-background/95 dark:bg-darkbg/95 backdrop-blur-md px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary dark:text-darkmuted w-16">Rank</th>
                  <th className="sticky top-0 z-10 bg-background/95 dark:bg-darkbg/95 backdrop-blur-md px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">Candidate</th>
                  <th className="sticky top-0 z-10 bg-background/95 dark:bg-darkbg/95 backdrop-blur-md px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary dark:text-darkmuted w-48">Skill Match</th>
                  <th className="sticky top-0 z-10 bg-background/95 dark:bg-darkbg/95 backdrop-blur-md px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary dark:text-darkmuted w-24">AI Score</th>
                  <th className="sticky top-0 z-10 bg-background/95 dark:bg-darkbg/95 backdrop-blur-md px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary dark:text-darkmuted w-36">Status</th>
                  <th className="sticky top-0 z-10 bg-background/95 dark:bg-darkbg/95 backdrop-blur-md px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary dark:text-darkmuted text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-darkborder">
                {filtered.map((candidate, i) => {
                  const rank = i + 1;
                  const isTop3 = rank <= 3;
                  const rowBg = rank === 1
                    ? 'bg-yellow-50/15 dark:bg-yellow-950/5 hover:bg-yellow-50/25 dark:hover:bg-yellow-950/10'
                    : rank === 2
                    ? 'bg-gray-50/15 dark:bg-gray-900/5 hover:bg-gray-50/25 dark:hover:bg-gray-950/10'
                    : rank === 3
                    ? 'bg-amber-50/15 dark:bg-amber-950/5 hover:bg-amber-50/25 dark:hover:bg-amber-950/10'
                    : 'hover:bg-gray-50/50 dark:hover:bg-darkborder/25';

                  return (
                    <tr key={candidate._id} className={`transition-colors ${rowBg}`}>
                      {/* Rank */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RankBadge rank={rank} />
                      </td>

                      {/* Candidate */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary dark:text-darktext text-sm">
                            {blindMode ? candidate.blindId : candidate.name}
                          </span>
                          {isTop3 && <Star className="h-3.5 w-3.5 fill-accent text-accent dark:fill-darkaccent dark:text-darkaccent" />}
                          {!blindMode && candidate.username && (
                            <Caption className="text-xs">
                              (@{candidate.username})
                            </Caption>
                          )}
                        </div>
                        <p className="text-xs text-secondary dark:text-darkmuted mt-0.5 font-medium">
                          {blindMode ? 'PII hidden' : candidate.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {candidate.skillGap?.filter((g) => g.candidateHas === 'match').slice(0, 3).map((g) => (
                            <Badge key={g.skill} tone="emerald" className="text-[10px] px-1.5 py-0">
                              {g.skill}
                            </Badge>
                          ))}
                          {candidate.skillGap?.filter((g) => g.candidateHas === 'partial').slice(0, 2).map((g) => (
                            <Badge key={g.skill} tone="yellow" className="text-[10px] px-1.5 py-0">
                              {g.skill}
                            </Badge>
                          ))}
                          {candidate.skillGap?.filter((g) => g.candidateHas === 'missing').slice(0, 2).map((g) => (
                            <Badge key={g.skill} tone="red" className="text-[10px] px-1.5 py-0">
                              {g.skill}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      {/* Skill Match */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold tabular-nums text-primary dark:text-darktext w-10">
                            {candidate.matchPercentage}%
                          </span>
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100 dark:bg-darkborder">
                            <div
                              className={`h-2 rounded-full ${candidate.matchPercentage >= 75 ? 'bg-success' : candidate.matchPercentage >= 50 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${candidate.matchPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* AI Score */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-primary dark:text-darktext">
                          {candidate.aiScore}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RecommendationBadge recommendation={candidate.recommendation} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedExplain({ id: candidate._id, name: blindMode ? candidate.blindId : candidate.name })}
                          >
                            <BrainCircuit className="h-3.5 w-3.5 text-accent dark:text-darkaccent" />
                            Why?
                          </Button>
                          <Link to={`/recruiter/candidates/${candidate._id}`}>
                            <Button variant="accent" size="sm">View Profile</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ExplanationPanel
        isOpen={Boolean(selectedExplain)}
        onClose={() => setSelectedExplain(null)}
        candidateId={selectedExplain?.id ?? ''}
        candidateName={selectedExplain?.name ?? ''}
      />
    </>
  );
}
