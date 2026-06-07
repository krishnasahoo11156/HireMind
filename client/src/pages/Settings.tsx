import { Bell, Building2, Globe, Lock, Monitor, Moon, Shield, Sun, UserCircle, CheckCircle } from 'lucide-react';
import { Button, Card, PageTitle, DisplayTitle, SectionTitle, CardTitle, BodyText, Caption } from '../components/ui';
import { useAppStore } from '../store/appStore';
import { useRecruiterAuth } from '../firebase/AuthContext';
import { useState, useEffect } from 'react';

type Section = {
  icon: React.ReactNode;
  title: string;
  description: string;
  content: React.ReactNode;
};

export function Settings() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const { user, updateProfile } = useRecruiterAuth();

  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState('Senior Recruiter');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setError('');
    setSaved(false);
    try {
      await updateProfile({ name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update profile');
    }
  };

  const sections: Section[] = [
    {
      icon: <UserCircle className="h-5 w-5" />,
      title: 'Profile',
      description: 'Your personal information and recruiter identity.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold text-primary dark:text-darktext">Full Name</Caption>
            <input className="hm-input w-full bg-white dark:bg-darkbg" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold text-primary dark:text-darktext">Email</Caption>
            <input className="hm-input w-full bg-white dark:bg-darkbg" value={user?.email || 'recruiter@hiremind.ai'} readOnly />
          </div>
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold text-primary dark:text-darktext">Role</Caption>
            <input className="hm-input w-full bg-white dark:bg-darkbg" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold text-primary dark:text-darktext">Phone</Caption>
            <input className="hm-input w-full bg-white dark:bg-darkbg" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {saved && (
            <div className="col-span-1 md:col-span-2 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-xs text-success">
              <CheckCircle className="h-4 w-4" />
              Profile details updated successfully!
            </div>
          )}
          {error && (
            <div className="col-span-1 md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-danger dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="col-span-1 md:col-span-2 flex justify-end">
            <Button variant="accent" onClick={handleSaveProfile}>Save Profile</Button>
          </div>
        </div>
      )
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Account & Security',
      description: 'Manage your organization workspace settings, integrations, and password security.',
      content: (
        <div className="space-y-6">
          {/* Sub-section: Workspace */}
          <div>
            <h5 className="text-sm font-bold text-primary dark:text-darktext mb-3">Workspace Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Caption as="label" className="mb-1.5 block font-semibold text-primary dark:text-darktext">Organization</Caption>
                <input className="hm-input w-full bg-white dark:bg-darkbg" defaultValue="Acme Recruiting" />
              </div>
              <div>
                <Caption as="label" className="mb-1.5 block font-semibold text-primary dark:text-darktext">Industry</Caption>
                <select className="hm-input w-full bg-white dark:bg-darkbg">
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="secondary" size="sm">Save Workspace</Button>
            </div>
          </div>

          <hr className="border-border dark:border-darkborder" />

          {/* Sub-section: Integrations */}
          <div>
            <h5 className="text-sm font-bold text-primary dark:text-darktext mb-1">Integrations</h5>
            <p className="text-xs text-secondary dark:text-darkmuted mb-3">Connect HireMind to your existing tools.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Slack', 'Google Calendar', 'Greenhouse ATS', 'LinkedIn Recruiter'].map((tool) => (
                <div
                  key={tool}
                  className="flex items-center justify-between rounded-xl border border-border p-3.5 dark:border-darkborder bg-background/30 dark:bg-darkbg/10"
                >
                  <span className="text-xs font-semibold text-primary dark:text-darktext">{tool}</span>
                  <Button variant="secondary" size="sm" className="h-8 px-2.5 text-xs rounded-lg">Connect</Button>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-border dark:border-darkborder" />

          {/* Sub-section: Security */}
          <div>
            <h5 className="text-sm font-bold text-primary dark:text-darktext mb-3">Security & Password</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Caption as="label" className="mb-1.5 block font-semibold text-primary dark:text-darktext">Current Password</Caption>
                <input type="password" className="hm-input w-full bg-white dark:bg-darkbg" placeholder="••••••••" />
              </div>
              <div>
                <Caption as="label" className="mb-1.5 block font-semibold text-primary dark:text-darktext">New Password</Caption>
                <input type="password" className="hm-input w-full bg-white dark:bg-darkbg" placeholder="••••••••" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border p-4 dark:border-darkborder bg-background/30 dark:bg-darkbg/10">
              <div>
                <div className="text-xs font-bold text-primary dark:text-darktext">Two-Factor Authentication</div>
                <div className="mt-0.5 text-[11px] text-secondary dark:text-darkmuted">Add an extra layer of security to your account.</div>
              </div>
              <Button variant="secondary" size="sm"><Shield className="h-3.5 w-3.5" />Enable 2FA</Button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="accent">Update Password</Button>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: 'Notifications',
      description: 'Choose when and how you get notified.',
      content: (
        <div className="space-y-3">
          {[
            'Email me when rankings are generated',
            'Notify me when a candidate is shortlisted',
            'Daily digest of hiring activity',
            'Alerts for AI accuracy drops',
          ].map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4 text-xs font-semibold transition hover:bg-gray-50 dark:border-darkborder dark:hover:bg-darkborder/30 bg-background/10"
            >
              <span className="text-primary dark:text-darktext">{item}</span>
              <input
                type="checkbox"
                defaultChecked={item.includes('rankings')}
                className="h-4.5 w-4.5 accent-accent rounded"
              />
            </label>
          ))}
        </div>
      )
    },
    {
      icon: <Monitor className="h-5 w-5" />,
      title: 'Appearance',
      description: 'Choose your preferred visual theme.',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { key: 'light', label: 'Light Mode', icon: Sun },
            { key: 'dark', label: 'Dark Mode', icon: Moon },
            { key: 'system', label: 'System Theme', icon: Monitor },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-xs font-bold transition-all ${
                theme === key
                  ? 'border-accent bg-accent/5 text-accent dark:border-darkaccent dark:bg-darkaccent/5 dark:text-darkaccent'
                  : 'border-border text-secondary hover:border-accent/50 hover:bg-gray-50/50 dark:border-darkborder dark:text-darkmuted dark:hover:bg-darkborder/30'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      )
    }
  ];

  return (
    <>
      <PageTitle
        title="Settings"
        subtitle="Manage your profile, workspace, notifications, and integrations."
      />

      <div className="space-y-5">
        {sections.map((section, i) => (
          <div key={section.title}>
            <Card className="overflow-hidden !p-0">
              <div className="flex items-start gap-4 border-b border-border bg-background/50 px-6 py-4 dark:border-darkborder dark:bg-darkbg/50">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent">
                  {section.icon}
                </div>
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <Caption className="block mt-0.5">{section.description}</Caption>
                </div>
              </div>
              <div className="p-6">{section.content}</div>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
