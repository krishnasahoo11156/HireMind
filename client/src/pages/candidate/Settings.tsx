import { useAppStore } from '../../store/appStore';
import { Shield, Sparkles, Moon, Sun } from 'lucide-react';
import { Card, PageTitle, SectionTitle, BodyText } from '../../components/ui';

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
        <Card className="p-6 space-y-4">
          <SectionTitle>Display Theme</SectionTitle>
          <BodyText variant="small" color="secondary">
            Toggle dark mode to adjust the HireMind interface for high/low contrast settings.
          </BodyText>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold transition-colors ${
                theme === 'light' ? 'bg-accent/10 border-accent text-accent' : 'bg-surface dark:border-darkborder text-secondary'
              }`}
            >
              <Sun className="h-4 w-4" />
              Light Mode
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold transition-colors ${
                theme === 'dark' ? 'bg-darkaccent/10 border-darkaccent text-darkaccent' : 'bg-surface dark:border-darkborder text-secondary'
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark Mode
            </button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <SectionTitle>Blind Hiring Profile</SectionTitle>
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
        </Card>
      </div>
    </div>
  );
}
