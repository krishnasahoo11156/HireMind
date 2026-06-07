import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ArrowRight, BriefcaseBusiness, Sparkles, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useJobs, useMyApplications } from '../../hooks/queries';
import type { Job, Application } from '../../types';
import { Badge, Button, Card, SectionHeader, DisplayTitle, SectionTitle, CardTitle, BodyText, Caption } from '../../components/ui';
import { useCandidateAuth } from '../../firebase/AuthContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function CandidateDashboard() {
  const { user, firebaseUser } = useCandidateAuth();
  const jobsQuery = useJobs();
  const myAppsQuery = useMyApplications();

  const activeJobs = jobsQuery.data?.jobs ?? [];
  const applications = myAppsQuery.data?.applications ?? [];

  const [realtimeApplications, setRealtimeApplications] = useState<Application[]>([]);
  const [hasLoadedRealtime, setHasLoadedRealtime] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: string; delay: string; color: string; size: string }>>([]);

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, 'applications'),
      where('candidateId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Application[] = [];
      snapshot.forEach((doc) => {
        list.push({ _id: doc.id, ...doc.data() } as Application);
      });
      setRealtimeApplications(list);
      setHasLoadedRealtime(true);
    });

    return unsubscribe;
  }, [user?.id]);

  useEffect(() => {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f43f5e'];
    const list = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: `${Math.random() * 6 + 6}px`
    }));
    setConfetti(list);
  }, []);

  const displayApps = hasLoadedRealtime ? realtimeApplications : applications;
  const selectedApplications = displayApps.filter((app) => app.status === 'Selected');

  const notifications = [];

  if (!user?.linkedinUrl) {
    notifications.push({
      id: 'linkedin',
      type: 'warning',
      title: 'LinkedIn Disconnected',
      message: 'Connect your LinkedIn profile to improve search matches and let recruiters verify your history.',
      actionLabel: 'Connect LinkedIn',
      link: '/candidate/profile'
    });
  }

  if (!user?.githubUrl) {
    notifications.push({
      id: 'github',
      type: 'info',
      title: 'GitHub Disconnected',
      message: 'Showcase your coding contributions and repositories by linking your GitHub profile.',
      actionLabel: 'Link GitHub',
      link: '/candidate/profile'
    });
  }

  if (!user?.leetcodeUsername) {
    notifications.push({
      id: 'leetcode',
      type: 'info',
      title: 'LeetCode Disconnected',
      message: 'Showcase your algorithmic challenge score and rating by connecting your LeetCode account.',
      actionLabel: 'Link LeetCode',
      link: '/candidate/profile'
    });
  }

  // Google provider check
  const isGoogleLinked = firebaseUser?.providerData?.some((p) => p.providerId === 'google.com');
  if (!isGoogleLinked) {
    notifications.push({
      id: 'google',
      type: 'security',
      title: 'Google Account Disconnected',
      message: 'Your Google sign-in is not connected. Enable single sign-on (SSO) for easy passwordless login.',
      actionLabel: 'Link Google Account',
      link: '/candidate/profile'
    });
  }

  // Phone number check
  if (!firebaseUser?.phoneNumber) {
    notifications.push({
      id: 'phone',
      type: 'warning',
      title: 'Contact Number Missing',
      message: 'No phone number linked to your profile. Please add your contact number for direct outreach and security alerts.',
      actionLabel: 'Add Phone Number',
      link: '/candidate/profile'
    });
  }
  
  // Calculate profile completeness based on actual user profile data in Firebase
  let fieldsFilled = 0;
  const totalFields = 5;
  if (user?.name) fieldsFilled++;
  if (user?.githubUrl) fieldsFilled++;
  if (user?.linkedinUrl) fieldsFilled++;
  if (user?.leetcodeUsername) fieldsFilled++;
  if (displayApps.length > 0) fieldsFilled++;
  const profileCompleteness = Math.round((fieldsFilled / totalFields) * 100);

  if (jobsQuery.isLoading || myAppsQuery.isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 bg-gray-200 dark:bg-darkborder rounded-2xl" />
        <div className="h-64 bg-gray-200 dark:bg-darkborder rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Congratulations Banner ── */}
      {selectedApplications.length > 0 && (
        <div className="space-y-4">
          {selectedApplications.map((app) => {
            const matchedJob = activeJobs.find((j) => j._id === app.jobId);
            return (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl border border-emerald-500/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/15 p-6 md:p-8 animate-congrats-gradient"
              >
                {/* Confetti decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {confetti.map((c) => (
                    <div
                      key={c.id}
                      className="floating-confetti"
                      style={{
                        left: c.left,
                        animationDelay: c.delay,
                        backgroundColor: c.color,
                        width: c.size,
                        height: c.size,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-pulse-ring">
                      <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Congratulations!
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-200 font-sans">
                      You have been selected as {matchedJob?.title || 'a Developer'}! 🎉
                    </h2>
                    <p className="text-sm text-emerald-800/80 dark:text-emerald-300/80 font-medium max-w-2xl leading-relaxed">
                      This particular recruiter has accepted your application. Congratulations on your selection! The hiring coordinator will reach out shortly with details.
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-full md:w-auto">
                    <Link to="/candidate/applications">
                      <Button variant="accent" size="lg" className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-500/25">
                        View Next Steps <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-border bg-gradient-to-br from-surface to-background p-6 dark:border-darkborder dark:from-darksurface dark:to-darkbg"
      >
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-secondary dark:text-darkmuted">
            <Sparkles className="h-4 w-4 text-accent dark:text-darkaccent" />
            Candidate Workspace
          </div>
          <DisplayTitle>
            {getGreeting()}, {user?.name || 'Candidate'} 👋
          </DisplayTitle>
          <BodyText variant="large" color="secondary">
            Track your applications in real-time, explore explainable AI-backed matching, and manage your developer credentials.
          </BodyText>
          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Resume active
            </div>
            {user?.githubUrl || user?.leetcodeUsername ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-accent dark:text-darkaccent">
                <CheckCircle className="h-4 w-4" />
                {user?.githubUrl ? 'GitHub' : ''}{user?.githubUrl && user?.leetcodeUsername ? ' & ' : ''}{user?.leetcodeUsername ? 'LeetCode' : ''} Linked
              </div>
            ) : null}
          </div>
        </div>

        {/* Profile Completeness Gauge */}
        <div className="flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-border dark:border-darkborder p-4">
          <div className="relative flex items-center justify-center">
            {/* Circle gauge */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-gray-200 dark:stroke-darkborder"
                strokeWidth="8"
                fill="transparent"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-accent dark:stroke-darkaccent"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * profileCompleteness) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <span className="absolute text-xl font-bold text-primary dark:text-darktext">{profileCompleteness}%</span>
          </div>
          <p className="mt-3 text-xs font-bold text-primary dark:text-darktext">Profile Completeness</p>
          <Link to="/candidate/profile" className="mt-1.5 text-xs text-accent hover:underline dark:text-darkaccent">
            Complete details
          </Link>
        </div>
      </motion.div>

      {/* ── Action Center / Notifications Section ── */}
      {notifications.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            title={`Action Center (${notifications.length} recommendation${notifications.length > 1 ? 's' : ''})`}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.map((notif) => {
              let iconColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
              let borderColor = 'border-amber-500/20';
              if (notif.type === 'info') {
                iconColor = 'text-accent bg-accent/10 dark:bg-darkaccent/10';
                borderColor = 'border-accent/20';
              } else if (notif.type === 'security') {
                iconColor = 'text-rose-500 bg-rose-50 dark:bg-rose-950/20';
                borderColor = 'border-rose-500/20';
              }
              
              return (
                <Card key={notif.id} className={`p-4 flex flex-col justify-between gap-4 border ${borderColor}`}>
                  <div className="flex gap-3 items-start">
                    <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${iconColor}`}>
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-sm">{notif.title}</CardTitle>
                      <BodyText variant="small" color="secondary" className="leading-relaxed">
                        {notif.message}
                      </BodyText>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1 border-t border-border/50 dark:border-darkborder/50">
                    <Link to={notif.link}>
                      <Button variant="ghost" size="sm" className="text-xs text-accent dark:text-darkaccent hover:underline px-2 h-8">
                        {notif.actionLabel} <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active Applications Strip ── */}
      {displayApps.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            title="Your Applications"
            action={
              <Link to="/candidate/applications" className="flex items-center gap-1 text-sm font-medium text-accent dark:text-darkaccent hover:underline">
                Track Applications <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="grid grid-cols-1 gap-4">
            {displayApps.map((app) => {
              const matchedJob = activeJobs.find((j) => j._id === app.jobId);
              return (
                <Card key={app._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{matchedJob?.title || 'Frontend Developer'}</CardTitle>
                      <BodyText variant="small" color="secondary">
                        Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </BodyText>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-secondary dark:text-darkmuted block">Status</span>
                      <Badge tone={app.status === 'Selected' ? 'green' : app.status === 'Rejected' ? 'red' : 'emerald'}>
                        {app.status}
                      </Badge>
                    </div>
                    <Link to="/candidate/applications">
                      <Button variant="secondary" size="sm">
                        View Tracker
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
