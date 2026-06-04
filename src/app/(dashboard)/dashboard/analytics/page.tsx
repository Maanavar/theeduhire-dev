"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { SchoolAnalytics as SchoolAnalyticsCharts } from "@/components/dashboard/school-analytics";
import { ProLockedState, SomethingWentWrongState, NoJobsPostedState } from "@/components/system/illustrated-states";
import { AnalyticsSkeleton } from "@/components/system/dashboard-skeletons";
import type { SchoolAnalytics } from "@/types";
import { getApiErrorMessage } from "@/lib/api/client";
import { PageShell } from "@/components/layout/page-shell";

async function fetchAnalytics(): Promise<{ data?: SchoolAnalytics; upgradeRequired?: boolean; error?: string }> {
  const res = await fetch("/api/dashboard/analytics");
  const json = await res.json();
  if (res.status === 403 && json.error === "PLAN_UPGRADE_REQUIRED") {
    return { upgradeRequired: true };
  }
  if (!res.ok || !json.success) {
    return { error: json.message ?? json.error ?? "Failed to load analytics" };
  }
  return { data: json.data };
}

export default function SchoolAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [showDateMenu, setShowDateMenu] = useState(false);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  const DATE_RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"];

  const exportReport = () => {
    if (!analytics) { toast.error("No analytics data to export"); return; }
    const s = analytics.summary;
    const rows = [
      ["Metric", "Value"],
      ["Total Jobs", String(s.totalJobs)],
      ["Active Jobs", String(s.activeJobs)],
      ["Total Applications", String(s.totalApplications)],
      ["Shortlisted", String(s.shortlisted)],
      ["Hired", String(s.hired)],
      ["Avg. Time to Hire (days)", s.avgTimeToHireDays != null ? s.avgTimeToHireDays.toFixed(1) : "N/A"],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const loadAnalytics = () => {
    setLoading(true);
    setError("");
    setUpgradeRequired(false);
    fetchAnalytics()
      .then((result) => {
        if (result.upgradeRequired) {
          setUpgradeRequired(true);
        } else if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setAnalytics(result.data);
        }
      })
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load analytics")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (!showDateMenu) return;
    const handler = (e: MouseEvent) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setShowDateMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDateMenu]);

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--eh-border)] pb-5">
        <div>
          <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)] sm:text-[26px]">
            Analytics
          </h1>
          <p className="mt-1.5 text-[14px] text-[var(--eh-text-3)]">
            Track hiring performance, pipeline health, and job outcomes.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative" ref={dateMenuRef}>
            <button
              onClick={() => setShowDateMenu((p) => !p)}
              className="eh-btn eh-btn-secondary"
            >
              <span className="text-[var(--eh-text-4)]">📅</span> {dateRange} <ChevronDown size={13} />
            </button>
            {showDateMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-[160px] rounded-xl border border-[var(--eh-border)] bg-white py-1 shadow-lg">
                {DATE_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => { setDateRange(range); setShowDateMenu(false); }}
                    className={["w-full px-4 py-2 text-left text-[13px] hover:bg-[var(--surface-base)]", range === dateRange ? "font-semibold text-[var(--eh-primary-700)]" : "text-[var(--eh-text-2)]"].join(" ")}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={exportReport} disabled={!analytics} className="eh-btn eh-btn-secondary">
            <ArrowRight size={14} className="rotate-90" /> Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <AnalyticsSkeleton />
      ) : upgradeRequired ? (
        <ProLockedState
          title="Analytics is a Pro feature"
          message="Upgrade to the Pro plan to unlock your full hiring funnel — application trends, job performance, time-to-hire, and recent activity."
          features={[
            "Application trend (30 days)",
            "Job performance comparison",
            "Hiring funnel (shortlist → hire)",
            "Time-to-hire average",
          ]}
          actions={
            <>
              <a
                href="mailto:hello@theeduhire.in?subject=Upgrade to Pro plan — EduHire Analytics"
                className="eh-btn eh-btn-primary"
              >
                Upgrade to Pro <ArrowRight size={13} />
              </a>
              <Link href="/dashboard/billing" className="eh-btn eh-btn-secondary">
                View billing
              </Link>
            </>
          }
        />
      ) : error ? (
        <SomethingWentWrongState
          title="Couldn't load analytics"
          message={error}
          onRetry={loadAnalytics}
        />
      ) : analytics ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
          <div>
            {/* Sub-page links */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Link href="/dashboard/analytics/funnel" className="flex items-center justify-between rounded-xl border border-[var(--eh-border)] bg-white px-4 py-3 hover:border-[var(--eh-border-strong)] hover:shadow-sm transition-all">
                <div>
                  <p className="text-[13px] font-semibold text-[var(--eh-text)]">Hiring Funnel Insights</p>
                  <p className="text-[11px] text-[var(--eh-text-3)]">Conversion, drop-off, bottlenecks</p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-[var(--eh-text-4)]" />
              </Link>
              <Link href="/dashboard/analytics/job-performance" className="flex items-center justify-between rounded-xl border border-[var(--eh-border)] bg-white px-4 py-3 hover:border-[var(--eh-border-strong)] hover:shadow-sm transition-all">
                <div>
                  <p className="text-[13px] font-semibold text-[var(--eh-text)]">Job Performance</p>
                  <p className="text-[11px] text-[var(--eh-text-3)]">Per-job metrics and match scores</p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-[var(--eh-text-4)]" />
              </Link>
            </div>
            <SchoolAnalyticsCharts data={analytics} />
          </div>
          <div className="flex flex-col gap-4">
            {/* Plan Access card */}
            <div className="rounded-xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Plan Access</h3>
                <span className="rounded-md border border-[var(--eh-primary-200)] bg-white px-2 py-0.5 text-[11px] font-bold text-[var(--eh-primary-700)]">PRO</span>
              </div>
              <ul className="space-y-2">
                {["Unlimited job posts", "Managed recruitment access", "Priority support"].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-[12px] text-[var(--eh-text-2)]">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/billing" className="mt-4 block w-full text-center rounded-lg border border-[var(--eh-primary-200)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--eh-primary-700)] hover:bg-[var(--eh-primary-50)] transition-colors">
                View Plan Details
              </Link>
            </div>
            {/* Upgrade CTA */}
            <div className="rounded-xl border border-[var(--eh-border)] bg-white p-5">
              <p className="text-[13px] font-semibold text-[var(--eh-text)] mb-1">Need more hiring power?</p>
              <p className="text-[12px] text-[var(--eh-text-3)] leading-[1.6] mb-3">Upgrade your plan to post more jobs, access advanced features, and hire better, faster.</p>
              <ul className="space-y-1.5 mb-4">
                {["Post more active jobs", "Unlock managed recruitment discounts", "Priority support & faster response"].map((feat) => (
                  <li key={feat} className="flex items-center gap-1.5 text-[12px] text-[var(--eh-text-3)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--eh-primary-500)] shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/billing" className="eh-btn eh-btn-primary w-full justify-center">Upgrade Now</Link>
            </div>
          </div>
        </div>
      ) : (
        <NoJobsPostedState
          actions={
            <Link href="/dashboard/post-job" className="eh-btn eh-btn-primary">Post a Job</Link>
          }
        />
      )}
    </PageShell>
  );
}
