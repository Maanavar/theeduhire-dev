"use client";

import { useEffect, useState } from "react";
import { Bookmark, Briefcase, CheckCircle2, FileText, TrendingUp, Users } from "lucide-react";
import { Metric } from "@/components/layout/page-shell";
import { getDashboardSummary } from "@/lib/api/dashboard-client";

interface TeacherStats {
  total: number;
  shortlisted: number;
  saved: number;
  hired: number;
}

interface SchoolStats {
  total: number;
  active: number;
  totalApplicants: number;
  newApplicants: number;
}

type StatTone = "brand" | "info" | "success" | "warning";

function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  trend?: "up" | "neutral";
  tone?: StatTone;
}) {
  const hint = trend === "up" && sub ? <span className="font-medium text-emerald-700">{sub}</span> : sub;

  return <Metric label={label} value={value} hint={hint} icon={icon} tone={tone} />;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-eh bg-eh-surface p-4 shadow-xs">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-8 w-8 rounded-lg skeleton" />
      </div>
      <div className="mb-2 h-7 w-14 rounded-lg skeleton" />
      <div className="h-3 w-20 rounded skeleton" />
      <div className="mt-1 h-3 w-16 rounded skeleton" />
    </div>
  );
}

export default function StatsCards() {
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);
  const [role, setRole] = useState<"TEACHER" | "SCHOOL_ADMIN" | "ADMIN" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const summary = await getDashboardSummary();
        if (cancelled) return;

        setRole(summary.role);
        if (summary.role === "SCHOOL_ADMIN") {
          setSchoolStats({
            total: summary.summary.totalJobs,
            active: summary.summary.activeJobs,
            totalApplicants: summary.summary.totalApplicants,
            newApplicants: summary.summary.newApplicants,
          });
          setTeacherStats(null);
          return;
        }

        if (summary.role === "TEACHER") {
          setTeacherStats({
            total: summary.summary.totalApplications,
            shortlisted: summary.summary.shortlistedApplications,
            hired: summary.summary.hiredApplications,
            saved: summary.summary.savedJobs,
          });
          setSchoolStats(null);
          return;
        }

        setTeacherStats(null);
        setSchoolStats(null);
      } catch {
        if (!cancelled) {
          setTeacherStats(null);
          setSchoolStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (role === "SCHOOL_ADMIN" && schoolStats) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="brand" icon={<Briefcase size={15} />} label="Total Listings" value={schoolStats.total} />
        <StatCard
          tone="success"
          icon={<TrendingUp size={15} />}
          label="Active Jobs"
          value={schoolStats.active}
          trend="up"
          sub={`${schoolStats.total - schoolStats.active} closed`}
        />
        <StatCard tone="info" icon={<Users size={15} />} label="Total Applicants" value={schoolStats.totalApplicants} />
        <StatCard tone="warning" icon={<FileText size={15} />} label="New This Week" value={schoolStats.newApplicants} sub="Last 7 days" />
      </div>
    );
  }

  if (role === "TEACHER" && teacherStats) {
    const rate = teacherStats.total > 0 ? Math.round((teacherStats.shortlisted / teacherStats.total) * 100) : 0;

    return (
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="brand" icon={<FileText size={15} />} label="Applications" value={teacherStats.total} />
        <StatCard tone="info" icon={<CheckCircle2 size={15} />} label="Shortlisted" value={teacherStats.shortlisted} sub={`${rate}% success rate`} />
        <StatCard tone="success" icon={<TrendingUp size={15} />} label="Hired" value={teacherStats.hired} trend={teacherStats.hired > 0 ? "up" : undefined} />
        <StatCard tone="warning" icon={<Bookmark size={15} />} label="Saved Jobs" value={teacherStats.saved} />
      </div>
    );
  }

  return null;
}
