import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, Clock, Gauge, Users, TrendingUp, Target, Zap } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import type { DashboardAnalytics } from '../types';
import { Card, PageTitle, StatCard } from '../components/ui';

// ─── Chart Card ────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactElement }) {
  return (
    <Card className="p-6">
      <div className="mb-1">
        <h2 className="text-base font-semibold text-primary dark:text-darktext">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-secondary dark:text-darkmuted">{subtitle}</p>}
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── Custom tooltip ────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-card dark:border-darkborder dark:bg-darksurface">
      <p className="font-semibold text-primary dark:text-darktext">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-secondary dark:text-darkmuted">
          {p.name}: <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Analytics ─────────────────────────────────────────────────────────────
export function Analytics() {
  const analytics = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.analytics() as Promise<DashboardAnalytics>
  });
  const data = analytics.data;

  const funnelData = data
    ? Object.entries(data.funnel).map(([stage, value]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        value
      }))
    : [];

  const COLORS = ['#6366F1', '#8B5CF6', '#F59E0B', '#F97316', '#22C55E'];
  const DONUT_COLORS = ['#15803D', '#B45309'];

  return (
    <>
      <PageTitle
        title="Analytics"
        subtitle="Executive recruiting dashboard — real-time funnel, AI accuracy, and time saved."
      />

      <div className="space-y-8">
        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Resumes Reviewed"
            value={data?.metrics.resumesReviewed ?? 0}
            icon={<Users className="h-4 w-4" />}
            trend="up"
            trendLabel="this month"
          />
          <StatCard
            label="Candidates Selected"
            value={data?.metrics.candidatesSelected ?? 0}
            icon={<Activity className="h-4 w-4" />}
            trend="up"
            trendLabel="hired this cycle"
          />
          <StatCard
            label="Hours Saved"
            value={`${data?.metrics.timeSaved ?? 0}h`}
            icon={<Clock className="h-4 w-4" />}
            trend="up"
            trendLabel="vs manual screening"
          />
          <StatCard
            label="AI Decision Accuracy"
            value={`${data?.metrics.decisionAccuracy ?? 100}%`}
            icon={<Gauge className="h-4 w-4" />}
            trend="neutral"
            trendLabel="validated decisions"
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-2 gap-6">
          <ChartCard title="Hiring Funnel" subtitle="Candidates at each stage of the pipeline">
            <BarChart data={funnelData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartCard>

          <ChartCard title="Recruiter Activity" subtitle="Resume reviews per day">
            <LineChart data={data?.activity ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="resumes"
                name="Resumes"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-2 gap-6">
          <ChartCard title="AI Performance" subtitle="Agreement vs override rate">
            <PieChart>
              <Pie
                data={data?.aiPerformance ?? []}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                strokeWidth={0}
              >
                {(data?.aiPerformance ?? []).map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs font-medium text-secondary dark:text-darkmuted">{value}</span>}
              />
            </PieChart>
          </ChartCard>

          <ChartCard title="Override Reasons" subtitle="Why recruiters disagreed with AI">
            <BarChart data={data?.overrideReasons ?? []} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.04)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="reason" width={150} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#F59E0B" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ChartCard>
        </div>

        {/* Time Saved callout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            <div className="flex items-center gap-6 p-6">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-yellow-600">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-primary dark:text-darktext">Time Saved Calculator</h2>
                <p className="mt-1 text-sm text-secondary dark:text-darkmuted">
                  Formula: {data?.metrics.resumesReviewed ?? 0} resumes × 15 min / 60 ={' '}
                  <span className="font-bold text-accent dark:text-darkaccent">
                    {data?.metrics.timeSaved ?? 0} hours saved
                  </span>{' '}
                  vs manual screening.
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums text-primary dark:text-darktext">
                  {data?.metrics.timeSaved ?? 0}h
                </div>
                <div className="text-xs text-secondary dark:text-darkmuted">saved this cycle</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
