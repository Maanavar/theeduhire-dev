"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSalary, timeAgo, getBoardLabel } from "@/lib/utils";
import { Plus, Users, Eye, Loader2, Briefcase, ArrowRight } from "lucide-react";
import StatsCards from "@/components/dashboard/stats-cards";
import JobDetailModal from "@/components/jobs/job-detail-modal";
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

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  ACTIVE:  { label: "Active",   dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  DRAFT:   { label: "Draft",    dot: "bg-gray-400",    bg: "bg-gray-100",   text: "text-gray-600",   border: "border-gray-200" },
  CLOSED:  { label: "Closed",   dot: "bg-red-400",     bg: "bg-red-50",     text: "text-red-600",    border: "border-red-100" },
  EXPIRED: { label: "Expired",  dot: "bg-amber-400",   bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-100" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function JobCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/5 rounded-lg" />
          <div className="skeleton h-3.5 w-1/3 rounded" />
          <div className="skeleton h-3 w-1/4 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-20 rounded-xl" />
          <div className="skeleton h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("");

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
      <JobDetailModal
        open={!!selectedJobId}
        jobId={selectedJobId}
        jobTitle={selectedJobTitle}
        onClose={() => {
          setSelectedJobId(null);
          setSelectedJobTitle("");
        }}
      />

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900 tracking-[-0.02em]">
            My Job Listings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your posted teaching positions
          </p>
        </div>
        <Link
          href="/dashboard/post-job"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-[120ms] shadow-brand hover:-translate-y-px active:translate-y-0 shrink-0"
        >
          <Plus size={14} /> Post New Job
        </Link>
      </div>

      <StatsCards />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 shadow-brand"
          >
            Reload
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-gray-400" />
          </div>
          <h3 className="font-display text-[18px] font-semibold text-gray-500 italic mb-2">
            No listings yet
          </h3>
          <p className="text-sm text-gray-400 mb-6 max-w-[260px] mx-auto">
            Create your first teaching position to start attracting qualified educators
          </p>
          <Link
            href="/dashboard/post-job"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-brand hover:-translate-y-px"
          >
            <Plus size={14} /> Post a Job <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="card p-5 transition-all duration-[120ms] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <h3 className="text-[15px] font-semibold text-gray-900 truncate">
                      {job.title}
                    </h3>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-1.5">
                    {job.subject} · {getBoardLabel(job.board)} · Grade {job.gradeLevel}
                  </p>
                  <div className="flex gap-3 text-xs text-gray-400 font-medium">
                    <span className="text-brand-600 font-semibold">
                      {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                    <span>Posted {timeAgo(job.postedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => toggleStatus(job.id, job.status)}
                    disabled={togglingId === job.id || job.status === "DRAFT"}
                    className={[
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-[120ms] disabled:opacity-40",
                      job.status === "ACTIVE"
                        ? "border-red-100 text-red-600 bg-red-50 hover:bg-red-100"
                        : "border-emerald-100 text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
                    ].join(" ")}
                  >
                    {togglingId === job.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : null
                    }
                    {job.status === "ACTIVE" ? "Close" : "Reopen"}
                  </button>

                  <Link
                    href={`/dashboard/my-jobs/${job.id}/applicants`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-black/[0.08] text-gray-600 bg-white hover:bg-gray-50 hover:border-black/[0.13] transition-all duration-[120ms]"
                  >
                    <Users size={13} />
                    {job._count.applications} Applicant{job._count.applications !== 1 ? "s" : ""}
                  </Link>

                  <button
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setSelectedJobTitle(job.title);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-black/[0.08] text-gray-600 bg-white hover:bg-gray-50 hover:border-black/[0.13] transition-all duration-[120ms]"
                  >
                    <Eye size={13} /> View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
