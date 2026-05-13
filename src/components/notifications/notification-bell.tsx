"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export default function NotificationBell({ href = "/dashboard/notifications" }: { href?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications?tab=all&limit=1")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json?.success) return;
        setUnreadCount(Number(json?.meta?.unreadCount || 0));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link href={href} aria-label="Open notifications" className="relative rounded-full p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900">
      <Bell size={16} />
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
