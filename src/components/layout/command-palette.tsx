"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  GraduationCap,
  KanbanSquare,
  LayoutDashboard,
  LineChart,
  Search,
  Sparkles,
  Users,
  BookMarked,
  BellRing,
  User,
  Building2,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";

type PaletteItem = {
  id: string;
  label: string;
  group: string;
  href: string;
  icon: React.ReactNode;
  keywords?: string;
};

const TEACHER_ITEMS: PaletteItem[] = [
  { id: "t-home", label: "Home", group: "Navigate", href: "/dashboard", icon: <LayoutDashboard size={15} />, keywords: "dashboard home" },
  { id: "t-jobs", label: "Browse Jobs", group: "Navigate", href: "/dashboard/jobs", icon: <BriefcaseBusiness size={15} />, keywords: "jobs search browse" },
  { id: "t-apps", label: "My Applications", group: "Navigate", href: "/dashboard/applications", icon: <FileText size={15} />, keywords: "applications apply" },
  { id: "t-matches", label: "AI Matches", group: "Navigate", href: "/dashboard/recommendations", icon: <Sparkles size={15} />, keywords: "recommendations ai matches" },
  { id: "t-interviews", label: "Interviews", group: "Navigate", href: "/dashboard/interviews", icon: <CalendarDays size={15} />, keywords: "interviews schedule" },
  { id: "t-saved", label: "Saved Jobs", group: "Navigate", href: "/dashboard/saved", icon: <BookMarked size={15} />, keywords: "saved bookmarked" },
  { id: "t-resumes", label: "Resumes", group: "Career Kit", href: "/dashboard/resumes", icon: <FileText size={15} />, keywords: "resume cv upload" },
  { id: "t-alerts", label: "Job Alerts", group: "Career Kit", href: "/dashboard/alerts", icon: <BellRing size={15} />, keywords: "alerts notifications jobs" },
  { id: "t-profile", label: "My Profile", group: "Account", href: "/dashboard/profile", icon: <User size={15} />, keywords: "profile settings" },
];

const SCHOOL_ITEMS: PaletteItem[] = [
  { id: "s-home", label: "Dashboard", group: "Navigate", href: "/dashboard/school", icon: <LayoutDashboard size={15} />, keywords: "dashboard home" },
  { id: "s-post", label: "Post a Job", group: "Actions", href: "/dashboard/post-job", icon: <Plus size={15} />, keywords: "post create job new" },
  { id: "s-jobs", label: "My Jobs", group: "Navigate", href: "/dashboard/my-jobs", icon: <BriefcaseBusiness size={15} />, keywords: "jobs listings" },
  { id: "s-applicants", label: "Applicants", group: "Navigate", href: "/dashboard/applicants", icon: <Users size={15} />, keywords: "applicants candidates board" },
  { id: "s-pipeline", label: "Pipeline", group: "Navigate", href: "/dashboard/pipeline", icon: <KanbanSquare size={15} />, keywords: "pipeline kanban stages" },
  { id: "s-interviews", label: "Interviews", group: "Navigate", href: "/dashboard/interviews", icon: <CalendarDays size={15} />, keywords: "interviews schedule calendar" },
  { id: "s-analytics", label: "Analytics", group: "Navigate", href: "/dashboard/analytics", icon: <LineChart size={15} />, keywords: "analytics stats metrics funnel" },
  { id: "s-profile", label: "School Profile", group: "Account", href: "/dashboard/profile", icon: <Building2 size={15} />, keywords: "profile school settings" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  const isSchool = session?.user?.role === "SCHOOL_ADMIN";
  const items = isSchool ? SCHOOL_ITEMS : TEACHER_ITEMS;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setSearch("");
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh]"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-white shadow-2xl shadow-black/20"
            onClick={(e) => e.stopPropagation()}
          >
            <Command shouldFilter={true} loop>
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-[var(--eh-border)] px-4 py-3.5">
                <Search size={16} className="shrink-0 text-[var(--eh-text-4)]" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search pages, actions…"
                  className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-[var(--eh-text)] outline-none placeholder:text-[var(--eh-text-4)]"
                  autoFocus
                />
                <kbd className="shrink-0 rounded-md border border-[var(--eh-border)] bg-[var(--surface-base)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--eh-text-4)]">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[380px] overflow-y-auto p-2">
                <Command.Empty className="py-10 text-center text-[13px] text-[var(--eh-text-3)]">
                  No results for &ldquo;{search}&rdquo;
                </Command.Empty>

                {groups.map((group) => {
                  const groupItems = items.filter((item) => item.group === group);
                  return (
                    <Command.Group
                      key={group}
                      heading={group}
                      className="[&>[cmdk-group-heading]]:mb-1 [&>[cmdk-group-heading]]:mt-3 [&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:text-[10.5px] [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-[0.07em] [&>[cmdk-group-heading]]:text-[var(--eh-text-4)] first:[&>[cmdk-group-heading]]:mt-0"
                    >
                      {groupItems.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={`${item.label} ${item.keywords ?? ""}`}
                          onSelect={() => navigate(item.href)}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-[var(--eh-text-2)] transition-colors aria-selected:bg-[var(--eh-primary-50)] aria-selected:text-[var(--eh-primary-700)] hover:bg-[var(--surface-base)]"
                        >
                          <span className="text-[var(--eh-text-4)] aria-selected:text-[var(--eh-primary-600)]">
                            {item.icon}
                          </span>
                          {item.label}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-[var(--eh-border)] px-4 py-2.5">
                <span className="flex items-center gap-1 text-[11px] text-[var(--eh-text-4)]">
                  <kbd className="rounded border border-[var(--eh-border)] bg-[var(--surface-base)] px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[var(--eh-text-4)]">
                  <kbd className="rounded border border-[var(--eh-border)] bg-[var(--surface-base)] px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
                  open
                </span>
                <span className="ml-auto text-[11px] text-[var(--eh-text-4)]">
                  {isSchool ? <Building2 size={11} className="inline mr-1" /> : <GraduationCap size={11} className="inline mr-1" />}
                  {isSchool ? "School workspace" : "Teacher workspace"}
                </span>
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
