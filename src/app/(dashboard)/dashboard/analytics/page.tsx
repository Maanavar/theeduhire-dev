"use client";

import { useEffect, useState } from "react";
import { SchoolAnalytics as SchoolAnalyticsCharts } from "@/components/dashboard/school-analytics";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import type { SchoolAnalytics } from "@/types";
import { getApiErrorMessage } from "@/lib/api/client";
import { getSchoolAnalytics } from "@/lib/api/school-client";

export default function SchoolAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = () => {
    setLoading(true);
    setError("");
    getSchoolAnalytics()
      .then((data) => setAnalytics(data))
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load analytics")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-[26px] font-semibold tracking-[-0.02em] text-[#111827]">Analytics</h1>
      <p className="mb-4 text-[14px] text-slate-500">Hiring funnel, application trend, and job performance overview.</p>

      {loading ? (
        <LoadingState title="Loading analytics" message="Preparing your hiring performance dashboard." />
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
    </div>
  );
}
