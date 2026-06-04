import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, BriefcaseBusiness, Clock, FilePlus2, Gauge, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Candidate, DashboardAnalytics, Job } from '../types';
import { Badge, Button, Card, EmptyState, PageTitle, RecommendationBadge, SkeletonCard, StatCard } from '../components/ui';

export function Dashboard() {
  const analytics = useQuery({ queryKey: ['analytics'], queryFn: () => api.analytics() as Promise<DashboardAnalytics> });
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: () => api.jobs() as Promise<{ jobs: Job[] }> });
  const candidates = useQuery({ queryKey: ['candidates', 'job_frontend'], queryFn: () => api.candidates('job_frontend') as Promise<{ candidates: Candidate[] }> });

  if (analytics.isLoading || jobs.isLoading) {
    return <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}</div>;
  }

  const metrics = analytics.data?.metrics;
  const recentJobs = jobs.data?.jobs.slice(0, 5) ?? [];
  const recentCandidates = candidates.data?.candidates.slice(0, 5) ?? [];

  return (
    <>
      <PageTitle title="Dashboard" subtitle="Live hiring intelligence, ranked candidates, and recruiter feedback signals." />
      {recentJobs.length === 0 ? (
        <EmptyState title="Create your first job to get started" body="Once a role is created, HireMind can parse resumes, analyze candidates, and explain every ranking." icon={<BriefcaseBusiness className="h-8 w-8" />} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Jobs Created" value={recentJobs.length} icon={<BriefcaseBusiness className="h-4 w-4" />} />
            <StatCard label="Candidates Reviewed" value={metrics?.resumesReviewed ?? 0} icon={<Users className="h-4 w-4" />} />
            <StatCard label="Time Saved" value={`${metrics?.timeSaved ?? 0}h`} icon={<Clock className="h-4 w-4" />} />
            <StatCard label="Accuracy Rate" value={`${metrics?.decisionAccuracy ?? 100}%`} icon={<Gauge className="h-4 w-4" />} />
          </div>
          <div className="grid grid-cols-[1.1fr_1fr] gap-6">
            <Card className="overflow-hidden">
              <SectionHeader title="Recent Jobs" />
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-background text-xs uppercase text-secondary dark:bg-darkbg dark:text-darkmuted">
                  <tr><th className="px-4 py-3">Title</th><th>Status</th><th>Candidates</th><th className="text-right pr-4">Action</th></tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job._id} className="border-t border-border hover:bg-gray-50 dark:border-darkborder dark:hover:bg-darkborder/30">
                      <td className="px-4 py-3 font-medium text-primary dark:text-darktext">{job.title}</td>
                      <td><Badge tone="gold">{job.status}</Badge></td>
                      <td className="text-secondary dark:text-darkmuted">{job.candidateCount ?? 0}</td>
                      <td className="pr-4 text-right"><Link className="text-sm font-medium text-accent dark:text-darkaccent" to={`/jobs/${job._id}`}>View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card className="overflow-hidden">
              <SectionHeader title="Recent Candidates" />
              <table className="w-full text-left text-sm">
                <thead className="bg-background text-xs uppercase text-secondary dark:bg-darkbg dark:text-darkmuted">
                  <tr><th className="px-4 py-3">Candidate</th><th>Score</th><th className="pr-4">Decision</th></tr>
                </thead>
                <tbody>
                  {recentCandidates.map((candidate) => (
                    <tr key={candidate._id} className="border-t border-border hover:bg-gray-50 dark:border-darkborder dark:hover:bg-darkborder/30">
                      <td className="px-4 py-3 font-medium"><Link to={`/candidates/${candidate._id}`}>{candidate.name}</Link></td>
                      <td className="font-semibold">{candidate.aiScore}</td>
                      <td className="pr-4"><RecommendationBadge recommendation={candidate.recommendation} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary dark:text-darktext">Quick Actions</h2>
                <p className="mt-1 text-sm text-secondary dark:text-darkmuted">Continue the hackathon demo from any key workflow.</p>
              </div>
              <div className="flex gap-3">
                <Link to="/jobs"><Button variant="secondary"><FilePlus2 className="h-4 w-4" />Create Job</Button></Link>
                <Link to="/jobs/job_frontend"><Button variant="accent"><ArrowRight className="h-4 w-4" />Upload Resumes</Button></Link>
                <Link to="/analytics"><Button><BarChart3 className="h-4 w-4" />View Analytics</Button></Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <div className="border-b border-border px-4 py-3 dark:border-darkborder"><h2 className="text-lg font-semibold text-primary dark:text-darktext">{title}</h2></div>;
}
