"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BarChart3, Briefcase, Building2, ExternalLink, GraduationCap, LogOut, ScrollText } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/schools", label: "Schools", icon: Building2 },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[260px] shrink-0 border-r border-[var(--eh-border)] bg-[var(--surface-raised)] lg:flex lg:flex-col">
      <div className="border-b border-[var(--eh-border)] px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="font-display text-[20px] font-semibold text-eh-primary">EduHire</span>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">ADMIN</span>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--eh-text-3)]">
          Review jobs, verify schools and teachers, and keep platform quality high.
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Operations</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                active
                  ? "border border-[var(--eh-border)] bg-[var(--surface-base)] text-[var(--eh-text)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  : "text-[var(--eh-text-3)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]",
              ].join(" ")}
            >
              <Icon size={15} className={active ? "text-eh-primary" : "text-[var(--eh-text-4)]"} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--eh-border)] p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-[var(--eh-text-3)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]"
        >
          <ExternalLink size={14} /> View site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}
