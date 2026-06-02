"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCheck,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  X,
  ArrowRight,
} from "lucide-react";

type NotificationType = "GENERAL" | "APPLICATION" | "INTERVIEW" | "MESSAGE" | "SYSTEM";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  payload?: Record<string, unknown> | null;
};

const TYPE_META: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string; dot: string }> = {
  APPLICATION: {
    icon: <BriefcaseBusiness size={13} />,
    color: "text-[var(--eh-primary-600)]",
    bg: "bg-[var(--eh-primary-50)] ring-1 ring-[var(--eh-primary-100)]",
    dot: "bg-[var(--eh-primary-500)]",
  },
  INTERVIEW: {
    icon: <CalendarDays size={13} />,
    color: "text-amber-600",
    bg: "bg-amber-50 ring-1 ring-amber-100",
    dot: "bg-amber-500",
  },
  MESSAGE: {
    icon: <MessageSquare size={13} />,
    color: "text-sky-600",
    bg: "bg-sky-50 ring-1 ring-sky-100",
    dot: "bg-sky-500",
  },
  SYSTEM: {
    icon: <ShieldCheck size={13} />,
    color: "text-violet-600",
    bg: "bg-violet-50 ring-1 ring-violet-100",
    dot: "bg-violet-500",
  },
  GENERAL: {
    icon: <Sparkles size={13} />,
    color: "text-slate-500",
    bg: "bg-slate-100 ring-1 ring-slate-200",
    dot: "bg-slate-400",
  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationBell({ href = "/dashboard/notifications" }: { href?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?tab=all&limit=6");
      const json = await res.json();
      if (!json?.success) return;
      setItems(json.data || []);
      setUnreadCount(Number(json?.meta?.unreadCount || 0));
    } catch {
      // silent
    }
  }, []);

  // Poll unread count every 60s when dropdown is closed
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (!open) fetchNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications, open]);

  // Refresh when opening
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
      setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className={[
          "relative rounded-lg p-2 transition-colors",
          open
            ? "bg-[var(--surface-base)] text-[var(--eh-text)]"
            : "text-[var(--eh-text-3)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]",
        ].join(" ")}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-[var(--eh-border)] bg-white shadow-xl shadow-black/[0.1]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--eh-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[var(--eh-text)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[var(--eh-primary-50)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--eh-primary-700)] ring-1 ring-[var(--eh-primary-200)]">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--eh-text-3)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)] disabled:opacity-50"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-[var(--eh-text-4)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="space-y-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 border-b border-[var(--eh-border)] px-4 py-3.5 last:border-b-0">
                    <div className="h-8 w-8 animate-pulse rounded-lg bg-[var(--surface-base)]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--surface-base)]" />
                      <div className="h-3 w-full animate-pulse rounded bg-[var(--surface-base)]" />
                      <div className="h-2.5 w-1/4 animate-pulse rounded bg-[var(--surface-base)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <Bell size={24} className="text-[var(--eh-text-4)]" />
                <p className="text-[13px] font-medium text-[var(--eh-text-3)]">You're all caught up</p>
                <p className="text-[12px] text-[var(--eh-text-4)]">New notifications will appear here.</p>
              </div>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.GENERAL;
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    className={[
                      "group flex gap-3 border-b border-[var(--eh-border)] px-4 py-3.5 last:border-b-0 transition-colors cursor-default",
                      isUnread ? "bg-blue-50/40" : "opacity-80 hover:bg-[var(--surface-base)]",
                    ].join(" ")}
                  >
                    {/* Icon */}
                    <div
                      className={[
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        meta.bg,
                        meta.color,
                      ].join(" ")}
                    >
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={["text-[13px] font-semibold leading-snug", isUnread ? "text-[var(--eh-text)]" : "text-[var(--eh-text-3)]"].join(" ")}>
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className={["mt-1 h-2 w-2 shrink-0 rounded-full", meta.dot].join(" ")} />
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] leading-[1.4] text-[var(--eh-text-3)]">
                        {n.body}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[var(--eh-text-4)]">{timeAgo(n.createdAt)}</span>
                        {isUnread && (
                          <button
                            onClick={() => markOneRead(n.id)}
                            className="text-[11px] font-semibold text-[var(--eh-primary-600)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--eh-primary-800)]"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--eh-border)] px-4 py-2.5">
            <Link
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-semibold text-[var(--eh-primary-600)] transition-colors hover:bg-[var(--eh-primary-50)] hover:text-[var(--eh-primary-800)]"
            >
              View all notifications <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
