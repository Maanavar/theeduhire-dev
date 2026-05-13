"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, Filter, Loader2, MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api/client";
import { getMyJobs, updateJobStatus } from "@/lib/api/hiring-client";
import { EmptyState, ErrorState } from "@/components/system/system-states";
import { TableSkeleton } from "@/components/system/dashboard-skeletons";
import { DataTable, FilterBar, PageHeader, PageShell, Panel, StatusBadge, Toolbar } from "@/components/layout/page-shell";

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

export default function MyJobsPage() {
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
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update status"));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <PageShell>
      {publishedJobId && dismissedPublishedId !== publishedJobId ? (
        <Panel className="border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-[13px] font-semibold text-emerald-800">Your job is now live</p>
          <div className="mt-1 flex flex-wrap gap-3">
            <Link href={`/jobs/${publishedJobId}`} target="_blank" className="text-[12px] font-medium text-emerald-700 underline underline-offset-2">
              View job
            </Link>
            <button
              type="button"
              onClick={async () => {
                const shareUrl = `${window.location.origin}/jobs/${publishedJobId}`;
                await navigator.clipboard.writeText(shareUrl);
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
          <label className="eh-search min-w-[280px] flex-1">
            <Search size={14} className="text-eh-text3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, subject, or grade level"
            />
          </label>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.04em] text-eh-text3">
            <Filter size={12} /> Filters
          </span>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input-base max-w-[180px]">
            <option value="ALL">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-base max-w-[180px]">
            <option value="ALL">All types</option>
            {jobTypes.map((jobType) => (
              <option key={jobType} value={jobType}>
                {typeLabel(jobType)}
              </option>
            ))}
          </select>
        </FilterBar>
      </Panel>

      <DataTable>
        <div className="grid min-w-[920px] grid-cols-[2.4fr_1fr_1fr_1fr_1fr_1fr_70px] border-b border-eh bg-eh-soft px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-eh-text3">
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
            <div key={job.id} className="grid min-w-[920px] grid-cols-[2.4fr_1fr_1fr_1fr_1fr_1fr_70px] items-center border-b border-eh px-4 py-4 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate text-[22px] font-semibold tracking-[-0.01em] text-eh-text">{job.title}</p>
                <p className="truncate text-[12px] text-eh-text3">
                  Grade {job.gradeLevel} - {closeLabel(job)}
                </p>
              </div>
              <span className="text-[13px] text-eh-text2">{job.subject}</span>
              <span className="text-[13px] text-eh-text2">{typeLabel(job.jobType)}</span>
              <span className="text-[13px] text-eh-text2">{timeAgo(job.postedAt)}</span>
              <div>
                <p className="text-[15px] font-semibold text-eh-text">{job._count.applications}</p>
                <p className="text-[11px] text-eh-text3">applicants</p>
              </div>
              <StatusBadge role="status" aria-label={`Job status: ${job.status}`} tone={statusTone[job.status]} dot className="max-w-fit">
                {job.status}
              </StatusBadge>
              <div className="flex items-center justify-end gap-1">
                <Link href={`/dashboard/applicants?jobId=${job.id}`} title="View applicants" aria-label="View applicants" className="rounded-md p-1.5 text-eh-text3 hover:bg-eh-soft hover:text-eh-text2">
                  <Users size={15} />
                </Link>
                <Link href={`/jobs/${job.id}`} target="_blank" title="Preview job post" aria-label="Preview job post" className="rounded-md p-1.5 text-eh-text3 hover:bg-eh-soft hover:text-eh-text2">
                  <Eye size={15} />
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId((prev) => (prev === job.id ? null : job.id))}
                    aria-label="Open job actions"
                    className="rounded-md p-1.5 text-eh-text3 hover:bg-eh-soft hover:text-eh-text2"
                  >
                    {updatingStatusId === job.id ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={15} />}
                  </button>
                  {openMenuId === job.id ? (
                    <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-eh bg-white p-1 shadow-md">
                      <Link href={`/dashboard/post-job?jobId=${job.id}`} className="block w-full rounded px-2 py-1.5 text-left text-[12px] font-medium text-eh-text2 hover:bg-eh-soft">
                        Edit job
                      </Link>
                      {(["ACTIVE", "DRAFT", "CLOSED", "EXPIRED"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(job.id, status)}
                          className={`block w-full rounded px-2 py-1.5 text-left text-[12px] font-medium hover:bg-eh-soft ${job.status === status ? "text-brand-700" : "text-eh-text2"}`}
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
    </PageShell>
  );
}
