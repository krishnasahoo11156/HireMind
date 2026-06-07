import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BriefcaseBusiness, Calendar, Clock, FileText, Globe, GraduationCap, Link2, MapPin, Send, Upload, X, User, Check, Lock, Github, Linkedin, Users, Award, Briefcase, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJob, useApplyJob } from '../../hooks/queries';
import type { Job } from '../../types';
import { Badge, Button, Card, PageTitle, SectionTitle, BodyText, Caption, CardTitle } from '../../components/ui';
import { useCandidateAuth } from '../../firebase/AuthContext';

export function CandidateJobDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useCandidateAuth();

  const { data, isLoading } = useJob(id);
  const [isApplyDrawerOpen, setIsApplyDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply form state pre-populated dynamically
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [whyApplying, setWhyApplying] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [error, setError] = useState('');

  const handleCloseModal = () => {
    setIsApplyDrawerOpen(false);
    if (searchParams.get('apply') === 'true') {
      navigate(`/candidate/jobs/${id}`, { replace: true });
    }
  };

  const getFileSizeStr = (f: File | null) => {
    if (!f) return '';
    if (f.size > 1024 * 1024) {
      return `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(f.size / 1024).toFixed(0)} KB`;
  };

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
      <div className="mb-8 flex items-start gap-4">
        <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-amber-50 dark:bg-darkaccent/10 text-accent dark:text-darkaccent shadow-sm flex-none">
          <svg className="h-7 w-7 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
        </div>
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight leading-[1.2] text-primary dark:text-darktext">
            {job.title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-secondary dark:text-darkmuted font-sans font-normal">
            Review requirements, skills criteria, and submit your credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Main Job details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex-none">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Job Description</CardTitle>
                <div className="w-10 h-0.5 bg-accent dark:bg-darkaccent mt-1.5 rounded-full" />
              </div>
            </div>
            <div className="text-secondary dark:text-darkmuted text-[14px] leading-relaxed font-sans font-normal whitespace-pre-line">
              {job.description}
            </div>
          </Card>

          <Card className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 flex-none">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Key Responsibilities</CardTitle>
                <div className="w-10 h-0.5 bg-emerald-600 dark:bg-emerald-500 mt-1.5 rounded-full" />
              </div>
            </div>
            <ul className="space-y-4 text-[14px] leading-relaxed text-secondary dark:text-darkmuted mt-2 font-sans font-normal">
              {[
                "Collaborate with cross-functional teams to build high-performance React client architectures.",
                "Deliver clean, responsive layout implementations with deep accessibility considerations.",
                "Maintain codebase robustness using type-safe declarations and strict TypeScript guidelines.",
                "Coordinate with engineering coordinators to resolve optimization and scaling bottlenecks."
              ].map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500 text-emerald-600 dark:text-emerald-400 flex-none mt-0.5 bg-emerald-50/20 dark:bg-emerald-950/20">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 flex-none">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Role Specifications</CardTitle>
                <div className="w-10 h-0.5 bg-purple-600 dark:bg-purple-500 mt-1.5 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-[auto_140px_1fr] gap-y-2.5 gap-x-3 items-start text-sm pt-1">
              {/* Job Status */}
              <div className="flex items-center h-5">
                <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-secondary dark:text-darkmuted font-medium py-0.5">Job Status</span>
              <span>
                <Badge tone="emerald">{job.status}</Badge>
              </span>

              {/* Posted By */}
              <div className="flex items-center h-5">
                <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-secondary dark:text-darkmuted font-medium py-0.5">Posted by</span>
              <span className="text-primary dark:text-darktext py-0.5">{job.creatorName || 'Recruiter'}</span>

              {/* Experience Required */}
              <div className="flex items-center h-5 mt-0.5">
                <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-secondary dark:text-darkmuted font-medium mt-0.5 py-0.5">Experience Required</span>
              <span className="text-primary dark:text-darktext leading-relaxed mt-0.5 py-0.5">{experience}</span>

              {/* Education */}
              <div className="flex items-center h-5">
                <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-secondary dark:text-darkmuted font-medium py-0.5">Education</span>
              <span className="text-primary dark:text-darktext py-0.5">{education}</span>

              {/* Location */}
              <div className="flex items-center h-5">
                <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-secondary dark:text-darkmuted font-medium py-0.5">Location</span>
              <span className="text-primary dark:text-darktext py-0.5">Remote / Hybrid</span>

              {/* Posted */}
              <div className="flex items-center h-5">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-secondary dark:text-darkmuted font-medium py-0.5">Posted</span>
              <span className="text-primary dark:text-darktext py-0.5">{new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 flex-none">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Required Technical Skills</CardTitle>
                <div className="w-10 h-0.5 bg-blue-600 dark:bg-blue-500 mt-1.5 rounded-full" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
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

      {/* Apply center-aligned modal */}
      <AnimatePresence>
        {isApplyDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Wrapper */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="bg-surface dark:bg-darksurface rounded-2xl shadow-2xl border border-border dark:border-darkborder w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border dark:border-darkborder bg-surface dark:bg-darksurface flex-none">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-50 dark:bg-darkaccent/10 text-accent dark:text-darkaccent flex-none">
                      <svg className="h-6 w-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary dark:text-darktext">Apply for {job.title}</h3>
                      <p className="text-xs text-secondary dark:text-darkmuted">Complete your developer credentials to run the AI matching pipeline.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="p-2 rounded-xl text-secondary hover:bg-gray-100 dark:hover:bg-darkborder transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form Container */}
                <form className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6" onSubmit={handleSubmit}>
                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-primary dark:text-darktext">Resume (PDF / DOCX)</label>
                    {file ? (
                      <div className="border border-dashed border-border dark:border-darkborder rounded-xl p-4 flex items-center justify-between bg-background/20">
                        <div className="flex items-center">
                          {/* File Icon */}
                          <div className="relative flex-none flex flex-col items-center justify-center w-12 h-14 bg-white dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-lg shadow-sm overflow-hidden">
                            <div className="flex-1 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-gray-400 dark:text-darkmuted" />
                            </div>
                            <div className={`w-full text-white text-[9px] font-black text-center py-0.5 uppercase tracking-wide ${
                              file.name.toLowerCase().endsWith('.pdf') ? 'bg-red-600' : 'bg-blue-600'
                            }`}>
                              {file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX'}
                            </div>
                          </div>
                          
                          {/* File Details */}
                          <div className="ml-4">
                            <p className="text-sm font-bold text-primary dark:text-darktext break-all">{file.name}</p>
                            <p className="text-xs text-secondary dark:text-darkmuted mt-0.5">
                              {getFileSizeStr(file)} <span className="mx-1 text-gray-300 dark:text-darkborder">•</span> <span className="text-success font-semibold">Uploaded successfully</span>
                            </p>
                          </div>
                        </div>

                        {/* File Action */}
                        <div className="flex items-center gap-3 ml-4 flex-none">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white flex-none">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border dark:border-darkborder rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-accent dark:hover:border-darkaccent relative bg-background/20 transition-colors"
                      >
                        <Upload className="h-8 w-8 text-secondary dark:text-darkmuted mb-2.5" />
                        <span className="text-xs font-semibold text-primary dark:text-darktext">Drag or click to choose resume file</span>
                        <span className="text-[10px] text-secondary/70 dark:text-darkmuted/70 mt-1">Supports PDF, DOCX up to 5MB</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      required={!file}
                      accept=".pdf,.docx"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>

                  {/* Full Name */}
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

                  {/* Why applying */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-primary dark:text-darktext">
                      Why are you applying for this job? <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        required
                        maxLength={1000}
                        className="hm-textarea w-full pb-8"
                        rows={4}
                        value={whyApplying}
                        onChange={(e) => setWhyApplying(e.target.value)}
                        placeholder="Briefly describe why you are a great fit for this position..."
                      />
                      <div className="absolute right-3 bottom-2.5 text-[10px] font-semibold text-secondary/70 dark:text-darkmuted/70">
                        {whyApplying.length} / 1000
                      </div>
                    </div>
                  </div>

                  {/* Links Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* GitHub */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-primary dark:text-darktext">GitHub Profile Link</label>
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                        <input
                          type="url"
                          className="hm-input w-full pl-9"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/your-username"
                        />
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-primary dark:text-darktext">LinkedIn Profile Link</label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                        <input
                          type="url"
                          className="hm-input w-full pl-9"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="https://linkedin.com/in/your-name"
                        />
                      </div>
                    </div>

                    {/* Portfolio */}
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

                    {/* LeetCode */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-primary dark:text-darktext">LeetCode Username</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-darkmuted">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                            <path d="M16.102 17.93l-2.697 2.607c-.466.45-1.211.45-1.677 0l-8.58-8.291a1.137 1.137 0 0 1 0-1.653l8.58-8.292c.466-.45 1.211-.45 1.677 0l2.697 2.606c.466.45.197 1.185-.452 1.258l-5.698.636a1.136 1.136 0 0 0-.96.96l-.637 5.699c-.073.65.65.918 1.1.452l2.368-2.29c.432-.417 1.116-.426 1.558-.02l5.06 4.652c.466.428.497 1.13.067 1.596l-1.397 1.517z"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          className="hm-input w-full pl-9"
                          value={leetcodeUsername}
                          onChange={(e) => setLeetcodeUsername(e.target.value)}
                          placeholder="leetcode_username"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-danger dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <Button
                      className="w-full flex items-center justify-center gap-2"
                      size="lg"
                      type="submit"
                      disabled={applyMutation.isPending}
                      variant="accent"
                    >
                      <Send className="h-4 w-4" />
                      {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                    </Button>
                    
                    <div className="flex items-center justify-center gap-1.5 text-xs text-secondary/70 dark:text-darkmuted/70 font-semibold">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Your information is secure and will only be used for evaluation purposes.</span>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
