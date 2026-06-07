import { useAppStore } from '../../store/appStore';
import { Shield, Moon, Sun, Monitor } from 'lucide-react';
import { Card, PageTitle, CardTitle, Caption, BodyText } from '../../components/ui';

export function CandidateSettings() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const blindMode = useAppStore((state) => state.blindMode);
  const toggleBlindMode = useAppStore((state) => state.toggleBlindMode);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Settings & Privacy"
        subtitle="Manage candidate account layout options, dark mode preferences, and blind data protections."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden !p-0">
          <div className="flex items-start gap-4 border-b border-border bg-background/50 px-6 py-4 dark:border-darkborder dark:bg-darkbg/50">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Display Theme</CardTitle>
              <Caption className="block mt-0.5">Choose your preferred visual theme.</Caption>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <BodyText variant="small" color="secondary">
              Toggle dark mode to adjust the HireMind interface for high/low contrast settings.
            </BodyText>
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
          </div>
        </Card>

        <Card className="overflow-hidden !p-0">
          <div className="flex items-start gap-4 border-b border-border bg-background/50 px-6 py-4 dark:border-darkborder dark:bg-darkbg/50">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/10 text-accent dark:bg-darkaccent/10 dark:text-darkaccent">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Blind Hiring Profile</CardTitle>
              <Caption className="block mt-0.5">Toggle anonymous recruitment view profile status.</Caption>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <BodyText variant="small" color="secondary">
              Toggle Blind Recruitment mode to view your profile using an anonymous ID (e.g. Candidate-4A2D), hiding name, email, and specific education metadata.
            </BodyText>
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary dark:text-darktext">
                <Shield className="h-4 w-4 text-accent dark:text-darkaccent" />
                Enable Blind Mode Preview
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={blindMode}
                  onChange={toggleBlindMode}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-darkborder peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent dark:peer-checked:bg-darkaccent"></div>
              </label>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
