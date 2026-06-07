import { useEffect, useState, useRef } from 'react';
import { io as connectSocket, Socket } from 'socket.io-client';
import { BriefcaseBusiness, CheckCircle, Clock, Sparkles, BrainCircuit, Bell, Shield, ArrowRight, Star, X } from 'lucide-react';
import { useJobs, useMyApplications } from '../../hooks/queries';
import { useCandidateAuth } from '../../firebase/AuthContext';
import type { Application, Job } from '../../types';
import { Badge, Card, PageTitle, SectionTitle, BodyText, Caption, CardTitle } from '../../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

// Toast Notification Type
interface Toast {
  id: string;
  message: string;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5001');

const ALL_STAGES = [
  { key: 'Applied', label: 'Applied', desc: 'Application received and registered.' },
  { key: 'Resume Parsed', label: 'Resume Parsed', desc: 'AI successfully extracted skills, education, and career details.' },
  { key: 'AI Analysis', label: 'AI Analysis', desc: 'Gemini AI running evaluation on skills match, GitHub signals, and algorithmic solve rates.' },
  { key: 'Under Review', label: 'Under Review', desc: 'Awaiting recruiter screening and manual override verification.' }
];

export function CandidateApplications() {
  const { user } = useCandidateAuth();
  const userId = user?.id ?? 'user_demo';

  const { data: myApps, refetch: refetchApps } = useMyApplications();
  const { data: allJobs } = useJobs();

  const applications = myApps?.applications ?? [];
  const jobs = allJobs?.jobs ?? [];

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Set default selected application on load
  useEffect(() => {
    if (applications.length > 0 && !selectedAppId) {
      setSelectedAppId(applications[0]._id);
      setSelectedApp(applications[0]);
    } else if (selectedAppId) {
      const found = applications.find((a) => a._id === selectedAppId);
      if (found) setSelectedApp(found);
    }
  }, [applications, selectedAppId]);

  // Set up WebSocket connection for real-time tracker updates
  useEffect(() => {
    if (!userId) return;

    const socket: Socket = connectSocket(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[tracker-socket] Connected. Joining candidate room: candidate:${userId}`);
      socket.emit('join_candidate', userId);
    });

    socket.on('tracker:update', (data: { applicationId: string; status: any; aiScore?: number; recommendation?: string; updatedAt: string }) => {
      console.log('[tracker-socket] Received update:', data);
      
      // Update selected application state immediately
      setSelectedApp((prev) => {
        if (prev && prev._id === data.applicationId) {
          return {
            ...prev,
            status: data.status,
            aiScore: data.aiScore !== undefined ? data.aiScore : prev.aiScore,
            recommendation: data.recommendation !== undefined ? data.recommendation : prev.recommendation,
            updatedAt: data.updatedAt
          };
        }
        return prev;
      });

      // Refetch full list
      refetchApps();
    });

    socket.on('notification:new', (data: { message: string }) => {
      console.log('[tracker-socket] Received notification:', data);
      // Trigger toast message
      const toastId = Math.random().toString();
      setToasts((prev) => [...prev, { id: toastId, message: data.message }]);
      
      // Auto close toast
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);
    });

    return () => {
      socket.emit('leave_candidate', userId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, refetchApps]);

  const selectApp = (app: Application) => {
    setSelectedAppId(app._id);
    setSelectedApp(app);
  };

  const getJobForApp = (jobId: string) => {
    return jobs.find((j) => j._id === jobId);
  };

  // Logic to determine stage state (completed, active, pending)
  const getStageState = (stageKey: string, currentStatus: string) => {
    const statusPriority = ['Applied', 'Resume Parsed', 'AI Analysis', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];
    const currentIdx = statusPriority.indexOf(currentStatus);
    const stageIdx = statusPriority.indexOf(stageKey);

    if (currentStatus === 'Rejected' && stageKey === 'Under Review') {
      return 'completed';
    }

    if (currentStatus === 'Rejected' && stageIdx > currentIdx) {
      return 'pending';
    }

    if (stageIdx < currentIdx) {
      return 'completed';
    } else if (stageIdx === currentIdx) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  return (
    <div className="space-y-6 relative">
      <PageTitle
        title="Application Status Tracker"
        subtitle="View live pipeline stages and explainable match statistics for your submissions."
      />

      {/* Live Toasts Container */}
      <div className="fixed top-6 right-6 z-50 space-y-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-surface/95 dark:bg-darksurface/95 shadow-xl p-4 backdrop-blur-md"
            >
              <Bell className="h-5 w-5 text-emerald-500 flex-shrink-0 animate-bounce" />
              <div className="text-sm font-semibold text-primary dark:text-darktext">
                {t.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {applications.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <BriefcaseBusiness className="h-12 w-12 text-secondary mx-auto" />
          <CardTitle>No applications found</CardTitle>
          <BodyText>You haven't applied to any job listings yet.</BodyText>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Applications list */}
          <div className="space-y-4">
            <SectionTitle>Your Applications</SectionTitle>
            <div className="space-y-3">
              {applications.map((app) => {
                const job = getJobForApp(app.jobId);
                const isSelected = app._id === selectedAppId;
                return (
                  <div
                    key={app._id}
                    onClick={() => selectApp(app)}
                    className="w-full text-left"
                  >
                    <Card
                      hover
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-accent dark:border-darkaccent bg-accent/5 dark:bg-darkaccent/5'
                          : 'border-border dark:border-darkborder'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-primary dark:text-darktext">
                            {job?.title || 'Frontend Developer'}
                          </h4>
                          <Caption className="mt-1 block">Applied: {new Date(app.appliedAt).toLocaleDateString()}</Caption>
                        </div>
                        <Badge tone={app.status === 'Selected' ? 'green' : app.status === 'Rejected' ? 'red' : 'emerald'}>
                          {app.status}
                        </Badge>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Application Tracker View */}
          <div className="lg:col-span-2">
            {selectedApp && (
              <div className="space-y-6">
                <Card className="p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-border pb-4 dark:border-darkborder">
                    <div>
                      <CardTitle>
                        {getJobForApp(selectedApp.jobId)?.title || 'Frontend Developer'}
                      </CardTitle>
                      <Caption className="mt-1 block">Application ID: {selectedApp._id}</Caption>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-secondary dark:text-darkmuted block font-semibold">Active Status</span>
                      <Badge tone={selectedApp.status === 'Selected' ? 'green' : selectedApp.status === 'Rejected' ? 'red' : 'emerald'}>
                        {selectedApp.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Selected / Rejected Banners */}
                  {selectedApp.status === 'Selected' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2"
                    >
                      <div className="flex items-center gap-2 text-base font-extrabold text-emerald-800 dark:text-emerald-400">
                        <Sparkles className="h-5 w-5 animate-pulse text-emerald-600 dark:text-emerald-400" />
                        Congratulations!
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed font-semibold">
                        This particular recruiter has accepted your application. Congratulations on your selection for the {getJobForApp(selectedApp.jobId)?.title || 'role'}! The hiring coordinator will reach out shortly with details.
                      </p>
                    </motion.div>
                  )}

                  {selectedApp.status === 'Rejected' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl border border-red-500/25 bg-red-500/5 p-5 space-y-2"
                    >
                      <div className="flex items-center gap-2 text-base font-extrabold text-red-800 dark:text-red-400">
                        <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                        Application Status Update
                      </div>
                      <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                        The recruiter has completed their evaluation for the {getJobForApp(selectedApp.jobId)?.title || 'role'}. While your application was not selected for this specific position, we will keep your profile on file for future opportunities.
                      </p>
                    </motion.div>
                  )}

                  {/* AI Scoring Summary Panel (Only visible once Under Review or further) */}
                  {['Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'].includes(selectedApp.status) && selectedApp.aiScore && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl border border-accent/25 dark:border-darkaccent/25 bg-gradient-to-br from-accent/5 to-yellow-600/5 dark:from-darkaccent/5 dark:to-yellow-950/5 p-4 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-accent dark:text-darkaccent">
                          <Sparkles className="h-4 w-4" />
                          AI Matching Complete
                        </div>
                        <p className="text-xs text-secondary dark:text-darkmuted">
                          Your profile has been matched against job requirements. AI Recommendation: <span className="font-bold text-primary dark:text-darktext">{selectedApp.recommendation}</span>.
                        </p>
                      </div>
                      <div className="text-center bg-surface dark:bg-darksurface rounded-xl px-4 py-2 border border-border dark:border-darkborder shadow-sm flex-shrink-0">
                        <div className="text-2xl font-extrabold text-primary dark:text-darktext tabular-nums">{selectedApp.aiScore}%</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-secondary dark:text-darkmuted">Match Score</div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Analysis Failed Banner */}
                  {selectedApp.analysisStatus === 'failed' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-red-500/25 bg-red-500/5 dark:border-red-950/40 p-4 space-y-1"
                    >
                      <div className="text-sm font-semibold text-danger">
                        AI Analysis Pipeline Failed
                      </div>
                      <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed">
                        An error occurred while running the AI matching models for your profile. The hiring manager has been notified and can trigger a retry.
                      </p>
                      {selectedApp.errorMessage && (
                        <p className="text-[11px] font-mono text-red-600 dark:text-red-400 mt-1">
                          Reason: {selectedApp.errorMessage}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Analysis Processing Banner */}
                  {(selectedApp.analysisStatus === 'parsing' || selectedApp.analysisStatus === 'analyzing' || selectedApp.analysisStatus === 'pending') && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:border-amber-950/40 p-4 space-y-2.5"
                    >
                      <div className="flex justify-between items-center text-sm font-semibold text-amber-600 dark:text-amber-400">
                        <span>Running AI Evaluation pipeline...</span>
                        <span className="tabular-nums">{selectedApp.progress ?? 10}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-darkborder rounded-full overflow-hidden">
                        <motion.div
                          className="h-1.5 bg-amber-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedApp.progress ?? 10}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed">
                        {selectedApp.analysisStatus === 'pending' && 'Application registered, preparing files...'}
                        {selectedApp.analysisStatus === 'parsing' && 'Extracting resume structure and text parsing...'}
                        {selectedApp.analysisStatus === 'analyzing' && 'Comparing skills match and social metrics against job details...'}
                      </p>
                    </motion.div>
                  )}

                  {/* Tracker Timeline */}
                  <div className="pt-4 space-y-6">
                    <Caption className="font-bold uppercase tracking-wider block">Progress Timeline</Caption>
                    <div className="relative pl-6 border-l border-gray-200 dark:border-darkborder space-y-6 ml-3">
                      {ALL_STAGES.map((s) => {
                        const state = getStageState(s.key, selectedApp.status);
                        return (
                          <div key={s.key} className="relative">
                            {/* Dot indicator */}
                            <div className="absolute -left-[31px] top-0.5">
                              {state === 'completed' ? (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </div>
                              ) : state === 'active' ? (
                                selectedApp.analysisStatus === 'failed' ? (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow">
                                    <X className="h-3.5 w-3.5" />
                                  </div>
                                ) : (
                                  <div className="relative flex h-5 w-5 items-center justify-center">
                                    <div className="absolute h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
                                    <div className="relative h-3.5 w-3.5 rounded-full bg-amber-500 border border-white dark:border-darkbg shadow" />
                                  </div>
                                )
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-gray-100 border-2 border-gray-300 dark:bg-darkbg dark:border-darkborder" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <h5 className={`text-sm font-bold ${
                                state === 'completed'
                                  ? 'text-primary dark:text-darktext'
                                  : state === 'active'
                                    ? selectedApp.analysisStatus === 'failed'
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-amber-600 dark:text-amber-400'
                                  : 'text-secondary dark:text-darkmuted'
                              }`}>
                                {s.label}
                              </h5>
                              <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed">
                                {s.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Recruiter Decisions Branch (Shortlisted, Interview, Selected, Rejected) */}
                      {['Shortlisted', 'Interview', 'Selected', 'Rejected'].includes(selectedApp.status) && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative"
                        >
                          <div className="absolute -left-[31px] top-0.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow">
                              <Star className="h-3.5 w-3.5 fill-white" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-accent dark:text-darkaccent">
                              {selectedApp.status === 'Shortlisted'
                                ? 'Shortlisted for Interview'
                                : selectedApp.status === 'Interview'
                                ? 'Interview Phase'
                                : selectedApp.status === 'Selected'
                                ? 'Final Selection & Offer'
                                : 'Application Completed'}
                            </h5>
                            <p className="text-xs text-secondary dark:text-darkmuted leading-relaxed">
                              {selectedApp.status === 'Shortlisted'
                                ? 'Congratulations! The recruiter has shortlisted your profile. They will reach out shortly to schedule your first round.'
                                : selectedApp.status === 'Interview'
                                ? 'Your interview has been scheduled. Please check your email for the coordinator details.'
                                : selectedApp.status === 'Selected'
                                ? 'Offer Extended! The hiring coordinator has selected you for this role. Welcome aboard! 🚀'
                                : 'The recruiter completed their evaluation. While this role is closed, we will maintain your details on file.'}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border dark:border-darkborder flex justify-between items-center text-xs text-secondary dark:text-darkmuted">
                    <span>Tracker connected to Socket.IO room</span>
                    <span>Last updated: {new Date(selectedApp.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
