import { Bell, Building2, Globe, Lock, Monitor, Moon, Shield, Sun, UserCircle } from 'lucide-react';
import { Button, Card, PageTitle, DisplayTitle, SectionTitle, CardTitle, BodyText, Caption } from '../components/ui';
import { useAppStore } from '../store/appStore';

type Section = {
  icon: React.ReactNode;
  title: string;
  description: string;
  content: React.ReactNode;
};

export function Settings() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const sections: Section[] = [
    {
      icon: <UserCircle className="h-5 w-5" />,
      title: 'Profile',
      description: 'Your personal information and recruiter identity.',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold">Full Name</Caption>
            <input className="hm-input w-full" defaultValue="Maya Kapoor" />
          </div>
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold">Email</Caption>
            <input className="hm-input w-full" defaultValue="recruiter@hiremind.ai" readOnly />
          </div>
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold">Role</Caption>
            <input className="hm-input w-full" defaultValue="Senior Recruiter" />
          </div>
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold">Phone</Caption>
            <input className="hm-input w-full" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="col-span-2 flex justify-end">
            <Button variant="accent">Save Profile</Button>
          </div>
        </div>
      )
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: 'Workspace',
      description: 'Organization name and team settings.',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold">Organization</Caption>
            <input className="hm-input w-full" defaultValue="Acme Recruiting" />
          </div>
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold">Industry</Caption>
            <select className="hm-input w-full">
              <option>Technology</option>
              <option>Finance</option>
              <option>Healthcare</option>
            </select>
          </div>
          <div className="col-span-2 flex justify-end">
            <Button variant="accent">Save Workspace</Button>
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
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4 text-sm transition hover:bg-gray-50 dark:border-darkborder dark:hover:bg-darkborder/30"
            >
              <span className="text-primary dark:text-darktext">{item}</span>
              <input
                type="checkbox"
                defaultChecked={item.includes('rankings')}
                className="h-4 w-4 accent-accent"
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
        <div className="flex gap-3">
          {([
            { key: 'light', label: 'Light', icon: Sun },
            { key: 'dark', label: 'Dark', icon: Moon },
            { key: 'system', label: 'System', icon: Monitor },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 p-6 text-sm font-medium transition-all ${
                theme === key
                  ? 'border-accent bg-accent/5 text-accent dark:border-darkaccent dark:bg-darkaccent/5 dark:text-darkaccent'
                  : 'border-border text-secondary hover:border-accent/50 dark:border-darkborder dark:text-darkmuted'
              }`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </button>
          ))}
        </div>
      )
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'Integrations',
      description: 'Connect HireMind to your existing tools.',
      content: (
        <div className="space-y-3">
          {['Slack', 'Google Calendar', 'Greenhouse ATS', 'LinkedIn Recruiter'].map((tool) => (
            <div
              key={tool}
              className="flex items-center justify-between rounded-xl border border-border p-4 dark:border-darkborder"
            >
              <span className="text-sm font-medium text-primary dark:text-darktext">{tool}</span>
              <Button variant="secondary" size="sm">Connect</Button>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Security',
      description: 'Password and access control settings.',
      content: (
        <div className="space-y-4">
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold">Current Password</Caption>
            <input type="password" className="hm-input w-full max-w-sm" placeholder="••••••••" />
          </div>
          <div>
            <Caption as="label" className="mb-1.5 block font-semibold">New Password</Caption>
            <input type="password" className="hm-input w-full max-w-sm" placeholder="••••••••" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4 dark:border-darkborder">
            <div>
              <div className="text-sm font-medium text-primary dark:text-darktext">Two-Factor Authentication</div>
              <div className="mt-0.5 text-xs text-secondary dark:text-darkmuted">Add an extra layer of security</div>
            </div>
            <Button variant="secondary" size="sm"><Shield className="h-3.5 w-3.5" />Enable 2FA</Button>
          </div>
          <Button variant="accent">Update Password</Button>
        </div>
      )
    },
  ];

  return (
    <>
      <PageTitle
        title="Settings"
        subtitle="Manage your profile, workspace, notifications, and integrations."
      />

      <div className="space-y-5">
        {sections.map((section, i) => (
          <Card key={section.title} className="overflow-hidden">
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
        ))}
      </div>
    </>
  );
}
