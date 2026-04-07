"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSalary, timeAgo, getBoardLabel } from "@/lib/utils";
import { Plus, Users, Eye, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import StatsCards from "@/components/dashboard/stats-cards";
import { toast } from "@/components/ui/toast";

interface MyJob {
  id: string;
  title: string;
  subject: string;
  board: string;
  gradeLevel: string;
  status: string;
  postedAt: string;
  salaryMin: number | null;
  salaryMax: number | null;
  school: { schoolName: string; city: string; verified: boolean };
  _count: { applications: number };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
  CLOSED: "bg-red-50 text-red-600",
  EXPIRED: "bg-amber-50 text-amber-700",
};

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/my-jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setJobs(data.data);
        else setError(data.error || "Failed to load your job listings");
      })
      .catch(() => setError("Network error. Please check your connection."))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "CLOSED" : "ACTIVE";
    setTogglingId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: newStatus } : j));
        toast.success(`Job ${newStatus === "ACTIVE" ? "reopened" : "closed"}`);
      } else {
        toast.error(data.error || "Failed to update job status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] font-bold">My Job Listings</h1>
          <p className="text-[14px] text-gray-500 mt-0.5">Manage your posted teaching positions</p>
        </div>
        <Link
          href="/dashboard/post-job"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
        >
          <Plus size={15} /> Post New Job
        </Link>
      </div>
      <StatsCards />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-1/3 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-1/4 bg-gray-100 rounded mb-3" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
          <p className="text-[14px] text-red-600">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
          <h3 className="font-display text-xl text-gray-500 italic mb-2">No jobs posted yet</h3>
          <p className="text-[14px] text-gray-400 mb-5">Create your first teaching position listing</p>
          <Link href="/dashboard/post-job" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600">
            <Plus size={15} /> Post a Job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[15px] font-semibold truncate">{job.title}</h3>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[job.status] || "bg-gray-100"}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500">
                    {job.subject} · {getBoardLabel(job.board)} · Grade {job.gradeLevel}
                  </p>
                  <p className="text-[13px] text-gray-400 mt-1">
                    {formatSalary(job.salaryMin, job.salaryMax)} · Posted {timeAgo(job.postedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleStatus(job.id, job.status)}
                    disabled={togglingId === job.id || job.status === "DRAFT"}
                    title={job.status === "ACTIVE" ? "Close listing" : "Reopen listing"}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                  >
                    {togglingId === job.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : job.status === "ACTIVE"
                        ? <ToggleRight size={14} className="text-green-500" />
                        : <ToggleLeft size={14} />
                    }
                    {job.status === "ACTIVE" ? "Close" : "Reopen"}
                  </button>
                  <Link
                    href={`/dashboard/my-jobs/${job.id}/applicants`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Users size={14} />
                    {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
                  </Link>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Eye size={14} /> View
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
