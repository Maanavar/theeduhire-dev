"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Lock } from "lucide-react";
import { SchoolAnalytics as SchoolAnalyticsCharts } from "@/components/dashboard/school-analytics";
import { EmptyState, ErrorState } from "@/components/system/system-states";
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

  return (
    <PageShell>
      <div className="border-b border-[var(--eh-border)] pb-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
          School dashboard
        </p>
        <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)] sm:text-[26px]">
          Analytics
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--eh-text-3)]">
          Hiring funnel, application trend, job performance, and recent activity.
        </p>
      </div>

      {loading ? (
        <AnalyticsSkeleton />
      ) : upgradeRequired ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-[var(--eh-border)] bg-white px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-50)]">
            <Lock size={22} className="text-[var(--color-brand-600)]" />
          </div>
          <h2 className="mt-4 text-[18px] font-semibold text-[var(--eh-text)]">
            Analytics is a Pro feature
          </h2>
          <p className="mt-2 max-w-sm text-[13.5px] leading-[1.7] text-[var(--eh-text-3)]">
            Upgrade to the Pro plan to unlock your full hiring funnel — application trends, job performance, time-to-hire, and recent activity.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:hello@theeduhire.in?subject=Upgrade to Pro plan — EduHire Analytics"
              className="eh-btn eh-btn-primary shadow-[0_4px_14px_rgba(10,102,194,0.2)]"
            >
              Upgrade to Pro <ArrowRight size={13} />
            </a>
            <Link href="/dashboard/billing" className="eh-btn eh-btn-secondary">
              View billing
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {[
              "Application trend (30 days)",
              "Job performance comparison",
              "Hiring funnel (shortlist → hire)",
              "Time-to-hire average",
            ].map((feat) => (
              <div
                key={feat}
                className="flex items-start gap-2 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-3"
              >
                <BarChart3 size={13} className="mt-0.5 shrink-0 text-[var(--color-brand-500)]" />
                <span className="text-[12px] text-[var(--eh-text-2)]">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load analytics"
          message={error}
          actions={
            <button onClick={loadAnalytics} className="eh-btn eh-btn-secondary eh-btn-sm">
              Retry
            </button>
          }
        />
      ) : analytics ? (
        <SchoolAnalyticsCharts data={analytics} />
      ) : (
        <EmptyState
          title="No analytics yet"
          message="Post jobs and review applicants to start seeing funnel and performance insights."
        />
      )}
    </PageShell>
  );
}
