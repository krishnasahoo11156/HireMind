import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, Clock, Gauge, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../lib/api';
import type { DashboardAnalytics } from '../types';
import { Card, PageTitle, StatCard } from '../components/ui';

export function Analytics() {
  const analytics = useQuery({ queryKey: ['analytics'], queryFn: () => api.analytics() as Promise<DashboardAnalytics> });
  const data = analytics.data;

  return (
    <>
      <PageTitle title="Analytics" subtitle="Real-time recruiting funnel, AI accuracy, override reasons, and time saved calculations." />
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Resumes Reviewed" value={data?.metrics.resumesReviewed ?? 0} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Candidates Selected" value={data?.metrics.candidatesSelected ?? 0} icon={<Activity className="h-4 w-4" />} />
          <StatCard label="Time Saved" value={`${data?.metrics.timeSaved ?? 0}h`} icon={<Clock className="h-4 w-4" />} />
          <StatCard label="AI Decision Accuracy" value={`${data?.metrics.decisionAccuracy ?? 100}%`} icon={<Gauge className="h-4 w-4" />} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <ChartCard title="Hiring Funnel">
            <BarChart data={data ? Object.entries(data.funnel).map(([stage, value]) => ({ stage, value })) : []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#A16207" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartCard>
          <ChartCard title="Recruiter Activity">
            <LineChart data={data?.activity ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="resumes" stroke="#166534" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>
          <ChartCard title="AI Performance">
            <PieChart>
              <Pie data={data?.aiPerformance ?? []} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={4}>
                {(data?.aiPerformance ?? []).map((entry, index) => <Cell key={entry.name} fill={index === 0 ? '#166534' : '#B45309'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartCard>
          <ChartCard title="Override Reasons">
            <BarChart data={data?.overrideReasons ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="reason" width={140} />
              <Tooltip />
              <Bar dataKey="count" fill="#B45309" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ChartCard>
        </div>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3 text-accent dark:bg-darkaccent/10 dark:text-darkaccent"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-semibold">Time Saved Tracker</h2>
              <p className="mt-1 text-sm text-secondary dark:text-darkmuted">Formula: resumes reviewed x 15 minutes / 60 = {data?.metrics.timeSaved ?? 0} hours saved.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}
