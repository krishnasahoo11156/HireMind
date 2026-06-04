import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, FileText, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Job } from '../types';
import { Badge, Button, Card, PageTitle } from '../components/ui';

export function Jobs() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('Frontend Developer');
  const [description, setDescription] = useState('We are looking for a Frontend Developer with strong React ecosystem experience, TypeScript fluency, Redux state management, Next.js delivery experience, and production TailwindCSS practice.');
  const extracted = useMemo(() => ({
    skills: ['React', 'TypeScript', 'Redux', 'Next.js', 'TailwindCSS'].filter((skill) => description.toLowerCase().includes(skill.toLowerCase())),
    experience: '3-5 Years',
    education: 'Computer Science or equivalent practical experience',
    keywords: ['React ecosystem', 'component architecture', 'state management', 'responsive UI']
  }), [description]);
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: () => api.jobs() as Promise<{ jobs: Job[] }> });
  const create = useMutation({
    mutationFn: () => api.createJob({ title, description }),
    onSuccess: () => {
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <>
      <PageTitle
        title="Jobs"
        subtitle="Create roles, upload job descriptions, and review AI-extracted requirements before saving."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Create Job</Button>}
      />
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-16 bg-background text-xs uppercase text-secondary dark:bg-darkbg dark:text-darkmuted">
            <tr><th className="px-4 py-3">Title</th><th>Status</th><th>Candidates</th><th>Created</th><th className="pr-4 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {(jobs.data?.jobs ?? []).map((job) => (
              <tr key={job._id} className="border-t border-border hover:bg-gray-50 dark:border-darkborder dark:hover:bg-darkborder/30">
                <td className="px-4 py-3">
                  <div className="font-semibold text-primary dark:text-darktext">{job.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1">{job.extractedData.skills.slice(0, 4).map((skill) => <Badge key={skill} tone="neutral">{skill}</Badge>)}</div>
                </td>
                <td><Badge tone="gold">{job.status}</Badge></td>
                <td className="text-secondary dark:text-darkmuted">{job.candidateCount ?? 0}</td>
                <td className="text-secondary dark:text-darkmuted">{new Date(job.createdAt).toLocaleDateString()}</td>
                <td className="pr-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/jobs/${job._id}`}><Button variant="secondary"><FileText className="h-4 w-4" />View</Button></Link>
                    <Button variant="secondary" aria-label="Delete job"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
          <Card className="w-full max-w-3xl p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary dark:text-darktext">Create Job</h2>
                <p className="mt-1 text-sm text-secondary dark:text-darkmuted">Paste the JD or drop a PDF/DOCX. Extraction runs automatically for preview.</p>
              </div>
              <button className="text-sm font-medium text-secondary dark:text-darkmuted" onClick={() => setOpen(false)}>Close</button>
            </div>
            <form className="grid grid-cols-[1fr_300px] gap-5" onSubmit={submit}>
              <div className="space-y-4">
                <input className="hm-input w-full" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Job title" />
                <textarea className="hm-textarea min-h-48 w-full" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Paste job description" />
                <div className="flex min-h-28 items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm font-medium text-secondary transition hover:border-accent dark:border-darkborder dark:text-darkmuted">
                  Upload JD PDF/DOCX
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4 dark:border-darkborder dark:bg-darkbg">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary dark:text-darktext"><BrainCircuit className="h-4 w-4 text-accent dark:text-darkaccent" />AI Extraction Preview</div>
                <Preview label="Skills" items={extracted.skills.length ? extracted.skills : ['React', 'TypeScript']} />
                <Preview label="Experience" items={[extracted.experience]} />
                <Preview label="Education" items={[extracted.education]} />
                <Preview label="Keywords" items={extracted.keywords} />
              </div>
              <div className="col-span-2 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Saving...' : 'Save Job'}</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </>
  );
}

function Preview({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-semibold uppercase text-secondary dark:text-darkmuted">{label}</p>
      <div className="flex flex-wrap gap-1.5">{items.map((item) => <Badge key={item} tone="gold">{item}</Badge>)}</div>
    </div>
  );
}
