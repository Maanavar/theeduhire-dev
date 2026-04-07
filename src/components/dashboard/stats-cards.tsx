"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, Bookmark, CheckCircle2, Briefcase, Users, TrendingUp } from "lucide-react";

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

function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  color = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  trend?: "up" | "neutral";
  color?: "brand" | "blue" | "green" | "orange";
}) {
  const colorMap = {
    brand:  { bg: "bg-brand-50",  text: "text-brand-600",  icon: "text-brand-500" },
    blue:   { bg: "bg-blue-50",   text: "text-blue-600",   icon: "text-blue-500" },
    green:  { bg: "bg-emerald-50",text: "text-emerald-600",icon: "text-emerald-500" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-500" },
  };
  const c = colorMap[color];

  return (
    <div className="card p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center ${c.icon} transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>
        {trend === "up" && (
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            ↑ Active
          </span>
        )}
      </div>
      <div className={`font-display text-[28px] font-bold leading-none tracking-[-0.02em] mb-1.5 ${c.text}`}>
        {value}
      </div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 skeleton rounded-lg" />
      </div>
      <div className="h-7 w-14 skeleton rounded-lg mb-2" />
      <div className="h-3 w-20 skeleton rounded" />
      <div className="h-3 w-16 skeleton rounded mt-1" />
    </div>
  );
}

export default function StatsCards() {
  const { data: session } = useSession();
  const isSchool = session?.user?.role === "SCHOOL_ADMIN";

  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    if (isSchool) {
      fetch("/api/my-jobs")
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const jobs = data.data as any[];
            const total = jobs.length;
            const active = jobs.filter((j) => j.status === "ACTIVE").length;
            const totalApplicants = jobs.reduce((sum: number, j: any) => sum + (j._count?.applications ?? 0), 0);
            const cutoff = Date.now() - 7 * 86400000;
            const newApplicants = jobs
              .filter((j) => new Date(j.postedAt).getTime() > cutoff)
              .reduce((sum: number, j: any) => sum + (j._count?.applications ?? 0), 0);
            setSchoolStats({ total, active, totalApplicants, newApplicants });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        fetch("/api/applications").then((r) => r.json()),
        fetch("/api/saved-jobs").then((r) => r.json()),
      ])
        .then(([appData, savedData]) => {
          const apps = appData.success ? (appData.data as any[]) : [];
          const saved = savedData.success ? (savedData.data as any[]) : [];
          setTeacherStats({
            total: apps.length,
            shortlisted: apps.filter((a) => a.status === "SHORTLISTED").length,
            hired: apps.filter((a) => a.status === "HIRED").length,
            saved: saved.length,
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [session, isSchool]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (isSchool && schoolStats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard color="brand" icon={<Briefcase size={15} />} label="Total Listings"     value={schoolStats.total} />
        <StatCard color="green" icon={<TrendingUp size={15} />} label="Active Jobs"        value={schoolStats.active} trend="up" sub={`${schoolStats.total - schoolStats.active} closed`} />
        <StatCard color="blue"  icon={<Users size={15} />}      label="Total Applicants"   value={schoolStats.totalApplicants} />
        <StatCard color="orange"icon={<FileText size={15} />}   label="New This Week"      value={schoolStats.newApplicants} sub="Last 7 days" />
      </div>
    );
  }

  if (!isSchool && teacherStats) {
    const rate = teacherStats.total > 0
      ? Math.round((teacherStats.shortlisted / teacherStats.total) * 100)
      : 0;
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard color="brand"  icon={<FileText size={15} />}     label="Applications"   value={teacherStats.total} />
        <StatCard color="blue"   icon={<CheckCircle2 size={15} />} label="Shortlisted"    value={teacherStats.shortlisted} sub={`${rate}% success rate`} />
        <StatCard color="green"  icon={<TrendingUp size={15} />}   label="Hired"          value={teacherStats.hired} trend={teacherStats.hired > 0 ? "up" : undefined} />
        <StatCard color="orange" icon={<Bookmark size={15} />}     label="Saved Jobs"     value={teacherStats.saved} />
      </div>
    );
  }

  return null;
}
