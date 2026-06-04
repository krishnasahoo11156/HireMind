import { Bell, BriefcaseBusiness, ChartNoAxesCombined, LayoutDashboard, LogOut, Moon, Search, Settings, Sparkles, Upload, UserCircle } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export function Layout() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-primary dark:bg-darkbg dark:text-darktext">
      <aside className="fixed left-0 top-0 z-30 h-screen w-60 border-r border-border bg-surface dark:border-darkborder dark:bg-darksurface">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5 dark:border-darkborder">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white dark:bg-darkaccent dark:text-darkbg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">HireMind</div>
            <div className="text-xs text-secondary dark:text-darkmuted">Explainable Hiring OS</div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${isActive ? 'bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent' : 'text-secondary hover:bg-gray-50 dark:text-darkmuted dark:hover:bg-darkborder/50'}`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3 dark:border-darkborder">
          <button
            aria-label="Upload resumes"
            onClick={() => navigate('/jobs')}
            className="hm-button w-full border border-border bg-white text-primary hover:bg-gray-50 dark:border-darkborder dark:bg-darkbg dark:text-darktext"
          >
            <Upload className="h-4 w-4" />
            Upload Resumes
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 ml-60 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur dark:border-darkborder dark:bg-darksurface/80">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary dark:text-darkmuted" />
          <input aria-label="Search" className="hm-input w-full pl-9" placeholder="Search jobs, candidates, skills" />
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Notifications" className="hm-button border border-border bg-white px-3 text-primary dark:border-darkborder dark:bg-darkbg dark:text-darktext">
            <Bell className="h-4 w-4" />
          </button>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hm-button border border-border bg-white px-3 text-primary dark:border-darkborder dark:bg-darkbg dark:text-darktext"
          >
            <Moon className="h-4 w-4" />
          </button>
          <button
            aria-label="Log out"
            onClick={() => {
              localStorage.removeItem(api.tokenKey);
              navigate('/login');
            }}
            className="hm-button border border-border bg-white px-3 text-primary dark:border-darkborder dark:bg-darkbg dark:text-darktext"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white dark:bg-darkaccent dark:text-darkbg">MK</div>
        </div>
      </header>

      <main className="ml-60 p-6">
        <Outlet />
      </main>
    </div>
  );
}
