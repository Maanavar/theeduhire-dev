"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Edit2,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api/client";
import { getMyJobs, updateJobStatus } from "@/lib/api/hiring-client";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/system/system-states";
import { TableSkeleton } from "@/components/system/dashboard-skeletons";
import {
  DataTable,
  FilterBar,
  PageHeader,
  PageShell,
  Panel,
  StatusBadge,
  Toolbar,
} from "@/components/layout/page-shell";

type MyJob = {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  jobType: string;
  postedAt: string;
  expiresAt: string | null;
  status: "ACTIVE" | "DRAFT" | "CLOSED" | "EXPIRED";
  school?: { schoolName?: string | null };
  _count: { applications: number };
};

const STATUS_TABS: Array<{ key: "ACTIVE" | "DRAFT" | "CLOSED" | "EXPIRED"; label: string }> = [
  { key: "ACTIVE", label: "Active" },
  { key: "DRAFT", label: "Drafts" },
  { key: "CLOSED", label: "Closed" },
  { key: "EXPIRED", label: "Archived" },
];

const typeLabel = (jobType: string) =>
  jobType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const statusTone: Record<MyJob["status"], "success" | "neutral" | "warning" | "danger"> = {
  ACTIVE: "success",
  DRAFT: "neutral",
  CLOSED: "warning",
  EXPIRED: "danger",
};

const closeLabel = (job: MyJob) => {
  if (job.expiresAt) {
    const date = new Date(job.expiresAt);
    if (!Number.isNaN(date.getTime())) {
      return `Closes ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    }
  }
  return "No expiry set";
};

// ── Inline Job Preview Panel ──────────────────────────────────────────────────
function JobPreviewPanel({
  job,
  onClose,
  onViewApplicants,
  onEdit,
}: {
  job: MyJob;
  onClose: () => void;
  onViewApplicants: (jobId: string) => void;
  onEdit: (jobId: string) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--eh-border)] px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
            Job preview
          </p>
          <h2 className="mt-0.5 text-[16px] font-semibold leading-snug text-[var(--eh-text)] truncate">
            {job.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 rounded-md p-1.5 text-[var(--eh-text-3)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text-2)]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Status + badge row */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge tone={statusTone[job.status]} dot className="max-w-fit">
            {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
          </StatusBadge>
          <span className="text-[12px] text-[var(--eh-text-3)]">{typeLabel(job.jobType)}</span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Subject", value: job.subject },
            { label: "Grade", value: `Grade ${job.gradeLevel}` },
            { label: "Posted", value: timeAgo(job.postedAt) },
            { label: "Expiry", value: closeLabel(job) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">{label}</p>
              <p className="mt-0.5 text-[13px] font-medium text-[var(--eh-text-2)]">{value}</p>
            </div>
          ))}
        </div>

        {/* Applicant count */}
        <div className="flex items-center gap-3 rounded-xl border border-[var(--eh-border)] bg-white px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--eh-primary-50)]">
            <Users size={16} className="text-[var(--eh-primary-600)]" />
          </div>
          <div>
            <p className="text-[22px] font-semibold leading-none tracking-[-0.02em] text-[var(--eh-primary-700)]">
              {job._count.applications}
            </p>
            <p className="text-[12px] text-[var(--eh-text-3)]">total applicants</p>
          </div>
          <button
            type="button"
            onClick={() => onViewApplicants(job.id)}
            className="ml-auto eh-btn eh-btn-secondary eh-btn-sm"
          >
            Review <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-[var(--eh-border)] px-5 py-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(job.id)}
          className="eh-btn eh-btn-secondary flex-1"
        >
          <Edit2 size={13} /> Edit job
        </button>
        <button
          type="button"
          onClick={() => onViewApplicants(job.id)}
          className="eh-btn eh-btn-primary flex-1"
        >
          <Users size={13} /> View applicants
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ACTIVE" | "DRAFT" | "CLOSED" | "EXPIRED">("ACTIVE");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [dismissedPublishedId, setDismissedPublishedId] = useState<string | null>(null);
  const [previewJob, setPreviewJob] = useState<MyJob | null>(null);
  const publishedJobId = searchParams.get("published");

  useEffect(() => {
    getMyJobs()
      .then((data) => setJobs(data as MyJob[]))
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load jobs")))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      ACTIVE: jobs.filter((job) => job.status === "ACTIVE").length,
      DRAFT: jobs.filter((job) => job.status === "DRAFT").length,
      CLOSED: jobs.filter((job) => job.status === "CLOSED").length,
      EXPIRED: jobs.filter((job) => job.status === "EXPIRED").length,
    }),
    [jobs]
  );

  const filtered = useMemo(
    () =>
      jobs.filter((job) => {
        const byTab = job.status === tab;
        const bySubject = subjectFilter === "ALL" || job.subject === subjectFilter;
        const byType = typeFilter === "ALL" || job.jobType === typeFilter;
        const q = search.trim().toLowerCase();
        const byQuery =
          q.length === 0 ||
          job.title.toLowerCase().includes(q) ||
          job.subject.toLowerCase().includes(q) ||
          job.gradeLevel.toLowerCase().includes(q);
        return byTab && bySubject && byType && byQuery;
      }),
    [jobs, search, tab, subjectFilter, typeFilter]
  );

  const subjects = useMemo(() => Array.from(new Set(jobs.map((job) => job.subject))).sort(), [jobs]);
  const jobTypes = useMemo(() => Array.from(new Set(jobs.map((job) => job.jobType))).sort(), [jobs]);
  const schoolName = jobs[0]?.school?.schoolName || "your school";

  const updateStatus = async (jobId: string, status: "DRAFT" | "ACTIVE" | "CLOSED" | "EXPIRED") => {
    setUpdatingStatusId(jobId);
    try {
      await updateJobStatus(jobId, status);
      setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, status } : job)));
      setOpenMenuId(null);
      toast.success(`Job marked as ${status.toLowerCase()}`);
      if (previewJob?.id === jobId) {
        setPreviewJob((prev) => prev ? { ...prev, status } : prev);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update status"));
      setError(getApiErrorMessage(err, "Failed to update status"));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleViewApplicants = (jobId: string) => {
    setPreviewJob(null);
    router.push(`/dashboard/applicants?jobId=${jobId}`);
  };

  const handleEdit = (jobId: string) => {
    setPreviewJob(null);
    router.push(`/dashboard/post-job?jobId=${jobId}`);
  };

  return (
    <PageShell>
      {/* Published success banner */}
      {publishedJobId && dismissedPublishedId !== publishedJobId ? (
        <Panel className="border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-[13px] font-semibold text-emerald-800">Your job is now live</p>
          <div className="mt-1 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPreviewJob(jobs.find((j) => j.id === publishedJobId) ?? null)}
              className="text-[12px] font-medium text-emerald-700 underline underline-offset-2"
            >
              View job
            </button>
            <button
              type="button"
              onClick={async () => {
                const shareUrl = `${window.location.origin}/jobs/${publishedJobId}`;
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Job link copied to clipboard");
              }}
              className="text-[12px] font-medium text-emerald-700 underline underline-offset-2"
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => setDismissedPublishedId(publishedJobId)}
              className="text-[12px] font-medium text-emerald-700"
            >
              Dismiss
            </button>
          </div>
        </Panel>
      ) : null}

      <PageHeader
        title="Jobs"
        subtitle={`Manage all teaching positions at ${schoolName}.`}
        actions={
          <Link href="/dashboard/post-job" className="eh-btn eh-btn-primary">
            <Plus size={14} /> Post a job
          </Link>
        }
      />

      {/* Split layout: list + inline preview */}
      <div className={["flex gap-4 transition-all", previewJob ? "xl:grid xl:grid-cols-[1fr_380px]" : ""].join(" ")}>
        <div className="min-w-0 flex-1">
          <Panel>
            <Toolbar className="rounded-none border-0 border-b border-eh shadow-none">
              <div className="flex flex-wrap gap-2">
                {STATUS_TABS.map((entry) => (
                  <button
                    key={entry.key}
                    onClick={() => setTab(entry.key)}
                    className={[
                      "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      tab === entry.key
                        ? "border-brand-200 bg-brand-50 text-brand-700"
                        : "border-eh text-eh-text2 hover:border-brand-200 hover:text-brand-700",
                    ].join(" ")}
                  >
                    {entry.label} ({counts[entry.key]})
                  </button>
                ))}
              </div>
              <span className="text-[13px] text-eh-text3">
                Sort: <strong className="text-eh-text2">Newest first</strong>
              </span>
            </Toolbar>

            <FilterBar>
              <label className="eh-search min-w-[240px] flex-1">
                <Search size={14} className="text-eh-text3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, subject, or grade"
                />
              </label>
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.04em] text-eh-text3">
                <Filter size={12} /> Filters
              </span>
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input-base max-w-[160px]">
                <option value="ALL">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-base max-w-[160px]">
                <option value="ALL">All types</option>
                {jobTypes.map((jobType) => (
                  <option key={jobType} value={jobType}>{typeLabel(jobType)}</option>
                ))}
              </select>
            </FilterBar>
          </Panel>

          <DataTable>
            <div className="grid min-w-[820px] grid-cols-[2.2fr_0.9fr_0.9fr_0.8fr_0.7fr_0.7fr_56px] border-b border-eh bg-eh-soft px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-eh-text3">
              <span>Job</span>
              <span>Subject</span>
              <span>Type</span>
              <span>Posted</span>
              <span>Applicants</span>
              <span>Status</span>
              <span />
            </div>

            {loading ? (
              <TableSkeleton rows={6} />
            ) : error ? (
              <div className="p-4">
                <ErrorState
                  title="Couldn't load jobs"
                  message={error}
                  actions={
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="eh-btn eh-btn-secondary eh-btn-sm"
                    >
                      Retry
                    </button>
                  }
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title={tab === "ACTIVE" ? "You haven't posted any jobs yet" : "No jobs found"}
                  message={
                    tab === "ACTIVE"
                      ? "Post your first role to start receiving applications."
                      : "Try a different tab or adjust your filters."
                  }
                  actions={
                    <Link href="/dashboard/post-job" className="eh-btn eh-btn-primary eh-btn-sm">
                      <Plus size={13} /> Post a Job
                    </Link>
                  }
                />
              </div>
            ) : (
              filtered.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setPreviewJob((prev) => prev?.id === job.id ? null : job)}
                  className={[
                    "group grid min-w-[820px] grid-cols-[2.2fr_0.9fr_0.9fr_0.8fr_0.7fr_0.7fr_56px] items-center border-b border-eh px-4 py-4 last:border-b-0 cursor-pointer transition-colors",
                    previewJob?.id === job.id
                      ? "bg-[var(--eh-primary-50)] border-l-2 border-l-[var(--eh-primary-500)]"
                      : "hover:bg-[var(--surface-base)]",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-eh-text">{job.title}</p>
                    <p className="truncate text-[12px] text-eh-text3">
                      Grade {job.gradeLevel} · {closeLabel(job)}
                    </p>
                  </div>
                  <span className="text-[13px] text-eh-text2">{job.subject}</span>
                  <span className="text-[13px] text-eh-text2">{typeLabel(job.jobType)}</span>
                  <span className="text-[13px] text-eh-text2">{timeAgo(job.postedAt)}</span>
                  <div>
                    <p className="text-[15px] font-semibold text-eh-text">{job._count.applications}</p>
                    <p className="text-[11px] text-eh-text3">applicants</p>
                  </div>
                  <StatusBadge role="status" tone={statusTone[job.status]} dot className="max-w-fit">
                    {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                  </StatusBadge>
                  {/* Actions */}
                  <div
                    className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId((prev) => (prev === job.id ? null : job.id))}
                        aria-label="Open job actions"
                        className="rounded-md p-1.5 text-eh-text3 hover:bg-white hover:text-eh-text2 hover:shadow-sm"
                      >
                        {updatingStatusId === job.id ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={15} />}
                      </button>
                      {openMenuId === job.id ? (
                        <div role="menu" className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-eh bg-white p-1 shadow-lg shadow-black/[0.08]">
                          <button
                            role="menuitem"
                            onClick={() => handleEdit(job.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-eh-text2 hover:bg-eh-soft"
                          >
                            <Edit2 size={12} /> Edit job
                          </button>
                          <button
                            role="menuitem"
                            onClick={() => { setPreviewJob(job); setOpenMenuId(null); }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-eh-text2 hover:bg-eh-soft"
                          >
                            <Eye size={12} /> Preview
                          </button>
                          <button
                            role="menuitem"
                            onClick={() => handleViewApplicants(job.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-eh-text2 hover:bg-eh-soft"
                          >
                            <Users size={12} /> View applicants
                          </button>
                          <div className="my-1 border-t border-eh" />
                          {(["ACTIVE", "DRAFT", "CLOSED"] as const).filter((s) => s !== job.status).map((status) => (
                            <button
                              key={status}
                              role="menuitem"
                              onClick={() => updateStatus(job.id, status)}
                              className="block w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium text-eh-text2 hover:bg-eh-soft"
                            >
                              Mark as {status.toLowerCase()}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </DataTable>
        </div>

        {/* Inline job preview panel */}
        {previewJob ? (
          <div className="hidden xl:flex flex-col rounded-xl border border-[var(--eh-border)] bg-white shadow-sm overflow-hidden h-fit sticky top-4">
            <JobPreviewPanel
              job={previewJob}
              onClose={() => setPreviewJob(null)}
              onViewApplicants={handleViewApplicants}
              onEdit={handleEdit}
            />
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
