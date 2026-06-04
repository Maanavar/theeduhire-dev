"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Calendar,
  Download,
  Filter,
  Lock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Send,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { featureFlags } from "@/config/feature-flags";
import { ScheduleInterviewModal } from "@/components/interviews/schedule-interview-modal";
import { NoApplicantsState, SomethingWentWrongState } from "@/components/system/illustrated-states";
import { RowsSkeleton } from "@/components/system/dashboard-skeletons";
import { trackEvent } from "@/lib/analytics";
import { getApiErrorMessage } from "@/lib/api/client";
import { useSchoolLiveUpdates } from "@/hooks/use-school-live-updates";
import { useClickOutside } from "@/hooks/use-click-outside";
import {
  bulkUpdateApplicants,
  createConversation,
  getAllRankedCandidates,
  getMyJobs,
  type ApplicantBoardCandidate,
  updateApplicationStatus,
  type SchoolJobSummary,
} from "@/lib/api/hiring-client";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { EXPERIENCE_LEVELS } from "@/config/constants";
import { UserAvatar } from "@/components/ui/user-avatar";

const statusLabel: Record<string, string> = {
  PENDING: "New",
  REVIEWED: "Reviewed",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview",
  INTERVIEW_COMPLETED: "Interview",
  REJECTED: "Rejected",
  HIRED: "Hired",
};
const AUTO_REFRESH_MS = 15000;
const DEFAULT_PAGE_SIZE = 20;
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

const STATUS_TABS = ["All Applicants", "New", "Reviewed", "Shortlisted", "Interview", "Hired", "Rejected"] as const;
type StatusTab = typeof STATUS_TABS[number];

export default function ApplicantsBoardPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<SchoolJobSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidates, setCandidates] = useState<ApplicantBoardCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<StatusTab>("All Applicants");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<ApplicantSort>("MATCH_DESC");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [messagingAll, setMessagingAll] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ApplicantBulkStatus>("SHORTLISTED");
  const [, setRefreshing] = useState(false);
  const [, setLastSyncedAt] = useState<number | null>(null);
  const [contactHidden, setContactHidden] = useState(false);
  const [aiAllowed, setAiAllowed] = useState(true);
  const [scheduleApplicationId, setScheduleApplicationId] = useState<string | null>(null);
  const [experienceFilter, setExperienceFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setOpenMenuId(null), !!openMenuId);
  useEffect(() => {
    if (!openMenuId) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenuId(null); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [openMenuId]);
  const preselectedJobId = searchParams.get("jobId") || "";
  const prefilledSearch = searchParams.get("search") || "";

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const loadCandidates = useCallback(async (jobId: string) => {
    const result = await getAllRankedCandidates(jobId);
    setCandidates(result.candidates);
    setContactHidden(result.contactHidden);
    setAiAllowed(result.aiAllowed);
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

  useEffect(() => { setSearch(prefilledSearch); }, [prefilledSearch]);

  const { mode: liveMode } = useSchoolLiveUpdates({
    jobId: selectedJobId,
    paused: !selectedJobId || !!updatingId || bulkLoading,
    onUpdate: async () => {
      setRefreshing(true);
      try { await loadCandidates(selectedJobId); }
      catch (err) { setError(getApiErrorMessage(err, "Failed to refresh applicants")); }
      finally { setRefreshing(false); }
    },
  });

  useEffect(() => {
    if (!selectedJobId || liveMode !== "polling") return;
    let disposed = false;
    const tick = async () => {
      if (document.hidden || updatingId || bulkLoading) return;
      setRefreshing(true);
      try { await loadCandidates(selectedJobId); }
      catch (err) { if (!disposed) setError(getApiErrorMessage(err, "Failed to refresh applicants")); }
      finally { if (!disposed) setRefreshing(false); }
    };
    const id = window.setInterval(tick, AUTO_REFRESH_MS);
    return () => { disposed = true; window.clearInterval(id); };
  }, [bulkLoading, liveMode, loadCandidates, selectedJobId, updatingId]);

  const groupedCounts = useMemo(() => {
    const entries: Record<StatusTab, number> = {
      "All Applicants": candidates.length,
      New: 0, Reviewed: 0, Shortlisted: 0, Interview: 0, Rejected: 0, Hired: 0,
    };
    for (const candidate of candidates) {
      const label = statusLabel[candidate.status] || "New";
      if (label in entries) entries[label as StatusTab] += 1;
    }
    return entries;
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const next = candidates.filter((candidate) => {
      const byTab = tab === "All Applicants" || (statusLabel[candidate.status] || "New") === tab;
      const byQuery = q.length === 0 ||
        candidate.applicant.name.toLowerCase().includes(q) ||
        candidate.applicant.teacherProfile?.city?.toLowerCase().includes(q) ||
        candidate.applicant.teacherProfile?.subjects?.join(" ").toLowerCase().includes(q);
      const byExperience = !experienceFilter || candidate.applicant.teacherProfile?.experience === experienceFilter;
      return byTab && byQuery && byExperience;
    });
    if (sortBy === "MATCH_DESC") next.sort((a, b) => b.matchScore - a.matchScore);
    if (sortBy === "APPLIED_DESC") next.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    if (sortBy === "APPLIED_ASC") next.sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());
    return next;
  }, [candidates, experienceFilter, search, sortBy, tab]);

  useEffect(() => { setPage(1); }, [search, sortBy, tab, selectedJobId, experienceFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedCandidates = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const setStatus = async (applicationId: string, nextStatus: ApplicantUpdateStatus) => {
    setUpdatingId(applicationId);
    try {
      await updateApplicationStatus(applicationId, { status: nextStatus });
      setCandidates((prev) => prev.map((c) => (c.id === applicationId ? { ...c, status: nextStatus } : c)));
      toast.success("Status updated");
      trackEvent("application_status_changed", { applicationId, toStatus: nextStatus, source: "applicants_board" });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update status"));
    } finally {
      setUpdatingId(null);
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
    const shortlisted = filtered.filter((c) => c.status === "SHORTLISTED");
    if (shortlisted.length === 0) { toast.error("No shortlisted candidates in current filter"); return; }
    setMessagingAll(true);
    let success = 0;
    for (const candidate of shortlisted) {
      try { await startConversation(candidate); success += 1; }
      catch { continue; }
    }
    setMessagingAll(false);
    if (success > 0) toast.success(`Started ${success} conversation${success > 1 ? "s" : ""}`);
    else toast.error("Unable to message shortlisted candidates");
  };

  const runBulkUpdate = async () => {
    if (!selectedJobId || selectedIds.length === 0) { toast.error("Select at least one applicant"); return; }
    setBulkLoading(true);
    try {
      const result = await bulkUpdateApplicants(selectedJobId, { applicationIds: selectedIds, status: bulkStatus });
      setCandidates((prev) => prev.map((c) => selectedIds.includes(c.id) ? { ...c, status: bulkStatus } : c));
      setSelectedIds([]);
      toast.success(`Updated ${result.updated} applicants`);
      trackEvent("application_status_changed", { count: selectedIds.length, toStatus: bulkStatus, source: "applicants_bulk" });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Bulk update failed"));
    } finally {
      setBulkLoading(false);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) { toast.error("No applicants available to export"); return; }
    const header = ["Name", "Status", "Match Score", "Applied At", "City", "Experience", "Qualification", "Resume"];
    const rows = filtered.map((c) => [
      c.applicant.name, c.status, String(c.matchScore), new Date(c.appliedAt).toISOString(),
      c.applicant.teacherProfile?.city || "", c.applicant.teacherProfile?.experience || "",
      c.applicant.teacherProfile?.qualification || "", c.resume?.fileName || "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
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

  if (status === "loading") return <RowsSkeleton rows={4} />;

  if (session?.user?.role !== "SCHOOL_ADMIN") {
    return (
      <Panel className="p-5 text-[14px] text-[var(--eh-text-3)]">
        This applicants board is available for school admins. Teacher view is available in{" "}
        <Link href="/dashboard/applications" className="font-semibold text-[var(--eh-primary-700)]">My Applications</Link>.
      </Panel>
    );
  }

  const scoreColor = (score: number) =>
    score >= 90 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 75 ? "text-[var(--eh-primary-700)] bg-[var(--eh-primary-50)] border-[var(--eh-primary-100)]"
    : score >= 60 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-slate-500 bg-slate-50 border-slate-200";

  return (
    <PageShell>
      <PageHeader
        title="Applicants"
        subtitle="Review, filter, and manage all candidates applying to your school jobs."
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCsv} className="eh-btn eh-btn-primary">
              <Download size={14} /> Export
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  const ids = pagedCandidates.map((c) => c.id);
                  setSelectedIds((prev) => prev.length === ids.length ? [] : ids);
                }}
                className="eh-btn eh-btn-secondary"
              >
                Bulk Actions <MoreHorizontal size={14} />
              </button>
            </div>
            {featureFlags.messaging && (
              <button onClick={messageAllShortlisted} disabled={messagingAll} className="hidden eh-btn eh-btn-secondary">
                {messagingAll ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Message shortlisted
              </button>
            )}
          </div>
        }
      />

      {/* Pill-style status tabs — matches Figma */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-all",
              tab === t
                ? "border-[var(--eh-primary-300)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)] shadow-[0_0_0_2px_var(--eh-primary-100)]"
                : "border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-[var(--eh-border-strong)] hover:bg-[var(--surface-base)]",
            ].join(" ")}
          >
            <span className={[
              "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
              tab === t ? "bg-[var(--eh-primary-600)] text-white" : "bg-[var(--surface-base)] text-[var(--eh-text-3)]",
            ].join(" ")}>
              {/* icon placeholder — different per tab in Figma, use count as text */}
            </span>
            {t}
            <span className={[
              "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
              tab === t ? "bg-[var(--eh-primary-100)] text-[var(--eh-primary-700)]" : "bg-[var(--surface-base)] text-[var(--eh-text-4)]",
            ].join(" ")}>
              {groupedCounts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <Panel>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="relative flex-1 max-w-[280px]">
            <Star size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by candidate name or skill..."
              className="input-base w-full pl-9"
            />
          </div>
          <div className="eh-select-wrap max-w-[200px] w-full">
            <select
              value={selectedJobId}
              onChange={async (e) => {
                const nextJobId = e.target.value;
                setSelectedJobId(nextJobId);
                setSelectedIds([]);
                setLoading(true);
                try { await loadCandidates(nextJobId); }
                catch (err) { setError(getApiErrorMessage(err, "Failed to load applicants")); }
                finally { setLoading(false); }
              }}
              className="input-base w-full"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>
          <div className="eh-select-wrap max-w-[160px] w-full">
            <select value={experienceFilter} onChange={(e) => setExperienceFilter(e.target.value)} className="input-base w-full">
              <option value="">All Experience</option>
              {EXPERIENCE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          <div className="eh-select-wrap max-w-[180px] w-full">
            <select
              value={sortBy}
              onChange={(e) => { const v = e.target.value as ApplicantSort; if (sortOptions.includes(v)) setSortBy(v); }}
              className="input-base w-full"
            >
              <option value="MATCH_DESC">Highest match first</option>
              <option value="APPLIED_DESC">Applied: Newest</option>
              <option value="APPLIED_ASC">Applied: Oldest</option>
            </select>
          </div>
          {(search || experienceFilter || sortBy !== "MATCH_DESC") && (
            <button
              onClick={() => { setExperienceFilter(""); setSortBy("MATCH_DESC"); setSearch(""); }}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--eh-border)] px-3 py-2 text-[13px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"
            >
              <Filter size={13} /> Clear filters
            </button>
          )}
        </div>
      </Panel>

      {/* Bulk action bar */}
      {selectedIds.length > 0 ? (
        <Panel className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold text-[var(--eh-text)]">{selectedIds.length} selected</p>
            <div className="eh-select-wrap max-w-[220px] w-full"><select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as ApplicantBulkStatus)} className="input-base w-full">
              <option value="SHORTLISTED">Mark shortlisted</option>
              <option value="REVIEWED">Mark reviewed</option>
              <option value="REJECTED">Mark rejected</option>
              <option value="HIRED">Mark hired</option>
            </select></div>
            <button onClick={runBulkUpdate} disabled={bulkLoading} className="eh-btn eh-btn-primary eh-btn-sm">
              {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : null}
              Apply
            </button>
            <button onClick={() => setSelectedIds([])} className="eh-btn eh-btn-secondary eh-btn-sm">Clear</button>
          </div>
        </Panel>
      ) : null}

      {/* AI locked banner */}
      {!loading && !error && !aiAllowed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-4 py-3">
          <p className="text-[13px] text-[var(--eh-primary-800)]">
            <span className="font-semibold">AI match scores are locked.</span> Upgrade to Growth to rank candidates by subject, board, and grade fit.
          </p>
          <Link href="/dashboard/billing" className="eh-btn eh-btn-primary eh-btn-sm shrink-0">Upgrade to Growth</Link>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <RowsSkeleton rows={5} />
      ) : error ? (
        <SomethingWentWrongState
          title="Couldn't load applicants"
          message={error}
          onRetry={() => selectedJobId && loadCandidates(selectedJobId)}
        />
      ) : filtered.length === 0 ? (
        <NoApplicantsState
          actions={
            <button type="button" onClick={async () => {
              if (!selectedJobId) return;
              await navigator.clipboard.writeText(`${window.location.origin}/jobs/${selectedJobId}`);
              toast.success("Job link copied");
            }} className="eh-btn eh-btn-primary eh-btn-sm">Copy link</button>
          }
        />
      ) : (
        <>
          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[var(--eh-border)] bg-[var(--surface-base)]">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedIds.length === pagedCandidates.length && pagedCandidates.length > 0}
                        onChange={(e) => setSelectedIds(e.target.checked ? pagedCandidates.map((c) => c.id) : [])}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Applicant</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Applied For</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Match Score</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Experience</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Applied On</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--eh-border)]">
                  {pagedCandidates.map((candidate) => {
                    const profile = candidate.applicant.teacherProfile;
                    const name = candidate.applicant.name;
                    const checked = selectedIds.includes(candidate.id);
                    const phone = (candidate.applicant as any).phone;
                    const email = (candidate.applicant as any).email;
                    return (
                      <tr key={candidate.id} className="group hover:bg-[var(--surface-base)] transition-colors">
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, candidate.id] : prev.filter((id) => id !== candidate.id))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={name} avatarUrl={(candidate.applicant as any).avatarUrl} size={40} className="shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[13px] font-semibold text-[var(--eh-text)]">{name}</p>
                                {profile?.safetyBadgeGranted && <ShieldCheck size={13} className="text-emerald-600 shrink-0" />}
                              </div>
                              {email && (
                                <a href={`mailto:${email}`} className="flex items-center gap-1 text-[11px] text-[var(--eh-text-3)] hover:underline mt-0.5">
                                  <Mail size={10} /> {email}
                                </a>
                              )}
                              {phone && !contactHidden && (
                                <a href={`tel:${phone}`} className="flex items-center gap-1 text-[11px] text-[var(--eh-text-3)] hover:underline">
                                  <Phone size={10} /> {phone}
                                </a>
                              )}
                              {contactHidden && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600">
                                  <Lock size={10} /> Contact locked
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] font-medium text-[var(--eh-text)]">{selectedJob?.title || "—"}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--eh-text-3)]">
                            <MapPin size={10} /> {profile?.city || "India"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="eh-select-wrap">
                          <select
                            value={candidate.status}
                            onChange={(e) => setStatus(candidate.id, e.target.value as ApplicantUpdateStatus)}
                            disabled={updatingId === candidate.id}
                            className="rounded-md border border-[var(--eh-border)] bg-white py-1 pl-2 pr-7 text-[12px] font-medium text-[var(--eh-text-2)] focus:outline-none focus:ring-1 focus:ring-[var(--eh-primary-400)] transition-colors"
                          >
                            <option value="PENDING">New</option>
                            <option value="REVIEWED">Reviewed</option>
                            <option value="SHORTLISTED">Shortlisted</option>
                            <option value="INTERVIEW_SCHEDULED">Interview</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="HIRED">Hired</option>
                          </select></div>
                        </td>
                        <td className="px-4 py-3.5">
                          {aiAllowed ? (
                            <span className={`inline-block rounded-md border px-2.5 py-1 text-[12px] font-bold ${scoreColor(candidate.matchScore)}`}>
                              {candidate.matchScore}%
                            </span>
                          ) : (
                            <span className="text-[12px] text-[var(--eh-text-4)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] text-[var(--eh-text-2)]">{profile?.experience || "—"}</p>
                          {profile?.qualification && (
                            <p className="text-[11px] text-[var(--eh-text-3)]">{profile.qualification}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[12px] text-[var(--eh-text-2)]">
                            {new Date(candidate.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <Link href={`/dashboard/applicants/${candidate.applicant.id || candidate.applicantId}?applicationId=${candidate.id}`} className="eh-btn eh-btn-secondary eh-btn-sm">
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => setStatus(candidate.id, "SHORTLISTED")}
                              disabled={updatingId === candidate.id}
                              className="eh-btn eh-btn-secondary eh-btn-sm"
                              title="Shortlist"
                            >
                              <Star size={12} /> Shortlist
                            </button>
                            <div className="relative" ref={openMenuId === candidate.id ? menuRef : undefined}>
                              <button
                                type="button"
                                onClick={() => setOpenMenuId((prev) => prev === candidate.id ? null : candidate.id)}
                                className="rounded-lg border border-[var(--eh-border)] p-1.5 text-[var(--eh-text-4)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--eh-text-2)]"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                              {openMenuId === candidate.id && (
                                <div className="eh-popover absolute right-0 z-20 mt-1 w-48">
                                  <button
                                    type="button"
                                    onClick={() => { setScheduleApplicationId(candidate.id); setOpenMenuId(null); }}
                                    className="eh-popover-item"
                                  >
                                    <Calendar size={12} /> Schedule interview
                                  </button>
                                  {candidate.resume?.id && (
                                    <a href={`/api/resumes/${candidate.resume.id}`} target="_blank" rel="noopener noreferrer" className="eh-popover-item">
                                      <Download size={12} /> Download resume
                                    </a>
                                  )}
                                  {featureFlags.messaging && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const id = await startConversation(candidate);
                                          window.location.href = `/dashboard/messages?thread=${id}`;
                                        } catch (err) { toast.error(getApiErrorMessage(err, "Failed to start conversation")); }
                                      }}
                                      className="eh-popover-item"
                                    >
                                      <MessageSquare size={12} /> Message
                                    </button>
                                  )}
                                  <div className="eh-popover-divider" />
                                  <button
                                    type="button"
                                    onClick={() => { setStatus(candidate.id, "REJECTED"); setOpenMenuId(null); }}
                                    className="eh-popover-item danger"
                                  >
                                    <XCircle size={12} /> Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-[var(--eh-border)] px-4 py-3">
              <p className="text-[13px] text-[var(--eh-text-3)]">
                Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} applicants
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-50">
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={["rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors", p === page ? "bg-[var(--eh-primary-600)] text-white" : "border border-[var(--eh-border)] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"].join(" ")}
                  >
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-50">
                  Next
                </button>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[var(--eh-text-3)]">
                Rows per page
                <select
                  className="input-base w-16"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </Panel>
        </>
      )}

      <ScheduleInterviewModal
        open={!!scheduleApplicationId}
        onOpenChange={(open) => { if (!open) setScheduleApplicationId(null); }}
        applicationId={scheduleApplicationId || ""}
        onSuccess={async () => {
          toast.success("Interview scheduled");
          if (selectedJobId) await loadCandidates(selectedJobId);
        }}
      />
    </PageShell>
  );
}
