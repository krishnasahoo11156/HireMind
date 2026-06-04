import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Upload,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Layout() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-primary dark:bg-darkbg dark:text-darktext">
      {/* ── SIDEBAR ── */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[280px] flex-col border-r border-border bg-surface dark:border-darkborder dark:bg-darksurface">
        {/* Logo */}
        <div className="flex h-[72px] flex-shrink-0 items-center gap-3 border-b border-border px-6 dark:border-darkborder">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-yellow-600 shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-[0.9375rem] font-bold tracking-tight text-primary dark:text-darktext">
              HireMind
            </div>
            <div className="text-[0.6875rem] font-medium text-secondary dark:text-darkmuted">
              AI Hiring Intelligence
            </div>
          </div>
        </div>

        {/* Workspace badge */}
        <div className="mx-4 mt-4 flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 dark:border-darkborder dark:bg-darkbg">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent">
              <Users className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-primary dark:text-darktext">Acme Recruiting</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-secondary dark:text-darkmuted" />
        </div>

        {/* Nav section label */}
        <div className="mt-5 px-6">
          <p className="hm-label text-[10px]">Navigation</p>
        </div>

        {/* Nav items */}
        <nav className="mt-2 flex-1 space-y-0.5 px-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `hm-nav-item ${
                    isActive
                      ? 'bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent font-semibold'
                      : 'text-secondary hover:bg-gray-50 hover:text-primary dark:text-darkmuted dark:hover:bg-darkborder/50 dark:hover:text-darktext'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 flex-none ${isActive ? 'text-accent dark:text-darkaccent' : ''}`}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex-shrink-0 border-t border-border p-4 dark:border-darkborder">
          {/* Quick Upload CTA */}
          <button
            aria-label="Upload resumes"
            onClick={() => navigate('/jobs')}
            className="hm-button mb-3 w-full bg-accent/10 text-accent hover:bg-accent/20 dark:bg-darkaccent/10 dark:text-darkaccent dark:hover:bg-darkaccent/20"
          >
            <Upload className="h-4 w-4" />
            Upload Resumes
          </button>

          {/* Recruiter profile card */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 dark:border-darkborder dark:bg-darkbg">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent to-yellow-600 text-sm font-bold text-white shadow-sm">
              MK
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-primary dark:text-darktext">Maya Kapoor</div>
              <div className="truncate text-xs text-secondary dark:text-darkmuted">Senior Recruiter</div>
            </div>
            <button
              aria-label="Log out"
              onClick={() => {
                localStorage.removeItem(api.tokenKey);
                navigate('/login');
              }}
              className="flex-none rounded-lg p-1.5 text-secondary transition-colors hover:bg-gray-100 hover:text-primary dark:text-darkmuted dark:hover:bg-darkborder dark:hover:text-darktext"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-20 ml-[280px] flex h-[72px] items-center justify-between border-b border-border bg-surface/90 px-8 backdrop-blur-md dark:border-darkborder dark:bg-darksurface/90">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary dark:text-darkmuted" />
          <input
            aria-label="Search"
            className="hm-input w-full pl-9"
            placeholder="Search jobs, candidates…"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="hm-button border border-border bg-surface px-3 text-secondary hover:text-primary dark:border-darkborder dark:bg-darkbg dark:text-darkmuted dark:hover:text-darktext"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hm-button border border-border bg-surface px-3 text-secondary hover:text-primary dark:border-darkborder dark:bg-darkbg dark:text-darkmuted dark:hover:text-darktext"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-yellow-600 text-sm font-bold text-white shadow-sm">
            MK
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="ml-[280px] min-h-[calc(100vh-72px)]">
        <div className="mx-auto max-w-content px-8 py-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
