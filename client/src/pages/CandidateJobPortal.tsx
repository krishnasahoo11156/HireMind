import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Award,
  ArrowRight,
  LogOut,
  Sun,
  Moon,
  Briefcase,
  Layers,
  MapPin,
  Clock,
  Code,
  User,
  ShieldCheck,
  BrainCircuit,
  Settings,
  Lightbulb,
  XCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';
import { Button, Badge, Card, SkillHeatmap, CardTitle, BodyText, Caption, Meta, SectionTitle } from '../components/ui';

const SKILL_ALIASES: Record<string, string> = {
  'react': 'React',
  'react.js': 'React',
  'reactjs': 'React',
  'react js': 'React',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'javascript': 'JavaScript',
  'js': 'JavaScript',
  'node.js': 'Node.js',
  'nodejs': 'Node.js',
  'node': 'Node.js',
  'next.js': 'Next.js',
  'nextjs': 'Next.js',
  'next': 'Next.js',
  'vue.js': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue': 'Vue.js',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  'css': 'CSS',
  'html': 'HTML',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'GCP',
  'google cloud': 'GCP',
  'firebase': 'Firebase',
  'redux': 'Redux',
  'graphql': 'GraphQL',
  'python': 'Python',
  'java': 'Java',
  'cpp': 'C++',
  'c++': 'C++',
  'csharp': 'C#',
  'c#': 'C#',
  'go': 'Go',
  'golang': 'Go',
  'rust': 'Rust',
  'ruby': 'Ruby',
  'rails': 'Ruby on Rails',
  'ruby on rails': 'Ruby on Rails',
  'php': 'PHP',
  'laravel': 'Laravel',
  'git': 'Git',
  'github': 'GitHub'
};

function normalizeSkill(skill: string): string {
  const trimmed = skill.trim();
  const lower = trimmed.toLowerCase();
  if (SKILL_ALIASES[lower]) {
    return SKILL_ALIASES[lower];
  }
  return trimmed
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeSkills(skills: string[]): string[] {
  if (!Array.isArray(skills)) return [];
  const normalized = skills.map(normalizeSkill);
  return Array.from(new Set(normalized));
}

function checkSkillsMatch(requiredSkills: string[], candidateSkills: string[], projects: any[] = [], experience: any[] = []) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { matched: [], partial: [], missing: [], percentage: 100 };
  }

  const normalizedRequired = normalizeSkills(requiredSkills);
  const normalizedResumeSkills = normalizeSkills(candidateSkills);
  const lowercaseResumeSkills = normalizedResumeSkills.map((s) => s.toLowerCase());

  const matched: string[] = [];
  const partial: Array<{ skill: string; evidence: string }> = [];
  const missing: string[] = [];
  let matchedCount = 0;
  let partialCount = 0;

  for (const skill of normalizedRequired) {
    const skillLower = skill.toLowerCase();

    // 1. Direct Match
    if (lowercaseResumeSkills.includes(skillLower)) {
      matchedCount++;
      matched.push(skill);
      continue;
    }

    // 2. Project match
    let foundInProject = false;
    if (Array.isArray(projects)) {
      for (const proj of projects) {
        const hasTech = Array.isArray(proj.technologies) && 
          proj.technologies.some((t: string) => t.toLowerCase().includes(skillLower) || skillLower.includes(t.toLowerCase()));
        const inDesc = proj.description?.toLowerCase().includes(skillLower);
        const inName = proj.name?.toLowerCase().includes(skillLower);

        if (hasTech || inDesc || inName) {
          partialCount++;
          partial.push({ skill, evidence: `Project: ${proj.name}` });
          foundInProject = true;
          break;
        }
      }
    }

    if (foundInProject) continue;

    // 3. Experience match
    let foundInExp = false;
    if (Array.isArray(experience)) {
      for (const exp of experience) {
        const inTitle = exp.title?.toLowerCase().includes(skillLower);
        const inCompany = exp.company?.toLowerCase().includes(skillLower);
        const inDesc = exp.description?.toLowerCase().includes(skillLower);

        if (inTitle || inCompany || inDesc) {
          partialCount++;
          partial.push({ skill, evidence: `Experience at ${exp.company}` });
          foundInExp = true;
          break;
        }
      }
    }

    if (foundInExp) continue;

    // 4. Missing
    missing.push(skill);
  }

  const percentage = Math.round(
    ((matchedCount + partialCount * 0.5) / normalizedRequired.length) * 100
  );

  return { matched, partial, missing, percentage };
}

export function CandidateJobPortal() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  // User session state
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    api.me()
      .then((res: any) => setCurrentUser(res.user))
      .catch(() => {
        localStorage.removeItem(api.tokenKey);
        navigate('/');
      });
  }, [navigate]);

  // Profile fields state
  const [githubUsername, setGithubUsername] = useState('sarahchen-dev');
  const [leetcodeUsername, setLeetcodeUsername] = useState('sarahc');
  const [resumeParsedData, setResumeParsedData] = useState<any>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Application matching states
  const [applications, setApplications] = useState<Record<string, any>>({});
  const [loadingAppJobId, setLoadingAppJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');

  // Fetch vacancies
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs() as Promise<{ jobs: any[] }>
  });

  // Fetch existing candidate applications for current user once loaded
  useEffect(() => {
    if (currentUser && jobsData?.jobs) {
      // For each job, check if this candidate has already applied
      jobsData.jobs.forEach((job) => {
        api.candidates(job._id)
          .then((res: any) => {
            const match = res.candidates?.find(
              (c: any) => c.email.toLowerCase() === currentUser.email.toLowerCase()
            );
            if (match) {
              setApplications((prev) => ({ ...prev, [job._id]: match }));
            }
          })
          .catch((err) => console.warn('Error fetching candidate application:', err));
      });
    }
  }, [currentUser, jobsData]);

  // Dropzone file handler
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      setUploadStatus('uploading');
      setErrorMessage('');

      try {
        const file = acceptedFiles[0];
        // Upload resume via api.uploadBatch
        setUploadStatus('parsing');
        const res: any = await api.uploadBatch([file]);
        if (res.resumes && res.resumes.length > 0) {
          const resume = res.resumes[0];
          setResumeId(resume._id);
          setResumeParsedData(resume.parsedData);
          setUploadStatus('success');
          
          // Seed profile fields if extracted
          if (resume.parsedData.links?.github) {
            const gh = resume.parsedData.links.github.split('/').pop();
            if (gh) setGithubUsername(gh);
          }
          if (resume.parsedData.links?.leetcode) {
            const lc = resume.parsedData.links.leetcode.split('/').pop();
            if (lc) setLeetcodeUsername(lc);
          }
        } else {
          throw new Error('Upload parsed empty response');
        }
      } catch (err: any) {
        setUploadStatus('error');
        setErrorMessage(err.message || 'File parsing failed');
      }
    }
  });

  const handleApply = async (jobId: string) => {
    if (!resumeId) return;
    setLoadingAppJobId(jobId);
    try {
      const res: any = await api.analyze(jobId, resumeId, githubUsername, leetcodeUsername);
      if (res.candidate) {
        setApplications((prev) => ({ ...prev, [jobId]: res.candidate }));
        queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      }
    } catch (err: any) {
      console.error('AI application analysis failed:', err);
      alert(err.message || 'Application failed');
    } finally {
      setLoadingAppJobId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(api.tokenKey);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-primary dark:bg-darkbg dark:text-darktext transition-colors duration-300">
      
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-8 backdrop-blur-md dark:border-darkborder dark:bg-darksurface/90">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#C88908] to-[#A16207] dark:from-[#D4A017] dark:to-[#A16207] shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="30" y1="75" x2="30" y2="25" stroke="white" strokeWidth="6" strokeLinecap="round" />
              <line x1="70" y1="75" x2="70" y2="25" stroke="white" strokeWidth="6" strokeLinecap="round" />
              <line x1="30" y1="50" x2="70" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round" />
              <circle cx="30" cy="25" r="7" fill="white" />
              <circle cx="30" cy="75" r="7" fill="white" />
              <circle cx="70" cy="25" r="7" fill="white" />
              <circle cx="70" cy="75" r="7" fill="white" />
              <circle cx="50" cy="50" r="8.5" fill="white" stroke="#A16207" strokeWidth="2.5" />
            </svg>
          </div>
          <div>
            <span className="font-heading text-lg font-extrabold tracking-[-0.03em] block">HireMind</span>
            <span className="text-[10px] uppercase font-bold text-accent tracking-wider dark:text-darkaccent block -mt-1">Candidate Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-secondary hover:bg-gray-50 hover:text-primary dark:border-darkborder dark:bg-darkbg dark:text-darkmuted dark:hover:bg-darkborder/50 dark:hover:text-darktext transition-all duration-200"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <div className="h-6 w-px bg-border dark:bg-darkborder" />
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs dark:bg-darkaccent/15 dark:text-darkaccent">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-none">{currentUser?.name ?? 'User'}</p>
              <p className="text-[10px] text-secondary dark:text-darkmuted font-medium mt-0.5">{currentUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl p-2 text-secondary hover:bg-gray-100 hover:text-primary dark:text-darkmuted dark:hover:bg-darkborder/50 dark:hover:text-darktext transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENT BODY ── */}
      <main className="mx-auto max-w-7xl px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: PROFILE & RESUME CENTER */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Resume Upload Dropzone */}
            <Card>
              <CardTitle className="mb-4">1. Upload Resume</CardTitle>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-accent bg-accent/5 dark:border-darkaccent dark:bg-darkaccent/5'
                    : 'border-border bg-background hover:bg-surface dark:border-darkborder dark:bg-darkbg'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-8 w-8 text-secondary dark:text-darkmuted mb-2.5" />
                <BodyText variant="small" className="font-semibold text-primary dark:text-darktext">
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop resume PDF or DOCX'}
                </BodyText>
                <Meta className="mt-1 block">
                  Supports file parsing up to 10MB
                </Meta>
              </div>

              {/* Uploading / Parsing States */}
              <AnimatePresence mode="wait">
                {uploadStatus === 'uploading' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3.5 flex items-center gap-2 text-xs font-semibold text-secondary">
                    <div className="h-4.5 w-4.5 rounded-full border-2 border-border border-t-accent animate-spin dark:border-darkborder dark:border-t-darkaccent" />
                    Uploading file to server...
                  </motion.div>
                )}
                {uploadStatus === 'parsing' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3.5 flex items-center gap-2 text-xs font-semibold text-accent dark:text-darkaccent">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    AI structured parsing running...
                  </motion.div>
                )}
                {uploadStatus === 'success' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3.5 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-start gap-2.5 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-none" />
                    <div>
                      <p className="font-bold">Resume Parsed Successfully!</p>
                      <p className="text-[10px] opacity-90 mt-0.5">Identified name: {resumeParsedData?.name}</p>
                    </div>
                  </motion.div>
                )}
                {uploadStatus === 'error' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3.5 p-3.5 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/40">
                    <p className="font-bold">Parsing Error</p>
                    <p className="text-[10px] opacity-90 mt-0.5">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Real-time Skill Validation Card */}
            {resumeParsedData && (
              <Card className="border-accent/20 bg-gradient-to-br from-accent/[0.01] to-surface dark:from-darkaccent/[0.01] shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-xl bg-accent/10 p-2 dark:bg-darkaccent/10">
                    <BrainCircuit className="h-4.5 w-4.5 text-accent dark:text-darkaccent" />
                  </div>
                  <CardTitle>Real-Time Skill Validation</CardTitle>
                </div>

                <div className="space-y-4">
                  <div>
                    <Caption className="uppercase tracking-wider font-bold block mb-1.5 text-secondary dark:text-darkmuted">
                      Select Target Job
                    </Caption>
                    <select
                      className="hm-input w-full bg-white dark:bg-darkbg"
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                    >
                      <option value="">-- Choose a job to match --</option>
                      {jobsData?.jobs?.map((j: any) => (
                        <option key={j._id} value={j._id}>{j.title}</option>
                      ))}
                    </select>
                  </div>

                  {selectedJobId ? (() => {
                    const targetJob = jobsData?.jobs?.find((j: any) => j._id === selectedJobId);
                    if (!targetJob) return null;

                    const match = checkSkillsMatch(
                      targetJob.requiredSkills || [],
                      resumeParsedData.skills || [],
                      resumeParsedData.projects || [],
                      resumeParsedData.experience || []
                    );

                    return (
                      <div className="space-y-4 animate-fadeIn border-t border-border dark:border-darkborder pt-4">
                        {/* Match score bar */}
                        <div>
                          <div className="mb-1.5 flex justify-between text-xs font-semibold">
                            <Caption className="font-semibold text-secondary dark:text-darkmuted">Match Confidence</Caption>
                            <span className="text-accent dark:text-darkaccent font-bold text-[14px]">{match.percentage}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-darkborder">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                match.percentage >= 75 ? 'bg-success' : match.percentage >= 50 ? 'bg-warning' : 'bg-danger'
                              }`}
                              style={{ width: `${match.percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Matched & Missing breakdown */}
                        <div className="space-y-4">
                          {/* Matched */}
                          <div>
                            <Caption className="font-bold text-success uppercase tracking-wider block mb-1.5">
                              Matched Skills ({match.matched.length})
                            </Caption>
                            <div className="flex flex-wrap gap-1.5">
                              {match.matched.map((s) => (
                                <Badge key={s} tone="emerald" className="text-[11px] px-2 py-0.5">{s}</Badge>
                              ))}
                              {match.matched.length === 0 && (
                                <span className="text-xs text-secondary dark:text-darkmuted italic">None</span>
                              )}
                            </div>
                          </div>

                          {/* Partial Match */}
                          {match.partial.length > 0 && (
                            <div>
                              <Caption className="font-bold text-warning uppercase tracking-wider block mb-1.5">
                                Partial Matches ({match.partial.length})
                              </Caption>
                              <div className="space-y-2">
                                {match.partial.map((p) => (
                                  <div key={p.skill} className="flex flex-col text-xs text-secondary dark:text-darkmuted border-l-2 border-warning/40 pl-3 py-0.5">
                                    <span className="font-semibold text-primary dark:text-darktext">{p.skill}</span>
                                    <span className="text-[11px] text-secondary/80 dark:text-darkmuted/80">{p.evidence}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing */}
                          <div>
                            <Caption className="font-bold text-danger uppercase tracking-wider block mb-1.5">
                              Missing Required Skills ({match.missing.length})
                            </Caption>
                            <div className="flex flex-wrap gap-1.5">
                              {match.missing.map((s) => (
                                <Badge key={s} tone="red" className="text-[11px] px-2 py-0.5">{s}</Badge>
                              ))}
                              {match.missing.length === 0 && (
                                <span className="text-xs text-secondary dark:text-darkmuted italic">None</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <p className="text-xs text-secondary dark:text-darkmuted italic bg-background/50 dark:bg-darkbg/50 p-3 rounded-xl border border-border/50 dark:border-darkborder/50 leading-relaxed">
                      Select a job from the dropdown to validate your resume against its required skills in real-time.
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Profile Enrichment Card */}
            <Card>
              <CardTitle className="mb-4">2. Technical Enrichment</CardTitle>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Caption className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-secondary dark:text-darkmuted">
                    <Code className="h-3.5 w-3.5" />
                    GitHub Username
                  </Caption>
                  <input
                    className="hm-input w-full"
                    placeholder="e.g. sarahchen-dev"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Caption className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-secondary dark:text-darkmuted">
                    <Award className="h-3.5 w-3.5" />
                    LeetCode Username
                  </Caption>
                  <input
                    className="hm-input w-full"
                    placeholder="e.g. sarahc"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                  />
                </div>
              </div>

              {resumeParsedData?.skills && (
                <div className="mt-6 pt-5 border-t border-border dark:border-darkborder">
                  <Caption className="font-bold uppercase tracking-wider block mb-2.5 text-secondary dark:text-darkmuted">Parsed Stack</Caption>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto scrollbar-hide">
                    {resumeParsedData.skills.map((skill: string) => (
                      <Badge key={skill} tone="neutral">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

          </div>

          {/* RIGHT PANEL: JOB VACANCIES & MATCHING ASSESSMENT */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-accent dark:text-darkaccent" />
              <SectionTitle>Active Job Opportunities</SectionTitle>
            </div>

            {jobsLoading ? (
              <div className="space-y-4">
                <div className="h-32 hm-skeleton rounded-xl" />
                <div className="h-32 hm-skeleton rounded-xl" />
              </div>
            ) : jobsData?.jobs?.length === 0 ? (
              <Card className="p-8 text-center text-secondary dark:text-darkmuted">
                No active vacancy postings found. Please ask recruiter to post jobs.
              </Card>
            ) : (
              <div className="space-y-5">
                {jobsData?.jobs?.map((job) => {
                  const hasApplied = Boolean(applications[job._id]);
                  const candidateResult = applications[job._id];

                  return (
                    <Card key={job._id}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 dark:border-darkborder/50 pb-4 mb-4">
                        <div>
                          <CardTitle>{job.title}</CardTitle>
                          <div className="flex items-center gap-4 text-xs text-secondary dark:text-darkmuted mt-1 font-semibold">
                            <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5 text-accent dark:text-darkaccent" /> {job.department ?? 'Engineering'}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Post Date: {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div>
                          {hasApplied ? (
                            <div className="flex items-center gap-2">
                              <Badge tone="green">Applied</Badge>
                              <span className="text-sm font-black text-accent dark:text-darkaccent">{candidateResult?.matchPercentage}% Fit</span>
                            </div>
                          ) : (
                            <Button
                              variant="accent"
                              disabled={!resumeId || loadingAppJobId === job._id}
                              onClick={() => handleApply(job._id)}
                              className="shadow-sm"
                            >
                              {loadingAppJobId === job._id ? (
                                <>
                                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1" />
                                  Evaluating Fit...
                                </>
                              ) : (
                                <>
                                  Apply & Match
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Caption className="font-bold uppercase tracking-wider block mb-1.5 text-secondary dark:text-darkmuted">Vacancy Details</Caption>
                          <BodyText variant="small" color="secondary" className="leading-relaxed">{job.description}</BodyText>
                        </div>

                        {/* If Applied: Display match metrics & Gemini explainability rationale */}
                        <AnimatePresence>
                          {hasApplied && candidateResult && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="pt-4 border-t border-border dark:border-darkborder space-y-4 overflow-hidden"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3.5 rounded-xl bg-background dark:bg-darkbg border border-border/60 dark:border-darkborder/50 text-center">
                                  <Caption className="font-bold uppercase block mb-0.5 text-secondary dark:text-darkmuted">AI fit Score</Caption>
                                  <span className="text-xl font-black text-accent dark:text-darkaccent">{candidateResult.matchPercentage}%</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-background dark:bg-darkbg border border-border/60 dark:border-darkborder/50 text-center">
                                  <Caption className="font-bold uppercase block mb-0.5 text-secondary dark:text-darkmuted">Recommendation</Caption>
                                  <span className={`text-xs font-bold block mt-1 ${
                                    candidateResult.recommendation === 'Strong Hire' || candidateResult.recommendation === 'Hire'
                                      ? 'text-success'
                                      : candidateResult.recommendation === 'Maybe'
                                      ? 'text-warning'
                                      : 'text-danger'
                                  }`}>{candidateResult.recommendation}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-background dark:bg-darkbg border border-border/60 dark:border-darkborder/50 text-center">
                                  <Caption className="font-bold uppercase block mb-0.5 text-secondary dark:text-darkmuted">GitHub Commits</Caption>
                                  <span className="text-xl font-black text-primary dark:text-white">{candidateResult.githubAnalysis?.totalCommits ?? 0}</span>
                                </div>
                              </div>

                              <div>
                                <Caption className="font-bold uppercase tracking-wider block mb-2.5 text-secondary dark:text-darkmuted">Requirements Heatmap Coverage</Caption>
                                {candidateResult.skillGap && <SkillHeatmap skillGap={candidateResult.skillGap} />}
                              </div>

                              <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-darkbg/30 border border-border dark:border-darkborder/50">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <BrainCircuit className="h-4.5 w-4.5 text-accent dark:text-darkaccent" />
                                  <span className="text-xs font-bold text-primary dark:text-white">Explainable Decision Reasoning</span>
                                </div>
                                <div className="space-y-1.5 text-xs text-secondary dark:text-darkmuted leading-relaxed">
                                  {candidateResult.explanation?.map((item: string, index: number) => (
                                    <p key={index} className="flex items-start gap-1.5">
                                      <span className="text-accent dark:text-darkaccent mt-0.5">•</span>
                                      <span>{item}</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Apply guidance reminder */}
                        {!hasApplied && !resumeId && (
                          <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40">
                            Please upload your resume in the left panel to apply to this vacancy.
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
