import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, EmptyState, ErrorNote, Spinner } from 'shell/ui';
import type { Funnel, HttpClient, MatchStats, SourceCount } from './types';
import { funnelSteps, pretty, scoreBuckets } from './stats';
import './index.css';

// single-series charts: one categorical slot (reference palette slot 1), recessive grid and axes
const SERIES = '#2a78d6';
const GRID = '#e5e7eb';
const AXIS = '#6b7280';
const tick = { fill: AXIS, fontSize: 12 };
const tooltipStyle = { borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 };

function ChartCard<T extends Record<string, unknown>>({
  title,
  subtitle,
  rows,
  columns,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  rows: T[];
  columns: [keyof T & string, string][];
  empty: boolean;
  children: ReactNode;
}) {
  const [table, setTable] = useState(false);
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        {!empty && (
          <button className="text-xs font-medium text-indigo-600 hover:underline" onClick={() => setTable((t) => !t)}>
            {table ? 'Show chart' : 'Show table'}
          </button>
        )}
      </div>
      {empty ? (
        <EmptyState title="No data yet" />
      ) : table ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              {columns.map(([, label]) => (
                <th key={label} className="pb-1 font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                {columns.map(([k]) => (
                  <td key={k} className="py-1 tabular-nums text-slate-700">{String(r[k] ?? '–')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="h-64">{children}</div>
      )}
    </Card>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}

function Dashboard({ core, ingest, match }: { core: HttpClient; ingest: HttpClient; match: HttpClient }) {
  const funnel = useQuery({ queryKey: ['funnel'], queryFn: async () => (await core.get<Funnel>('/stats/funnel')).data });
  const sources = useQuery({ queryKey: ['sources'], queryFn: async () => (await ingest.get<SourceCount[]>('/stats/sources')).data });
  const matches = useQuery({ queryKey: ['matchStats'], queryFn: async () => (await match.get<MatchStats>('/stats/matches')).data });

  if (funnel.isLoading || sources.isLoading || matches.isLoading) return <Spinner label="Loading insights" />;

  const steps = funnelSteps(funnel.data);
  const buckets = scoreBuckets(matches.data?.scoreDistribution ?? []);
  const sourceRows = (sources.data ?? []).map((s) => ({ source: pretty(s.source), total: Number(s.total), lastWeek: Number(s.lastWeek) }));
  const gaps = (matches.data?.topSkillGaps ?? []).map((g) => ({ skill: g.skill, count: Number(g.count) }));
  const totalMatches = buckets.reduce((n, b) => n + b.count, 0);
  const saved = Number(matches.data?.byStatus.find((s) => s.status === 'SAVED')?.count ?? 0);
  const applied = steps[1].count;
  const interviews = steps[2].count;
  const errors = [funnel.error, sources.error, matches.error].filter(Boolean) as Error[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Insights</h1>
        <p className="text-sm text-slate-500">Where jobs come from, how well they fit, and how your applications convert.</p>
      </div>
      {errors.map((e, i) => (
        <ErrorNote key={i} message={`Some data could not be loaded: ${e.message}`} />
      ))}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Matches" value={totalMatches} hint="scored 40%+" />
        <Kpi label="Saved from feed" value={saved} />
        <Kpi label="Applied" value={applied} />
        <Kpi label="Interview rate" value={applied ? `${Math.round((100 * interviews) / applied)}%` : '–'} hint={`${interviews} interviews`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Application funnel"
          subtitle="Cards that ever reached each stage, with step conversion"
          rows={steps}
          columns={[['stage', 'Stage'], ['count', 'Applications'], ['conversion', 'Conversion %']]}
          empty={steps.every((s) => s.count === 0)}
        >
          <ResponsiveContainer>
            <BarChart data={steps} layout="vertical" margin={{ left: 8, right: 48 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
              <YAxis type="category" interval={0} dataKey="stage" tick={tick} axisLine={false} tickLine={false} width={72} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }}
                formatter={(v, _n, p) => [`${v}${p.payload.conversion != null ? ` (${p.payload.conversion}% of previous)` : ''}`, 'Applications']} />
              <Bar dataKey="count" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={28}>
                <LabelList dataKey="count" position="right" fill="#334155" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Match score distribution"
          subtitle="How well ingested jobs fit your profile"
          rows={buckets}
          columns={[['label', 'Score'], ['count', 'Matches']]}
          empty={totalMatches === 0}
        >
          <ResponsiveContainer>
            <BarChart data={buckets} margin={{ top: 16 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} formatter={(v) => [v, 'Matches']} />
              <Bar dataKey="count" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Jobs ingested per source"
          subtitle="All time; hover for the last 7 days"
          rows={sourceRows}
          columns={[['source', 'Source'], ['total', 'Total'], ['lastWeek', 'Last 7 days']]}
          empty={sourceRows.length === 0}
        >
          <ResponsiveContainer>
            <BarChart data={sourceRows} layout="vertical" margin={{ left: 8, right: 48 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
              <YAxis type="category" interval={0} dataKey="source" tick={tick} axisLine={false} tickLine={false} width={104} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }}
                formatter={(v, _n, p) => [`${v} (${p.payload.lastWeek} in last 7 days)`, 'Jobs']} />
              <Bar dataKey="total" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={24}>
                <LabelList dataKey="total" position="right" fill="#334155" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top skill gaps"
          subtitle="Skills your matches ask for that your profile lacks"
          rows={gaps}
          columns={[['skill', 'Skill'], ['count', 'Matches asking for it']]}
          empty={gaps.length === 0}
        >
          <ResponsiveContainer>
            <BarChart data={gaps} layout="vertical" margin={{ left: 8, right: 40 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
              <YAxis type="category" interval={0} dataKey="skill" tick={tick} axisLine={false} tickLine={false} width={104} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} formatter={(v) => [v, 'Matches']} />
              <Bar dataKey="count" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={20}>
                <LabelList dataKey="count" position="right" fill="#334155" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

/** Exposed as insights/Insights. Takes one client per backend service. */
export default function Insights(props: { core: HttpClient; ingest: HttpClient; match: HttpClient }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } }));
  return (
    <QueryClientProvider client={client}>
      <Dashboard {...props} />
    </QueryClientProvider>
  );
}
