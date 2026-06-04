"use client";

import { useCallback, useEffect, useState } from "react";
import { useTabIndicator } from "@/hooks/use-tab-indicator";
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
  if (n.type === "MESSAGE" && (p.conversationId || p.threadId)) return `/dashboard/messages?thread=${p.conversationId ?? p.threadId}`;
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

  const viewingArchived = tab === "archived";
  const toggleArchived = () => {
    setTab(viewingArchived ? "all" : "archived");
    setTypeFilter("");
    setPage(1);
  };

  const TYPE_CATEGORY_TABS = [
    { key: "all", label: "All", filterType: "" },
    { key: "unread", label: "Unread", count: unreadCount, filterType: "" },
    { key: "application", label: "Applications", filterType: "APPLICATION" },
    { key: "interview", label: "Interviews", filterType: "INTERVIEW" },
    { key: "message", label: "Messages", filterType: "MESSAGE" },
    { key: "system", label: "System", filterType: "SYSTEM" },
  ];

  const switchCategoryTab = (key: string, filterType: string) => {
    setTab(key === "unread" ? "unread" : "all");
    setTypeFilter(filterType);
    setPage(1);
    load(key === "unread" ? "unread" : "all", filterType, 1);
  };

  const activeTab = TYPE_CATEGORY_TABS.find((t) => {
    if (tab === "unread" && t.key === "unread") return true;
    if (tab !== "unread" && t.filterType === typeFilter && t.key !== "unread") return true;
    return false;
  }) ?? TYPE_CATEGORY_TABS[0];

  const activeTabIndex = TYPE_CATEGORY_TABS.findIndex((t) => t.key === activeTab.key);
  const { containerRef: tabContainerRef, indicatorStyle } = useTabIndicator(activeTabIndex);

  return (
    <PageShell>
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with important activity across your account."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-4">
          {/* Tab bar */}
          <Panel>
            <div ref={tabContainerRef} className="relative flex overflow-x-auto border-b border-[var(--eh-border)]">
              <div className="eh-tabs-indicator" style={indicatorStyle} />
              {TYPE_CATEGORY_TABS.map((t) => (
                <button
                  key={t.key}
                  data-tab={t.key}
                  type="button"
                  onClick={() => switchCategoryTab(t.key, t.filterType)}
                  className={[
                    "flex items-center gap-1.5 whitespace-nowrap px-4 py-3.5 text-[13px] font-semibold transition-colors",
                    activeTab.key === t.key
                      ? "text-[var(--eh-primary-700)]"
                      : "text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]",
                  ].join(" ")}
                >
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className="rounded-full bg-[var(--eh-primary-600)] px-1.5 py-0.5 text-[10px] font-bold text-white">{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--eh-border)]">
              <p className="text-[13px] text-[var(--eh-text-3)]">
                {viewingArchived ? "Archived" : null}
                {notifications.length > 0
                  ? `${viewingArchived ? " · " : ""}Showing ${notifications.length} notification${notifications.length !== 1 ? "s" : ""}${totalPages > 1 ? ` (page ${page} of ${totalPages})` : ""}`
                  : viewingArchived ? " · empty" : "No notifications"}
              </p>
              <div className="flex gap-2">
                {!viewingArchived && unreadCount > 0 && (
                  <button type="button" onClick={markAllRead} disabled={markingAllRead} className="eh-btn eh-btn-secondary eh-btn-sm">
                    {markingAllRead ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                    Mark all as read
                  </button>
                )}
                <button type="button" onClick={toggleArchived} className="eh-btn eh-btn-secondary eh-btn-sm">
                  <Archive size={13} /> {viewingArchived ? "Back to inbox" : "View archived"}
                </button>
              </div>
            </div>

            {/* Notification list */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={22} className="animate-spin text-[var(--eh-text-4)]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={tab === "unread" ? "All caught up" : "No notifications yet"}
                  message="Notifications from applications, interviews, and messages appear here."
                />
              </div>
            ) : (
              <div>
                {/* Group by day */}
                {(() => {
                  const today = new Date();
                  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                  const groups: { label: string; items: Notification[] }[] = [
                    { label: "Today", items: notifications.filter((n) => { const d = new Date(n.createdAt); return d.toDateString() === today.toDateString(); }) },
                    { label: "Yesterday", items: notifications.filter((n) => { const d = new Date(n.createdAt); return d.toDateString() === yesterday.toDateString(); }) },
                    { label: "Earlier", items: notifications.filter((n) => { const d = new Date(n.createdAt); return d < yesterday; }) },
                  ].filter((g) => g.items.length > 0);

                  return groups.map((group) => (
                    <div key={group.label}>
                      <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)] bg-[var(--surface-base)] border-b border-[var(--eh-border)]">
                        {group.label}
                      </p>
                      {group.items.map((n) => {
                        const href = notificationHref(n);
                        const isUnread = !n.readAt;
                        const busy = actionId === n.id;
                        return (
                          <div
                            key={n.id}
                            className={["group flex items-start gap-4 px-4 py-4 transition-colors border-b border-[var(--eh-border)] last:border-0", isUnread ? "bg-[var(--eh-primary-50)]/30" : "bg-white hover:bg-[var(--surface-base)]"].join(" ")}
                          >
                            <div className={["mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", isUnread ? "border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)]" : "border-[var(--eh-border)] bg-[var(--surface-base)]"].join(" ")}>
                              {notificationIcon(n.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className={["text-[13px] font-semibold", isUnread ? "text-[var(--eh-text)]" : "text-[var(--eh-text-2)]"].join(" ")}>{n.title}</p>
                                  <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--eh-text-3)]">{n.body}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-[11px] text-[var(--eh-text-4)] whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                                  {isUnread && <span className="h-2 w-2 rounded-full bg-[var(--eh-primary-500)] shrink-0" />}
                                </div>
                              </div>
                              {href && (
                                <Link href={href} className="mt-1.5 inline-flex text-[11px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                                  View →
                                </Link>
                              )}
                            </div>
                            <div className="flex shrink-0 flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              {isUnread && (
                                <button type="button" onClick={() => markRead(n.id)} disabled={busy} title="Mark as read" className="rounded-lg p-1.5 text-[var(--eh-text-4)] hover:bg-[var(--surface-base)] hover:text-emerald-600">
                                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                </button>
                              )}
                              {tab !== "archived" && (
                                <button type="button" onClick={() => archiveOne(n.id)} disabled={busy} title="Archive" className="rounded-lg p-1.5 text-[var(--eh-text-4)] hover:bg-[var(--surface-base)] hover:text-slate-600">
                                  <Archive size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--eh-border)]">
                    <span className="text-[12px] text-[var(--eh-text-3)]">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-40">Prev</button>
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="eh-btn eh-btn-secondary eh-btn-sm disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Notification Settings */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Notification Settings</h3>
              <Link href="/dashboard/settings" className="text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">Manage</Link>
            </div>
            <p className="text-[12px] leading-[1.6] text-[var(--eh-text-3)]">
              Choose which updates you receive by email and how often, from your account settings.
            </p>
            <Link href="/dashboard/settings" className="eh-btn eh-btn-secondary eh-btn-sm mt-3 w-full justify-center">
              <Settings size={13} /> Open Settings
            </Link>
          </Panel>

          {/* Quick Filters */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-3">Quick Filters</h3>
            <div className="space-y-1">
              {[
                { label: "All Notifications", count: notifications.length, key: "all", filterType: "" },
                { label: "Unread", count: unreadCount, key: "unread", filterType: "" },
                { label: "Applications", count: notifications.filter((n) => n.type === "APPLICATION").length, key: "application", filterType: "APPLICATION" },
                { label: "Interviews", count: notifications.filter((n) => n.type === "INTERVIEW").length, key: "interview", filterType: "INTERVIEW" },
                { label: "Messages", count: notifications.filter((n) => n.type === "MESSAGE").length, key: "message", filterType: "MESSAGE" },
                { label: "System", count: notifications.filter((n) => n.type === "SYSTEM").length, key: "system", filterType: "SYSTEM" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => switchCategoryTab(f.key, f.filterType)}
                  className={[
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors",
                    activeTab.key === f.key ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)] font-semibold" : "text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]",
                  ].join(" ")}
                >
                  <span>{f.label}</span>
                  <span className={["rounded-full px-2 py-0.5 text-[11px] font-bold", activeTab.key === f.key ? "bg-[var(--eh-primary-100)] text-[var(--eh-primary-700)]" : "bg-[var(--surface-base)] text-[var(--eh-text-4)]"].join(" ")}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          {/* Stay in the loop banner */}
          <Panel className="p-5 text-center">
            <div className="flex h-12 w-12 mx-auto mb-3 items-center justify-center rounded-2xl bg-[var(--eh-primary-50)]">
              <Bell size={20} className="text-[var(--eh-primary-600)]" />
            </div>
            <p className="text-[13px] font-semibold text-[var(--eh-text)] mb-1">Stay in the loop</p>
            <p className="text-[12px] text-[var(--eh-text-3)] leading-[1.6] mb-3">Enable notifications so you never miss important updates about candidates, interviews, and account activity.</p>
            <Link href="/dashboard/settings" className="eh-btn eh-btn-secondary w-full justify-center">Notification Preferences</Link>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
