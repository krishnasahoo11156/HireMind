import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, Search, SlidersHorizontal, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { Candidate, Recommendation } from '../types';
import { Badge, Button, Card, EmptyState, PageTitle, RankBadge, RecommendationBadge } from '../components/ui';
import { BlindToggle } from '../components/BlindToggle';
import { ExplanationPanel } from '../components/ExplanationPanel';

// ─── Candidate Card ─────────────────────────────────────────────────────────
function CandidateCard({
  candidate,
  rank,
  blindMode,
  onExplain
}: {
  candidate: Candidate;
  rank: number;
  blindMode: boolean;
  onExplain: (id: string, name: string) => void;
}) {
  const isTop3 = rank <= 3;
  const cardBg = rank === 1
    ? 'border-yellow-300 dark:border-yellow-600/40 bg-gradient-to-br from-yellow-50/60 to-surface dark:from-yellow-950/20 dark:to-darksurface'
    : rank === 2
    ? 'border-gray-300 dark:border-gray-600/40 bg-gradient-to-br from-gray-50/60 to-surface dark:from-gray-900/30 dark:to-darksurface'
    : rank === 3
    ? 'border-amber-300 dark:border-amber-700/40 bg-gradient-to-br from-amber-50/60 to-surface dark:from-amber-950/20 dark:to-darksurface'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.05 }}
    >
      <Card hover className={`p-5 ${cardBg}`}>
        <div className="flex items-start gap-4">
          {/* Rank */}
          <div className="flex-none pt-0.5">
            <RankBadge rank={rank} />
          </div>

          {/* Main info */}
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-primary dark:text-darktext">
                    {blindMode ? candidate.blindId : candidate.name}
                    {!blindMode && candidate.username && (
                      <span className="text-xs font-normal text-secondary dark:text-darkmuted ml-2">
                        (@{candidate.username})
                      </span>
                    )}
                  </h3>
                  {isTop3 && <Star className="h-3.5 w-3.5 fill-accent text-accent dark:fill-darkaccent dark:text-darkaccent" />}
                </div>
                <p className="mt-0.5 text-sm text-secondary dark:text-darkmuted">
                  {blindMode ? 'PII hidden' : candidate.email}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <RecommendationBadge recommendation={candidate.recommendation} />
                {candidate.recruiterDecision.startsWith('override') && (
                  <Badge tone="gold">Override</Badge>
                )}
              </div>
            </div>

            {/* Scores */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold tabular-nums text-primary dark:text-darktext">
                  {candidate.matchPercentage}%
                </div>
                <div className="text-xs font-medium text-secondary dark:text-darkmuted">Match</div>
              </div>
              <div className="h-10 w-px bg-border dark:bg-darkborder" />
              <div className="text-center">
                <div className="text-2xl font-bold tabular-nums text-primary dark:text-darktext">
                  {candidate.aiScore}
                </div>
                <div className="text-xs font-medium text-secondary dark:text-darkmuted">AI Score</div>
              </div>
              <div className="h-10 w-px bg-border dark:bg-darkborder" />
              {/* Score bar */}
              <div className="flex-1">
                <div className="mb-1.5 flex justify-between text-xs font-medium text-secondary dark:text-darkmuted">
                  <span>Confidence</span>
                  <span className="font-bold text-primary dark:text-darktext">{candidate.aiScore}/100</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-darkborder">
                  <motion.div
                     className={`h-2 rounded-full ${candidate.aiScore >= 75 ? 'bg-success' : candidate.aiScore >= 50 ? 'bg-warning' : 'bg-danger'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${candidate.aiScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: rank * 0.05 }}
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5">
              {candidate.skillGap
                ?.filter((g) => g.candidateHas === 'match')
                .slice(0, 5)
                .map((g) => (
                  <Badge key={g.skill} tone="emerald">{g.skill}</Badge>
                ))}
              {candidate.skillGap?.filter((g) => g.candidateHas === 'missing').slice(0, 2).map((g) => (
                <Badge key={g.skill} tone="red">{g.skill}</Badge>
              ))}
            </div>

            {/* AI Explanation preview */}
            {candidate.explanation?.[0] && (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-background/70 p-3 dark:border-darkborder dark:bg-darkbg/70">
                <BrainCircuit className="mt-0.5 h-3.5 w-3.5 flex-none text-accent dark:text-darkaccent" />
                <p className="text-xs leading-relaxed text-secondary dark:text-darkmuted">
                  {candidate.explanation[0]}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-3 dark:border-darkborder">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onExplain(candidate._id, blindMode ? candidate.blindId : candidate.name)}
              >
                <BrainCircuit className="h-3.5 w-3.5 text-accent dark:text-darkaccent" />
                Why?
              </Button>
              <Link to={`/candidates/${candidate._id}`}>
                <Button variant="accent" size="sm">View Profile</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Candidate Rankings Page ────────────────────────────────────────────────
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
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary dark:text-darkmuted" />
            <input
              className="hm-input w-full pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or blind ID…"
            />
          </div>
          <select
            className="hm-input w-44"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value as 'All' | Recommendation)}
          >
            {['All', 'Strong Hire', 'Hire', 'Maybe', 'Reject'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <div className="flex h-11 items-center gap-3 rounded-xl border border-border px-3 dark:border-darkborder">
            <SlidersHorizontal className="h-4 w-4 text-secondary dark:text-darkmuted" />
            <input
              aria-label="Minimum score"
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="accent-accent"
            />
            <span className="w-10 text-right text-sm font-semibold text-primary dark:text-darktext">{minScore}+</span>
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

      {/* Ranked Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No candidates match your filters"
          body="Adjust the search, recommendation filter, or score threshold."
          icon={<Search className="h-7 w-7" />}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((candidate, i) => (
            <CandidateCard
              key={candidate._id}
              candidate={candidate}
              rank={i + 1}
              blindMode={blindMode}
              onExplain={(id, name) => setSelectedExplain({ id, name })}
            />
          ))}
        </div>
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
