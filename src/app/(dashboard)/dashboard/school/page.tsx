"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import StatsCards from "@/components/dashboard/stats-cards";
import type { SchoolAnalytics } from "@/types";

// Dynamic import to prevent SSR crash
const SchoolAnalytics = dynamic(
  () => import("@/components/dashboard/school-analytics").then((mod) => ({ default: mod.SchoolAnalytics })),
  { ssr: false, loading: () => <AnalyticsSkeleton /> }
);

export default function SchoolDashboardPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/analytics");
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || "Failed to fetch analytics");
          return;
        }

        setAnalytics(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-[26px] font-bold text-gray-900 tracking-[-0.02em]">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your school's hiring activity and performance
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Analytics Charts */}
      {error ? (
        <div className="card p-6 flex items-start gap-3 bg-red-50 border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Failed to load analytics</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      ) : loading || !analytics ? (
        <AnalyticsSkeleton />
      ) : (
        <SchoolAnalytics data={analytics} />
      )}

      {/* Recent Activity */}
      {analytics && analytics.recentActivity.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display text-base font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.applicantName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{activity.jobTitle}</p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <StatusBadge status={activity.toStatus} />
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.changedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6 h-96 skeleton rounded-2xl" />
      <div className="card p-6 h-96 skeleton rounded-2xl" />
    </div>
  );
}

const STATUS_BADGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  REVIEWED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  SHORTLISTED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  REJECTED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  HIRED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_BADGE_COLORS[status] || STATUS_BADGE_COLORS.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}
