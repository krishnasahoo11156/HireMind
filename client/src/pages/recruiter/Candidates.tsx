import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BrainCircuit, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/appStore';
import type { Candidate } from '../../types';
import { Badge, Button, Card, EmptyState, PageTitle, RecommendationBadge, ScoreGauge } from '../../components/ui';
import { BlindToggle } from '../../components/BlindToggle';

export function CandidatesDirectory() {
  const blindMode = useAppStore((state) => state.blindMode);
  const [query, setQuery] = useState('');
  const [selectedRec, setSelectedRec] = useState<'All' | Candidate['recommendation']>('All');

  const { data, isLoading } = useQuery({
    queryKey: ['candidates-all'],
    queryFn: () => api.allCandidates() as Promise<{ candidates: Candidate[] }>
  });

  const candidatesList = data?.candidates ?? [];

  const filtered = useMemo(() => {
    return candidatesList
      .filter((c) => selectedRec === 'All' || c.recommendation === selectedRec)
      .filter((c) => `${c.name} ${c.blindId} ${c.email}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.aiScore - a.aiScore);
  }, [candidatesList, query, selectedRec]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-darkborder w-1/3 rounded" />
        <div className="h-64 bg-gray-200 dark:bg-darkborder rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Candidate Directory"
        subtitle="Global index of all evaluated candidates, including match rates and LeetCode/GitHub insights."
        action={<BlindToggle />}
      />

      {/* Filter Header */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary dark:text-darkmuted" />
          <input
            className="hm-input w-full pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or blind ID…"
          />
        </div>
        <select
          className="hm-input w-full sm:w-48"
          value={selectedRec}
          onChange={(e) => setSelectedRec(e.target.value as any)}
        >
          <option value="All">All Recommendations</option>
          <option value="Strong Hire">Strong Hire</option>
          <option value="Hire">Hire</option>
          <option value="Maybe">Maybe</option>
          <option value="Reject">Reject</option>
        </select>
      </Card>

      {/* Candidates List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No candidates found"
          body="Try broadening your search criteria or resetting filters."
          icon={<Users className="h-8 w-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((candidate, i) => (
            <Card key={candidate._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-accent/30 dark:hover:border-darkaccent/30 transition-all border border-border dark:border-darkborder">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 dark:bg-darkaccent/10 text-accent dark:text-darkaccent text-sm font-bold">
                  #{i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-primary dark:text-darktext">
                      {blindMode ? candidate.blindId : candidate.name}
                    </h3>
                    {candidate.aiScore >= 85 && <Star className="h-3.5 w-3.5 fill-accent text-accent dark:fill-darkaccent dark:text-darkaccent" />}
                  </div>
                  <p className="text-xs text-secondary dark:text-darkmuted mt-0.5">
                    {blindMode ? 'PII Hidden' : candidate.email}
                  </p>
                </div>
              </div>

              {/* Match/Scores */}
              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary dark:text-darktext">{candidate.matchPercentage}%</div>
                  <div className="text-[10px] font-semibold text-secondary dark:text-darkmuted uppercase tracking-wider">Match %</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-primary dark:text-darktext">{candidate.aiScore}</div>
                  <div className="text-[10px] font-semibold text-secondary dark:text-darkmuted uppercase tracking-wider">AI Score</div>
                </div>

                <div className="text-right">
                  <RecommendationBadge recommendation={candidate.recommendation} />
                  <span className="text-[10px] font-semibold text-secondary dark:text-darkmuted block mt-1">
                    Status: {candidate.recruiterDecision === 'pending' ? 'Pending Review' : 'Reviewed'}
                  </span>
                </div>

                <Link to={`/recruiter/candidates/${candidate._id}`}>
                  <Button variant="accent" size="sm">
                    View Profile
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
