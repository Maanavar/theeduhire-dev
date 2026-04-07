"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSalary, timeAgo } from "@/lib/utils";
import { MapPin, Clock, Briefcase, ArrowRight, RefreshCw } from "lucide-react";
import StatsCards from "@/components/dashboard/stats-cards";

interface AppItem {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter: string | null;
  job: {
    id: string;
    title: string;
    subject: string;
    board: string;
    gradeLevel: string;
    salaryMin: number | null;
    salaryMax: number | null;
    status: string;
    school: { schoolName: string; city: string; verified: boolean };
  };
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  PENDING:     { label: "Pending Review", dot: "bg-gray-400",    bg: "bg-gray-50",    text: "text-gray-600",   border: "border-gray-200" },
  REVIEWED:    { label: "Reviewed",       dot: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-100" },
  SHORTLISTED: { label: "Shortlisted",    dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-100" },
  REJECTED:    { label: "Not Selected",   dot: "bg-red-400",     bg: "bg-red-50",     text: "text-red-600",    border: "border-red-100" },
  HIRED:       { label: "Hired! 🎉",      dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-100" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function AppCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/5 rounded-lg" />
          <div className="skeleton h-3.5 w-1/3 rounded" />
          <div className="flex gap-3">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-3 w-14 rounded" />
          </div>
        </div>
        <div className="skeleton h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApps = () => {
    setLoading(true);
    setError("");
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setApps(data.data);
        else setError(data.error || "Failed to load applications");
      })
      .catch(() => setError("Network error. Please check your connection."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); }, []);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-bold text-gray-900 tracking-[-0.02em]">
          My Applications
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track the status of your job applications
        </p>
      </div>

      <StatsCards />

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <AppCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-red-500">
              <circle cx="9" cy="9" r="8.5" stroke="currentColor"/>
              <path d="M9 6V9.5M9 12H9.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchApps}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-brand"
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      ) : apps.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-gray-400" />
          </div>
          <h3 className="font-display text-[18px] font-semibold text-gray-500 italic mb-2">
            No applications yet
          </h3>
          <p className="text-sm text-gray-400 mb-6 max-w-[260px] mx-auto">
            Start browsing teaching positions and submit your first application
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-brand hover:-translate-y-px"
          >
            Browse Jobs <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="card p-5 transition-all duration-[120ms] hover:shadow-md hover:-translate-y-px"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="text-[15px] font-semibold text-gray-900 hover:text-brand-600 transition-colors truncate"
                    >
                      {app.job.title}
                    </Link>
                    {app.job.status === "CLOSED" && (
                      <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        Job Closed
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 font-medium mb-2">
                    {app.job.school.schoolName}
                  </p>

                  <div className="flex gap-3 text-xs text-gray-400 font-medium flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {app.job.school.city}
                    </span>
                    <span>{app.job.subject}</span>
                    <span className="text-brand-600 font-semibold">
                      {formatSalary(app.job.salaryMin, app.job.salaryMax)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={app.status} />
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                    <Clock size={11} /> Applied {timeAgo(app.appliedAt)}
                  </span>
                  <Link
                    href={`/jobs/${app.job.id}`}
                    className="text-[11px] text-brand-500 hover:text-brand-700 font-semibold transition-colors flex items-center gap-1"
                  >
                    View job <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
