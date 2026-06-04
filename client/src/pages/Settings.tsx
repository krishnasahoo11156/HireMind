import { Bell, Monitor, Moon, Sun, UserCircle } from 'lucide-react';
import { Button, Card, PageTitle } from '../components/ui';
import { useAppStore } from '../store/appStore';

export function Settings() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  return (
    <>
      <PageTitle title="Settings" subtitle="Profile, notification, and appearance preferences." />
      <div className="grid grid-cols-[360px_1fr] gap-6">
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Theme</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button variant={theme === 'light' ? 'accent' : 'secondary'} onClick={() => setTheme('light')}><Sun className="h-4 w-4" />Light</Button>
            <Button variant={theme === 'dark' ? 'accent' : 'secondary'} onClick={() => setTheme('dark')}><Moon className="h-4 w-4" />Dark</Button>
            <Button variant={theme === 'system' ? 'accent' : 'secondary'} onClick={() => setTheme('system')}><Monitor className="h-4 w-4" />System</Button>
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2"><UserCircle className="h-5 w-5 text-accent dark:text-darkaccent" /><h2 className="text-xl font-semibold">Profile</h2></div>
            <div className="grid grid-cols-2 gap-4">
              <input className="hm-input" value="Maya Kapoor" readOnly />
              <input className="hm-input" value="recruiter@hiremind.ai" readOnly />
            </div>
          </Card>
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2"><Bell className="h-5 w-5 text-accent dark:text-darkaccent" /><h2 className="text-xl font-semibold">Notifications</h2></div>
            <label className="flex items-center justify-between rounded-2xl border border-border p-4 text-sm dark:border-darkborder">
              Email me when rankings are generated
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-accent" />
            </label>
          </Card>
        </div>
      </div>
    </>
  );
}
