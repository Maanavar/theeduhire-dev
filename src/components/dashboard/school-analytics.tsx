"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SchoolAnalytics } from "@/types";
import { Panel, PanelHeader, StatusBadge } from "@/components/layout/page-shell";

interface SchoolAnalyticsProps {
  data: SchoolAnalytics;
}

const CHART_COLORS = {
  primary: "var(--eh-primary-600)",
  primaryLight: "var(--eh-primary-100)",
  shortlisted: "#d97706",
  hired: "#059669",
  grid: "rgba(15,23,42,0.06)",
  tooltip: {
    bg: "#ffffff",
    border: "rgba(15,23,42,0.1)",
    radius: "10px",
    padding: "10px 14px",
    fontSize: "12px",
  },
};

function tooltipStyle() {
  return {
    backgroundColor: CHART_COLORS.tooltip.bg,
    border: `1px solid ${CHART_COLORS.tooltip.border}`,
    borderRadius: CHART_COLORS.tooltip.radius,
    padding: CHART_COLORS.tooltip.padding,
    fontSize: CHART_COLORS.tooltip.fontSize,
    fontFamily: "inherit",
    boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
  };
}

function axisTickStyle() {
  return { fontSize: 11, fill: "rgba(15,23,42,0.35)", fontFamily: "inherit" };
}

// ── Activity status label map ────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; tone: "success" | "warning" | "info" | "danger" | "neutral" | "brand" }> = {
  PENDING:            { label: "Applied",      tone: "neutral" },
  REVIEWED:           { label: "Reviewed",     tone: "info" },
  SHORTLISTED:        { label: "Shortlisted",  tone: "brand" },
  INTERVIEW_SCHEDULED:{ label: "Interview",    tone: "warning" },
  OFFERED:            { label: "Offered",      tone: "success" },
  HIRED:              { label: "Hired",        tone: "success" },
  REJECTED:           { label: "Rejected",     tone: "danger" },
  WITHDRAWN:          { label: "Withdrawn",    tone: "neutral" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function SchoolAnalytics({ data }: SchoolAnalyticsProps) {
  const { summary, trend, jobPerformance, recentActivity } = data;

  const hasTrendData = trend?.length > 0 && trend.some((d) => d.applications > 0);
  const hasJobData = jobPerformance?.length > 0;
  const hasActivity = recentActivity?.length > 0;

  // Conversion rates
  const shortlistRate =
    summary.totalApplications > 0
      ? Math.round((summary.shortlisted / summary.totalApplications) * 100)
      : 0;
  const hireRate =
    summary.shortlisted > 0
      ? Math.round((summary.hired / summary.shortlisted) * 100)
      : 0;

  // Funnel data
  const funnel = [
    { label: "Applications", value: summary.totalApplications, color: "#0a66c2" },
    { label: "Shortlisted",  value: summary.shortlisted,       color: "#d97706" },
    { label: "Hired",        value: summary.hired,             color: "#059669" },
  ];
  const funnelMax = Math.max(summary.totalApplications, 1);

  // Format trend dates
  const trendFormatted = (trend || []).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="space-y-5">
      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile
          label="Total jobs"
          value={summary.totalJobs}
          sub={`${summary.activeJobs} active`}
          tone="brand"
        />
        <SummaryTile
          label="Total applications"
          value={summary.totalApplications}
          sub={`${shortlistRate}% shortlist rate`}
          tone="info"
        />
        <SummaryTile
          label="Hired"
          value={summary.hired}
          sub={`${hireRate}% of shortlisted`}
          tone="success"
        />
        <SummaryTile
          label="Avg time to hire"
          value={summary.avgTimeToHireDays != null ? `${Math.round(summary.avgTimeToHireDays)}d` : "—"}
          sub="From application to hire"
          tone="neutral"
        />
      </div>

      {/* ── Conversion funnel ── */}
      <Panel className="p-5">
        <PanelHeader
          title="Hiring funnel"
          subtitle="How applications convert through each stage."
          compact
        />
        <div className="space-y-3">
          {funnel.map((stage) => {
            const pct = Math.round((stage.value / funnelMax) * 100);
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="w-[110px] shrink-0 text-[13px] font-medium text-[var(--eh-text-2)]">
                  {stage.label}
                </span>
                <div className="relative flex-1 overflow-hidden rounded-md bg-[var(--surface-base)] h-6">
                  <div
                    className="absolute left-0 top-0 h-full rounded-md transition-all duration-700"
                    style={{
                      width: stage.value > 0 ? `${Math.max(pct, 6)}%` : "0%",
                      background: stage.color,
                    }}
                  />
                </div>
                <div className="flex w-16 shrink-0 items-center justify-between gap-2 text-right">
                  <span className="text-[13px] font-semibold tabular-nums text-[var(--eh-text)]">
                    {stage.value}
                  </span>
                  {stage.value > 0 && stage.label !== "Applications" ? (
                    <span className="text-[11px] font-medium text-[var(--eh-text-4)]">
                      {pct}%
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ── Trend + Job performance ── */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Applications trend */}
        <Panel className="p-5">
          <PanelHeader
            title="Applications over time"
            subtitle="Last 30 days of inbound applications."
            compact
          />
          {!hasTrendData ? (
            <EmptyChart message="No applications yet — post jobs to start seeing trends." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendFormatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-apps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0a66c2" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#0a66c2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={axisTickStyle()}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(trendFormatted.length / 6)}
                />
                <YAxis
                  tick={axisTickStyle()}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle()} cursor={{ stroke: "#0a66c2", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke="#0a66c2"
                  strokeWidth={2}
                  fill="url(#grad-apps)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#0a66c2" }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Job performance */}
        <Panel className="p-5">
          <PanelHeader
            title="Job performance"
            subtitle="Applications, shortlisted, and hired per job."
            compact
          />
          {!hasJobData ? (
            <EmptyChart message="Post your first job to see per-role performance." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={jobPerformance.slice(0, 8)}
                margin={{ top: 4, right: 4, left: -20, bottom: 40 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="title"
                  tick={axisTickStyle()}
                  tickLine={false}
                  axisLine={false}
                  angle={-35}
                  textAnchor="end"
                  tickFormatter={(v) => (v?.length > 12 ? v.slice(0, 12) + "…" : v || "")}
                />
                <YAxis
                  tick={axisTickStyle()}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: "rgba(15,23,42,0.03)" }} />
                <Bar dataKey="applicationCount" name="Applications" fill="#0a66c2" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="shortlistedCount" name="Shortlisted" fill="#d97706" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="hiredCount" name="Hired" fill="#059669" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {hasJobData ? (
            <div className="mt-3 flex items-center gap-4">
              {[
                { color: "#0a66c2", label: "Applications" },
                { color: "#d97706", label: "Shortlisted" },
                { color: "#059669", label: "Hired" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--eh-text-3)]">
                  <span className="h-2 w-2 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          ) : null}
        </Panel>
      </div>

      {/* ── Per-job detail table ── */}
      {hasJobData ? (
        <Panel>
          <div className="border-b border-[var(--eh-border)] px-5 py-3.5">
            <h2 className="text-[14px] font-semibold text-[var(--eh-text)]">Job breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--eh-border)]">
                  {["Role", "Applications", "Shortlisted", "Hired", "Shortlist rate"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobPerformance.map((job) => {
                  const rate =
                    job.applicationCount > 0
                      ? Math.round((job.shortlistedCount / job.applicationCount) * 100)
                      : 0;
                  return (
                    <tr
                      key={job.jobId}
                      className="border-b border-[var(--eh-border)] transition-colors last:border-b-0 hover:bg-[var(--surface-base)]"
                    >
                      <td className="px-5 py-3 text-[13px] font-medium text-[var(--eh-text)]">
                        {job.title}
                      </td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-[var(--eh-text-2)]">
                        {job.applicationCount}
                      </td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-[var(--eh-text-2)]">
                        {job.shortlistedCount}
                      </td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-[var(--eh-text-2)]">
                        {job.hiredCount}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-[var(--surface-base)]">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-[var(--eh-primary-500)]"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-semibold tabular-nums text-[var(--eh-text-2)]">
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {/* ── Recent activity feed ── */}
      {hasActivity ? (
        <Panel className="p-5">
          <PanelHeader
            title="Recent activity"
            subtitle="Latest status changes across all your job applications."
            compact
          />
          <div className="space-y-0">
            {recentActivity.slice(0, 10).map((item, idx) => {
              const meta = STATUS_META[item.toStatus] || { label: item.toStatus, tone: "neutral" as const };
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 border-t border-[var(--eh-border)] py-3 first:border-t-0 first:pt-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-base)] text-[11px] font-bold text-[var(--eh-text-3)]">
                    {item.applicantName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">
                      {item.applicantName}
                    </p>
                    <p className="truncate text-[11px] text-[var(--eh-text-3)]">{item.jobTitle}</p>
                  </div>
                  <StatusBadge tone={meta.tone as any}>{meta.label}</StatusBadge>
                  <span className="shrink-0 text-[11px] text-[var(--eh-text-4)]">
                    {timeAgo(item.changedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function SummaryTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number | string;
  sub: string;
  tone: "brand" | "info" | "success" | "neutral";
}) {
  const accentBar: Record<typeof tone, string> = {
    brand: "bg-[var(--eh-primary-500)]",
    info: "bg-sky-500",
    success: "bg-emerald-500",
    neutral: "bg-slate-400",
  };
  const valueColor: Record<typeof tone, string> = {
    brand: "text-[var(--eh-primary-700)]",
    info: "text-sky-700",
    success: "text-emerald-700",
    neutral: "text-[var(--eh-text)]",
  };
  return (
    <div className="rounded-xl border border-[var(--eh-border)] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className={`mb-3 h-0.5 w-6 rounded-full ${accentBar[tone]}`} />
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
        {label}
      </p>
      <p className={`mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em] ${valueColor[tone]}`}>
        {value}
      </p>
      <p className="mt-2 text-[12px] text-[var(--eh-text-3)]">{sub}</p>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-[var(--eh-border)]">
      <p className="max-w-[240px] text-center text-[13px] text-[var(--eh-text-3)]">{message}</p>
    </div>
  );
}
