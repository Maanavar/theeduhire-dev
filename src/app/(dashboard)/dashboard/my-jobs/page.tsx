"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Edit2,
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
import { getBillingPlan, type BillingPlan } from "@/lib/api/billing-client";
import { useClickOutside } from "@/hooks/use-click-outside";
import { toast } from "sonner";
import { NoJobsPostedState, SomethingWentWrongState } from "@/components/system/illustrated-states";
import { TableSkeleton } from "@/components/system/dashboard-skeletons";
import {
  PageHeader,
  PageShell,
  Panel,
  StatusBadge,
} from "@/components/layout/page-shell";

type MyJob = {
  id: string;
  title: string;
  subject: string;
  board: string;
  gradeLevel: string;
  jobType: string;
  experience: string | null;
  experienceLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  isUrgent: boolean;
  requiredWithin48h: boolean;
  requiresTet: boolean;
  applicationDeadline: string | null;
  postedAt: string;
  expiresAt: string | null;
  status: "ACTIVE" | "DRAFT" | "CLOSED" | "EXPIRED";
  school?: { schoolName?: string | null };
  _count: { applications: number };
  shortlistedCount: number;
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
  const [boardFilter, setBoardFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [dismissedPublishedId, setDismissedPublishedId] = useState<string | null>(null);
  const [previewJob, setPreviewJob] = useState<MyJob | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const publishedJobId = searchParams.get("published");

  useClickOutside(menuRef, () => setOpenMenuId(null), !!openMenuId);

  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenuId(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openMenuId]);

  const [billing, setBilling] = useState<BillingPlan | null>(null);

  useEffect(() => {
    getMyJobs()
      .then((data) => setJobs(data as MyJob[]))
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load jobs")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getBillingPlan().then(setBilling).catch(() => {});
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

  const filtered = useMemo(() => {
    const result = jobs.filter((job) => {
      const byTab = job.status === tab;
      const bySubject = subjectFilter === "ALL" || job.subject === subjectFilter;
      const byType = typeFilter === "ALL" || job.jobType === typeFilter;
      const byBoard = boardFilter === "ALL" || job.board === boardFilter;
      const q = search.trim().toLowerCase();
      const byQuery =
        q.length === 0 ||
        job.title.toLowerCase().includes(q) ||
        job.subject.toLowerCase().includes(q) ||
        job.gradeLevel.toLowerCase().includes(q);
      return byTab && bySubject && byType && byBoard && byQuery;
    });
    result.sort((a, b) => {
      const diff = new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      return sortOrder === "latest" ? diff : -diff;
    });
    return result;
  }, [jobs, search, tab, subjectFilter, typeFilter, boardFilter, sortOrder]);

  const subjects = useMemo(() => Array.from(new Set(jobs.map((job) => job.subject))).sort(), [jobs]);
  const jobTypes = useMemo(() => Array.from(new Set(jobs.map((job) => job.jobType))).sort(), [jobs]);
  const boards = useMemo(() => Array.from(new Set(jobs.map((job) => job.board).filter(Boolean))).sort(), [jobs]);

  useEffect(() => { setPage(1); }, [search, tab, subjectFilter, typeFilter, boardFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedJobs = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page, PAGE_SIZE]);

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
        subtitle="Create, manage, and monitor all your school job postings."
        actions={
          <Link href="/dashboard/post-job" className="eh-btn eh-btn-primary">
            <Plus size={14} /> Post New Job
          </Link>
        }
      />

      {/* KPI row — matches Figma */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total Jobs", value: jobs.length, sub: "All postings", textColor: "text-[var(--eh-primary-700)]" },
          { label: "Active Jobs", value: counts.ACTIVE, sub: "Currently live", textColor: "text-emerald-700" },
          { label: "Drafts", value: counts.DRAFT, sub: "Not published", textColor: "text-slate-700" },
          { label: "Closed Jobs", value: counts.CLOSED, sub: "No longer open", textColor: "text-amber-700" },
          { label: "Total Applicants", value: jobs.reduce((s, j) => s + j._count.applications, 0), sub: "Across all jobs", textColor: "text-sky-700" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[var(--eh-border)] bg-white px-4 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <p className="text-[12px] font-semibold text-[var(--eh-text-3)]">{m.label}</p>
            <p className={`mt-2 text-[28px] font-bold leading-none tracking-[-0.03em] ${m.textColor}`}>{m.value}</p>
            <p className="mt-2 text-[11px] font-medium text-[var(--eh-text-4)]">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Split layout: list + right sidebar */}
      <div className={["flex gap-4 transition-all", previewJob ? "xl:grid xl:grid-cols-[1fr_380px]" : "xl:grid xl:grid-cols-[1fr_300px]"].join(" ")}>
        <div className="min-w-0 flex-1">
          <Panel>
            {/* Status tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--eh-border)] px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {STATUS_TABS.map((entry) => (
                  <button
                    key={entry.key}
                    onClick={() => setTab(entry.key)}
                    className={[
                      "rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                      tab === entry.key
                        ? "border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
                        : "border-[var(--eh-border)] text-[var(--eh-text-2)] hover:border-[var(--eh-border-strong)]",
                    ].join(" ")}
                  >
                    {entry.label} ({counts[entry.key]})
                  </button>
                ))}
              </div>
              <span className="text-[12px] text-[var(--eh-text-3)]">
                Sort: <strong className="text-[var(--eh-text-2)]">Latest</strong>
              </span>
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--eh-border)] px-4 py-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by job title..."
                  className="input-base w-full pl-9"
                />
              </div>
              <div className="eh-select-wrap max-w-[160px] w-full">
                <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input-base w-full">
                  <option value="ALL">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div className="eh-select-wrap max-w-[140px] w-full">
                <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)} className="input-base w-full">
                  <option value="ALL">All Boards</option>
                  {boards.map((board) => (
                    <option key={board} value={board}>{board}</option>
                  ))}
                </select>
              </div>
              <div className="eh-select-wrap max-w-[140px] w-full">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-base w-full">
                  <option value="ALL">All Types</option>
                  {jobTypes.map((jobType) => (
                    <option key={jobType} value={jobType}>{typeLabel(jobType)}</option>
                  ))}
                </select>
              </div>
              <div className="eh-select-wrap max-w-[120px] w-full">
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")} className="input-base w-full">
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[var(--eh-border)] bg-[var(--surface-base)]">
                    {["Job Title", "Subject", "Board", "Posted Date", "Applicants", "Shortlisted", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8}><TableSkeleton rows={6} /></td></tr>
                  ) : error ? (
                    <tr><td colSpan={8} className="p-4">
                      <SomethingWentWrongState title="Couldn't load jobs" message={error} onRetry={() => window.location.reload()} />
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="p-4">
                      <NoJobsPostedState
                        actions={<Link href="/dashboard/post-job" className="eh-btn eh-btn-primary eh-btn-sm"><Plus size={13} /> Post a Job</Link>}
                      />
                    </td></tr>
                  ) : pagedJobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => setPreviewJob((prev) => prev?.id === job.id ? null : job)}
                      className={["group cursor-pointer border-b border-[var(--eh-border)] last:border-0 transition-colors", previewJob?.id === job.id ? "bg-[var(--eh-primary-50)]" : "hover:bg-[var(--surface-base)]"].join(" ")}
                    >
                      <td className="px-4 py-4">
                        <p className="text-[14px] font-semibold text-[var(--eh-text)]">{job.title}</p>
                        <p className="mt-0.5 text-[12px] text-[var(--eh-text-3)]">{typeLabel(job.jobType)}</p>
                      </td>
                      <td className="px-4 py-4 text-[13px] text-[var(--eh-text-2)]">{job.subject}</td>
                      <td className="px-4 py-4 text-[13px] text-[var(--eh-text-2)]">{job.board || "—"}</td>
                      <td className="px-4 py-4">
                        <p className="text-[13px] font-medium text-[var(--eh-text-2)]">{new Date(job.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--eh-text-3)]">{timeAgo(job.postedAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {/* Avatar stack */}
                          <div className="flex -space-x-2">
                            {Array.from({ length: Math.min(job._count.applications, 4) }).map((_, i) => (
                              <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[var(--eh-primary-100)] text-[9px] font-bold text-[var(--eh-primary-700)]">
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[var(--eh-text)]">{job._count.applications}</p>
                            {job._count.applications > 4 && <p className="text-[10px] text-[var(--eh-text-4)]">+{job._count.applications - 4} more</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[13px] font-medium text-[var(--eh-text-2)]">{job.shortlistedCount}</td>
                      <td className="px-4 py-4">
                        <StatusBadge role="status" tone={statusTone[job.status]} dot className="max-w-fit">
                          {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setPreviewJob(job); }} className="eh-btn eh-btn-secondary eh-btn-sm">View</button>
                          <div className="relative" ref={openMenuId === job.id ? menuRef : undefined}>
                            <button onClick={() => setOpenMenuId((prev) => (prev === job.id ? null : job.id))} className="rounded-lg border border-[var(--eh-border)] p-1.5 text-[var(--eh-text-4)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--eh-text-2)]">
                              {updatingStatusId === job.id ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
                            </button>
                            {openMenuId === job.id && (
                              <div role="menu" className="eh-popover absolute right-0 z-20 mt-1 w-48">
                                <button role="menuitem" onClick={() => handleEdit(job.id)} className="eh-popover-item"><Edit2 size={12} /> Edit job</button>
                                <button role="menuitem" onClick={() => handleViewApplicants(job.id)} className="eh-popover-item"><Users size={12} /> View applicants</button>
                                <div className="eh-popover-divider" />
                                {(["ACTIVE", "DRAFT", "CLOSED"] as const).filter((s) => s !== job.status).map((status) => (
                                  <button key={status} role="menuitem" onClick={() => updateStatus(job.id, status)} className="eh-popover-item">Mark as {status.toLowerCase()}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--eh-border)] px-4 py-3">
                <p className="text-[13px] text-[var(--eh-text-3)]">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} jobs
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-40">Prev</button>
                  <span className="rounded-lg bg-[var(--eh-primary-600)] px-3 py-1.5 text-[12px] font-semibold text-white">{page}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-40">Next</button>
                </div>
                <p className="text-[12px] text-[var(--eh-text-3)]">Page {page} of {totalPages}</p>
              </div>
            )}

          </Panel>
        </div>

        {/* Right panel: inline preview OR plan sidebar */}
        <div className="hidden xl:flex flex-col gap-4 sticky top-4 h-fit">
          {previewJob ? (
            <div className="flex flex-col rounded-xl border border-[var(--eh-border)] bg-white shadow-sm overflow-hidden animate-panel-slide-in">
              <JobPreviewPanel
                job={previewJob}
                onClose={() => setPreviewJob(null)}
                onViewApplicants={handleViewApplicants}
                onEdit={handleEdit}
              />
            </div>
          ) : (
            <>
              {/* Plan usage card */}
              {(() => {
                const planName = billing?.plan ?? "FREE";
                const planLabel = planName.charAt(0) + planName.slice(1).toLowerCase();
                const used = billing?.postsUsed ?? counts.ACTIVE;
                const limit = billing ? billing.postsLimit : null;
                const isUnlimited = billing != null && billing.postsLimit === null;
                const pct = isUnlimited ? (used > 0 ? 100 : 0) : limit ? Math.min((used / limit) * 100, 100) : 0;
                return (
                  <Panel className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Your Plan Usage</h3>
                      <StatusBadge tone="brand">{planLabel} Plan</StatusBadge>
                    </div>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="text-[var(--eh-text-3)]">Active job posts used</span>
                      <span className="font-semibold text-[var(--eh-text)]">{used} / {isUnlimited ? "∞" : limit ?? "—"}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-base)]">
                      <div className="h-full rounded-full bg-[var(--eh-primary-600)] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <Link href="/dashboard/billing" className="mt-4 block w-full text-center rounded-lg border border-[var(--eh-border)] px-3 py-2 text-[12px] font-semibold text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors">
                      View Plan
                    </Link>
                  </Panel>
                );
              })()}
              {/* Upgrade nudge */}
              <Panel className="p-5">
                <p className="text-[13px] font-semibold text-[var(--eh-text)] mb-1">Need more job posts?</p>
                <p className="text-[12px] text-[var(--eh-text-3)] leading-[1.6] mb-3">Upgrade your plan to post more jobs and reach more qualified candidates.</p>
                <Link href="/dashboard/billing" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">
                  Upgrade Plan <ArrowRight size={12} />
                </Link>
              </Panel>
              {/* Managed recruitment */}
              <Panel className="p-5">
                <p className="text-[13px] font-semibold text-[var(--eh-text)] mb-1">Let EduHire handle your recruitment</p>
                <p className="text-[12px] text-[var(--eh-text-3)] leading-[1.6] mb-3">We source, screen, and coordinate candidates so you can focus on students, not hiring.</p>
                <ul className="space-y-1.5 mb-4">
                  {["Verified & pre-screened candidates", "End-to-end hiring support", "Faster hiring, better quality"].map((feat) => (
                    <li key={feat} className="flex items-center gap-1.5 text-[12px] text-[var(--eh-text-3)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" /> {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/managed-recruitment" className="eh-btn eh-btn-primary w-full justify-center">
                  Explore Managed Recruitment
                </Link>
              </Panel>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
