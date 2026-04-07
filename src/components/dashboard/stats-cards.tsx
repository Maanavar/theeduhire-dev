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

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-500">
          {icon}
        </div>
        <span className="text-[12.5px] font-medium text-gray-500">{label}</span>
      </div>
      <div className="font-display text-[28px] font-bold text-gray-900 leading-none">{value}</div>
      {sub && <p className="text-[12px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
      </div>
      <div className="h-8 w-16 bg-gray-100 rounded" />
      <div className="h-3 w-28 bg-gray-100 rounded mt-2" />
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
            // "new" = applicants on jobs posted in the last 7 days
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (isSchool && schoolStats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatCard icon={<Briefcase size={16} />} label="Total listings" value={schoolStats.total} />
        <StatCard icon={<TrendingUp size={16} />} label="Active jobs" value={schoolStats.active} sub={`${schoolStats.total - schoolStats.active} closed`} />
        <StatCard icon={<Users size={16} />} label="Total applicants" value={schoolStats.totalApplicants} />
        <StatCard icon={<FileText size={16} />} label="New applicants" value={schoolStats.newApplicants} sub="Last 7 days" />
      </div>
    );
  }

  if (!isSchool && teacherStats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatCard icon={<FileText size={16} />} label="Applications" value={teacherStats.total} />
        <StatCard icon={<CheckCircle2 size={16} />} label="Shortlisted" value={teacherStats.shortlisted} sub={`${teacherStats.total > 0 ? Math.round((teacherStats.shortlisted / teacherStats.total) * 100) : 0}% success rate`} />
        <StatCard icon={<TrendingUp size={16} />} label="Hired" value={teacherStats.hired} />
        <StatCard icon={<Bookmark size={16} />} label="Saved jobs" value={teacherStats.saved} />
      </div>
    );
  }

  return null;
}
