import { useMemo, useState } from 'react';
import { Search, BriefcaseBusiness } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useJobs } from '../../hooks/queries';
import type { Job } from '../../types';
import { Badge, Button, Card, EmptyState, PageTitle, SectionTitle, BodyText } from '../../components/ui';

export function CandidateJobs() {
  const { data, isLoading } = useJobs();
  const [query, setQuery] = useState('');

  const activeJobs = data?.jobs ?? [];

  const filtered = useMemo(() => {
    return activeJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase()) ||
        job.extractedData?.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
    );
  }, [activeJobs, query]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-darkborder rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-44 bg-gray-200 dark:bg-darkborder rounded-xl" />
          <div className="h-44 bg-gray-200 dark:bg-darkborder rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Find Job Opportunities"
        subtitle="Explore roles that align with your experience and technical capabilities."
      />

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary dark:text-darkmuted" />
          <input
            className="hm-input w-full pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by job title, description, or skills…"
          />
        </div>
      </Card>

      {/* Filtered jobs */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No opportunities match your search"
          body="Try altering keywords, experience range, or specific skills."
          icon={<Search className="h-8 w-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => (
            <Card key={job._id} hover className="p-5 flex flex-col justify-between min-h-[200px]">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <SectionTitle>{job.title}</SectionTitle>
                  <Badge tone="neutral">Remote</Badge>
                </div>
                <BodyText variant="small" color="secondary" className="line-clamp-3">
                  {job.description}
                </BodyText>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.extractedData?.skills.slice(0, 4).map((s) => (
                    <Badge key={s} tone="neutral">{s}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center border-t border-border pt-4 dark:border-darkborder">
                <div className="flex flex-col text-left">
                  <span className="text-xs text-secondary dark:text-darkmuted">
                    Experience: {job.extractedData?.experience || '3-5 years'}
                  </span>
                  <span className="text-[10px] text-secondary/80 dark:text-darkmuted/80 mt-0.5">
                    Posted by: <span className="font-semibold text-primary dark:text-darktext">{job.creatorName || 'Recruiter'}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/candidate/jobs/${job._id}`}>
                    <Button variant="secondary" size="sm">Details</Button>
                  </Link>
                  <Link to={`/candidate/jobs/${job._id}?apply=true`}>
                    <Button variant="accent" size="sm">Apply</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
