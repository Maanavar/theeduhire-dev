"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSalary, timeAgo } from "@/lib/utils";
import { MapPin, Clock, Briefcase, ExternalLink } from "lucide-react";
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

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  REVIEWED: "bg-blue-50 text-blue-700",
  SHORTLISTED: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-600",
  HIRED: "bg-green-50 text-green-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending Review",
  REVIEWED: "Reviewed",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Not Selected",
  HIRED: "Hired!",
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setApps(data.data);
        else setError(data.error || "Failed to load applications");
      })
      .catch(() => setError("Network error. Please check your connection."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-[26px] font-bold mb-1">My Applications</h1>
      <p className="text-[14px] text-gray-500 mb-6">Track the status of your job applications</p>
      <StatsCards />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-2/5 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-1/3 bg-gray-100 rounded mb-3" />
              <div className="h-4 w-1/4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
          <p className="text-[14px] text-red-600 mb-3">{error}</p>
          <button
            onClick={() => { setError(""); setLoading(true); fetch("/api/applications").then(r => r.json()).then(data => { if (data.success) setApps(data.data); else setError(data.error || "Failed to load"); }).catch(() => setError("Network error.")).finally(() => setLoading(false)); }}
            className="text-[13px] text-brand-500 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
          <Briefcase size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-display text-xl text-gray-500 italic mb-2">No applications yet</h3>
          <p className="text-[14px] text-gray-400 mb-5">Start browsing and apply for teaching positions</p>
          <Link href="/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link href={`/jobs/${app.job.id}`} className="text-[15px] font-semibold hover:text-brand-500 transition-colors truncate">
                      {app.job.title}
                    </Link>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[app.status]}`}>
                      {statusLabels[app.status] || app.status}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500">{app.job.school.schoolName}</p>
                  <div className="flex gap-3 mt-2 text-[12.5px] text-gray-400">
                    <span className="flex items-center gap-1"><MapPin size={12} />{app.job.school.city}</span>
                    <span>{app.job.subject}</span>
                    <span>{formatSalary(app.job.salaryMin, app.job.salaryMax)}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[12px] text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> Applied {timeAgo(app.appliedAt)}
                  </span>
                  <Link
                    href={`/jobs/${app.job.id}`}
                    className="inline-flex items-center gap-1 text-[12px] text-brand-500 hover:underline mt-1"
                  >
                    View job <ExternalLink size={11} />
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
