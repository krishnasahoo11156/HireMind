import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BriefcaseBusiness, Calendar, Clock, FileText, Globe, GraduationCap, Link2, MapPin, Send, Upload, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJob, useApplyJob } from '../../hooks/queries';
import type { Job } from '../../types';
import { Badge, Button, Card, PageTitle, SectionTitle, BodyText, Caption } from '../../components/ui';
import { useAuth } from '../../firebase/AuthContext';

export function CandidateJobDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const { data, isLoading } = useJob(id);
  const [isApplyDrawerOpen, setIsApplyDrawerOpen] = useState(false);

  // Apply form state pre-populated dynamically
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [whyApplying, setWhyApplying] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [error, setError] = useState('');

  // Sync inputs with user details when loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setGithubUrl(user.githubUrl || '');
      setLinkedinUrl(user.linkedinUrl || '');
      setPortfolioUrl(user.portfolioUrl || '');
      setLeetcodeUsername(user.leetcodeUsername || '');
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('apply') === 'true') {
      setIsApplyDrawerOpen(true);
    }
  }, [searchParams]);

  const applyMutation = useApplyJob({
    onSuccess: () => {
      navigate('/candidate/applications');
    },
    onError: (err: any) => {
      setError(err?.message ?? 'Failed to submit application');
    }
  });

  if (isLoading || !data?.job) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-darkborder w-1/3 rounded" />
        <div className="h-44 bg-gray-200 dark:bg-darkborder rounded-xl" />
      </div>
    );
  }

  const job = data.job;
  const skills = job.extractedData?.skills ?? [];
  const experience = job.extractedData?.experience ?? '3-5 years';
  const education = job.extractedData?.education ?? 'B.S. in Computer Science';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('jobId', job._id);
    if (file) formData.append('file', file);
    formData.append('name', name);
    formData.append('whyApplying', whyApplying);
    formData.append('githubUrl', githubUrl);
    formData.append('linkedinUrl', linkedinUrl);
    formData.append('portfolioUrl', portfolioUrl);
    formData.append('leetcodeUsername', leetcodeUsername);

    applyMutation.mutate(formData);
  };

  return (
    <div className="pb-24 relative">
      <PageTitle
        title={job.title}
        subtitle="Review requirements, skills criteria, and submit your credentials."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Main Job details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <SectionTitle>Job Description</SectionTitle>
            <div className="text-secondary dark:text-darkmuted text-sm whitespace-pre-line leading-relaxed">
              {job.description}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <SectionTitle>Key Responsibilities</SectionTitle>
            <ul className="list-disc pl-5 text-sm text-secondary dark:text-darkmuted space-y-2">
              <li>Collaborate with cross-functional teams to build high-performance React client architectures.</li>
              <li>Deliver clean, responsive layout implementations with deep accessibility considerations.</li>
              <li>Maintain codebase robustness using type-safe declarations and strict TypeScript guidelines.</li>
              <li>Coordinate with engineering coordinators to resolve optimization and scaling bottlenecks.</li>
            </ul>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <SectionTitle>Role Specifications</SectionTitle>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-secondary dark:text-darkmuted">
                <BriefcaseBusiness className="h-4 w-4 text-accent dark:text-darkaccent" />
                <span>Job Status: <Badge tone="emerald">{job.status}</Badge></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary dark:text-darkmuted">
                <User className="h-4 w-4 text-accent dark:text-darkaccent" />
                <span>Posted by: <span className="font-semibold text-primary dark:text-darktext">{job.creatorName || 'Recruiter'}</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary dark:text-darkmuted">
                <Clock className="h-4 w-4 text-accent dark:text-darkaccent" />
                <span>Exp Required: {experience}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary dark:text-darkmuted">
                <GraduationCap className="h-4 w-4 text-accent dark:text-darkaccent" />
                <span>Education: {education}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary dark:text-darkmuted">
                <MapPin className="h-4 w-4 text-accent dark:text-darkaccent" />
                <span>Location: Remote / Hybrid</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary dark:text-darkmuted">
                <Calendar className="h-4 w-4 text-accent dark:text-darkaccent" />
                <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <SectionTitle>Required Technical Skills</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} tone="gold">{s}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Apply Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-surface/85 backdrop-blur-md dark:border-darkborder dark:bg-darksurface/85 py-4 px-8 flex justify-between items-center transition-all">
        <div className="hidden sm:block">
          <p className="text-sm font-bold text-primary dark:text-darktext">{job.title}</p>
          <span className="text-xs text-secondary dark:text-darkmuted">Submit application using one-click AI processing.</span>
        </div>
        <Button size="lg" variant="accent" onClick={() => setIsApplyDrawerOpen(true)}>
          Apply Now
        </Button>
      </div>

      {/* Apply slide-out drawer */}
      <AnimatePresence>
        {isApplyDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApplyDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-surface dark:bg-darksurface shadow-2xl p-6 border-l border-border dark:border-darkborder overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-border dark:border-darkborder">
                <div>
                  <h3 className="text-lg font-bold text-primary dark:text-darktext">Apply for {job.title}</h3>
                  <p className="text-xs text-secondary dark:text-darkmuted">Complete your developer credentials to run the AI matching pipeline.</p>
                </div>
                <button
                  onClick={() => setIsApplyDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-secondary hover:bg-gray-100 dark:hover:bg-darkborder"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form className="space-y-5 mt-6" onSubmit={handleSubmit}>
                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary dark:text-darktext">Resume (PDF / DOCX)</label>
                  <div className="border-2 border-dashed border-border dark:border-darkborder rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-accent dark:hover:border-darkaccent relative bg-background/50">
                    <input
                      type="file"
                      required
                      accept=".pdf,.docx"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-8 w-8 text-secondary dark:text-darkmuted mb-2" />
                    {file ? (
                      <span className="text-sm font-medium text-primary dark:text-darktext">{file.name}</span>
                    ) : (
                      <>
                        <span className="text-xs text-secondary dark:text-darkmuted">Drag or click to choose resume file</span>
                        <span className="text-[10px] text-secondary/70 dark:text-darkmuted/70 mt-1">Supports PDF, DOCX up to 5MB</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary dark:text-darktext">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                    <input
                      type="text"
                      required
                      className="hm-input w-full pl-9"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                    />
                  </div>
                </div>

                {/* Statement / Cover Letter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary dark:text-darktext">Why are you applying for this job?</label>
                  <textarea
                    required
                    className="hm-textarea w-full"
                    rows={4}
                    value={whyApplying}
                    onChange={(e) => setWhyApplying(e.target.value)}
                    placeholder="Briefly describe why you are a great fit for this position..."
                  />
                </div>

                {/* Social profile fields */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary dark:text-darktext">GitHub Profile Link</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                    <input
                      type="url"
                      required
                      className="hm-input w-full pl-9"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/your-username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary dark:text-darktext">LinkedIn Profile Link</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                    <input
                      type="url"
                      required
                      className="hm-input w-full pl-9"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/your-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary dark:text-darktext">Portfolio Link</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                    <input
                      type="url"
                      className="hm-input w-full pl-9"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://your-portfolio.dev"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary dark:text-darktext">LeetCode Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                    <input
                      type="text"
                      required
                      className="hm-input w-full pl-9"
                      value={leetcodeUsername}
                      onChange={(e) => setLeetcodeUsername(e.target.value)}
                      placeholder="leetcode_username"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-danger dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  className="w-full mt-4"
                  size="lg"
                  type="submit"
                  disabled={applyMutation.isPending}
                  variant="accent"
                >
                  <Send className="h-4 w-4" />
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
