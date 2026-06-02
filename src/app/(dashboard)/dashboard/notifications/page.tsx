"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Bell,
  BriefcaseBusiness,
  Calendar,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  RefreshCw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/system/system-states";
import { timeAgo } from "@/lib/utils";

type NotificationType = "GENERAL" | "APPLICATION" | "INTERVIEW" | "MESSAGE" | "SYSTEM";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, string>;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

const TYPE_TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "archived", label: "Archived" },
];

const TYPE_FILTERS = [
  { key: "", label: "All types" },
  { key: "APPLICATION", label: "Applications" },
  { key: "INTERVIEW", label: "Interviews" },
  { key: "MESSAGE", label: "Messages" },
  { key: "SYSTEM", label: "System" },
  { key: "GENERAL", label: "General" },
];

function notificationIcon(type: NotificationType) {
  switch (type) {
    case "APPLICATION": return <BriefcaseBusiness size={15} className="text-[var(--eh-primary-600)]" />;
    case "INTERVIEW": return <Calendar size={15} className="text-amber-600" />;
    case "MESSAGE": return <MessageSquare size={15} className="text-emerald-600" />;
    case "SYSTEM": return <Settings size={15} className="text-slate-500" />;
    default: return <Bell size={15} className="text-[var(--eh-text-3)]" />;
  }
}

function notificationHref(n: Notification): string | null {
  const p = n.payload;
  if (!p) return null;
  if (n.type === "APPLICATION" && p.applicationId) return "/dashboard/applications";
  if (n.type === "INTERVIEW" && p.interviewId) return "/dashboard/interviews";
  if (n.type === "MESSAGE" && p.threadId) return `/dashboard/messages?thread=${p.threadId}`;
  return null;
}

export default function NotificationsPage() {
  const [tab, setTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async (t: string, type: string, pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab: t, page: String(pg), limit: "20" });
      if (type) params.set("type", type);
      const res = await fetch(`/api/notifications?${params}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        setTotalPages(json.pagination.totalPages);
        setUnreadCount(json.meta.unreadCount);
      }
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab, typeFilter, page); }, [load, tab, typeFilter, page]);

  const switchTab = (t: string) => { setTab(t); setPage(1); load(t, typeFilter, 1); };
  const switchType = (t: string) => { setTypeFilter(t); setPage(1); load(tab, t, 1); };

  const markRead = async (id: string) => {
    setActionId(id);
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { toast.error("Failed to mark as read"); }
    finally { setActionId(null); }
  };

  const archiveOne = async (id: string) => {
    setActionId(id);
    try {
      await fetch(`/api/notifications/${id}/archive`, { method: "PATCH" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Archived");
    } catch { toast.error("Failed to archive"); }
    finally { setActionId(null); }
  };

  const markAllRead = async () => {
    setMarkingAllRead(true);
    try {
      await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch { toast.error("Failed"); }
    finally { setMarkingAllRead(false); }
  };

  return (
    <PageShell>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => load(tab, typeFilter, page)} className="eh-btn eh-btn-ghost">
              <RefreshCw size={14} /> Refresh
            </button>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} disabled={markingAllRead} className="eh-btn eh-btn-secondary">
                {markingAllRead ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                Mark all read
              </button>
            )}
          </div>
        }
      />

      {/* Tabs + type filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--eh-border)] bg-white px-4 py-3">
        <div className="flex gap-1.5">
          {TYPE_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
              className={[
                "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
                tab === t.key
                  ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
                  : "text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]",
              ].join(" ")}
            >
              {t.label}
              {t.key === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-[var(--eh-primary-600)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => switchType(e.target.value)}
          className="input-base max-w-[160px] text-[13px]"
        >
          {TYPE_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>

      {/* List */}
      <Panel>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-[var(--eh-text-4)]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={tab === "unread" ? "All caught up" : tab === "archived" ? "Nothing archived" : "No notifications yet"}
              message="Notifications from applications, interviews, and messages appear here."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--eh-border)]">
            {notifications.map((n) => {
              const href = notificationHref(n);
              const isUnread = !n.readAt;
              const busy = actionId === n.id;
              return (
                <div
                  key={n.id}
                  className={[
                    "group flex items-start gap-3 px-4 py-4 transition-colors",
                    isUnread ? "bg-[var(--eh-primary-50)]/40" : "bg-white hover:bg-[var(--surface-base)]",
                  ].join(" ")}
                >
                  <div className={[
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
                    isUnread ? "border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)]" : "border-[var(--eh-border)] bg-[var(--surface-base)]",
                  ].join(" ")}>
                    {notificationIcon(n.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={["text-[13px] font-semibold", isUnread ? "text-[var(--eh-text)]" : "text-[var(--eh-text-2)]"].join(" ")}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--eh-text-3)]">{n.body}</p>
                      </div>
                      {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--eh-primary-500)]" />}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[11px] text-[var(--eh-text-4)]">{timeAgo(n.createdAt)}</span>
                      {href && (
                        <Link href={href} className="text-[11px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                          View →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        disabled={busy}
                        title="Mark as read"
                        className="rounded-lg p-1.5 text-[var(--eh-text-4)] hover:bg-[var(--surface-base)] hover:text-emerald-600"
                      >
                        {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      </button>
                    )}
                    {tab !== "archived" && (
                      <button
                        type="button"
                        onClick={() => archiveOne(n.id)}
                        disabled={busy}
                        title="Archive"
                        className="rounded-lg p-1.5 text-[var(--eh-text-4)] hover:bg-[var(--surface-base)] hover:text-slate-600"
                      >
                        <Archive size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--eh-border)] px-4 py-3">
            <span className="text-[12px] text-[var(--eh-text-3)]">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-40">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
