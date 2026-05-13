"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ToggleRight, ToggleLeft, Trash2, ExternalLink, Loader2, EyeOff, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { getApiErrorMessage } from "@/lib/api/client";
import { getAdminJobs, adminJobAction } from "@/lib/api/admin-client";
import type { AdminJob } from "@/lib/api/admin-client";
import AdminActionModal from "@/components/admin/admin-action-modal";
import type { AdminActionVariant } from "@/components/admin/admin-action-modal";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  CLOSED: "bg-[var(--surface-base)] text-[var(--eh-text-3)]",
  DRAFT: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-600",
};

const PAGE_SIZE = 25;

type JobActionType = "close" | "activate" | "delete" | "hide" | "show";

type PendingAction = {
  jobId: string;
  action: JobActionType;
  title: string;
  description?: string;
  variant: AdminActionVariant;
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    getAdminJobs(params)
      .then((result) => {
        setJobs(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => {
        const msg = getApiErrorMessage(err, "Failed to load jobs");
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const openAction = (jobId: string, action: JobActionType) => {
    const job = jobs.find((j) => j.id === jobId);
    const label = job?.title || "this job";

    const configs: Record<JobActionType, PendingAction> = {
      close: {
        jobId, action,
        title: `Close "${label}"`,
        description: "No new applications will be accepted. Existing applications are preserved.",
        variant: { kind: "notes", label: "Admin notes", confirmLabel: "Close job", danger: false },
      },
      activate: {
        jobId, action,
        title: `Reactivate "${label}"`,
        variant: { kind: "confirm", message: `Reactivate "${label}" and open it for applications?`, confirmLabel: "Activate", danger: false },
      },
      hide: {
        jobId, action,
        title: `Hide "${label}"`,
        description: "Teachers will not see this posting. It remains visible in the admin view.",
        variant: { kind: "notes", label: "Admin notes", confirmLabel: "Hide job", danger: true },
      },
      show: {
        jobId, action,
        title: `Make "${label}" visible`,
        variant: { kind: "confirm", message: `Make "${label}" visible in public listings again?`, confirmLabel: "Show job", danger: false },
      },
      delete: {
        jobId, action,
        title: `Delete "${label}"`,
        description: "This will permanently remove the job and all associated applications. This cannot be undone.",
        variant: { kind: "confirm", message: `Are you sure you want to permanently delete "${label}"? All applications will also be removed.`, confirmLabel: "Delete permanently", danger: true },
      },
    };

    setPendingAction(configs[action]);
  };

  const handleModalConfirm = async ({ notes }: { reason?: string; notes?: string }) => {
    if (!pendingAction) return;
    const { jobId, action } = pendingAction;
    setModalLoading(true);
    try {
      await adminJobAction(jobId, action, notes);
      toast.success(
        action === "delete" ? "Job deleted" :
        action === "hide" ? "Job hidden from public listings" :
        action === "show" ? "Job visible again" :
        `Job ${action === "close" ? "closed" : "activated"}`
      );
      setPendingAction(null);
      if (action === "delete") {
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
      } else {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: action === "close" ? "CLOSED" : action === "activate" ? "ACTIVE" : job.status,
                  isHidden: action === "hide" ? true : action === "show" ? false : job.isHidden,
                  moderationNotes: notes ?? job.moderationNotes,
                }
              : job
          )
        );
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setModalLoading(false);
    }
  };

  const activeCount = jobs.filter((job) => job.status === "ACTIVE").length;
  const reviewCount = jobs.filter((job) => job.status === "DRAFT" || job.status === "EXPIRED").length;
  const totalApplications = jobs.reduce((sum, job) => sum + job._count.applications, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">Job moderation</h1>
        <p className="mt-0.5 text-[14px] text-[var(--eh-text-3)]">
          Review publishing status, open roles, and moderation actions from one queue.
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Queue size</p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">{total}</p>
          <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Total jobs currently in the admin queue.</p>
        </div>
        <div className="rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Open on this page</p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">{activeCount}</p>
          <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Live roles visible in the current results set.</p>
        </div>
        <div className="rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Applicant volume</p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">{totalApplications}</p>
          <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">{reviewCount} roles need review or relisting.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
          <input
            className="w-full rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] py-2.5 pl-9 pr-3 text-[13.5px] focus:border-brand-500 focus:outline-none"
            placeholder="Search title or school..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-3 py-2.5 text-[13.5px] focus:border-brand-500 focus:outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {["ACTIVE", "CLOSED", "DRAFT", "EXPIRED"].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)]">
        {loading ? (
          <div className="p-4">
            <LoadingState title="Loading jobs" message="Fetching moderation queue." />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load jobs"
              message={error}
              actions={<button onClick={fetchJobs} className="eh-btn eh-btn-secondary eh-btn-sm">Retry</button>}
            />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No jobs found" message="Try a different filter or search query." />
          </div>
        ) : (
          <div>
            <div className="hidden grid-cols-[minmax(0,1.6fr)_140px_180px_190px] gap-4 border-b border-[var(--eh-border)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)] md:grid">
              <span>Role</span>
              <span>Status</span>
              <span>School</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-[var(--eh-border)]">
              {jobs.map((job) => (
                <div key={job.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.6fr)_140px_180px_190px] md:items-center md:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[var(--eh-text)]">{job.title}</p>
                    <p className="mt-1 text-[12.5px] text-[var(--eh-text-3)]">
                      {job.subject} | {job._count.applications} applicants | Posted {timeAgo(job.postedAt)}{job.isHidden ? " | Hidden" : ""}
                    </p>
                    {job.moderationNotes ? (
                      <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Admin notes: {job.moderationNotes}</p>
                    ) : null}
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${STATUS_COLORS[job.status] || "bg-[var(--surface-base)] text-[var(--eh-text-3)]"}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[var(--eh-text-2)]">{job.school.schoolName}</p>
                    <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">{job.school.city || "Location pending"}</p>
                  </div>
                  <div className="flex items-center gap-1.5 md:justify-end">
                    <Link
                      href={`/jobs/${job.id}`}
                      target="_blank"
                      aria-label="Preview job post"
                      className="rounded-lg p-2 text-[var(--eh-text-4)] transition-colors hover:bg-[var(--surface-base)] hover:text-brand-500"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    <button
                      onClick={() => openAction(job.id, job.status === "ACTIVE" ? "close" : "activate")}
                      className="flex items-center gap-1 rounded-lg bg-[var(--surface-base)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--eh-text-2)] transition-colors hover:bg-white"
                    >
                      {job.status === "ACTIVE" ? (
                        <><ToggleRight size={13} className="text-green-500" /> Close</>
                      ) : (
                        <><ToggleLeft size={13} /> Activate</>
                      )}
                    </button>
                    <button
                      onClick={() => openAction(job.id, job.isHidden ? "show" : "hide")}
                      className="flex items-center gap-1 rounded-lg bg-[var(--surface-base)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--eh-text-2)] transition-colors hover:bg-white"
                    >
                      {job.isHidden ? <><Eye size={13} /> Show</> : <><EyeOff size={13} /> Hide</>}
                    </button>
                    <button
                      onClick={() => openAction(job.id, "delete")}
                      aria-label="Delete job"
                      className="rounded-lg p-2 text-[var(--eh-text-4)] transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-[var(--eh-text-3)]">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}-{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[var(--eh-border)] px-3 py-1.5 text-[13px] text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)] disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[var(--eh-border)] px-3 py-1.5 text-[13px] text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Action confirmation modal */}
      {pendingAction && (
        <AdminActionModal
          open={true}
          title={pendingAction.title}
          description={pendingAction.description}
          variant={pendingAction.variant}
          loading={modalLoading}
          onConfirm={handleModalConfirm}
          onClose={() => { if (!modalLoading) setPendingAction(null); }}
        />
      )}
    </div>
  );
}
