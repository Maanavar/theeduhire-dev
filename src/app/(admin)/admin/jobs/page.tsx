"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ToggleRight, ToggleLeft, Trash2, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { getBoardLabel, timeAgo } from "@/lib/utils";

interface AdminJob {
  id: string;
  title: string;
  status: string;
  postedAt: string;
  subject: string;
  school: { schoolName: string; city: string; verified: boolean };
  _count: { applications: number };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
  DRAFT: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-600",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/jobs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) { setJobs(data.data); setTotal(data.pagination.total); }
      })
      .catch(() => toast.error("Failed to load jobs"))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const doAction = async (jobId: string, action: "close" | "activate" | "delete") => {
    if (action === "delete" && !confirm("Permanently delete this job and all its applications?")) return;
    setActionId(jobId);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "delete" ? "Job deleted" : `Job ${action === "close" ? "closed" : "activated"}`);
        if (action === "delete") {
          setJobs((prev) => prev.filter((j) => j.id !== jobId));
        } else {
          setJobs((prev) => prev.map((j) => j.id === jobId
            ? { ...j, status: action === "close" ? "CLOSED" : "ACTIVE" } : j));
        }
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch { toast.error("Network error"); }
    finally { setActionId(null); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-bold">Job moderation</h1>
        <p className="text-[14px] text-gray-500 mt-0.5">{total} total jobs</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] bg-white focus:outline-none focus:border-brand-500"
            placeholder="Search title or school..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] bg-white focus:outline-none focus:border-brand-500"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {["ACTIVE", "CLOSED", "DRAFT", "EXPIRED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={20} className="animate-spin text-gray-400 mx-auto" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-10 text-center text-[14px] text-gray-400">No jobs found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.map((job) => (
              <div key={job.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-semibold truncate">{job.title}</p>
                    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[job.status] || "bg-gray-100"}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-gray-500">
                    {job.school.schoolName} · {job.school.city} · {job.subject} · {job._count.applications} applicants · {timeAgo(job.postedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href={`/jobs/${job.id}`} target="_blank"
                    className="p-2 text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-gray-50">
                    <ExternalLink size={14} />
                  </Link>
                  {actionId === job.id ? (
                    <Loader2 size={16} className="animate-spin text-gray-400 mx-2" />
                  ) : (
                    <>
                      <button
                        onClick={() => doAction(job.id, job.status === "ACTIVE" ? "close" : "activate")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {job.status === "ACTIVE"
                          ? <><ToggleRight size={13} className="text-green-500" /> Close</>
                          : <><ToggleLeft size={13} /> Activate</>
                        }
                      </button>
                      <button
                        onClick={() => doAction(job.id, "delete")}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[13px] text-gray-500">Showing {Math.min((page - 1) * 25 + 1, total)}–{Math.min(page * 25, total)} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg text-[13px] border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg text-[13px] border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
