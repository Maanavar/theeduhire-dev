"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, Download, TrendingDown } from "lucide-react";
import { PageShell, Panel, StatusBadge } from "@/components/layout/page-shell";

const FUNNEL_STAGES = [
  { label: "New Applicants", value: 128, dropped: 37, dropPct: 71.1 },
  { label: "Reviewed", value: 91, dropped: 55, dropPct: 39.6 },
  { label: "Shortlisted", value: 36, dropped: 18, dropPct: 50.0 },
  { label: "Interview Scheduled", value: 18, dropped: 7, dropPct: 61.1 },
  { label: "Interview Completed", value: 11, dropped: 5, dropPct: 54.5 },
  { label: "Hired", value: 6, dropped: 0, dropPct: 0 },
];

const STAGE_COLORS = [
  "bg-violet-400",
  "bg-violet-500",
  "bg-[var(--eh-primary-400)]",
  "bg-[var(--eh-primary-500)]",
  "bg-emerald-400",
  "bg-emerald-600",
];

const DROP_REASONS = [
  { label: "Low match score", count: 32, pct: 38 },
  { label: "Incomplete profile", count: 21, pct: 25 },
  { label: "Salary mismatch", count: 17, pct: 20 },
  { label: "No response", count: 14, pct: 17 },
];

const INTERVIEWERS = [
  { name: "Priya Raman", interviews: 24, completionRate: 79, hires: 3, avgFeedback: 1.2 },
  { name: "Arun Kumar", interviews: 20, completionRate: 70, hires: 2, avgFeedback: 1.6 },
  { name: "Divya Nair", interviews: 16, completionRate: 75, hires: 1, avgFeedback: 2.1 },
  { name: "Karthik S", interviews: 14, completionRate: 64, hires: 0, avgFeedback: 2.8 },
  { name: "Meera Krishnan", interviews: 12, completionRate: 66, hires: 0, avgFeedback: 3.0 },
];

const RECENT_ACTIVITY = [
  { icon: "✓", label: "Meera Krishnan was hired for Science Teacher", tag: "Hired", time: "24 May, 2025" },
  { icon: "📅", label: "5 interviews completed for Math Teacher", tag: "Completed", time: "24 May, 2025" },
  { icon: "👤", label: "18 new applicants for Physics Teacher", tag: "New", time: "24 May, 2025" },
];

export default function HiringFunnelInsightsPage() {
  const maxValue = Math.max(...FUNNEL_STAGES.map((s) => s.value));
  const overallConversion = ((6 / 128) * 100).toFixed(1);

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[var(--eh-text-3)]">
        <Link href="/dashboard/analytics" className="hover:text-[var(--eh-text-2)] flex items-center gap-1">
          <ArrowLeft size={13} /> Analytics
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--eh-text)]">Hiring Funnel Insights</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--eh-border)] pb-5">
        <div>
          <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)] sm:text-[26px]">Hiring Funnel Insights</h1>
          <p className="mt-1.5 text-[14px] text-[var(--eh-text-3)]">Understand conversion, bottlenecks, and recruiter activity.</p>
        </div>
        <div className="flex gap-2">
          <button className="eh-btn eh-btn-secondary">📅 18 May – 24 May, 2025 ▾</button>
          <button className="eh-btn eh-btn-secondary">All Jobs ▾</button>
          <button className="eh-btn eh-btn-secondary"><Download size={14} /> Download CSV</button>
        </div>
      </div>

      {/* Funnel Overview */}
      <Panel className="p-5">
        <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-5">Hiring Funnel Overview</h3>
        <div className="flex items-end gap-3 overflow-x-auto pb-2">
          {FUNNEL_STAGES.map((stage, i) => {
            const barHeight = Math.round((stage.value / maxValue) * 100);
            return (
              <div key={stage.label} className="flex min-w-[110px] flex-1 flex-col items-center">
                {/* Funnel block */}
                <div className="relative w-full">
                  <div className={`w-full rounded-t-xl ${STAGE_COLORS[i]} flex items-center justify-center py-4`} style={{ minHeight: `${Math.max(barHeight, 30)}px` }}>
                    <div className="text-center text-white">
                      <div className="flex h-8 w-8 mx-auto mb-1 items-center justify-center rounded-full bg-white/20">
                        <span className="text-[14px]">{i === 0 ? "👤" : i === 1 ? "📋" : i === 2 ? "⭐" : i === 3 ? "📅" : i === 4 ? "✓" : "🎉"}</span>
                      </div>
                      <p className="text-[20px] font-bold">{stage.value}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-center text-[11px] font-semibold text-[var(--eh-text-2)]">{stage.label}</p>
                {stage.dropPct > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500">
                    <TrendingDown size={10} />
                    <span>{stage.dropPct}% dropped</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {/* Stage Drop-off Reasons */}
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[var(--eh-text)]">Stage Drop-off Reasons</h3>
            <span className="text-[11px] text-[var(--eh-text-4)]">ⓘ</span>
          </div>
          <div className="space-y-3">
            {DROP_REASONS.map((reason) => (
              <div key={reason.label}>
                <div className="flex items-center justify-between mb-1 text-[13px]">
                  <span className="text-[var(--eh-text-2)]">{reason.label}</span>
                  <span className="font-semibold text-[var(--eh-text)]">{reason.count} ({reason.pct}%)</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-base)]">
                  <div className="h-full rounded-full bg-[var(--eh-primary-400)]" style={{ width: `${reason.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Interviewer Performance */}
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[var(--eh-text)]">Interviewer Performance</h3>
            <button className="text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">View all</button>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[var(--eh-border)]">
                {["Interviewer", "Interviews", "Completion Rate", "Hires", "Avg Feedback Time"].map((col) => (
                  <th key={col} className="pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--eh-border)]">
              {INTERVIEWERS.map((iv) => (
                <tr key={iv.name}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-100)] text-[10px] font-bold text-[var(--eh-primary-700)]">
                        {iv.name.charAt(0)}
                      </div>
                      <span className="font-medium text-[var(--eh-text-2)]">{iv.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-[var(--eh-text-2)]">{iv.interviews}</td>
                  <td className="py-2.5">
                    <span className={`font-semibold ${iv.completionRate >= 75 ? "text-emerald-600" : "text-amber-600"}`}>{iv.completionRate}%</span>
                  </td>
                  <td className="py-2.5 text-[var(--eh-text-2)]">{iv.hires}</td>
                  <td className="py-2.5 text-[var(--eh-text-2)]">{iv.avgFeedback} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Time in Stage */}
        <Panel className="p-5">
          <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-4">Time in Stage (Avg. Days)</h3>
          <div className="space-y-2">
            {[
              { label: "Reviewed", days: 2.1, icon: "📋" },
              { label: "Shortlisted", days: 2.8, icon: "⭐" },
              { label: "Interview Scheduled", days: 3.6, icon: "📅" },
              { label: "Offer (To Hired)", days: 2.4, icon: "🎉" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="shrink-0 text-[16px]">{item.icon}</span>
                <div className="flex flex-1 items-center justify-between rounded-lg bg-[var(--surface-base)] px-3 py-2">
                  <span className="text-[13px] text-[var(--eh-text-2)]">{item.label}</span>
                  <span className="text-[13px] font-bold text-[var(--eh-primary-700)]">{item.days} days</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Recent Funnel Activity */}
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[var(--eh-text)]">Recent Funnel Activity</h3>
            <button className="text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">View all</button>
          </div>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--eh-border)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-base)] text-[14px]">{item.icon}</div>
                  <p className="text-[13px] text-[var(--eh-text-2)]">{item.label}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-[var(--eh-text-4)]">{item.time}</span>
                  <StatusBadge tone={item.tag === "Hired" ? "success" : item.tag === "Completed" ? "neutral" : "brand"}>{item.tag}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Weekly Health Score */}
      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--eh-text)]">Weekly Hiring Health Score</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[48px] font-bold leading-none text-[var(--eh-primary-700)]">78</span>
              <div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-bold text-emerald-700">↑ 8 pts vs last week</span>
                <p className="mt-1 text-[12px] text-emerald-600 font-medium">Strong progress! Keep optimizing shortlisting and interview flow.</p>
              </div>
            </div>
            <button className="mt-2 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">View full report →</button>
          </div>
          <div className="min-w-[200px] flex-1 max-w-[300px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)] mb-3">Overall Conversion</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[var(--eh-primary-700)]">{overallConversion}%</span>
              <span className="text-[13px] text-[var(--eh-text-3)]">Hired / Total</span>
            </div>
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
