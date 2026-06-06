import { useState } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login, Register } from './pages/Auth';
import { Analytics } from './pages/Analytics';
import { CandidateDashboard as RecruiterCandidateRankings } from './pages/CandidateDashboard';
import { CandidateProfile as RecruiterCandidateProfile } from './pages/CandidateProfile';
import { Dashboard as RecruiterDashboard } from './pages/Dashboard';
import { JobDetail as RecruiterJobDetail } from './pages/JobDetail';
import { Jobs as RecruiterJobs } from './pages/Jobs';
import { Settings as RecruiterSettings } from './pages/Settings';
import Landing from './pages/Landing';
import { CandidateJobPortal } from './pages/CandidateJobPortal';

// Candidate experience page imports
import { CandidateDashboard } from './pages/candidate/Dashboard';
import { CandidateJobs } from './pages/candidate/Jobs';
import { CandidateJobDetail } from './pages/candidate/JobDetail';
import { CandidateApplications } from './pages/candidate/Applications';
import { CandidateProfileEdit } from './pages/candidate/Profile';
import { CandidateSettings } from './pages/candidate/Settings';

// Recruiter new pages
import { CandidatesDirectory } from './pages/recruiter/Candidates';

import { useAuth, useRecruiterAuth, useCandidateAuth, useAdminAuth } from './firebase/AuthContext';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-darkbg text-primary dark:text-darktext">
        <div className="animate-pulse font-heading text-lg font-bold">Loading HireMind...</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function RequireRole({ children, role }: { children: JSX.Element; role: 'candidate' | 'recruiter' | 'admin' }) {
  const baseAuth = useAuth();
  const recruiter = useRecruiterAuth();
  const candidate = useCandidateAuth();
  const admin = useAdminAuth();

  const authState = role === 'candidate' ? candidate : role === 'recruiter' ? recruiter : admin;

  if (authState.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-darkbg text-primary dark:text-darktext">
        <div className="animate-pulse font-heading text-lg font-bold">Loading...</div>
      </div>
    );
  }

  if (!authState.user) {
    if (baseAuth.user) {
      console.warn(`[Route Guard] Role mismatch. Required: ${role}, Actual: ${baseAuth.user.role}. Redirecting...`);
      return <Navigate to={baseAuth.user.role === 'candidate' ? '/candidate/dashboard' : baseAuth.user.role === 'recruiter' ? '/recruiter/dashboard' : '/admin/dashboard'} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-darkbg text-primary dark:text-darktext">
        <div className="animate-pulse font-heading text-lg font-bold">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'candidate' ? '/candidate/dashboard' : user.role === 'recruiter' ? '/recruiter/dashboard' : '/admin/dashboard'} replace />;
}

function ParamRedirect({ to }: { to: string }) {
  const params = useParams();
  let target = to;
  for (const [key, val] of Object.entries(params)) {
    if (val) target = target.replace(`:${key}`, val);
  }
  return <Navigate to={target} replace />;
}

function SessionDebugPanel() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] rounded-xl bg-accent/90 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur hover:bg-accent transition"
      >
        🔍 Debug Session
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-64 rounded-2xl border border-border bg-surface/90 dark:border-darkborder dark:bg-darksurface/90 p-4 shadow-2xl backdrop-blur-md text-primary dark:text-darktext">
      <div className="flex items-center justify-between border-b border-border dark:border-darkborder pb-2 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-accent dark:text-darkaccent">Session Debugger</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-secondary hover:text-primary dark:text-darkmuted dark:hover:text-darktext text-xs"
        >
          Hide
        </button>
      </div>
      {loading ? (
        <div className="text-[11px] text-secondary dark:text-darkmuted animate-pulse">Loading auth state...</div>
      ) : user ? (
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-secondary dark:text-darkmuted font-medium">User:</span>
            <span className="font-semibold text-primary dark:text-darktext truncate max-w-[160px]">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary dark:text-darkmuted font-medium">Role:</span>
            <span className={`font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase ${
              user.role === 'recruiter' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
              user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
              'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}>{user.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary dark:text-darkmuted font-medium">UID:</span>
            <span className="font-mono text-primary dark:text-darktext">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary dark:text-darkmuted font-medium">Persistence:</span>
            <span className="font-semibold text-success">session</span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-secondary dark:text-darkmuted italic">
          No active session (Logged Out)
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <>
      <SessionDebugPanel />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Landing />} />
        
        {/* Protected Layout */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          
          {/* Candidate Experience Protected Routes */}
          <Route path="/candidate/dashboard" element={<RequireRole role="candidate"><CandidateDashboard /></RequireRole>} />
          <Route path="/candidate/jobs" element={<RequireRole role="candidate"><CandidateJobs /></RequireRole>} />
          <Route path="/candidate/jobs/:id" element={<RequireRole role="candidate"><CandidateJobDetail /></RequireRole>} />
          <Route path="/candidate/applications" element={<RequireRole role="candidate"><CandidateApplications /></RequireRole>} />
          <Route path="/candidate/profile" element={<RequireRole role="candidate"><CandidateProfileEdit /></RequireRole>} />
          <Route path="/candidate/settings" element={<RequireRole role="candidate"><CandidateSettings /></RequireRole>} />

          {/* Recruiter Experience Protected Routes */}
          <Route path="/recruiter/dashboard" element={<RequireRole role="recruiter"><RecruiterDashboard /></RequireRole>} />
          <Route path="/recruiter/jobs" element={<RequireRole role="recruiter"><RecruiterJobs /></RequireRole>} />
          <Route path="/recruiter/jobs/:id" element={<RequireRole role="recruiter"><RecruiterJobDetail /></RequireRole>} />
          <Route path="/recruiter/jobs/:id/candidates" element={<RequireRole role="recruiter"><RecruiterCandidateRankings /></RequireRole>} />
          <Route path="/recruiter/candidates" element={<RequireRole role="recruiter"><CandidatesDirectory /></RequireRole>} />
          <Route path="/recruiter/candidates/:id" element={<RequireRole role="recruiter"><RecruiterCandidateProfile /></RequireRole>} />
          <Route path="/recruiter/analytics" element={<RequireRole role="recruiter"><Analytics /></RequireRole>} />
          <Route path="/recruiter/settings" element={<RequireRole role="recruiter"><RecruiterSettings /></RequireRole>} />

          {/* Admin Experience Protected Routes */}
          <Route path="/admin/dashboard" element={<RequireRole role="admin"><div className="p-6 font-bold">Admin Dashboard Coming Soon</div></RequireRole>} />

          {/* Redirect for general authenticated routes */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/jobs" element={<Navigate to="/recruiter/jobs" replace />} />
          <Route path="/jobs/:id" element={<ParamRedirect to="/recruiter/jobs/:id" />} />
          <Route path="/jobs/:id/candidates" element={<ParamRedirect to="/recruiter/jobs/:id/candidates" />} />
          <Route path="/candidates/:id" element={<ParamRedirect to="/recruiter/candidates/:id" />} />
          <Route path="/analytics" element={<Navigate to="/recruiter/analytics" replace />} />
          <Route path="/settings" element={<Navigate to="/recruiter/settings" replace />} />
        </Route>

        <Route path="*" element={<DashboardRedirect />} />
      </Routes>
    </>
  );
}
