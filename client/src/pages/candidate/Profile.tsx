import { useState } from 'react';
import { User, Link2, Globe, Sparkles, Save, CheckCircle } from 'lucide-react';
import { Badge, Button, Card, PageTitle, SectionTitle, BodyText } from '../../components/ui';

export function CandidateProfileEdit() {
  const [name, setName] = useState('Sarah Chen');
  const [email, setEmail] = useState('sarah.chen@example.com');
  const [githubUrl, setGithubUrl] = useState('https://github.com/sarahchen-dev');
  const [linkedinUrl, setLinkedinUrl] = useState('https://linkedin.com/in/sarah-chen');
  const [portfolioUrl, setPortfolioUrl] = useState('https://sarahchen-dev.dev');
  const [leetcodeUsername, setLeetcodeUsername] = useState('sarahc');

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="My Professional Profile"
        subtitle="Manage your social details, developer handles, and credentials synced with the hiring platform."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-semibold text-primary dark:text-darktext">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="hm-input w-full"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-semibold text-primary dark:text-darktext">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="hm-input w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary dark:text-darktext">GitHub Link</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                  <input
                    type="url"
                    required
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="hm-input w-full pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary dark:text-darktext">LinkedIn Link</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                  <input
                    type="url"
                    required
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="hm-input w-full pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary dark:text-darktext">Portfolio Link</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="hm-input w-full pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary dark:text-darktext">LeetCode Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary dark:text-darkmuted" />
                  <input
                    type="text"
                    required
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                    className="hm-input w-full pl-9"
                  />
                </div>
              </div>

              {saved && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-xs text-success">
                  <CheckCircle className="h-4 w-4" />
                  Profile details updated successfully!
                </div>
              )}

              <Button type="submit" variant="accent" className="w-full">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar credentials summary */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <SectionTitle>Social Integrations</SectionTitle>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary dark:text-darkmuted">GitHub Status</span>
                <Badge tone="green">Connected</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary dark:text-darkmuted">LeetCode Status</span>
                <Badge tone="green">Connected</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary dark:text-darkmuted">LinkedIn Sync</span>
                <Badge tone="green">Active</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent dark:text-darkaccent">
              <Sparkles className="h-4 w-4" />
              AI Resume Matching
            </div>
            <BodyText variant="small" color="secondary">
              When applying, our Gemini AI compares your connected social profiles and projects with open requirements to explain matches. Keep handles active for optimal scoring.
            </BodyText>
          </Card>
        </div>
      </div>
    </div>
  );
}
