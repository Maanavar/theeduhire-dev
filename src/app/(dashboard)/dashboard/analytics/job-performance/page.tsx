"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpDown, ChevronRight } from "lucide-react";
import { PageShell, Panel } from "@/components/layout/page-shell";

const MOCK_JOBS = [
  { title: "Math Teacher - CBSE", applicants: 42, shortlisted: 8, interviews: 3, hired: 1, avgMatch: 82, daysLive: 15, status: "ACTIVE" },
  { title: "Science Teacher", applicants: 36, shortlisted: 6, interviews: 2, hired: 1, avgMatch: 78, daysLive: 12, status: "ACTIVE" },
  { title: "Physics Teacher", applicants: 28, shortlisted: 5, interviews: 0, hired: 0, avgMatch: 74, daysLive: 10, status: "ACTIVE" },
  { title: "English Teacher", applicants: 18, shortlisted: 3, interviews: 1, hired: 1, avgMatch: 83, daysLive: 8, status: "ACTIVE" },
  { title: "Chemistry Teacher", applicants: 24, shortlisted: 4, interviews: 1, hired: 0, avgMatch: 76, daysLive: 11, status: "ACTIVE" },
];

const SCORE_DISTRIBUTION = [
  { label: "90–100", count: 11, pct: 26.2, color: "bg-emerald-500" },
  { label: "80–89", count: 17, pct: 40.5, color: "bg-[var(--eh-primary-500)]" },
  { label: "70–79", count: 9, pct: 21.4, color: "bg-amber-400" },
  { label: "Below 70", count: 5, pct: 11.9, color: "bg-red-400" },
];

const DROP_OFF = [
  { from: "Viewed → Applied", count: 270, pct: 86.5, color: "bg-red-400" },
  { from: "Applied → Reviewed", count: 20, pct: 47.6, color: "bg-amber-400" },
  { from: "Reviewed → Shortlisted", count: 14, pct: 63.6, color: "bg-amber-300" },
  { from: "Shortlisted → Interviewed", count: 5, pct: 62.5, color: "bg-sky-400" },
  { from: "Interviewed → Hired", count: 2, pct: 66.7, color: "bg-emerald-500" },
];

export default function JobPerformancePage() {
  const [selectedJob, setSelectedJob] = useState(MOCK_JOBS[0]);

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[var(--eh-text-3)]">
        <Link href="/dashboard/analytics" className="hover:text-[var(--eh-text-2)] flex items-center gap-1">
          <ArrowLeft size={13} /> Analytics
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--eh-text)]">Job Performance</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--eh-border)] pb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)]">Job Performance</h1>
          <select className="input-base max-w-[220px]" value={selectedJob.title} onChange={(e) => { const j = MOCK_JOBS.find((job) => job.title === e.target.value); if (j) setSelectedJob(j); }}>
            {MOCK_JOBS.map((job) => <option key={job.title}>{job.title}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="eh-btn eh-btn-secondary">📅 10 May – 25 May ▾</button>
          <button className="eh-btn eh-btn-secondary"><ArrowUpDown size={14} /> Compare Jobs</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Total Applicants", value: selectedJob.applicants, color: "bg-[var(--eh-primary-500)]", textColor: "text-[var(--eh-primary-700)]", hint: "↑ 24 vs prev 15d" },
          { label: "Shortlisted", value: selectedJob.shortlisted, color: "bg-emerald-500", textColor: "text-emerald-700", hint: "↑ 6 vs prev 15d" },
          { label: "Interviews", value: selectedJob.interviews, color: "bg-amber-400", textColor: "text-amber-700", hint: "↑ 2 vs prev 15d" },
          { label: "Hired", value: selectedJob.hired, color: "bg-emerald-600", textColor: "text-emerald-800", hint: "↑ 1 vs prev 15d" },
          { label: "Avg. Match Score", value: `${selectedJob.avgMatch}%`, color: "bg-[var(--eh-primary-400)]", textColor: "text-[var(--eh-primary-700)]", hint: "↑ 5% vs prev 15d" },
          { label: "Days Live", value: selectedJob.daysLive, color: "bg-slate-400", textColor: "text-slate-700", hint: "No change" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[var(--eh-border)] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className={`mb-3 h-0.5 w-6 rounded-full ${m.color}`} />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">{m.label}</p>
            <p className={`mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em] ${m.textColor}`}>{m.value}</p>
            <p className="mt-2 text-[11px] text-[var(--eh-text-4)]">{m.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {/* Applicants Funnel */}
        <Panel className="p-5">
          <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-4">Applicants Funnel</h3>
          <div className="space-y-2">
            {[
              { label: "Viewed", value: 312, pct: null },
              { label: "Applied", value: selectedJob.applicants, pct: 13.5 },
              { label: "Reviewed", value: 22, pct: 52.4, color: "text-[var(--eh-primary-700)]" },
              { label: "Shortlisted", value: selectedJob.shortlisted, pct: 36.4, color: "text-amber-700" },
              { label: "Interviewed", value: selectedJob.interviews, pct: 37.5, color: "text-amber-700" },
              { label: "Hired", value: selectedJob.hired, pct: 33.3, color: "text-emerald-700" },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center justify-between rounded-lg bg-[var(--surface-base)] px-4 py-2.5">
                <span className="text-[13px] font-medium text-[var(--eh-text-2)]">{stage.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-bold text-[var(--eh-text)]">{stage.value}</span>
                  {stage.pct !== null && (
                    <span className={`text-[12px] font-semibold ${stage.color || "text-[var(--eh-text-3)]"}`}>{stage.pct}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* AI Match Score Distribution */}
        <Panel className="p-5">
          <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-4">AI Match Score Distribution</h3>
          <div className="flex items-center gap-6">
            {/* Donut placeholder */}
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-8 border-[var(--eh-primary-500)] bg-white">
              <span className="text-[15px] font-bold text-[var(--eh-text)]">{selectedJob.applicants}</span>
            </div>
            <div className="space-y-2 flex-1">
              {SCORE_DISTRIBUTION.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full shrink-0 ${item.color}`} />
                  <span className="flex-1 text-[12px] text-[var(--eh-text-2)]">{item.label}</span>
                  <span className="text-[12px] font-semibold text-[var(--eh-text)]">{item.count} ({item.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
          <button className="mt-3 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">View full breakdown →</button>
        </Panel>

        {/* Application Drop-off */}
        <Panel className="p-5">
          <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-4">Application Drop-off</h3>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[var(--eh-border)]">
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">Stage</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">Drop-off</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">Drop-off %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--eh-border)]">
              {DROP_OFF.map((item) => (
                <tr key={item.from}>
                  <td className="py-2.5 text-[var(--eh-text-2)]">{item.from}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--surface-base)]">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="font-semibold text-[var(--eh-text)]">{item.count}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-red-500">{item.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Top Job Posts Comparison */}
        <Panel className="p-5">
          <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-4">Top Job Posts Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-[12px]">
              <thead>
                <tr className="border-b border-[var(--eh-border)]">
                  {["Job", "Applicants", "Shortlisted", "Interviews", "Hires", "Avg Match", "Conversion"].map((col) => (
                    <th key={col} className="pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--eh-border)]">
                {MOCK_JOBS.map((job) => (
                  <tr key={job.title} className="hover:bg-[var(--surface-base)] transition-colors">
                    <td className="py-2.5 font-medium text-[var(--eh-primary-600)]">{job.title}</td>
                    <td className="py-2.5 text-[var(--eh-text-2)]">{job.applicants}</td>
                    <td className="py-2.5 text-[var(--eh-text-2)]">{job.shortlisted} ({Math.round(job.shortlisted / job.applicants * 100)}%)</td>
                    <td className="py-2.5 text-[var(--eh-text-2)]">{job.interviews} ({Math.round(job.interviews / job.applicants * 100)}%)</td>
                    <td className="py-2.5 text-[var(--eh-text-2)]">{job.hired} ({Math.round(job.hired / job.applicants * 100)}%)</td>
                    <td className="py-2.5">
                      <span className={`font-semibold ${job.avgMatch >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{job.avgMatch}%</span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-12 overflow-hidden rounded-full bg-[var(--surface-base)]">
                          <div className="h-full rounded-full bg-[var(--eh-primary-400)]" style={{ width: `${job.hired / job.applicants * 100 * 10}%` }} />
                        </div>
                        <span className="text-[var(--eh-text-3)]">{(job.hired / job.applicants * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="mt-3 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">View all jobs analytics →</button>
        </Panel>
      </div>

      {/* Recommended Actions */}
      <Panel className="p-5">
        <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-4">Recommended Actions</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: "🚀", title: "Boost visibility", desc: "Repost to top job boards to reach more qualified candidates.", action: "Boost Job" },
            { icon: "🎯", title: "Improve match quality", desc: "Tighten must-have criteria to increase shortlist quality.", action: "Edit Criteria" },
            { icon: "⚡", title: "Speed up response", desc: "Respond faster to high-match applicants to reduce drop-offs.", action: "Set SLA Alerts" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl border border-[var(--eh-border)] p-4">
              <span className="text-[20px] shrink-0">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[var(--eh-text)]">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-[var(--eh-text-3)]">{item.desc}</p>
                <button className="mt-2 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">{item.action} ↗</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}
