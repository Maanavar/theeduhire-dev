"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Calendar, Download, Loader2, MapPin, MessageSquare, Send, ShieldCheck, Star, XCircle } from "lucide-react";
import { toast } from "sonner";
import { featureFlags } from "@/config/feature-flags";
import { ScheduleInterviewModal } from "@/components/interviews/schedule-interview-modal";
import { EmptyState, ErrorState } from "@/components/system/system-states";
import { RowsSkeleton } from "@/components/system/dashboard-skeletons";
import { trackEvent } from "@/lib/analytics";
import { getApiErrorMessage } from "@/lib/api/client";
import { useSchoolLiveUpdates } from "@/hooks/use-school-live-updates";
import {
  bulkUpdateApplicants,
  createConversation,
  getAllRankedCandidates,
  getMyJobs,
  type ApplicantBoardCandidate,
  updateApplicationStatus,
  type SchoolJobSummary,
} from "@/lib/api/hiring-client";
import { FilterBar, Metric, PageHeader, PageShell, Panel, StatusBadge, Toolbar } from "@/components/layout/page-shell";

const avatarColors = ["#4338ca", "#0f766e", "#be185d", "#b45309", "#0e7490", "#9a3412"];
const statusLabel: Record<string, string> = {
  PENDING: "NEW",
  REVIEWED: "REVIEWED",
  SHORTLISTED: "SHORTLISTED",
  INTERVIEW_SCHEDULED: "INTERVIEW",
  INTERVIEW_COMPLETED: "INTERVIEW",
  REJECTED: "REJECTED",
  HIRED: "HIRED",
};
const statusTone: Record<string, "brand" | "neutral" | "warning" | "info" | "danger" | "success"> = {
  NEW: "brand",
  REVIEWED: "neutral",
  SHORTLISTED: "success",
  INTERVIEW: "warning",
  REJECTED: "danger",
  HIRED: "info",
};
const AUTO_REFRESH_MS = 15000;
const PAGE_SIZE = 20;
type ApplicantSort = "MATCH_DESC" | "APPLIED_DESC" | "APPLIED_ASC";
type ApplicantBulkStatus = "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";
type ApplicantUpdateStatus =
  | "PENDING"
  | "REVIEWED"
  | "SHORTLISTED"
  | "REJECTED"
  | "HIRED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED";
const sortOptions: ApplicantSort[] = ["MATCH_DESC", "APPLIED_DESC", "APPLIED_ASC"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ApplicantsBoardPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<SchoolJobSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidates, setCandidates] = useState<ApplicantBoardCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<ApplicantSort>("MATCH_DESC");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [messagingAll, setMessagingAll] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [noteLoadingId, setNoteLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ApplicantBulkStatus>("SHORTLISTED");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [scheduleApplicationId, setScheduleApplicationId] = useState<string | null>(null);
  const preselectedJobId = searchParams.get("jobId") || "";
  const prefilledSearch = searchParams.get("search") || "";

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const loadCandidates = useCallback(async (jobId: string) => {
    const allCandidates = await getAllRankedCandidates(jobId);
    setCandidates(allCandidates);
    setLastSyncedAt(Date.now());
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const activeJobs = (await getMyJobs()).filter((entry) => entry.status === "ACTIVE");
        setJobs(activeJobs);
        if (activeJobs[0]) {
          const nextJobId = activeJobs.some((entry) => entry.id === preselectedJobId) ? preselectedJobId : activeJobs[0].id;
          setSelectedJobId(nextJobId);
          await loadCandidates(nextJobId);
        } else {
          setCandidates([]);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load applicants"));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [loadCandidates, preselectedJobId]);

  useEffect(() => {
    setSearch(prefilledSearch);
  }, [prefilledSearch]);

  const { mode: liveMode } = useSchoolLiveUpdates({
    jobId: selectedJobId,
    paused: !selectedJobId || !!updatingId || bulkLoading,
    onUpdate: async () => {
      setRefreshing(true);
      try {
        await loadCandidates(selectedJobId);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to refresh applicants"));
      } finally {
        setRefreshing(false);
      }
    },
  });

  useEffect(() => {
    if (!selectedJobId) return;
    if (liveMode !== "polling") return;

    let disposed = false;
    const tick = async () => {
      if (document.hidden || updatingId || bulkLoading) return;
      setRefreshing(true);
      try {
        await loadCandidates(selectedJobId);
      } catch (err) {
        if (!disposed) setError(getApiErrorMessage(err, "Failed to refresh applicants"));
      } finally {
        if (!disposed) setRefreshing(false);
      }
    };

    const id = window.setInterval(tick, AUTO_REFRESH_MS);
    return () => {
      disposed = true;
      window.clearInterval(id);
    };
  }, [bulkLoading, liveMode, loadCandidates, selectedJobId, updatingId]);

  const groupedCounts = useMemo(() => {
    const entries = {
      ALL: candidates.length,
      NEW: 0,
      REVIEWED: 0,
      SHORTLISTED: 0,
      INTERVIEW: 0,
      REJECTED: 0,
      HIRED: 0,
    };
    for (const candidate of candidates) {
      const label = statusLabel[candidate.status] || "NEW";
      if (label in entries) entries[label as keyof typeof entries] += 1;
    }
    return entries;
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const next = candidates.filter((candidate) => {
      const byTab = tab === "ALL" || (statusLabel[candidate.status] || "NEW") === tab;
      const byQuery =
        q.length === 0 ||
        candidate.applicant.name.toLowerCase().includes(q) ||
        candidate.applicant.teacherProfile?.city?.toLowerCase().includes(q) ||
        candidate.applicant.teacherProfile?.subjects?.join(" ").toLowerCase().includes(q);
      return byTab && byQuery;
    });

    if (sortBy === "MATCH_DESC") next.sort((a, b) => b.matchScore - a.matchScore);
    if (sortBy === "APPLIED_DESC") next.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    if (sortBy === "APPLIED_ASC") next.sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());
    return next;
  }, [candidates, search, sortBy, tab]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, tab, selectedJobId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedCandidates = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );
  const setStatus = async (applicationId: string, nextStatus: ApplicantUpdateStatus) => {
    setUpdatingId(applicationId);
    try {
      await updateApplicationStatus(applicationId, { status: nextStatus });
      setCandidates((prev) => prev.map((candidate) => (candidate.id === applicationId ? { ...candidate, status: nextStatus } : candidate)));
      toast.success("Status updated");
      trackEvent("application_status_changed", {
        applicationId,
        toStatus: nextStatus,
        source: "applicants_board",
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update status"));
    } finally {
      setUpdatingId(null);
    }
  };

  const saveNotes = async (candidate: ApplicantBoardCandidate) => {
    const note = (notesDraft[candidate.id] ?? candidate.schoolNotes ?? "").trim();
    setNoteLoadingId(candidate.id);
    try {
      await updateApplicationStatus(candidate.id, {
        status: candidate.status,
        schoolNotes: note,
      });
      setCandidates((prev) =>
        prev.map((entry) => (entry.id === candidate.id ? { ...entry, schoolNotes: note } : entry))
      );
      toast.success("Notes saved");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save notes"));
    } finally {
      setNoteLoadingId(null);
    }
  };

  const startConversation = async (candidate: ApplicantBoardCandidate) => {
    const data = await createConversation({
      participantIds: [candidate.applicantId],
      message: `Hi ${candidate.applicant.name}, thanks for applying. We would like to discuss the next steps.`,
    });
    return data.id;
  };

  const messageAllShortlisted = async () => {
    const shortlisted = filtered.filter((candidate) => candidate.status === "SHORTLISTED");
    if (shortlisted.length === 0) {
      toast.error("No shortlisted candidates in current filter");
      return;
    }
    setMessagingAll(true);
    let success = 0;
    for (const candidate of shortlisted) {
      try {
        await startConversation(candidate);
        success += 1;
      } catch {
        continue;
      }
    }
    setMessagingAll(false);
    if (success > 0) toast.success(`Started ${success} conversation${success > 1 ? "s" : ""}`);
    else toast.error("Unable to message shortlisted candidates");
  };

  const runBulkUpdate = async () => {
    if (!selectedJobId || selectedIds.length === 0) {
      toast.error("Select at least one applicant");
      return;
    }
    setBulkLoading(true);
    try {
      const result = await bulkUpdateApplicants(selectedJobId, {
        applicationIds: selectedIds,
        status: bulkStatus,
      });
      setCandidates((prev) =>
        prev.map((candidate) =>
          selectedIds.includes(candidate.id) ? { ...candidate, status: bulkStatus } : candidate
        )
      );
      setSelectedIds([]);
      toast.success(`Updated ${result.updated} applicants`);
      trackEvent("application_status_changed", {
        count: selectedIds.length,
        toStatus: bulkStatus,
        source: "applicants_bulk",
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Bulk update failed"));
    } finally {
      setBulkLoading(false);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("No applicants available to export");
      return;
    }
    const header = [
      "Name",
      "Status",
      "Match Score",
      "Applied At",
      "City",
      "Experience",
      "Qualification",
      "Resume",
      "School Notes",
    ];
    const rows = filtered.map((candidate) => [
      candidate.applicant.name,
      candidate.status,
      String(candidate.matchScore),
      new Date(candidate.appliedAt).toISOString(),
      candidate.applicant.teacherProfile?.city || "",
      candidate.applicant.teacherProfile?.experience || "",
      candidate.applicant.teacherProfile?.qualification || "",
      candidate.resume?.fileName || "",
      candidate.schoolNotes || "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `applicants-${selectedJobId || "job"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  if (status === "loading") {
    return (
      <RowsSkeleton rows={4} />
    );
  }

  if (session?.user?.role !== "SCHOOL_ADMIN") {
    return (
      <Panel className="p-5 text-[14px] text-eh-text2">
        This applicants board is available for school admins. Teacher view is available in{" "}
        <Link href="/dashboard/applications" className="font-semibold text-brand-700">
          My Applications
        </Link>
        .
      </Panel>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Applicants"
        subtitle={`${candidates.length} total applicants. ${refreshing ? "Syncing now." : liveMode === "sse" ? "Live updates enabled." : `Auto-refresh every ${AUTO_REFRESH_MS / 1000}s.`}${lastSyncedAt ? ` Last sync ${new Date(lastSyncedAt).toLocaleTimeString("en-IN")}.` : ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCsv} className="eh-btn eh-btn-secondary">
              <Download size={14} /> Download CSV
            </button>
            {featureFlags.messaging && (
              <button onClick={messageAllShortlisted} disabled={messagingAll} className="eh-btn eh-btn-secondary">
                {messagingAll ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Message shortlisted
              </button>
            )}
            <button
              type="button"
              onClick={() => setScheduleApplicationId(filtered[0]?.id || null)}
              disabled={!filtered[0]}
              className="eh-btn eh-btn-primary disabled:opacity-50"
            >
              <Calendar size={14} /> Schedule interview
            </button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="New" value={groupedCounts.NEW} hint="Fresh applications awaiting review" tone="brand" />
        <Metric label="Shortlisted" value={groupedCounts.SHORTLISTED} hint="Ready for outreach or scheduling" tone="success" />
        <Metric label="Interview" value={groupedCounts.INTERVIEW} hint="Candidates already in process" tone="warning" />
        <Metric label="Hired" value={groupedCounts.HIRED} hint="Successful closeouts on this board" tone="info" />
      </div>

      <Panel>
        <Toolbar className="rounded-none border-0 border-b border-eh shadow-none">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedJobId}
              onChange={async (event) => {
                const nextJobId = event.target.value;
                setSelectedJobId(nextJobId);
                setSelectedIds([]);
                setLoading(true);
                try {
                  await loadCandidates(nextJobId);
                } catch (err) {
                  setError(getApiErrorMessage(err, "Failed to load applicants"));
                } finally {
                  setLoading(false);
                }
              }}
              className="input-base min-w-[320px]"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-eh-text3">
              {selectedJob?.school?.schoolName || "Active job"}
            </span>
          </div>
          <p className="text-[12px] text-eh-text3">
            {refreshing
              ? "Syncing..."
              : liveMode === "sse"
                ? "Live updates enabled"
                : `Auto-refresh every ${AUTO_REFRESH_MS / 1000}s`}
            {lastSyncedAt ? ` | Last sync ${new Date(lastSyncedAt).toLocaleTimeString("en-IN")}` : ""}
          </p>
        </Toolbar>
        <FilterBar className="border-t-0">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, location, subject"
            className="input-base max-w-[320px] flex-1"
          />
          <select
            value={sortBy}
            onChange={(event) => {
              const nextSort = event.target.value as ApplicantSort;
              if (sortOptions.includes(nextSort)) {
                setSortBy(nextSort);
              }
            }}
            className="input-base max-w-[220px]"
          >
            <option value="MATCH_DESC">Sort: Match score</option>
            <option value="APPLIED_DESC">Sort: Applied date (newest)</option>
            <option value="APPLIED_ASC">Sort: Applied date (oldest)</option>
          </select>
          <div className="flex flex-wrap gap-2">
            {Object.entries(groupedCounts).map(([key, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={[
                  "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  tab === key
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-eh text-eh-text2 hover:border-brand-200 hover:text-brand-700",
                ].join(" ")}
              >
                {key === "ALL" ? "All" : key.charAt(0) + key.slice(1).toLowerCase()} ({count})
              </button>
            ))}
          </div>
        </FilterBar>
      </Panel>

      {selectedIds.length > 0 ? (
        <Panel className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] text-eh-text2">{selectedIds.length} selected</p>
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value as ApplicantBulkStatus)}
              className="input-base max-w-[220px]"
            >
              <option value="SHORTLISTED">Mark shortlisted</option>
              <option value="REVIEWED">Mark reviewed</option>
              <option value="REJECTED">Mark rejected</option>
              <option value="HIRED">Mark hired</option>
            </select>
            <button onClick={runBulkUpdate} disabled={bulkLoading} className="eh-btn eh-btn-primary eh-btn-sm">
              {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : null}
              Apply bulk update
            </button>
            <button onClick={() => setSelectedIds([])} className="eh-btn eh-btn-secondary eh-btn-sm">
              Clear
            </button>
          </div>
        </Panel>
      ) : null}

      {loading ? (
        <RowsSkeleton rows={5} />
      ) : error ? (
        <ErrorState
          title="Couldn't load applicants"
          message={error}
          actions={
            <button
              type="button"
              onClick={() => selectedJobId && loadCandidates(selectedJobId)}
              className="eh-btn eh-btn-secondary eh-btn-sm"
            >
              Retry
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message="Share your job to attract candidates."
          actions={
            <button
              type="button"
              onClick={async () => {
                if (!selectedJobId) return;
                const shareUrl = `${window.location.origin}/jobs/${selectedJobId}`;
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Job link copied");
              }}
              className="eh-btn eh-btn-primary eh-btn-sm"
            >
              Copy link
            </button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 xl:grid-cols-2">
            {pagedCandidates.map((candidate, idx) => {
              const profile = candidate.applicant.teacherProfile;
              const name = candidate.applicant.name;
              const badge = statusLabel[candidate.status] || "NEW";
              const checked = selectedIds.includes(candidate.id);
              return (
                <Panel key={candidate.id} className="p-4 transition-shadow duration-150 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setSelectedIds((prev) => (e.target.checked ? [...prev, candidate.id] : prev.filter((id) => id !== candidate.id)))
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                      style={{ background: avatarColors[idx % avatarColors.length] }}
                    >
                      {initials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[25px] font-semibold tracking-[-0.01em] text-eh-text">{name}</h3>
                        {profile?.safetyBadgeGranted ? <ShieldCheck size={16} className="text-green-600" /> : null}
                        <StatusBadge role="status" aria-label={`Application status: ${badge}`} tone={statusTone[badge] || "neutral"}>
                          {badge}
                        </StatusBadge>
                      </div>
                      <p className="text-[13px] text-eh-text3">
                        {profile?.subjects?.[0] || "Teacher"} | {profile?.experience || "Experienced"} | Applied{" "}
                        {new Date(candidate.appliedAt).toLocaleDateString("en-IN")}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-eh-text3">
                        <MapPin size={12} /> {profile?.city || "India"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-200 text-[12px] font-semibold text-brand-700">
                        {candidate.matchScore}%
                      </span>
                      <p className="mt-1 text-[11px] text-eh-text3">fit</p>
                    </div>
                  </div>

                  {selectedJob?.school?.logoUrl ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-eh bg-eh-soft px-2 py-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedJob.school.logoUrl} alt={`${selectedJob.school.schoolName} logo`} className="h-5 w-5 rounded-sm object-cover" />
                      <span className="text-[11px] font-medium text-eh-text2">{selectedJob.school.schoolName}</span>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="eh-chip">{profile?.qualification || "Qualified teacher"}</span>
                    <span className="eh-chip">{profile?.subjects?.[0] || "Subject"}</span>
                    <span className="eh-chip">{profile?.city || "Location"}</span>
                    {profile?.demoVideoUrl ? <span className="eh-chip">Demo available</span> : null}
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <select
                      value={candidate.status}
                      onChange={(event) =>
                        setStatus(candidate.id, event.target.value as ApplicantUpdateStatus)
                      }
                      disabled={updatingId === candidate.id}
                      className="input-base"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="HIRED">Hired</option>
                    </select>
                    <div className="flex gap-2">
                      <Link href={`/profile/${candidate.applicant.id}`} target="_blank" className="eh-btn eh-btn-secondary eh-btn-sm">
                        View profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => setScheduleApplicationId(candidate.id)}
                        className="eh-btn eh-btn-secondary eh-btn-sm"
                      >
                        <Calendar size={13} /> Schedule
                      </button>
                      {candidate.resume?.id ? (
                        <a href={`/api/resumes/${candidate.resume.id}`} target="_blank" rel="noopener noreferrer" className="eh-btn eh-btn-secondary eh-btn-sm">
                          Resume
                        </a>
                      ) : null}
                      {profile?.demoVideoUrl ? (
                        <a href={profile.demoVideoUrl} target="_blank" rel="noopener noreferrer" className="eh-btn eh-btn-secondary eh-btn-sm">
                          Demo
                        </a>
                      ) : null}
                      {profile?.lessonPlanUrl ? (
                        <a href={profile.lessonPlanUrl} target="_blank" rel="noopener noreferrer" className="eh-btn eh-btn-secondary eh-btn-sm">
                          Lesson plan
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-2">
                    {candidate.screeningAnswers?.length ? (
                      <div className="mb-2 rounded-lg border border-eh bg-eh-soft p-2.5">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-eh-text3">Screening responses</p>
                        <div className="space-y-1.5">
                          {[...(candidate.screeningAnswers || [])]
                            .sort((a, b) => (a.question?.sortOrder || 0) - (b.question?.sortOrder || 0))
                            .map((entry) => (
                            <div key={entry.id} className="text-[12px] text-eh-text2">
                              <p className="font-medium text-eh-text">{entry.questionSnapshot || entry.question?.question}</p>
                              <p className="whitespace-pre-line text-eh-text2">{entry.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <textarea
                      className="input-base min-h-[70px]"
                      placeholder="Internal notes for this applicant"
                      value={notesDraft[candidate.id] ?? candidate.schoolNotes ?? ""}
                      onChange={(e) => setNotesDraft((prev) => ({ ...prev, [candidate.id]: e.target.value }))}
                    />
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => saveNotes(candidate)} disabled={noteLoadingId === candidate.id} className="eh-btn eh-btn-secondary eh-btn-sm">
                        {noteLoadingId === candidate.id ? <Loader2 size={13} className="animate-spin" /> : null}
                        Save notes
                      </button>
                      <button onClick={() => setStatus(candidate.id, "SHORTLISTED")} disabled={updatingId === candidate.id} className="eh-btn eh-btn-primary eh-btn-sm">
                        <Star size={13} /> Shortlist
                      </button>
                      <button onClick={() => setStatus(candidate.id, "REJECTED")} disabled={updatingId === candidate.id} className="eh-btn eh-btn-ghost eh-btn-sm text-red-600">
                        <XCircle size={13} /> Reject
                      </button>
                      {featureFlags.messaging && (
                      <button
                        onClick={async () => {
                            try {
                              const conversationId = await startConversation(candidate);
                              window.location.href = `/dashboard/messages?thread=${conversationId}`;
                            } catch (err) {
                              toast.error(getApiErrorMessage(err, "Failed to start conversation"));
                            }
                          }}
                          className="rounded-lg border border-eh p-2 text-eh-text3 hover:bg-eh-soft hover:text-eh-text2"
                          title="Message"
                          aria-label="Message applicant"
                        >
                          <MessageSquare size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[13px] text-eh-text3">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="inline-flex items-center px-3 text-[13px] text-eh-text2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <ScheduleInterviewModal
        open={!!scheduleApplicationId}
        onOpenChange={(open) => {
          if (!open) setScheduleApplicationId(null);
        }}
        applicationId={scheduleApplicationId || ""}
        onSuccess={async () => {
          toast.success("Interview scheduled");
          if (selectedJobId) {
            await loadCandidates(selectedJobId);
          }
        }}
      />
    </PageShell>
  );
}
