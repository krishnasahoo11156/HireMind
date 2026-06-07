import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, Clock, Gauge, Users, TrendingUp, Target, Zap } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import type { DashboardAnalytics } from '../types';
import { Card, PageTitle, StatCard, DisplayTitle, SectionTitle, CardTitle, BodyText, Caption } from '../components/ui';
import { useAppStore } from '../store/appStore';

// ─── Chart Card ────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactElement }) {
  return (
    <Card className="p-6">
      <div className="mb-1">
        <CardTitle>{title}</CardTitle>
        {subtitle && <Caption className="mt-0.5 block">{subtitle}</Caption>}
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
  const theme = useAppStore((state) => state.theme);
  
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

  const colors = theme === 'dark'
    ? ['#F9FAFB', '#D1D5DB', '#9CA3AF', '#4B5563', '#374151']
    : ['#111827', '#374151', '#4B5563', '#9CA3AF', '#D1D5DB'];

  const donutColors = theme === 'dark'
    ? ['#10B981', '#374151']
    : ['#059669', '#9CA3AF'];

  const brandAccent = theme === 'dark' ? '#D4A017' : '#A16207';
  const gridStroke = theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const labelColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';

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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="stage" tick={{ fontSize: 12, fill: labelColor }} stroke={gridStroke} />
              <YAxis tick={{ fontSize: 12, fill: labelColor }} stroke={gridStroke} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartCard>

          <ChartCard title="Recruiter Activity" subtitle="Resume reviews per day">
            <LineChart data={data?.activity ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: labelColor }} stroke={gridStroke} />
              <YAxis tick={{ fontSize: 12, fill: labelColor }} stroke={gridStroke} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="resumes"
                name="Resumes"
                stroke={brandAccent}
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
                  <Cell key={i} fill={donutColors[i % donutColors.length]} />
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
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
              <XAxis type="number" tick={{ fontSize: 12, fill: labelColor }} stroke={gridStroke} />
              <YAxis type="category" dataKey="reason" width={150} tick={{ fontSize: 11, fill: labelColor }} stroke={gridStroke} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={brandAccent} radius={[0, 8, 8, 0]} />
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
                <CardTitle>Time Saved Calculator</CardTitle>
                <BodyText variant="default" color="secondary" className="mt-1">
                  Formula: {data?.metrics.resumesReviewed ?? 0} resumes × 15 min / 60 ={' '}
                  <span className="font-bold text-accent dark:text-darkaccent font-sans">
                    {data?.metrics.timeSaved ?? 0} hours saved
                  </span>{' '}
                  vs manual screening.
                </BodyText>
              </div>
              <div className="text-right">
                <div className="font-heading text-[40px] font-bold leading-[1.1] tracking-[-0.04em] tabular-nums text-primary dark:text-darktext">
                  {data?.metrics.timeSaved ?? 0}h
                </div>
                <Caption className="block">saved this cycle</Caption>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
