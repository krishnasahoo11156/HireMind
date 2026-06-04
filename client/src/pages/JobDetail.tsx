import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, FileUp, Loader2, Play, Tag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Candidate, Job, Resume } from '../types';
import { Badge, Button, Card, PageTitle, RecommendationBadge, ScoreBar } from '../components/ui';

export function JobDetail() {
  const { id = 'job_frontend' } = useParams();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const job = useQuery({ queryKey: ['job', id], queryFn: () => api.job(id) as Promise<{ job: Job; resumes: Resume[]; candidates: Candidate[] }> });
  const upload = useMutation({ mutationFn: () => api.uploadBatch(), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['job', id] }) });
  const generate = useMutation({ mutationFn: () => api.generateRanking(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['job', id] }) });

  async function runProcessing() {
    setProcessing(true);
    await upload.mutateAsync();
    await new Promise((resolve) => setTimeout(resolve, 900));
    await generate.mutateAsync();
    setProcessing(false);
  }

  const data = job.data;

  return (
    <>
      <PageTitle
        title={data?.job.title ?? 'Job Detail'}
        subtitle="Upload resumes, watch processing states, and open the ranked candidate dashboard."
        action={<Link to={`/jobs/${id}/candidates`}><Button><ArrowRight className="h-4 w-4" />View Rankings</Button></Link>}
      />
      <div className="grid grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-accent dark:text-darkaccent" /><h2 className="text-xl font-semibold">Job Intelligence</h2></div>
            <p className="text-sm leading-relaxed text-secondary dark:text-darkmuted">{data?.job.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">{data?.job.extractedData.skills.map((skill) => <Badge key={skill} tone="gold">{skill}</Badge>)}</div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Info label="Experience" value={data?.job.extractedData.experience ?? '3-5 Years'} />
              <Info label="Education" value={data?.job.extractedData.education ?? 'Equivalent'} />
              <Info label="Keywords" value={`${data?.job.extractedData.keywords.length ?? 0} extracted`} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-xl font-semibold">Upload Resumes</h2>
            <div className="mt-4 flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-center transition hover:border-accent dark:border-darkborder">
              <FileUp className="h-8 w-8 text-accent dark:text-darkaccent" />
              <p className="mt-3 text-sm font-semibold text-primary dark:text-darktext">Batch drag & drop supports 10-20 PDF/DOCX files</p>
              <p className="mt-1 text-xs text-secondary dark:text-darkmuted">Demo mode loads the five seeded candidate resumes.</p>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => upload.mutate()} disabled={upload.isPending}>{upload.isPending ? 'Uploading...' : 'Upload 5 Resumes'}</Button>
              <Button variant="accent" onClick={runProcessing} disabled={processing}><Play className="h-4 w-4" />{processing ? 'Processing...' : 'Analyze Candidates'}</Button>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3 dark:border-darkborder"><h2 className="text-lg font-semibold">Uploaded Resumes</h2></div>
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-xs uppercase text-secondary dark:bg-darkbg dark:text-darkmuted"><tr><th className="px-4 py-3">File</th><th>Candidate</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.resumes ?? []).map((resume, index) => (
                  <tr key={resume._id} className="border-t border-border dark:border-darkborder">
                    <td className="px-4 py-3 font-medium">{resume.fileName}</td>
                    <td>{resume.parsedData.name}</td>
                    <td>{processing && index > 1 ? <span className="inline-flex items-center gap-2 text-warning"><Loader2 className="h-4 w-4 animate-spin" />Processing...</span> : <span className="inline-flex items-center gap-2 text-success"><CheckCircle2 className="h-4 w-4" />Parsed</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Live Ranking Preview</h2>
          <div className="mt-4 space-y-4">
            {(data?.candidates ?? []).slice().sort((a, b) => b.aiScore - a.aiScore).map((candidate, index) => (
              <Link key={candidate._id} to={`/candidates/${candidate._id}`} className="block rounded-2xl border border-border p-3 transition hover:border-accent dark:border-darkborder">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">#{index + 1} {candidate.name}</div>
                    <div className="mt-1"><RecommendationBadge recommendation={candidate.recommendation} /></div>
                  </div>
                  <ScoreBar value={candidate.aiScore} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-background p-3 dark:border-darkborder dark:bg-darkbg"><p className="text-xs text-secondary dark:text-darkmuted">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}
