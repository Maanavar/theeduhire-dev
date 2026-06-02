"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  GraduationCap,
  LogOut,
  ScrollText,
  WifiOff,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/schools", label: "Schools", icon: Building2 },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
];

const OPS_NAV_ITEMS = [
  { href: "/admin/offline-schools", label: "Offline schools", icon: WifiOff },
  { href: "/admin/managed-jobs", label: "Managed jobs", icon: ClipboardList },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[220px] shrink-0 flex-col border-r border-[var(--eh-border)] bg-white lg:flex">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 border-b border-[var(--eh-border)] px-4 py-4">
        <div className="eh-logo-mark h-[24px] w-[24px] rounded-[6px]" />
        <span className="text-[15px] font-bold tracking-[-0.01em] text-[var(--eh-text)]">
          EduHire
        </span>
        <span className="ml-auto rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
          ADMIN
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
          Platform
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
                active
                  ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
                  : "text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]",
              ].join(" ")}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-[55%] w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--eh-primary-600)]" />
              )}
              <Icon
                size={15}
                className={
                  active
                    ? "text-[var(--eh-primary-600)]"
                    : "text-[var(--eh-text-4)] group-hover:text-[var(--eh-text-3)] transition-colors"
                }
              />
              {label}
            </Link>
          );
        })}

        <p className="mb-1 mt-4 px-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
          Ops team
        </p>
        {OPS_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
                active
                  ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
                  : "text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]",
              ].join(" ")}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-[55%] w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--eh-primary-600)]" />
              )}
              <Icon
                size={15}
                className={
                  active
                    ? "text-[var(--eh-primary-600)]"
                    : "text-[var(--eh-text-4)] group-hover:text-[var(--eh-text-3)] transition-colors"
                }
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--eh-border)] px-2 py-3">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
