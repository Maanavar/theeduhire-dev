"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Calendar, MessageSquare, Users } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/teacher-client";
import type { NotificationItem } from "@/lib/api/teacher-client";


const TYPE_TABS = [
  { id: "all", label: "All" },
  { id: "APPLICATION", label: "Applications" },
  { id: "INTERVIEW", label: "Interviews" },
  { id: "MESSAGE", label: "Messages" },
  { id: "SYSTEM", label: "System" },
] as const;

const iconByType = {
  APPLICATION: Users,
  INTERVIEW: Calendar,
  MESSAGE: MessageSquare,
  SYSTEM: Bell,
  GENERAL: Bell,
} satisfies Record<NotificationItem["type"], React.ComponentType<{ size?: number; className?: string }>>;

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TYPE_TABS)[number]["id"]>("all");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications();
      setItems(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load notifications"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => !item.readAt).length, [items]);
  const filtered = useMemo(() => (tab === "all" ? items : items.filter((item) => item.type === tab)), [items, tab]);

  const markAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    await loadNotifications();
  };

  const markRead = async (id: string) => {
    await markNotificationRead(id).catch(() => {});
    await loadNotifications();
  };

  const openNotification = async (item: NotificationItem) => {
    await markRead(item.id);
    if (item.payload?.conversationId) {
      router.push(`/dashboard/messages?thread=${item.payload.conversationId}`);
      return;
    }
    if (item.type === "INTERVIEW") {
      router.push("/dashboard/interviews");
      return;
    }
    if (item.type === "APPLICATION") {
      router.push("/dashboard/applicants");
      return;
    }
    if (item.type === "MESSAGE") {
      router.push("/dashboard/messages");
      return;
    }
    router.push("/dashboard/settings#security");
  };

  return (
    <div className="mx-auto w-full max-w-[820px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#111827]">Notifications</h1>
          <p className="text-[14px] text-slate-500">{unreadCount} unread - we&apos;ll keep this clean.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="eh-btn eh-btn-secondary eh-btn-sm">
            Mark all as read
          </button>
          <button onClick={() => router.push("/dashboard/settings#security")} className="eh-btn eh-btn-ghost eh-btn-sm">Notification settings</button>
        </div>
      </div>

      <div className="mb-3 flex gap-4 border-b border-[#e5e9ef] px-1">
        {TYPE_TABS.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setTab(entry.id)}
            className={[
              "border-b-2 pb-2 text-[14px] font-semibold",
              tab === entry.id ? "border-[#4f46e5] text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white">
        {loading ? (
          <div className="p-4">
            <LoadingState title="Loading notifications" message="Fetching your latest updates." />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load notifications"
              message={error}
              actions={
                <button onClick={loadNotifications} className="eh-btn eh-btn-secondary eh-btn-sm">
                  Retry
                </button>
              }
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No notifications in this tab" message="You are all caught up. New updates will appear here." />
          </div>
        ) : (
          filtered.map((item) => {
            const Icon = iconByType[item.type];
            return (
              <div key={item.id} className={`flex items-start gap-3 border-t border-[#edf1f6] px-4 py-3 first:border-t-0 ${item.readAt ? "bg-white" : "bg-[#eef2ff]"}`}>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f4ff] text-[#4f46e5]">
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-slate-900">{item.title}</p>
                    {!item.readAt ? <span className="h-1.5 w-1.5 rounded-full bg-[#4f46e5]" /> : null}
                  </div>
                  <p className="mt-0.5 text-[13px] text-slate-600">{item.body}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <button onClick={() => openNotification(item)} className="text-[12px] font-semibold text-slate-600 hover:text-[#4f46e5]">
                  View
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
