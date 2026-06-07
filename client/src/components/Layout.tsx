import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Feather,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Sun,
  Upload,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { useAuth } from '../firebase/AuthContext';

const recruiterNav = [
  { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recruiter/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/recruiter/candidates', label: 'Candidates', icon: Users },
  { to: '/recruiter/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/recruiter/settings', label: 'Settings', icon: Settings },
];

const candidateNav = [
  { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/candidate/jobs', label: 'Find Jobs', icon: BriefcaseBusiness },
  { to: '/candidate/applications', label: 'Applications', icon: Bell },
  { to: '/candidate/profile', label: 'My Profile', icon: Users },
  { to: '/candidate/settings', label: 'Settings', icon: Settings },
];

export function Layout() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const role = user?.role ?? 'recruiter';
  
  const name = user?.name ?? (role === 'candidate' ? 'Sarah Chen' : 'Maya Kapoor');
  const title = role === 'candidate' ? 'Software Engineer' : 'Senior Recruiter';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || (role === 'candidate' ? 'SC' : 'MK');
  const nav = role === 'candidate' ? candidateNav : recruiterNav;

  return (
    <div className="min-h-screen bg-background text-primary dark:bg-darkbg dark:text-darktext">
      {/* ── SIDEBAR ── */}
      <aside className={`fixed left-0 top-0 z-30 flex h-screen ${sidebarCollapsed ? 'w-[80px]' : 'w-[280px]'} flex-col border-r border-border bg-surface dark:border-darkborder dark:bg-darksurface transition-all duration-300 ease-out`}>
        {/* Logo */}
        <div className={`flex h-[68px] flex-shrink-0 items-center ${sidebarCollapsed ? 'justify-center px-4' : 'gap-3 px-5'} border-b border-border dark:border-darkborder transition-all duration-300`}>
          <div className="relative flex-shrink-0 group cursor-pointer" onClick={toggleSidebar}>
            {/* Animated accent ring */}
            <div className="absolute -inset-1 rounded-full bg-accent/25 dark:bg-darkaccent/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />
            <div className={`absolute -inset-0.5 rounded-[12px] bg-accent/30 dark:bg-darkaccent/30 animate-slow-pulse opacity-100 pointer-events-none ${
              sidebarCollapsed ? 'rounded-[10px]' : 'rounded-[12px]'
            }`} />

            {/* Logo Container */}
            <div className={`relative flex items-center justify-center transition-all duration-300 ease-out bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-100 dark:to-neutral-200 hover:-translate-y-0.5 hover:scale-[1.02] ${
              sidebarCollapsed ? 'h-9 w-9 rounded-[10px]' : 'h-[38px] w-[38px] rounded-[12px]'
            }`}>
              {/* Custom Monogram H Neural SVG */}
              <svg
                className={`transition-all duration-300 ${sidebarCollapsed ? 'h-[20px] w-[20px]' : 'h-[22px] w-[22px]'}`}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Neural net links */}
                <line x1="30" y1="75" x2="30" y2="25" stroke={theme === 'dark' ? 'black' : 'white'} strokeWidth="6" strokeLinecap="round" />
                <line x1="70" y1="75" x2="70" y2="25" stroke={theme === 'dark' ? 'black' : 'white'} strokeWidth="6" strokeLinecap="round" />
                <line x1="30" y1="50" x2="70" y2="50" stroke={theme === 'dark' ? 'black' : 'white'} strokeWidth="6" strokeLinecap="round" />
                
                <line x1="30" y1="75" x2="50" y2="50" stroke={theme === 'dark' ? 'black' : 'white'} strokeWidth="4" strokeOpacity="0.5" strokeLinecap="round" />
                <line x1="50" y1="50" x2="70" y2="25" stroke={theme === 'dark' ? 'black' : 'white'} strokeWidth="4" strokeOpacity="0.5" strokeLinecap="round" />

                {/* Nodes */}
                <circle cx="30" cy="25" r="7" fill={theme === 'dark' ? 'black' : 'white'} />
                <circle cx="30" cy="75" r="7" fill={theme === 'dark' ? 'black' : 'white'} />
                <circle cx="70" cy="25" r="7" fill={theme === 'dark' ? 'black' : 'white'} />
                <circle cx="70" cy="75" r="7" fill={theme === 'dark' ? 'black' : 'white'} />
                <circle cx="50" cy="50" r="8.5" fill={theme === 'dark' ? 'black' : 'white'} stroke={theme === 'dark' ? 'white' : 'black'} strokeWidth="2.5" />
              </svg>
            </div>
          </div>

          {!sidebarCollapsed && (
            <div className="flex flex-col select-none group cursor-pointer" onClick={toggleSidebar}>
              <div className="font-sans text-[20px] font-extrabold tracking-[-0.04em] leading-none text-primary dark:text-white transition-colors duration-200">
                HireMind
              </div>
              <div className="mt-[2px] font-sans text-[11px] font-medium tracking-[0.02em] text-secondary dark:text-darkmuted leading-normal whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px] block">
                Explainable Hiring Intelligence
              </div>
            </div>
          )}
        </div>

        {/* Workspace badge */}
        <div className={`mx-4 mt-4 flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'} rounded-xl border border-border bg-background dark:border-darkborder dark:bg-darkbg transition-all duration-300`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-100 text-primary dark:bg-darkborder dark:text-darktext">
              <Users className="h-3.5 w-3.5" />
            </div>
            {!sidebarCollapsed && <span className="text-[13px] font-semibold text-primary dark:text-darktext">{role === 'recruiter' ? 'Acme Recruiting' : 'Candidate Portal'}</span>}
          </div>
          {!sidebarCollapsed && <ChevronDown className="h-3.5 w-3.5 text-secondary dark:text-darkmuted" />}
        </div>

        {/* Nav section label */}
        <div className={`mt-5 px-6 ${sidebarCollapsed ? 'flex justify-center px-2' : ''}`}>
          {sidebarCollapsed ? (
            <div className="h-px w-full bg-border dark:bg-darkborder" />
          ) : (
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-secondary/70 dark:text-darkmuted/70">Navigation</p>
          )}
        </div>

        {/* Nav items */}
        <nav className={`mt-2 flex-1 space-y-0.5 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `hm-nav-item text-[13px] border-l-2 ${sidebarCollapsed ? 'justify-center px-0' : 'pl-3'} transition-all duration-150 ${
                    isActive
                      ? 'border-accent dark:border-darkaccent bg-neutral-100 text-primary dark:bg-darkborder/50 dark:text-darktext font-semibold'
                      : 'border-transparent text-secondary hover:bg-neutral-50 hover:text-primary dark:text-darkmuted dark:hover:bg-darkborder/20 dark:hover:text-darktext font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 flex-none ${isActive ? 'text-accent dark:text-darkaccent' : ''}`}
                    />
                    {!sidebarCollapsed && item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className={`flex-shrink-0 border-t border-border ${sidebarCollapsed ? 'p-2' : 'p-4'} dark:border-darkborder transition-all duration-300`}>
          {/* Quick Upload CTA - Only for Recruiter */}
          {role === 'recruiter' && (
            <button
              aria-label="Upload resumes"
              onClick={() => navigate('/recruiter/jobs')}
              title="Upload Resumes"
              className={`hm-button mb-3 w-full justify-center bg-accent/10 text-accent hover:bg-accent/20 dark:bg-darkaccent/10 dark:text-darkaccent dark:hover:bg-darkaccent/20 ${sidebarCollapsed ? 'px-0' : ''}`}
            >
              <Upload className="h-4 w-4" />
              {!sidebarCollapsed && 'Upload Resumes'}
            </button>
          )}

          {/* Powered by Featherless AI */}
          <a
            href="https://featherless.ai"
            target="_blank"
            rel="noopener noreferrer"
            title="Powered by Featherless AI"
            className={`group mb-3 flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-2.5'} w-full rounded-xl border border-dashed border-border hover:border-[#FACC15]/60 bg-transparent hover:bg-[#FACC15]/5 dark:border-darkborder dark:hover:border-[#FACC15]/40 dark:hover:bg-[#FACC15]/5 transition-all duration-200 cursor-pointer`}
          >
            <div className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[#FACC15]/15 dark:bg-[#FACC15]/10 group-hover:bg-[#FACC15]/25 transition-colors duration-200">
              <Feather className="h-3.5 w-3.5 text-[#A16207] dark:text-[#FACC15] group-hover:text-[#92400E] dark:group-hover:text-[#FDE68A] transition-colors duration-200" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-medium tracking-[0.06em] uppercase text-secondary dark:text-darkmuted leading-none mb-0.5">Powered by</span>
                <span className="text-[12px] font-bold text-primary dark:text-darktext group-hover:text-accent dark:group-hover:text-darkaccent transition-colors duration-200 leading-none truncate">Featherless AI</span>
              </div>
            )}
          </a>

          {/* Profile card */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center p-2' : 'gap-3 p-3'} rounded-xl border border-border bg-background dark:border-darkborder dark:bg-darkbg transition-all duration-300`}>
            <div
              title={sidebarCollapsed ? `${name} (${title})` : undefined}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent to-yellow-600 text-sm font-bold text-white shadow-sm cursor-pointer"
            >
              {initials}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-primary dark:text-darktext">{name}</div>
                  <div className="truncate text-xs text-secondary dark:text-darkmuted">{title}</div>
                </div>
                <button
                  aria-label="Log out"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="flex-none rounded-lg p-1.5 text-secondary transition-colors hover:bg-gray-100 hover:text-primary dark:text-darkmuted dark:hover:bg-darkborder dark:hover:text-darktext"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── NAVBAR ── */}
      <header className={`sticky top-0 z-20 ${sidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'} flex h-[68px] items-center justify-between border-b border-border bg-surface/90 px-8 backdrop-blur-md dark:border-darkborder dark:bg-darkbg/90 transition-all duration-300 ease-out`}>
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="rounded-xl border border-border bg-surface p-2 text-secondary hover:text-primary dark:border-darkborder dark:bg-darkbg dark:text-darkmuted dark:hover:text-darktext transition-colors"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary dark:text-darkmuted" />
            <input
              aria-label="Search"
              className="hm-input w-full pl-9"
              placeholder={role === 'candidate' ? 'Search jobs…' : 'Search jobs, candidates…'}
            />
          </div>
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
            {initials}
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className={`${sidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'} min-h-[calc(100vh-68px)] transition-all duration-300 ease-out`}>
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
