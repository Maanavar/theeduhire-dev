"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEventHandler } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { trackEvent } from "@/lib/analytics";
import { getApiErrorMessage } from "@/lib/api/client";
import { getAllRankedCandidates, getMyJobs, updateApplicationStatus } from "@/lib/api/hiring-client";
import { useSchoolLiveUpdates } from "@/hooks/use-school-live-updates";
import { useClickOutside } from "@/hooks/use-click-outside";
import { isFeatureEnabled } from "@/config/feature-flags";

type JobOption = { id: string; title: string; status: string };
type AppCard = {
  id: string;
  status: string;
  matchScore?: number;
  applicant: {
    name: string;
    teacherProfile: { city: string | null; experience: string | null } | null;
  };
};

const COLUMNS = ["PENDING", "REVIEWED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "HIRED"] as const;
const columnLabel: Record<(typeof COLUMNS)[number], string> = {
  PENDING: "New",
  REVIEWED: "Reviewed",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview",
  INTERVIEW_COMPLETED: "Interview Done",
  HIRED: "Offer",
};
const dotColor: Record<(typeof COLUMNS)[number], string> = {
  PENDING: "#1d4ed8",
  REVIEWED: "#94a3b8",
  SHORTLISTED: "#4f46e5",
  INTERVIEW_SCHEDULED: "#b45309",
  INTERVIEW_COMPLETED: "#7c3aed",
  HIRED: "#15803d",
};
const avatarColors = ["#9a3412", "#0f766e", "#4338ca", "#be185d", "#b45309", "#0e7490"];
const AUTO_REFRESH_MS = 15000;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function PipelinePage() {
  const router = useRouter();

  useEffect(() => {
    if (!isFeatureEnabled("pipelineBoard")) {
      router.replace("/dashboard");
    }
  }, [router]);

  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [cards, setCards] = useState<AppCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [boardFilter, setBoardFilter] = useState("Any");
  const [expFilter, setExpFilter] = useState("Any");
  const [sortPipeline, setSortPipeline] = useState<"last_activity" | "match_score">("last_activity");
  const [quickAddOpenColumn, setQuickAddOpenColumn] = useState<string | null>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  useClickOutside(quickAddRef, () => setQuickAddOpenColumn(null), !!quickAddOpenColumn);
  useEffect(() => {
    if (!quickAddOpenColumn) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setQuickAddOpenColumn(null); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [quickAddOpenColumn]);
  const [refreshing, setRefreshing] = useState(false);
  const [, setLastSyncedAt] = useState<number | null>(null);

  const loadCards = useCallback(async (jobId: string) => {
    const { candidates } = await getAllRankedCandidates(jobId);
    setCards(candidates as AppCard[]);
    setLastSyncedAt(Date.now());
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const allJobs = await getMyJobs();
        const activeJobs = (allJobs as JobOption[]).filter((job) => job.status === "ACTIVE");
        setJobs(activeJobs);
        if (activeJobs[0]) {
          setSelectedJobId(activeJobs[0].id);
          await loadCards(activeJobs[0].id);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load pipeline"));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [loadCards]);

  const { mode: liveMode } = useSchoolLiveUpdates({
    jobId: selectedJobId,
    paused: !selectedJobId || !!savingId,
    onUpdate: async () => {
      setRefreshing(true);
      try {
        await loadCards(selectedJobId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to refresh pipeline");
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
      if (document.hidden || savingId) return;
      setRefreshing(true);
      try {
        await loadCards(selectedJobId);
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : "Failed to refresh pipeline");
      } finally {
        if (!disposed) setRefreshing(false);
      }
    };

    const id = window.setInterval(tick, AUTO_REFRESH_MS);
    return () => {
      disposed = true;
      window.clearInterval(id);
    };
  }, [liveMode, loadCards, savingId, selectedJobId]);

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = cards.filter((card) => {
      const byQuery = query.length === 0 || card.applicant.name.toLowerCase().includes(query);
      const byMatch = (card.matchScore ?? 0) >= minMatch;
      const byExp =
        expFilter === "Any" ||
        (expFilter === "0-2 yrs" && Number(card.applicant.teacherProfile?.experience) <= 2) ||
        (expFilter === "3-5 yrs" && Number(card.applicant.teacherProfile?.experience) >= 3 && Number(card.applicant.teacherProfile?.experience) <= 5) ||
        (expFilter === "5+ yrs" && Number(card.applicant.teacherProfile?.experience) > 5);
      return byQuery && byMatch && byExp;
    });
    if (sortPipeline === "match_score") result.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    return result;
  }, [cards, minMatch, search, expFilter, sortPipeline]);

  const grouped = useMemo(
    () =>
      COLUMNS.reduce<Record<string, AppCard[]>>((acc, column) => {
        acc[column] = filteredCards.filter((card) => card.status === column);
        return acc;
      }, {}),
    [filteredCards]
  );

  const onDropCard = async (applicationId: string, toStatus: string) => {
    const previous = cards.find((card) => card.id === applicationId)?.status;
    if (!previous || previous === toStatus) return;
    setSavingId(applicationId);
    setCards((prev) => prev.map((card) => (card.id === applicationId ? { ...card, status: toStatus } : card)));
    try {
      await updateApplicationStatus(applicationId, {
        status: toStatus as Parameters<typeof updateApplicationStatus>[1]["status"],
      });
      trackEvent("application_status_changed", {
        applicationId,
        toStatus,
        source: "pipeline",
      });
    } catch {
      setCards((prev) => prev.map((card) => (card.id === applicationId ? { ...card, status: previous } : card)));
    } finally {
      setSavingId(null);
    }
  };

  const onQuickAdd = async (applicationId: string, toStatus: string) => {
    if (toStatus === "INTERVIEW_SCHEDULED") {
      router.push(`/dashboard/interviews?applicationId=${applicationId}`);
      return;
    }
    await onDropCard(applicationId, toStatus);
  };

  const totalCandidates = cards.length;
  const conversionRate = totalCandidates > 0
    ? Math.round((grouped.HIRED?.length || 0) / totalCandidates * 100 * 10) / 10
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--eh-border)] pb-5">
        <div>
          <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)] sm:text-[26px]">
            Candidate Pipeline
          </h1>
          <p className="mt-1.5 text-[14px] text-[var(--eh-text-3)]">Track and manage candidates for your job openings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              if (!selectedJobId) return;
              await navigator.clipboard.writeText(`${window.location.origin}/jobs/${selectedJobId}`);
              toast.success("Job link copied to clipboard");
            }}
            disabled={!selectedJobId}
            className="eh-btn eh-btn-secondary"
          >
            <span className="text-[13px]">🔗</span> Share Job Link
          </button>
          <button
            onClick={() => { if (selectedJobId) router.push(`/jobs/${selectedJobId}`); }}
            disabled={!selectedJobId}
            className="eh-btn eh-btn-secondary"
          >
            View Job Details
          </button>
          <button
            onClick={() => { if (selectedJobId) router.push(`/dashboard/applicants?jobId=${selectedJobId}`); }}
            disabled={!selectedJobId}
            className="eh-btn eh-btn-primary"
          >
            <Plus size={14} /> Add Candidate
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--eh-border)] bg-white px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-[12px] font-semibold text-[var(--eh-text-3)]">Select Job</span>
          <div className="eh-select-wrap max-w-[260px] flex-1">
            <select
              value={selectedJobId}
              onChange={async (e) => {
                const next = e.target.value;
                setSelectedJobId(next);
                setQuickAddOpenColumn(null);
                if (next) await loadCards(next);
              }}
              className="input-base w-full"
            >
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </div>
        </div>
        <div className="eh-select-wrap max-w-[130px] w-full">
          <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)} className="input-base w-full">
            <option value="Any">Any Board</option>
            <option value="CBSE">CBSE</option>
            <option value="State Board">State Board</option>
            <option value="ICSE">ICSE</option>
            <option value="Matriculation">Matriculation</option>
          </select>
        </div>
        <div className="eh-select-wrap max-w-[130px] w-full">
          <select value={expFilter} onChange={(e) => setExpFilter(e.target.value)} className="input-base w-full">
            <option value="Any">Any Exp.</option>
            <option value="0-2 yrs">0–2 yrs</option>
            <option value="3-5 yrs">3–5 yrs</option>
            <option value="5+ yrs">5+ yrs</option>
          </select>
        </div>
        <div className="eh-select-wrap max-w-[160px] w-full">
          <select value={sortPipeline} onChange={(e) => setSortPipeline(e.target.value as "last_activity" | "match_score")} className="input-base w-full">
            <option value="last_activity">Sort: Last Activity</option>
            <option value="match_score">Sort: Match Score</option>
          </select>
        </div>
        <button onClick={() => setShowFilters((p) => !p)} className={["eh-btn eh-btn-secondary", showFilters ? "border-[var(--eh-primary-300)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]" : ""].join(" ")}>
          <Filter size={14} /> Filters {showFilters ? "▲" : "▼"}
        </button>
        <button
          onClick={() => toast.success("View saved")}
          className="eh-btn eh-btn-secondary"
        >
          Save View
        </button>
      </div>

      {showFilters && (
        <div className="grid gap-2 rounded-xl border border-[var(--eh-border)] bg-white p-4 sm:grid-cols-2">
          <div>
            <label className="eh-label">Search candidate</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-base" placeholder="Type candidate name" />
          </div>
          <div>
            <label className="eh-label">Minimum match score</label>
            <div className="eh-select-wrap w-full">
              <select value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))} className="input-base w-full">
                {[0, 50, 60, 70, 80, 90].map((s) => <option key={s} value={s}>{s}% and above</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState title="Loading pipeline" message="Organizing candidate stages for your active jobs." />
      ) : error ? (
        <ErrorState title="Couldn't load pipeline" message={error} actions={<button onClick={async () => { setError(""); if (selectedJobId) await loadCards(selectedJobId); }} className="eh-btn eh-btn-secondary eh-btn-sm">Retry</button>} />
      ) : !selectedJobId ? (
        <EmptyState title="No active jobs yet" message="Post your first job to start the pipeline." actions={<Link href="/dashboard/post-job" className="eh-btn eh-btn-primary eh-btn-sm"><Plus size={13} /> Post a Job</Link>} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
          {/* Kanban board */}
          <div className="space-y-4">
            {/* Stage summary row */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {COLUMNS.map((col) => {
                const count = grouped[col]?.length || 0;
                const pct = totalCandidates > 0 ? Math.round((count / totalCandidates) * 100 * 10) / 10 : 0;
                return (
                  <div key={col} className="flex min-w-[130px] flex-1 flex-col items-center rounded-xl border border-[var(--eh-border)] bg-white px-3 py-2.5 text-center">
                    <p className="text-[20px] font-bold text-[var(--eh-text)]">{count}</p>
                    <p className="text-[11px] font-semibold text-[var(--eh-text-3)]">{columnLabel[col]}</p>
                    <p className="text-[11px] text-[var(--eh-text-4)]">{pct}%</p>
                  </div>
                );
              })}
              <div className="flex min-w-[130px] flex-1 flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center">
                <p className="text-[20px] font-bold text-emerald-700">{conversionRate}%</p>
                <p className="text-[11px] font-semibold text-emerald-600">Overall Conversion</p>
                <p className="text-[11px] text-emerald-500">Hired / Total</p>
              </div>
            </div>

            {/* Kanban columns */}
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[1100px] gap-3">
                {COLUMNS.map((column, columnIdx) => (
                  <DropColumn
                    key={column}
                    name={column}
                    label={columnLabel[column]}
                    dot={dotColor[column]}
                    cards={grouped[column] || []}
                    candidatePool={cards.filter((c) => c.status !== column)}
                    onDropCard={onDropCard}
                    onQuickAdd={onQuickAdd}
                    savingId={savingId}
                    colorIndex={columnIdx}
                    quickAddOpen={quickAddOpenColumn === column}
                    onToggleQuickAdd={() => setQuickAddOpenColumn((prev) => (prev === column ? null : column))}
                    onViewCard={(card) => router.push(`/dashboard/applicants?jobId=${selectedJobId}&search=${encodeURIComponent(card.applicant.name)}`)}
                    onMessageCard={(card) => { toast.info(`Messaging ${card.applicant.name} — feature coming soon`); }}
                  />
                ))}
              </div>
            </div>
            <p className="text-center text-[12px] text-[var(--eh-text-4)]">
              ⇄ Drag and drop candidates between stages to update status
            </p>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-4">
            {/* Bulk actions */}
            <div className="rounded-xl border border-[var(--eh-border)] bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Bulk Actions</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    if (!selectedJobId) return;
                    const pending = filteredCards.filter((c) => c.status === "PENDING");
                    if (pending.length === 0) { toast.error("No new candidates to move"); return; }
                    for (const card of pending) await onDropCard(card.id, "REVIEWED");
                    toast.success(`${pending.length} candidates moved to Reviewed`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors text-left"
                >
                  Move New → Reviewed
                </button>
                <button
                  onClick={async () => {
                    if (!selectedJobId) return;
                    const reviewed = filteredCards.filter((c) => c.status === "REVIEWED");
                    if (reviewed.length === 0) { toast.error("No reviewed candidates to shortlist"); return; }
                    for (const card of reviewed) await onDropCard(card.id, "SHORTLISTED");
                    toast.success(`${reviewed.length} candidates shortlisted`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors text-left"
                >
                  Add All Reviewed to Shortlist
                </button>
                <button
                  onClick={() => { if (selectedJobId) router.push(`/dashboard/applicants?jobId=${selectedJobId}`); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors text-left"
                >
                  Go to Applicants Table
                </button>
                <button
                  onClick={async () => {
                    if (filteredCards.length === 0) { toast.error("No candidates to export"); return; }
                    const header = ["Name", "Status", "Match Score", "Experience", "City"];
                    const rows = filteredCards.map((c) => [
                      c.applicant.name, c.status, String(c.matchScore ?? 0),
                      c.applicant.teacherProfile?.experience || "", c.applicant.teacherProfile?.city || "",
                    ]);
                    const csv = [header, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `pipeline-${selectedJobId}-${new Date().toISOString().slice(0, 10)}.csv`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("Pipeline exported");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors text-left"
                >
                  Export Candidates (CSV)
                </button>
              </div>
            </div>

            {/* AI Shortlist Hints */}
            <div className="rounded-xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[var(--eh-primary-600)]">✨</span>
                <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">AI Shortlist Hints</h3>
              </div>
              <p className="text-[11px] text-[var(--eh-text-3)] mb-3">Based on job requirements</p>
              <div className="space-y-2">
                {cards.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)).slice(0, 3).map((card) => {
                  const score = card.matchScore ?? 0;
                  const scoreColor = score >= 90 ? "text-emerald-700" : score >= 75 ? "text-[var(--eh-primary-700)]" : "text-amber-700";
                  return (
                    <div key={card.id} className="flex items-center gap-2 rounded-lg border border-[var(--eh-border)] bg-white px-3 py-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-100)] text-[11px] font-bold text-[var(--eh-primary-700)]">
                        {card.applicant.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-[var(--eh-text)]">{card.applicant.name}</p>
                        <p className="text-[11px] text-[var(--eh-text-3)]">{card.applicant.teacherProfile?.experience || "Exp"} · {card.applicant.teacherProfile?.city || "India"}</p>
                      </div>
                      <span className={`text-[12px] font-bold ${scoreColor}`}>{score}%</span>
                    </div>
                  );
                })}
                {cards.length === 0 && <p className="text-[12px] text-[var(--eh-text-3)]">No candidates yet.</p>}
              </div>
              {cards.length > 3 && (
                <Link href="/dashboard/applicants" className="mt-3 block text-center text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">
                  View All AI Suggestions →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      <p className="text-center text-[12px] text-[var(--eh-text-4)]">
        {refreshing ? "Syncing..." : liveMode === "sse" ? "✦ AI tips are shown on the right to help you shortlist faster." : `Auto-refresh every ${AUTO_REFRESH_MS / 1000}s`}
      </p>
    </div>
  );
}

function DropColumn({
  name,
  label,
  dot,
  cards,
  candidatePool,
  onDropCard,
  onQuickAdd,
  savingId,
  colorIndex,
  quickAddOpen,
  onToggleQuickAdd,
  onViewCard,
  onMessageCard,
}: {
  name: string;
  label: string;
  dot: string;
  cards: AppCard[];
  candidatePool: AppCard[];
  onDropCard: (applicationId: string, toStatus: string) => void;
  onQuickAdd: (applicationId: string, toStatus: string) => void;
  savingId: string | null;
  colorIndex: number;
  quickAddOpen: boolean;
  onToggleQuickAdd: () => void;
  onViewCard: (card: AppCard) => void;
  onMessageCard: (card: AppCard) => void;
}) {
  const [quickAddId, setQuickAddId] = useState("");

  useEffect(() => {
    if (!quickAddId && candidatePool[0]?.id) setQuickAddId(candidatePool[0].id);
  }, [candidatePool, quickAddId]);

  const onDragOver: DragEventHandler<HTMLDivElement> = (event) => event.preventDefault();
  const onDrop: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const applicationId = event.dataTransfer.getData("applicationId");
    if (!applicationId) return;
    onDropCard(applicationId, name);
  };

  const score = (card: AppCard) => card.matchScore ?? 0;
  const scoreColor = (s: number) => s >= 90 ? "text-emerald-700 bg-emerald-50" : s >= 75 ? "text-[var(--eh-primary-700)] bg-[var(--eh-primary-50)]" : "text-amber-700 bg-amber-50";

  return (
    <div onDragOver={onDragOver} onDrop={onDrop} className="w-[220px] shrink-0 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-2">
      <div className="relative mb-2 flex items-center gap-2 px-1 py-1">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: dot }} />
        <span className="text-[13px] font-semibold text-[var(--eh-text)]">{label}</span>
        <span className="rounded-full bg-white border border-[var(--eh-border)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--eh-text-3)]">{cards.length}</span>
        <button onClick={onToggleQuickAdd} className="ml-auto rounded-md p-1 text-[var(--eh-text-4)] hover:bg-white" aria-label={`Add to ${label}`}>
          <Plus size={13} />
        </button>
        {quickAddOpen && (
          <div className="eh-popover absolute right-0 top-8 z-20 w-[210px] p-3">
            <p className="mb-2 text-[11px] font-semibold text-[var(--eh-text-4)]">Quick add to {label}</p>
            {candidatePool.length === 0 ? (
              <p className="text-[11px] text-[var(--eh-text-3)]">No candidates available.</p>
            ) : (
              <>
                <div className="eh-select-wrap w-full mb-2">
                  <select className="input-base w-full text-[12px]" value={quickAddId} onChange={(e) => setQuickAddId(e.target.value)}>
                    {candidatePool.map((entry) => <option key={entry.id} value={entry.id}>{entry.applicant.name}</option>)}
                  </select>
                </div>
                <button onClick={() => { if (!quickAddId) return; onQuickAdd(quickAddId, name); onToggleQuickAdd(); }} className="eh-btn eh-btn-primary eh-btn-sm w-full">
                  {name === "INTERVIEW_SCHEDULED" ? "Schedule" : `Move to ${label}`}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">Drop here</p>
      <div className="space-y-2 min-h-[60px]">
        {cards.map((card, cardIdx) => {
          const s = score(card);
          return (
            <div
              key={card.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("applicationId", card.id)}
              className="cursor-grab rounded-xl border border-[var(--eh-border)] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: avatarColors[(colorIndex + cardIdx) % avatarColors.length] }}
                >
                  {initials(card.applicant.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[var(--eh-text)]">{card.applicant.name}</p>
                  <p className="truncate text-[11px] text-[var(--eh-text-3)]">{card.applicant.teacherProfile?.experience || "Exp"}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${scoreColor(s)}`}>{s}%</span>
                {savingId === card.id
                  ? <Loader2 size={11} className="animate-spin text-[var(--eh-text-4)]" />
                  : <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onViewCard(card); }} className="rounded p-1 text-[var(--eh-text-4)] hover:bg-[var(--surface-base)]" title="View applicant">👁</button>
                      <button onClick={(e) => { e.stopPropagation(); onMessageCard(card); }} className="rounded p-1 text-[var(--eh-text-4)] hover:bg-[var(--surface-base)]" title="Message">💬</button>
                    </div>
                }
              </div>
              <select
                value={card.status}
                onChange={(e) => onDropCard(card.id, e.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--eh-border)] bg-transparent px-2 py-1 text-[11px] text-[var(--eh-text-2)] focus:outline-none"
                aria-label={`Move ${card.applicant.name}`}
              >
                {COLUMNS.map((s) => <option key={s} value={s}>{columnLabel[s]}</option>)}
              </select>
            </div>
          );
        })}
        {cards.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--eh-border)] p-4 text-center text-[12px] text-[var(--eh-text-4)]">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
