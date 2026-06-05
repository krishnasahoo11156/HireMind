import { Navigate, Route, Routes } from 'react-router-dom';
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

// Candidate experience page imports (to be created)
import { CandidateDashboard } from './pages/candidate/Dashboard';
import { CandidateJobs } from './pages/candidate/Jobs';
import { CandidateJobDetail } from './pages/candidate/JobDetail';
import { CandidateApplications } from './pages/candidate/Applications';
import { CandidateProfileEdit } from './pages/candidate/Profile';
import { CandidateSettings } from './pages/candidate/Settings';

// Recruiter new pages
import { CandidatesDirectory } from './pages/recruiter/Candidates';

import { getDecodedToken } from './lib/auth';

function RequireAuth({ children }: { children: JSX.Element }) {
  const hasToken = Boolean(localStorage.getItem('hiremind_token'));
  return hasToken ? children : <Navigate to="/login" replace />;
}

function RequireRole({ children, role }: { children: JSX.Element; role: 'candidate' | 'recruiter' }) {
  const decoded = getDecodedToken();
  if (!decoded) {
    return <Navigate to="/login" replace />;
  }
  if (decoded.role !== role) {
    return <Navigate to={decoded.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard'} replace />;
  }
  return children;
}

function DashboardRedirect() {
  const decoded = getDecodedToken();
  if (!decoded) return <Navigate to="/login" replace />;
  return <Navigate to={decoded.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard'} replace />;
}

export default function App() {
  return (
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

        {/* Redirect for general authenticated routes */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/jobs" element={<Navigate to="/recruiter/jobs" replace />} />
        <Route path="/jobs/:id" element={<Navigate to="/recruiter/jobs/:id" replace />} />
        <Route path="/jobs/:id/candidates" element={<Navigate to="/recruiter/jobs/:id/candidates" replace />} />
        <Route path="/candidates/:id" element={<Navigate to="/recruiter/candidates/:id" replace />} />
        <Route path="/analytics" element={<Navigate to="/recruiter/analytics" replace />} />
        <Route path="/settings" element={<Navigate to="/recruiter/settings" replace />} />
      </Route>

      <Route path="*" element={<DashboardRedirect />} />
    </Routes>
  );
}
