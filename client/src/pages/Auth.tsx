import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Target,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Key,
  User,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';

// ─────────────────────────────────────────────
// HERO LEFT PANEL (SHARED FOR LOGIN & REGISTER)
// ─────────────────────────────────────────────
function AuthHeroPanel() {
  return (
    <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 relative overflow-hidden min-h-screen bg-gradient-to-b from-[#0c0f16] to-[#07090e] border-r border-white/5 select-none">
      {/* Background glowing particles/circles */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-yellow-500/5 blur-3xl" />

      {/* Header Logo */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#C88908] to-[#A16207] shadow-md shadow-accent/10">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="font-heading text-xl font-extrabold tracking-tight text-white">HireMind</span>
      </div>

      {/* Main Feature Content */}
      <div className="space-y-12 my-auto relative z-10">
        <div className="space-y-4">
          <h1 className="font-heading text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Smarter Hiring.<br />
            <span className="bg-gradient-to-r from-[#D4A017] to-yellow-500 bg-clip-text text-transparent">Stronger Teams.</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            AI-Powered platform to help you find, match, and hire the best talent faster.
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent shadow-sm">
              <Zap className="h-5 w-5 text-[#D4A017]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI-Powered Screening</h3>
              <p className="text-xs text-slate-400 mt-0.5">Filter top candidates in seconds</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent shadow-sm">
              <Target className="h-5 w-5 text-[#D4A017]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Better Match</h3>
              <p className="text-xs text-slate-400 mt-0.5">Find the perfect fit for every role</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent shadow-sm">
              <Shield className="h-5 w-5 text-[#D4A017]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Secure & Reliable</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enterprise-grade data protection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Gold Arc SVG */}
      <svg className="absolute bottom-0 left-0 w-full h-1/2 pointer-events-none opacity-60" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100 250 C100 100, 300 150, 500 250" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="5 5" />
        <path d="M-100 280 C100 80, 300 120, 500 280" stroke="url(#goldGrad)" strokeWidth="1" />
        <circle cx="280" cy="115" r="4.5" fill="#E8B923" className="animate-pulse shadow-[0_0_12px_#E8B923]" />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A16207" stopOpacity="0" />
            <stop offset="50%" stopColor="#D4A017" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C88908" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  
  // Google setup states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [tempGoogleData, setTempGoogleData] = useState<{ idToken: string; name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [setupName, setSetupName] = useState('');

  async function handleGoogleSignIn(event?: FormEvent) {
    if (event) event.preventDefault();
    setError('');
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken(true);

      const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/api$/, '');
      const body: any = { idToken };
      if (password.trim()) {
        body.password = password;
      }
      
      const resp = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error ?? 'Backend authentication failed');
      }

      const data = await resp.json();

      if (data.requiresProfileSetup) {
        setTempGoogleData({ idToken, name: cred.user.displayName ?? '' });
        setSetupName(cred.user.displayName ?? '');
        setShowSetupModal(true);
        setLoadingGoogle(false);
        return;
      }

      const user = await loginWithGoogle(undefined, undefined, password.trim() || undefined);
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Unable to sign in with Google');
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleEmailSignIn(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!tempGoogleData) return;
    try {
      setLoadingGoogle(true);
      const user = await loginWithGoogle(selectedRole, setupName, password);
      setShowSetupModal(false);
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Unable to complete profile setup');
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-[#07090e] text-white">
      {/* Left Column - Hero */}
      <AuthHeroPanel />

      {/* Right Column - Form */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Floating gradient highlights */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

        {/* Back Link */}
        <Link
          to="/"
          className="absolute top-8 left-8 sm:left-12 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
        >
          &larr; Back to home
        </Link>

        {/* Login Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-[#0d1220]/60 border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10"
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-xs text-slate-400 mt-1">Sign in to continue to your account</p>
          </div>

          <form className="space-y-4" onSubmit={handleEmailSignIn}>
            {/* Input 1 - Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Email or Password
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Enter your email or password"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#0a0d14] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4A017] transition duration-200"
                />
              </div>
            </div>

            {/* Input 2 - Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('For recovery, please contact your administrator.')}
                  className="text-xs font-semibold text-[#D4A017] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-[#0a0d14] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4A017] transition duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="remember"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-white/10 bg-[#0a0d14] text-[#D4A017] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs font-medium text-slate-400 select-none cursor-pointer">
                Keep me signed in
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Google Login Button */}
            <button
              type="button"
              onClick={() => handleGoogleSignIn()}
              disabled={loadingGoogle}
              className="w-full py-3 bg-gradient-to-r from-[#C88908] to-[#A16207] hover:from-[#D4A017] hover:to-[#B57C14] text-white font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-lg transition duration-200 mt-2 disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loadingGoogle ? 'Connecting Google...' : 'Continue with Google'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <span className="relative px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-[#0d1220]">OR</span>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleEmailSignIn}
              disabled={loading}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition duration-200"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>{loading ? 'Verifying...' : 'Continue with Email'}</span>
            </button>
            <button
              onClick={handleEmailSignIn}
              disabled={loading}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition duration-200"
            >
              <Key className="h-4 w-4 shrink-0" />
              <span>Use Password</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center text-xs font-medium text-slate-400">
            Don't have an account?{' '}
            <Link
              className="font-bold text-[#D4A017] hover:underline inline-flex items-center gap-0.5 ml-1"
              to="/register"
            >
              <span>Sign up</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Setup Role Modal for New Google Users */}
      <AnimatePresence>
        {showSetupModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-45 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="w-full max-w-md p-6 shadow-2xl border border-white/5 rounded-2xl bg-[#0d1220] text-white">
                <h3 className="text-lg font-bold text-white mb-2">Complete Profile Setup</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Welcome! Verify your name and choose your account role to complete registration.
                </p>
                <form onSubmit={handleCompleteSetup} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Full Name</label>
                    <input
                      className="w-full px-4 py-3 bg-[#0a0d14] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4A017]"
                      placeholder="Full name"
                      required
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">I want to register as a</label>
                    <select
                      className="w-full px-4 py-3 bg-[#0a0d14] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#D4A017] cursor-pointer"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'candidate' | 'recruiter')}
                    >
                      <option value="candidate">Candidate (Job Seeker)</option>
                      <option value="recruiter">Recruiter (Hiring Manager)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#D4A017] hover:bg-[#B57C14] text-white text-sm font-semibold rounded-xl shadow-md transition duration-200 mt-2"
                    disabled={loadingGoogle}
                  >
                    {loadingGoogle ? 'Completing Setup...' : 'Complete Profile Setup'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// REGISTER PAGE
// ─────────────────────────────────────────────
export function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('recruiter');
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  async function handleGoogleSignUp(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name first.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password to secure your account.');
      return;
    }
    setError('');
    setLoadingGoogle(true);
    try {
      const user = await loginWithGoogle(role as 'candidate' | 'recruiter', name, password);
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Unable to register with Google');
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleEmailSignUp(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a secure password.');
      return;
    }
    setError('');
    setLoadingEmail(true);
    try {
      const user = await register({ name, email, password, role });
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally {
      setLoadingEmail(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-[#07090e] text-white">
      {/* Left Column - Hero */}
      <AuthHeroPanel />

      {/* Right Column - Form */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Floating gradient highlights */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

        {/* Back Link */}
        <Link
          to="/"
          className="absolute top-8 left-8 sm:left-12 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
        >
          &larr; Back to home
        </Link>

        {/* Registration Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-[#0d1220]/60 border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10"
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Create account</h2>
            <p className="text-xs text-slate-400 mt-1">Register to get started on the platform</p>
          </div>

          <form className="space-y-4" onSubmit={handleEmailSignUp}>
            {/* Input 1 - Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#0a0d14] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4A017] transition duration-200"
                />
              </div>
            </div>

            {/* Input 2 - Email Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="email"
                  required={!loadingGoogle} // only required if using email/pass registration
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#0a0d14] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4A017] transition duration-200"
                />
              </div>
            </div>

            {/* Input 3 - Create Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#0a0d14] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4A017] transition duration-200"
                />
              </div>
            </div>

            {/* Input 4 - Role Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Register As
              </label>
              <div className="relative flex items-center">
                <Briefcase className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#0a0d14] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#D4A017] cursor-pointer transition duration-200"
                >
                  <option value="recruiter">Recruiter / Hiring Manager</option>
                  <option value="candidate">Candidate (Job Seeker)</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Register with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loadingGoogle}
              className="w-full py-3 bg-gradient-to-r from-[#C88908] to-[#A16207] hover:from-[#D4A017] hover:to-[#B57C14] text-white font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-lg transition duration-200 mt-2 disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loadingGoogle ? 'Connecting Google...' : 'Register with Google'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <span className="relative px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-[#0d1220]">OR</span>
          </div>

          {/* Email Signup */}
          <button
            onClick={handleEmailSignUp}
            disabled={loadingEmail}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition duration-200"
          >
            <Mail className="h-4 w-4 shrink-0" />
            <span>{loadingEmail ? 'Registering...' : 'Register with Email'}</span>
          </button>

          {/* Login Link */}
          <div className="mt-8 text-center text-xs font-medium text-slate-400">
            Already have an account?{' '}
            <Link
              className="font-bold text-[#D4A017] hover:underline inline-flex items-center gap-0.5 ml-1"
              to="/login"
            >
              <span>Sign in</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
