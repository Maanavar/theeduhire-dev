"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Building2, GraduationCap, Briefcase, Clock, Filter, ChevronDown } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/client";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { toast } from "@/components/ui/toast";

const PAGE_SIZE = 50;

type AuditEvent = {
  id: string;
  eventType: string;
  aggregateType: "school" | "teacher" | "job";
  aggregateId: string;
  actorId: string | null;
  payload: {
    entityLabel?: string;
    reason?: string;
    notes?: string;
  };
  occurredAt: string;
  actor: { id: string; name: string; email: string } | null;
};

const ACTION_META: Record<string, { label: string; color: string }> = {
  "school.approve":      { label: "School approved",        color: "bg-green-50 text-green-700" },
  "school.verify":       { label: "School verified",        color: "bg-green-50 text-green-700" },
  "school.unverify":     { label: "Verification removed",   color: "bg-amber-50 text-amber-700" },
  "school.reject":       { label: "School rejected",        color: "bg-red-50 text-red-600" },
  "school.mark_pending": { label: "Moved to pending",       color: "bg-gray-100 text-gray-500" },
  "school.suspend":      { label: "School suspended",       color: "bg-red-50 text-red-600" },
  "school.unsuspend":    { label: "School unsuspended",     color: "bg-blue-50 text-blue-600" },
  "teacher.approve":     { label: "Teacher verified",       color: "bg-green-50 text-green-700" },
  "teacher.reject":      { label: "Teacher rejected",       color: "bg-red-50 text-red-600" },
  "teacher.mark_pending":{ label: "Moved to pending",       color: "bg-gray-100 text-gray-500" },
  "teacher.revoke_badge":{ label: "Badge revoked",          color: "bg-amber-50 text-amber-700" },
  "teacher.suspend":     { label: "Teacher suspended",      color: "bg-red-50 text-red-600" },
  "teacher.unsuspend":   { label: "Teacher unsuspended",    color: "bg-blue-50 text-blue-600" },
  "job.close":           { label: "Job closed",             color: "bg-gray-100 text-gray-500" },
  "job.activate":        { label: "Job activated",          color: "bg-green-50 text-green-700" },
  "job.hide":            { label: "Job hidden",             color: "bg-amber-50 text-amber-700" },
  "job.show":            { label: "Job shown",              color: "bg-blue-50 text-blue-600" },
  "job.delete":          { label: "Job deleted",            color: "bg-red-50 text-red-600" },
};

const ENTITY_ICONS = {
  school:  <Building2 size={13} />,
  teacher: <GraduationCap size={13} />,
  job:     <Briefcase size={13} />,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

async function fetchAuditLog(params: URLSearchParams) {
  const res = await fetch(`/api/admin/audit?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to load");
  return json as { data: AuditEvent[]; pagination: { total: number; totalPages: number } };
}

export default function AdminAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (entityType) params.set("entityType", entityType);
    if (actionFilter) params.set("action", actionFilter);

    fetchAuditLog(params)
      .then((result) => {
        setEvents(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => {
        const msg = getApiErrorMessage(err, "Failed to load audit log");
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [page, search, entityType, actionFilter]);

  useEffect(() => { load(); }, [load]);

  const actionOptions = Object.entries(ACTION_META).map(([key, { label }]) => ({ key, label }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">Audit log</h1>
        <p className="mt-0.5 text-[14px] text-[var(--eh-text-3)]">
          Every admin action recorded — who did what, when, and why.
        </p>
      </div>

      {/* Stat strip */}
      <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-5 py-4">
        <Clock size={16} className="shrink-0 text-[var(--eh-text-4)]" />
        <p className="text-[13.5px] text-[var(--eh-text-2)]">
          <span className="font-semibold text-[var(--eh-text)]">{total}</span> action{total !== 1 ? "s" : ""} recorded
          {entityType || actionFilter ? " matching current filters" : " in total"}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
          <input
            className="w-full rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] py-2.5 pl-9 pr-3 text-[13.5px] focus:border-brand-500 focus:outline-none"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-3 py-2.5 text-[13.5px] focus:border-brand-500 focus:outline-none"
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
        >
          <option value="">All entity types</option>
          <option value="school">Schools</option>
          <option value="teacher">Teachers</option>
          <option value="job">Jobs</option>
        </select>
        <select
          className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-3 py-2.5 text-[13.5px] focus:border-brand-500 focus:outline-none"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All actions</option>
          {actionOptions.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Log table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)]">
        {loading ? (
          <div className="p-4">
            <LoadingState title="Loading audit log" message="Fetching admin actions." />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load audit log"
              message={error}
              actions={<button onClick={load} className="eh-btn eh-btn-secondary eh-btn-sm">Retry</button>}
            />
          </div>
        ) : events.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No actions recorded yet"
              message={entityType || actionFilter || search ? "Try broadening your filters." : "Admin actions will appear here as they are taken."}
            />
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden grid-cols-[minmax(0,1.4fr)_200px_160px_180px_32px] gap-4 border-b border-[var(--eh-border)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)] md:grid">
              <span>Target</span>
              <span>Action</span>
              <span>By</span>
              <span>When</span>
              <span />
            </div>

            <div className="divide-y divide-[var(--eh-border)]">
              {events.map((event) => {
                const meta = ACTION_META[event.eventType] ?? { label: event.eventType, color: "bg-gray-100 text-gray-500" };
                const isOpen = expanded === event.id;
                const hasDetail = event.payload.reason || event.payload.notes;

                return (
                  <div key={event.id}>
                    <div className="grid gap-3 px-5 py-3.5 md:grid-cols-[minmax(0,1.4fr)_200px_160px_180px_32px] md:items-center md:gap-4">
                      {/* Target */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-[var(--eh-text-4)]">
                          {ENTITY_ICONS[event.aggregateType]}
                        </span>
                        <span className="truncate text-[13.5px] font-medium text-[var(--eh-text)]">
                          {event.payload.entityLabel || event.aggregateId}
                        </span>
                      </div>

                      {/* Action badge */}
                      <div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>

                      {/* Admin */}
                      <div className="min-w-0">
                        {event.actor ? (
                          <>
                            <p className="truncate text-[13px] font-medium text-[var(--eh-text-2)]">{event.actor.name}</p>
                            <p className="truncate text-[11.5px] text-[var(--eh-text-4)]">{event.actor.email}</p>
                          </>
                        ) : (
                          <p className="text-[13px] text-[var(--eh-text-4)]">System</p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div>
                        <p className="text-[13px] text-[var(--eh-text-3)]">{formatDate(event.occurredAt)}</p>
                      </div>

                      {/* Expand toggle */}
                      <div className="flex justify-end">
                        {hasDetail ? (
                          <button
                            onClick={() => setExpanded(isOpen ? null : event.id)}
                            aria-label={isOpen ? "Collapse" : "Expand"}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--eh-text-4)] transition-colors hover:bg-[var(--surface-base)]"
                          >
                            <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Expanded detail row */}
                    {isOpen && hasDetail && (
                      <div className="border-t border-[var(--eh-border)] bg-[var(--surface-base)] px-5 py-3.5 space-y-2">
                        {event.payload.reason && (
                          <div>
                            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--eh-text-4)]">Reason</p>
                            <p className="text-[13.5px] text-[var(--eh-text-2)]">{event.payload.reason}</p>
                          </div>
                        )}
                        {event.payload.notes && (
                          <div>
                            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--eh-text-4)]">Admin notes</p>
                            <p className="text-[13.5px] text-[var(--eh-text-2)]">{event.payload.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-[var(--eh-text-3)]">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
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
    </div>
  );
}
