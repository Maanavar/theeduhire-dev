"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEventHandler } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, Loader2, Plus } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { trackEvent } from "@/lib/analytics";
import { getApiErrorMessage } from "@/lib/api/client";
import { getAllRankedCandidates, getMyJobs, updateApplicationStatus } from "@/lib/api/hiring-client";
import { useSchoolLiveUpdates } from "@/hooks/use-school-live-updates";
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
  const [quickAddOpenColumn, setQuickAddOpenColumn] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

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
    return cards.filter((card) => {
      const byQuery = query.length === 0 || card.applicant.name.toLowerCase().includes(query);
      const byMatch = (card.matchScore ?? 0) >= minMatch;
      return byQuery && byMatch;
    });
  }, [cards, minMatch, search]);

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#111827]">Pipeline</h1>
          <p className="text-[14px] text-slate-500">Drag candidates between stages. Candidate timeline updates automatically.</p>
          <p className="text-[12px] text-slate-400">
            {refreshing
              ? "Syncing..."
              : liveMode === "sse"
                ? "Live updates enabled"
                : `Auto-refresh every ${AUTO_REFRESH_MS / 1000}s`}
            {lastSyncedAt ? ` | Last sync ${new Date(lastSyncedAt).toLocaleTimeString("en-IN")}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedJobId}
            onChange={async (event) => {
              const next = event.target.value;
              setSelectedJobId(next);
              setQuickAddOpenColumn(null);
              if (next) await loadCards(next);
            }}
            className="input-base min-w-[230px]"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <button onClick={() => setShowFilters((prev) => !prev)} className="eh-btn eh-btn-secondary">
            <Filter size={14} /> Filters
          </button>
        </div>
      </div>

      {showFilters ? (
        <div className="mb-3 grid gap-2 rounded-xl border border-[#e6ebf2] bg-white p-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[12px] font-semibold text-slate-500">Search candidate</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-base" placeholder="Type candidate name" />
          </label>
          <label className="space-y-1">
            <span className="text-[12px] font-semibold text-slate-500">Minimum match score</span>
            <select value={minMatch} onChange={(event) => setMinMatch(Number(event.target.value))} className="input-base">
              {[0, 50, 60, 70, 80, 90].map((score) => (
                <option key={score} value={score}>
                  {score}% and above
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {loading ? (
        <LoadingState title="Loading pipeline" message="Organizing candidate stages for your active jobs." />
      ) : error ? (
        <ErrorState
          title="Couldn't load pipeline"
          message={error}
          actions={
            <button
              onClick={async () => {
                if (!selectedJobId) return;
                try {
                  setError("");
                  await loadCards(selectedJobId);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to load pipeline");
                }
              }}
              className="eh-btn eh-btn-secondary eh-btn-sm"
            >
              Retry
            </button>
          }
        />
      ) : !selectedJobId ? (
        <EmptyState
          title="No active jobs yet"
          message="Post your first job to start moving candidates through the hiring pipeline."
          actions={
            <Link href="/dashboard/post-job" className="eh-btn eh-btn-primary eh-btn-sm">
              Post a Job
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[1080px] gap-3">
            {COLUMNS.map((column, columnIdx) => (
              <DropColumn
                key={column}
                name={column}
                label={columnLabel[column]}
                dot={dotColor[column]}
                cards={grouped[column] || []}
                candidatePool={cards.filter((card) => card.status !== column)}
                onDropCard={onDropCard}
                onQuickAdd={onQuickAdd}
                savingId={savingId}
                colorIndex={columnIdx}
                quickAddOpen={quickAddOpenColumn === column}
                onToggleQuickAdd={() => setQuickAddOpenColumn((prev) => (prev === column ? null : column))}
              />
            ))}
          </div>
        </div>
      )}
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

  return (
    <div onDragOver={onDragOver} onDrop={onDrop} className="w-[248px] rounded-2xl border border-[#e5eaf2] bg-[#f8fafd] p-2">
      <div className="relative mb-2 flex items-center gap-2 px-1">
        <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
        <span className="text-[14px] font-semibold text-slate-800">{label}</span>
        <span className="text-[12px] text-slate-400">{cards.length}</span>
        <button onClick={onToggleQuickAdd} className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-200/60" aria-label={`Add to ${label}`}>
          <Plus size={13} />
        </button>

        {quickAddOpen ? (
          <div className="absolute right-0 top-7 z-20 w-[220px] rounded-lg border border-[#dfe5ef] bg-white p-2 shadow-lg">
            <p className="mb-1 text-[11px] font-semibold text-slate-500">Quick add to {label}</p>
            {candidatePool.length === 0 ? (
              <p className="text-[11px] text-slate-400">No candidates available.</p>
            ) : (
              <>
                <select className="input-base mb-2 text-[12px]" value={quickAddId} onChange={(event) => setQuickAddId(event.target.value)}>
                  {candidatePool.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.applicant.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (!quickAddId) return;
                    onQuickAdd(quickAddId, name);
                    onToggleQuickAdd();
                  }}
                  className="eh-btn eh-btn-primary eh-btn-sm w-full"
                >
                  {name === "INTERVIEW_SCHEDULED" ? "Schedule interview" : `Move to ${label}`}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        {cards.map((card, cardIdx) => (
          <div
            key={card.id}
            draggable
            onDragStart={(event) => event.dataTransfer.setData("applicationId", card.id)}
            className="cursor-grab rounded-xl border border-[#e3e8ef] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-shadow duration-150 hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: avatarColors[(colorIndex + cardIdx) % avatarColors.length] }}
              >
                {initials(card.applicant.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">{card.applicant.name}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {card.applicant.teacherProfile?.experience || "Experienced"} - {card.applicant.teacherProfile?.city || "India"}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[11px] font-medium text-[#4f46e5]">
                {card.matchScore ?? 0}% match
              </span>
              {savingId === card.id ? <Loader2 size={12} className="animate-spin text-slate-400" /> : <span className="text-[11px] text-slate-400">Move stage</span>}
            </div>
            <select
              value={card.status}
              onChange={(event) => onDropCard(card.id, event.target.value)}
              className="input-base mt-2 text-[11px]"
              aria-label={`Move ${card.applicant.name} to another stage`}
            >
              {COLUMNS.map((status) => (
                <option key={status} value={status}>
                  {columnLabel[status]}
                </option>
              ))}
            </select>
          </div>
        ))}
        {cards.length === 0 ? <div className="rounded-xl border border-dashed border-[#d9e0ea] p-3 text-center text-[12px] text-slate-400">Drop candidates here</div> : null}
      </div>
    </div>
  );
}
