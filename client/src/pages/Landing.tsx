import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Code,
  Award,
  Sparkles,
  Eye,
  EyeOff,
  ChevronRight,
  Play,
  Quote,
  Check,
  Calendar,
  ChevronLeft,
  Users,
  ShieldAlert,
  Settings,
  Mail,
  User,
  Activity,
  Layers,
  MapPin,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Button, Badge, Card, ScoreBar, DisplayTitle, PageTitleText, SectionTitle, CardTitle, BodyText, Caption, Meta } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../firebase/AuthContext';

// ─────────────────────────────────────────────
// TYPES & MOCK DATA FOR INTERACTIVE FEATURES
// ─────────────────────────────────────────────
interface MockCandidate {
  id: string;
  name: string;
  blindId: string;
  email: string;
  role: string;
  score: number;
  match: number;
  recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject';
  avatar: string;
  skills: { name: string; status: 'match' | 'partial' | 'missing' }[];
  explanation: string;
  stage: 'Applied' | 'Tech Review' | 'Interview' | 'Offer';
}

const mockCandidates: MockCandidate[] = [
  {
    id: 'cand_1',
    name: 'Sarah Chen',
    blindId: 'Candidate-SCHN',
    email: 'sarah.chen@example.com',
    role: 'Frontend Engineer',
    score: 91,
    match: 94,
    recommendation: 'Strong Hire',
    avatar: 'SC',
    skills: [
      { name: 'React', status: 'match' },
      { name: 'TypeScript', status: 'match' },
      { name: 'Redux', status: 'match' },
      { name: 'Next.js', status: 'partial' },
      { name: 'TailwindCSS', status: 'match' }
    ],
    explanation: 'Sarah’s React & TypeScript project portfolio aligns perfectly. Her GitHub activity shows strong open source collaboration and solid contest performance.',
    stage: 'Interview'
  },
  {
    id: 'cand_2',
    name: 'Alex Rodriguez',
    blindId: 'Candidate-AROD',
    email: 'alex.rod@example.com',
    role: 'Full Stack Engineer',
    score: 85,
    match: 89,
    recommendation: 'Hire',
    avatar: 'AR',
    skills: [
      { name: 'React', status: 'match' },
      { name: 'TypeScript', status: 'match' },
      { name: 'Redux', status: 'missing' },
      { name: 'Next.js', status: 'match' },
      { name: 'TailwindCSS', status: 'partial' }
    ],
    explanation: 'Alex demonstrates robust full-stack skills with several TypeScript & Next.js applications, though state-management depth (Redux) is currently unverified.',
    stage: 'Tech Review'
  },
  {
    id: 'cand_3',
    name: 'Rahul Patel',
    blindId: 'Candidate-RPAT',
    email: 'rahul.patel@example.com',
    role: 'Frontend Developer',
    score: 79,
    match: 82,
    recommendation: 'Maybe',
    avatar: 'RP',
    skills: [
      { name: 'React', status: 'match' },
      { name: 'TypeScript', status: 'missing' },
      { name: 'Redux', status: 'missing' },
      { name: 'Next.js', status: 'missing' },
      { name: 'TailwindCSS', status: 'match' }
    ],
    explanation: 'Rahul has good foundational CSS & React skills but lacks the required TypeScript and advanced state management experience specified in the JD.',
    stage: 'Applied'
  }
];

export default function Landing() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = user !== null;
  
  const handleGoToDashboard = () => {
    if (user?.role === 'candidate') {
      navigate('/candidate/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Responsive mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Demo interactive states
  const [blindMode, setBlindMode] = useState(false);
  const [activeTabCandidate, setActiveTabCandidate] = useState<string>('cand_1');
  const [kanbanCandidates, setKanbanCandidates] = useState<MockCandidate[]>(mockCandidates);
  const [demoStep, setDemoStep] = useState<number>(0);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Floating notifications simulation
  const [notifications, setNotifications] = useState<string[]>([]);
  useEffect(() => {
    const alerts = [
      '📥 Resume uploaded: sarah-chen-resume.pdf',
      '✨ AI Scored: Sarah Chen matched 94% for Frontend Developer',
      '🔍 GitHub analysed: 42 repos, 180 stars found for sarahchen-dev',
      '📥 Resume uploaded: alex-rod-resume.pdf',
      '✨ AI Scored: Alex Rodriguez matched 89% for Frontend Developer',
      '💡 Match explanation generated for Candidate-AROD'
    ];
    let index = 0;
    const interval = setInterval(() => {
      setNotifications((prev) => {
        const next = [alerts[index], ...prev].slice(0, 3);
        index = (index + 1) % alerts.length;
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceCandidate = () => {
    setKanbanCandidates((prev) =>
      prev.map((c) => {
        if (c.id === 'cand_1') {
          const stages: MockCandidate['stage'][] = ['Applied', 'Tech Review', 'Interview', 'Offer'];
          const nextIdx = (stages.indexOf(c.stage) + 1) % stages.length;
          return { ...c, stage: stages[nextIdx] };
        }
        return c;
      })
    );
  };

  const handleBookDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) return;
    setBookingConfirmed(true);
    setTimeout(() => {
      setShowDemoModal(false);
      setBookingConfirmed(false);
      setBookingDate('');
    }, 2500);
  };

  const selectedCandidateData = mockCandidates.find(c => c.id === activeTabCandidate) || mockCandidates[0];

  return (
    <div className="min-h-screen bg-background text-primary dark:bg-darkbg dark:text-darktext selection:bg-accent/20 transition-colors duration-300">
      
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-surface/85 backdrop-blur-md dark:border-darkborder/50 dark:bg-darksurface/85">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Logo monogram */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-100 dark:to-neutral-200 border border-transparent shadow-sm">
              <svg className="h-5 w-5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="30" y1="75" x2="30" y2="25" stroke={theme === 'dark' ? 'black' : 'white'} strokeWidth="6" strokeLinecap="round" />
                <line x1="70" y1="75" x2="70" y2="25" stroke={theme === 'dark' ? 'black' : 'white'} strokeWidth="6" strokeLinecap="round" />
                <line x1="30" y1="50" x2="70" y2="50" stroke={theme === 'dark' ? 'black' : 'white'} strokeWidth="6" strokeLinecap="round" />
                <circle cx="30" cy="25" r="7" fill={theme === 'dark' ? 'black' : 'white'} />
                <circle cx="30" cy="75" r="7" fill={theme === 'dark' ? 'black' : 'white'} />
                <circle cx="70" cy="25" r="7" fill={theme === 'dark' ? 'black' : 'white'} />
                <circle cx="70" cy="75" r="7" fill={theme === 'dark' ? 'black' : 'white'} />
                <circle cx="50" cy="50" r="8.5" fill={theme === 'dark' ? 'black' : 'white'} stroke={theme === 'dark' ? 'white' : 'black'} strokeWidth="2.5" />
              </svg>
            </div>
            <span className="font-sans text-xl font-extrabold tracking-[-0.03em]">HireMind</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-secondary dark:text-darkmuted">
            <a href="#features" className="hover:text-primary dark:hover:text-darktext transition-colors">Features</a>
            <a href="#paths" className="hover:text-primary dark:hover:text-darktext transition-colors">User Paths</a>
            <a href="#metrics" className="hover:text-primary dark:hover:text-darktext transition-colors">Performance</a>
            <a href="#testimonials" className="hover:text-primary dark:hover:text-darktext transition-colors">Testimonials</a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl border border-border bg-surface p-2 text-secondary hover:text-primary dark:border-darkborder dark:bg-darkbg dark:text-darkmuted dark:hover:text-darktext transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707-.707m12.728 0l-.707.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              ) : (
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {isAuthenticated ? (
              <Button onClick={handleGoToDashboard} variant="accent">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold hover:text-accent dark:hover:text-darkaccent transition-colors">Sign in</Link>
                <Button onClick={() => navigate('/register')} variant="primary">Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-xl border border-border bg-surface p-2 text-secondary dark:border-darkborder dark:bg-darkbg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute left-0 top-16 w-full border-b border-border bg-surface px-6 py-8 shadow-lg dark:border-darkborder dark:bg-darksurface md:hidden"
            >
              <nav className="flex flex-col gap-5 text-[15px] font-semibold text-secondary dark:text-darkmuted">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary dark:hover:text-darktext">Features</a>
                <a href="#paths" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary dark:hover:text-darktext">User Paths</a>
                <a href="#metrics" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary dark:hover:text-darktext">Performance</a>
                <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary dark:hover:text-darktext">Testimonials</a>
                <div className="h-px bg-border dark:bg-darkborder my-2" />
                
                {isAuthenticated ? (
                  <Button onClick={() => { setMobileMenuOpen(false); handleGoToDashboard(); }} variant="accent" className="w-full">
                    Go to Dashboard
                  </Button>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} variant="secondary" className="w-full">Sign in</Button>
                    <Button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} variant="primary" className="w-full">Get Started</Button>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
        {/* Subtle grid background */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#232936_1px,transparent_1px),linear-gradient(to_bottom,#232936_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 dark:opacity-20" />
        
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-6">
              
              <h1 className="font-sans text-4xl sm:text-5xl lg:text-[48px] font-extrabold tracking-[-0.04em] leading-[1.1] text-primary dark:text-white">
                Explainable Hiring Intelligence<br />
                for Modern Tech Teams.
              </h1>
              
              <p className="text-[16px] leading-relaxed text-secondary dark:text-darkmuted max-w-lg mx-auto lg:mx-0 font-sans font-normal">
                Analyze resumes, inspect GitHub open-source contributions, evaluate LeetCode algorithms, and rank candidates with fully explainable AI decisions.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {isAuthenticated ? (
                  <Button onClick={handleGoToDashboard} variant="accent" size="lg" className="w-full sm:w-auto shadow-md">
                    Go to Dashboard
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/login')} variant="accent" size="lg" className="w-full sm:w-auto shadow-md shadow-accent/15">
                    Start Hiring
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Button>
                )}
                <Button onClick={() => navigate(isAuthenticated ? '/jobs' : '/login')} variant="secondary" size="lg" className="w-full sm:w-auto">
                  Explore Jobs
                </Button>
              </div>
            </div>

            {/* Hero Right Visual (Interactive ATS Mockup) */}
            <div className="lg:col-span-7 relative">
              <div className="relative mx-auto max-w-[620px] rounded-2xl border border-border/80 bg-white p-5 shadow-2xl dark:border-darkborder/60 dark:bg-darksurface transition-all duration-300">
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-border/80 dark:border-darkborder/60 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs font-semibold tracking-wide text-secondary dark:text-darkmuted uppercase">HireMind ATS · Active Listings</span>
                  </div>
                  <Badge tone="gold">Demo Mode</Badge>
                </div>

                {/* Main ATS grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Candidates rankings preview */}
                  <div className="md:col-span-7 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-secondary dark:text-darkmuted block mb-1">Ranked Candidates</span>
                    
                    {mockCandidates.map((c, idx) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background dark:border-darkborder/40 dark:bg-darkbg hover:-translate-y-0.5 transition-transform duration-200">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold block">{c.name}</span>
                            <span className="text-[10px] text-secondary dark:text-darkmuted">{c.role}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-accent dark:text-darkaccent">{c.match}% Fit</span>
                          <span className={`h-2 w-2 rounded-full ${c.match >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills gaps and notifications preview */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Interactive Heatmap mini card */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-background dark:border-darkborder/40 dark:bg-darkbg">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary dark:text-darkmuted block mb-2">Requirements Coverage</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="h-6 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200 flex items-center justify-center dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">React</div>
                        <div className="h-6 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200 flex items-center justify-center dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">TS</div>
                        <div className="h-6 rounded-md bg-red-50 text-[10px] font-bold text-red-700 border border-red-200 flex items-center justify-center dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40">Redux</div>
                      </div>
                      <span className="text-[9px] text-secondary dark:text-darkmuted block mt-1.5 text-center">2/3 core requirements matched</span>
                    </div>

                    {/* Live Tracker Stage Card */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-background dark:border-darkborder/40 dark:bg-darkbg">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary dark:text-darkmuted block mb-2">Hiring Pipeline Funnel</span>
                      <div className="flex gap-1 items-end h-14 justify-between px-1">
                        <div className="w-2.5 rounded-t bg-blue-500" style={{ height: '100%' }} />
                        <div className="w-2.5 rounded-t bg-violet-500" style={{ height: '75%' }} />
                        <div className="w-2.5 rounded-t bg-amber-500" style={{ height: '40%' }} />
                        <div className="w-2.5 rounded-t bg-orange-500" style={{ height: '20%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Notifications Panel */}
                <div className="absolute -bottom-6 -right-6 hidden sm:block w-[240px] rounded-xl border border-border bg-white p-3 shadow-xl dark:border-darkborder dark:bg-darksurface z-20">
                  <div className="flex items-center gap-2 border-b border-border/60 dark:border-darkborder/50 pb-1.5 mb-2">
                    <Activity className="h-3 w-3 text-accent dark:text-darkaccent" />
                    <span className="text-[10px] font-bold tracking-wide uppercase text-secondary dark:text-darkmuted">Platform Activity</span>
                  </div>
                  
                  <div className="space-y-2 h-[80px] overflow-hidden">
                    <AnimatePresence initial={false}>
                      {notifications.map((note, idx) => (
                        <motion.div
                          key={note}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.35 }}
                          className="text-[9px] font-semibold truncate text-secondary dark:text-darkmuted flex items-center gap-1.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-darkaccent flex-none" />
                          {note}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Left Floating Stat Card */}
                <div className="absolute -top-6 -left-6 hidden sm:block rounded-xl border border-border bg-white py-2 px-3 shadow-xl dark:border-darkborder dark:bg-darksurface z-20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">Model Accuracy</span>
                  <div className="flex items-center gap-1.5 mt-0.5 justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-accent dark:text-darkaccent" />
                    <span className="text-base font-black text-primary dark:text-white leading-none">95.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <section className="border-y border-border/60 bg-surface/40 py-8 dark:border-darkborder/50 dark:bg-darksurface/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-xs font-semibold uppercase tracking-[0.1em] text-secondary/70 dark:text-darkmuted/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent dark:text-darkaccent" />
              AI Resume Analysis
            </div>
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-accent dark:text-darkaccent" />
              GitHub Intelligence
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-accent dark:text-darkaccent" />
              LeetCode Assessment
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent dark:text-darkaccent" />
              Bias-Free Screening
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent dark:text-darkaccent" />
              Explainable AI Decisions
            </div>
          </div>
        </div>
      </section>

      {/* ── TWO USER PATHS SECTION ── */}
      <section id="paths" className="py-20 md:py-28 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-primary dark:text-white">One Platform. Two Workflows.</h2>
            <p className="text-secondary dark:text-darkmuted text-base">Whether you are an engineering candidate or a hiring manager, HireMind streamlines recruitment with real-time feedback loops and modern intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* For Candidates Path */}
            <div className="group relative rounded-2xl border border-border/80 bg-white p-8 dark:border-darkborder/60 dark:bg-darksurface shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/5 dark:bg-darkaccent/5 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="space-y-6">
                {/* Visual illustration of parsing code */}
                <div className="h-36 rounded-xl bg-background border border-border/60 dark:bg-darkbg dark:border-darkborder/50 flex flex-col justify-between p-4 overflow-hidden relative">
                  <div className="flex items-center justify-between border-b border-border/50 dark:border-darkborder/50 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Code className="h-4 w-4 text-accent dark:text-darkaccent" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">Skills Extractor</span>
                    </div>
                    <span className="text-[9px] text-green-600 dark:text-green-400 font-bold">● Running NLP Parser</span>
                  </div>
                  <div className="font-mono text-[10px] space-y-1.5 text-secondary dark:text-darkmuted flex-1 mt-2.5">
                    <div className="flex gap-1.5"><span className="text-accent dark:text-darkaccent font-bold">$</span> <span>parsing sarah_chen_portfolio.pdf...</span></div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">React</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">TypeScript</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">Next.js</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-accent dark:text-darkaccent uppercase tracking-wider">Candidate Ecosystem</span>
                  <h3 className="font-heading text-2xl font-bold tracking-tight">For Engineering Candidates</h3>
                  <p className="text-sm text-secondary dark:text-darkmuted leading-relaxed">Submit your resume and immediately link your coding profiles to demonstrate real-world development impact transparently.</p>
                </div>

                <ul className="space-y-2.5 text-sm font-semibold">
                  <li className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-accent dark:text-darkaccent" /> Browse opportunities matching your profile</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-accent dark:text-darkaccent" /> One-click applications via PDF/DOCX</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-accent dark:text-darkaccent" /> Live application status tracker dashboard</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-accent dark:text-darkaccent" /> Real-time status update notifications</li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Button onClick={() => navigate(isAuthenticated ? (user?.role === 'candidate' ? '/candidate/dashboard' : '/jobs') : '/login')} variant="secondary" className="w-full justify-between">
                  <span>Find Jobs</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* For Recruiters Path */}
            <div className="group relative rounded-2xl border border-border/80 bg-white p-8 dark:border-darkborder/60 dark:bg-darksurface shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/5 dark:bg-darkaccent/5 group-hover:scale-150 transition-transform duration-500" />

              <div className="space-y-6">
                {/* Visual illustration of radar evaluation weights */}
                <div className="h-36 rounded-xl bg-background border border-border/60 dark:bg-darkbg dark:border-darkborder/50 flex flex-col justify-between p-4 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border/50 dark:border-darkborder/50 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-accent dark:text-darkaccent" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">Weighted Candidate Score</span>
                    </div>
                    <span className="text-[9px] text-accent dark:text-darkaccent font-bold">Sum: 100%</span>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-secondary dark:text-darkmuted"><span>GitHub Weight</span> <span>50%</span></div>
                      <div className="h-1.5 w-full bg-border rounded-full dark:bg-darkborder"><div className="h-full bg-accent dark:bg-darkaccent rounded-full" style={{ width: '50%' }} /></div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-secondary dark:text-darkmuted"><span>LeetCode Weight</span> <span>30%</span></div>
                      <div className="h-1.5 w-full bg-border rounded-full dark:bg-darkborder"><div className="h-full bg-accent dark:bg-darkaccent rounded-full" style={{ width: '30%' }} /></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-accent dark:text-darkaccent uppercase tracking-wider">Recruiter Ecosystem</span>
                  <h3 className="font-heading text-2xl font-bold tracking-tight">For Hiring Teams & Recruiters</h3>
                  <p className="text-sm text-secondary dark:text-darkmuted leading-relaxed">Configure job weights, run deep-dive match evaluations, and trace decisions using clean, explainable AI explanations.</p>
                </div>

                <ul className="space-y-2.5 text-sm font-semibold">
                  <li className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-accent dark:text-darkaccent" /> AI-powered resume & document screening</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-accent dark:text-darkaccent" /> Candidate matching and multi-profile ranking</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-accent dark:text-darkaccent" /> Real-time applicant upload notifications</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-accent dark:text-darkaccent" /> Full GitHub profile & LeetCode assessment</li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Button onClick={() => navigate(isAuthenticated ? (user?.role === 'candidate' ? '/candidate/dashboard' : '/dashboard') : '/login')} variant="accent" className="w-full justify-between shadow-sm shadow-accent/15">
                  <span>Start Hiring</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASE (Alternating Sections) ── */}
      <section id="features" className="py-20 md:py-28 bg-surface/30 dark:bg-darksurface/20 border-y border-border/60 dark:border-darkborder/50">
        <div className="mx-auto max-w-7xl px-6 space-y-28">
          
          {/* Showcase 1: Explainable AI Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold text-accent dark:text-darkaccent uppercase tracking-wider">Feature 01</span>
              <SectionTitle>Explainable AI Scoring & Match Reasoning</SectionTitle>
              <BodyText color="secondary" className="leading-relaxed">
                No black-box decisions. HireMind breaks down every candidate match score into clear strengths, key skill gaps, and a logical textual reasoning explanation so recruiters understand the "Why" behind the AI.
              </BodyText>
            </div>
            
            <div className="lg:col-span-7">
              <Card className="shadow-lg">
                <div className="flex items-center justify-between border-b border-border/60 dark:border-darkborder/50 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-white">🥇</span>
                    <span className="text-sm font-bold text-primary dark:text-darktext">Sarah Chen</span>
                    <span className="text-[10px] text-secondary dark:text-darkmuted">Frontend Developer Candidate</span>
                  </div>
                  <Badge tone="green">94% Fit</Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-secondary dark:text-darkmuted uppercase block mb-1">AI Recommendation Decision</span>
                    <div className="inline-block px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/40">Strong Hire</div>
                  </div>

                  <div className="p-4 rounded-xl bg-background dark:bg-darkbg border border-border/50 dark:border-darkborder/40">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-4 w-4 text-accent dark:text-darkaccent" />
                      <span className="text-xs font-bold text-primary dark:text-white">Gemini Decision Rationale</span>
                    </div>
                    <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed">
                      "Sarah Chen is ranked #1 because her 4 years of React and TypeScript experience directly exceed the JD requirements. GitHub activity is exceptionally strong with 47 commits in the last 30 days and 180 stars on key public repositories. LeetCode rating of 1820 supports dependable problem solving under pressure."
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Showcase 2: Skill Gap Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual Column */}
            <div className="lg:col-span-7 order-last lg:order-first">
              <Card className="shadow-lg">
                <div className="flex items-center justify-between border-b border-border/60 dark:border-darkborder/50 pb-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">Interactive Skill Matrix</span>
                  
                  {/* Candidate selector tabs */}
                  <div className="flex gap-1 bg-background p-1 rounded-lg dark:bg-darkbg">
                    {mockCandidates.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setActiveTabCandidate(c.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                          activeTabCandidate === c.id 
                            ? 'bg-white text-primary shadow-sm dark:bg-darksurface dark:text-white' 
                            : 'text-secondary dark:text-darkmuted hover:text-primary'
                        }`}
                      >
                        {c.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-secondary dark:text-darkmuted px-1">
                    <span>Target Job: Frontend Engineer</span>
                    <span>Overall Coverage: {selectedCandidateData.match}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedCandidateData.skills.map((skill) => (
                      <div
                        key={skill.name}
                        className={`flex flex-col gap-1 p-3 rounded-xl border ${
                          skill.status === 'match'
                            ? 'hm-heat-match'
                            : skill.status === 'partial'
                            ? 'hm-heat-partial'
                            : 'hm-heat-missing'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate">{skill.name}</span>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            skill.status === 'match' ? 'bg-emerald-500' : skill.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                        </div>
                        <span className="text-[9px] opacity-80">
                          {skill.status === 'match' ? 'Strong Match' : skill.status === 'partial' ? 'Partial' : 'Missing'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold text-accent dark:text-darkaccent uppercase tracking-wider">Feature 02</span>
              <SectionTitle>Interactive Skill Gap Heatmap</SectionTitle>
              <BodyText color="secondary" className="leading-relaxed">
                Compare candidate technical stacks side-by-side against job requirements. Color-coded evaluation cells instantly highlight direct matches, partial alignments, and missing requirements, saving hours of manual resume scrubbing.
              </BodyText>
            </div>
          </div>

          {/* Showcase 3: Blind Screening */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold text-accent dark:text-darkaccent uppercase tracking-wider">Feature 03</span>
              <SectionTitle>Bias-Free Blind Screening</SectionTitle>
              <BodyText color="secondary" className="leading-relaxed">
                Remove unconscious bias from your early screening stages. With a single click, toggle Blind Mode to redact candidate names, profile avatars, and contact details, replacing them with anonymous identifiers while keeping score and skill matching intact.
              </BodyText>
              
              {/* Interactive toggle control */}
              <div className="pt-2">
                <Button
                  onClick={() => setBlindMode(!blindMode)}
                  variant="secondary"
                >
                  {blindMode ? <Eye className="h-4.5 w-4.5 text-accent dark:text-darkaccent" /> : <EyeOff className="h-4.5 w-4.5 text-accent dark:text-darkaccent" />}
                  <span>{blindMode ? 'Disable Blind Mode' : 'Enable Blind Mode'}</span>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <Card className="shadow-lg">
                <div className="flex items-center justify-between border-b border-border/60 dark:border-darkborder/50 pb-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">Screening Profile Preview</span>
                  <Badge tone={blindMode ? 'gold' : 'blue'}>{blindMode ? 'Blind Mode Active' : 'Standard View'}</Badge>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-background dark:bg-darkbg border border-border/50 dark:border-darkborder/40 transition-all duration-300">
                  {/* Animated Avatar / Blind Icon */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center text-white font-bold shadow-sm transition-all duration-300">
                    {blindMode ? '??' : 'SC'}
                  </div>

                  <div className="space-y-1">
                    <div className="text-base font-extrabold text-primary dark:text-darktext">
                      {blindMode ? 'Candidate-SCHN' : 'Sarah Chen'}
                    </div>
                    <div className="text-xs text-secondary dark:text-darkmuted font-semibold">
                      {blindMode ? 'Redacted for bias-free evaluation' : 'sarah.chen@example.com'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-background dark:bg-darkbg border border-border/50 dark:border-darkborder/40 text-center">
                    <span className="text-[10px] font-bold text-secondary dark:text-darkmuted uppercase block mb-1">AI Match Score</span>
                    <span className="text-2xl font-black text-accent dark:text-darkaccent">94%</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background dark:bg-darkbg border border-border/50 dark:border-darkborder/40 text-center">
                    <span className="text-[10px] font-bold text-secondary dark:text-darkmuted uppercase block mb-1">Recommendation</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-1">Strong Hire</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Showcase 4: Real-Time Hiring Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual Column */}
            <div className="lg:col-span-7 order-last lg:order-first">
              <Card className="shadow-lg">
                <div className="flex items-center justify-between border-b border-border/60 dark:border-darkborder/50 pb-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary dark:text-darkmuted">Pipeline Board</span>
                  <Button
                    onClick={handleAdvanceCandidate}
                    variant="secondary"
                    size="sm"
                  >
                    <Play className="h-3 w-3 fill-accent stroke-none dark:fill-darkaccent" />
                    Advance Candidate
                  </Button>
                </div>

                {/* Pipeline columns */}
                <div className="grid grid-cols-4 gap-3">
                  {(['Applied', 'Tech Review', 'Interview', 'Offer'] as const).map((stage) => (
                    <div key={stage} className="space-y-3 p-2 rounded-xl bg-background dark:bg-darkbg/50 border border-border/30 dark:border-darkborder/20">
                      <div className="flex items-center justify-between text-[9px] font-bold text-secondary dark:text-darkmuted px-1 border-b border-border/20 dark:border-darkborder/10 pb-1">
                        <span>{stage}</span>
                        <span>{kanbanCandidates.filter((c) => c.stage === stage).length}</span>
                      </div>

                      <div className="space-y-2 h-36 relative">
                        <AnimatePresence>
                          {kanbanCandidates
                            .filter((c) => c.stage === stage)
                            .map((c) => (
                              <motion.div
                                key={c.id}
                                layoutId={c.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                className="p-2 rounded-lg bg-surface border border-border/60 dark:border-darkborder/40 dark:bg-darksurface shadow-sm text-left cursor-grab"
                              >
                                <span className="text-[9px] font-bold truncate block text-primary dark:text-darktext">{c.name}</span>
                                <div className="flex items-center justify-between mt-1 text-[8px] font-semibold text-accent dark:text-darkaccent">
                                  <span>{c.match}% match</span>
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                </div>
                              </motion.div>
                            ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold text-accent dark:text-darkaccent uppercase tracking-wider">Feature 04</span>
              <SectionTitle>Real-Time Hiring Pipeline Kanban</SectionTitle>
              <BodyText color="secondary" className="leading-relaxed">
                Automated applicant progression tracking. Drag and drop candidate cards or allow AI to auto-advance candidates through columns based on real-time parsed details and scoring evaluations.
              </BodyText>
            </div>
          </div>

        </div>
      </section>

      {/* ── METRICS SECTION ── */}
      <section id="metrics" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Card hover className="p-8 text-center space-y-2">
              <p className="font-heading text-5xl font-black text-accent dark:text-darkaccent leading-none tracking-tight">95%</p>
              <p className="text-sm font-bold text-primary dark:text-white">Screening Accuracy</p>
              <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed">Validated against recruiter hiring decisions and feedback overrides.</p>
            </Card>

            <Card hover className="p-8 text-center space-y-2">
              <p className="font-heading text-5xl font-black text-accent dark:text-darkaccent leading-none tracking-tight">10x</p>
              <p className="text-sm font-bold text-primary dark:text-white">Faster Hiring</p>
              <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed">Accelerating screening times from weeks to minutes in batches.</p>
            </Card>

            <Card hover className="p-8 text-center space-y-2">
              <p className="font-heading text-5xl font-black text-accent dark:text-darkaccent leading-none tracking-tight">70%</p>
              <p className="text-sm font-bold text-primary dark:text-white">Time Saved</p>
              <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed">Automated parsing and GitHub summaries eliminate manual reviews.</p>
            </Card>

            <Card hover className="p-8 text-center space-y-2">
              <p className="font-heading text-5xl font-black text-accent dark:text-darkaccent leading-none tracking-tight">100%</p>
              <p className="text-sm font-bold text-primary dark:text-white">Transparent Decisions</p>
              <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed">No black box scoring; full reasoning summaries provided for all profiles.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL SECTION ── */}
      <section id="testimonials" className="py-20 md:py-28 bg-surface/30 dark:bg-darksurface/20 border-y border-border/60 dark:border-darkborder/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <PageTitleText as="h2" className="text-center">What Hiring Teams Say</PageTitleText>
            <p className="text-secondary dark:text-darkmuted text-base">Loved by scale-up and enterprise recruiting teams globally.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hover className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <Quote className="h-7 w-7 text-accent/25 dark:text-darkaccent/25 mb-4" />
                <p className="text-sm text-secondary dark:text-darkmuted italic leading-relaxed">
                  We migrated from basic keyword parsers to HireMind and saved weeks of screening time. The GitHub integration and LeetCode scoring give us high-fidelity signals before we even hop on a call.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/60 dark:border-darkborder/50">
                <div className="h-9 w-9 rounded-full bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent flex items-center justify-center font-bold text-xs">MK</div>
                <div>
                  <span className="text-xs font-bold block text-primary dark:text-darktext">Maya Kapoor</span>
                  <span className="text-[10px] text-secondary dark:text-darkmuted uppercase font-semibold tracking-wider">VP of Talent, Acme Corp</span>
                </div>
              </div>
            </Card>

            <Card hover className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <Quote className="h-7 w-7 text-accent/25 dark:text-darkaccent/25 mb-4" />
                <p className="text-sm text-secondary dark:text-darkmuted italic leading-relaxed">
                  The blind screening toggle is revolutionary for our DEI audits. It completely filters out unnecessary demographics during early resumes triage, letting candidates shine purely based on their technical credentials.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/60 dark:border-darkborder/50">
                <div className="h-9 w-9 rounded-full bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent flex items-center justify-center font-bold text-xs">JH</div>
                <div>
                  <span className="text-xs font-bold block text-primary dark:text-darktext">Jason Harris</span>
                  <span className="text-[10px] text-secondary dark:text-darkmuted uppercase font-semibold tracking-wider">Head of Engineering, Velo Systems</span>
                </div>
              </div>
            </Card>

            <Card hover className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <Quote className="h-7 w-7 text-accent/25 dark:text-darkaccent/25 mb-4" />
                <p className="text-sm text-secondary dark:text-darkmuted italic leading-relaxed">
                  The typewriter match explanations from Gemini have changed the way we align with our recruiters. Instead of just seeing a fit score, we understand exactly which skills are matched and what needs further probing.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/60 dark:border-darkborder/50">
                <div className="h-9 w-9 rounded-full bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent flex items-center justify-center font-bold text-xs">SD</div>
                <div>
                  <span className="text-xs font-bold block text-primary dark:text-darktext">Samantha Davis</span>
                  <span className="text-[10px] text-secondary dark:text-darkmuted uppercase font-semibold tracking-wider">Lead Recruiter, CloudScale</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 md:py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_400px_at_50%_150px,#C88908,transparent)] opacity-10 dark:opacity-5" />
        
        <div className="mx-auto max-w-4xl px-6 space-y-8">
          <PageTitleText as="h2" className="text-center">
            Build Better Teams With AI.
          </PageTitleText>
          <p className="text-secondary dark:text-darkmuted text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Unlock explainable recruiting intelligence and parse technical candidates instantly with structured scoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')} variant="accent" size="lg" className="w-full sm:w-auto shadow-md">
              Get Started
            </Button>
            <Button onClick={() => setShowDemoModal(true)} variant="secondary" size="lg" className="w-full sm:w-auto">
              Book Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/60 bg-surface/50 py-12 dark:border-darkborder/50 dark:bg-darksurface/30 text-xs text-secondary/80 dark:text-darkmuted/70">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black tracking-tight text-primary dark:text-white">HireMind</span>
            <span>· Explainable AI Recruitment Systems</span>
          </div>
          <div>
            <span>© 2026 HireMind. Built for the modern developer pipeline.</span>
          </div>
        </div>
      </footer>

      {/* ── BOOK DEMO MODAL ── */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm dark:bg-black/50"
            />
            
            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl dark:border-darkborder dark:bg-darksurface z-10"
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-secondary hover:bg-gray-100 hover:text-primary dark:text-darkmuted dark:hover:bg-darkborder dark:hover:text-darktext"
                aria-label="Close modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent dark:text-darkaccent">
                  <Calendar className="h-5 w-5" />
                  <span className="font-heading text-lg font-bold">Schedule an ATS Demonstration</span>
                </div>
                <p className="text-xs text-secondary dark:text-darkmuted">
                  Choose a date for a 15-minute screen-share tour with one of our AI recruitment specialists.
                </p>

                {bookingConfirmed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-center space-y-2 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40"
                  >
                    <Check className="h-6.5 w-6.5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold">Demonstration Scheduled!</p>
                    <p className="text-xs">We have sent a calendar invite with the meeting details.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleBookDemo} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-secondary dark:text-darkmuted uppercase block">Preferred Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="hm-input w-full"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-secondary dark:text-darkmuted uppercase block">Your Corporate Email</label>
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        className="hm-input w-full"
                      />
                    </div>
                    <Button type="submit" variant="accent" className="w-full shadow-sm mt-2">
                      Confirm Demo Booking
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
