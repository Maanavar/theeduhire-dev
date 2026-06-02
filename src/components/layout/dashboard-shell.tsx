"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import type { ComponentType, ReactNode } from "react";
import {
  BellRing,
  BookMarked,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FileBadge2,
  FileText,
  GraduationCap,
  KanbanSquare,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { featureFlags } from "@/config/feature-flags";
import NotificationBell from "@/components/notifications/notification-bell";
import { CommandPalette } from "@/components/layout/command-palette";
import { PageTransition } from "@/components/layout/page-transition";
import { calculateProfileCompletion, getTeacherApplyReadiness } from "@/lib/profileCompletion";
import { getBoardLabel } from "@/lib/utils";
import {
  DashboardProfileProvider,
  type DashboardProfileData,
} from "@/components/layout/dashboard-profile-context";
import { UserAvatar } from "@/components/ui/user-avatar";

type DashboardShellProps = {
  children: ReactNode;
  role: "TEACHER" | "SCHOOL_ADMIN";
};

type NavLink = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  featureFlag?: "messaging" | "notificationsCenter" | "settingsSecurity" | "pipelineBoard";
};

const TEACHER_MAIN_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/applications", label: "Applications", icon: FileText },
  { href: "/dashboard/recommendations", label: "Matches", icon: Sparkles },
  { href: "/dashboard/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare, featureFlag: "messaging" },
  { href: "/dashboard/saved", label: "Saved", icon: BookMarked },
];

const TEACHER_SECONDARY_LINKS: NavLink[] = [
  { href: "/dashboard/resumes", label: "Resumes", icon: FileBadge2 },
  { href: "/dashboard/alerts", label: "Job Alerts", icon: BellRing },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/subscription", label: "My Plan", icon: CreditCard },
];

const SCHOOL_MAIN_LINKS: NavLink[] = [
  { href: "/dashboard/school", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/post-job", label: "Post a Job", icon: Sparkles },
  { href: "/dashboard/my-jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/applicants", label: "Applicants", icon: Users },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: KanbanSquare, featureFlag: "pipelineBoard" },
  { href: "/dashboard/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare, featureFlag: "messaging" },
];

const SCHOOL_SECONDARY_LINKS: NavLink[] = [
  { href: "/dashboard/notifications", label: "Notifications", icon: BellRing, featureFlag: "notificationsCenter" },
  { href: "/dashboard/profile", label: "School Profile", icon: User },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const ACCOUNT_LINKS: NavLink[] = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings, featureFlag: "settingsSecurity" },
  { href: "/dashboard/settings#security", label: "Security", icon: Shield, featureFlag: "settingsSecurity" },
];

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
        active
          ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
          : "text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]",
      ].join(" ")}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-[60%] w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--eh-primary-600)]" />
      )}
      <Icon
        size={15}
        aria-hidden="true"
        className={active ? "text-[var(--eh-primary-600)]" : "text-[var(--eh-text-4)] group-hover:text-[var(--eh-text-3)] transition-colors"}
      />
      {label}
    </Link>
  );
}

function TopNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={[
        "relative flex h-[56px] flex-col items-center justify-center gap-0.5 px-4 text-[11px] font-semibold tracking-[0.01em] transition-colors",
        active
          ? "text-[var(--eh-primary-700)]"
          : "text-[var(--eh-text-3)] hover:text-[var(--eh-text)]",
      ].join(" ")}
    >
      <Icon size={17} />
      <span>{label}</span>
      {active && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-t-full bg-[var(--eh-primary-600)]" />
      )}
    </Link>
  );
}

function filterLinks(links: NavLink[]) {
  return links.filter((link) => {
    if (!link.featureFlag) return true;
    return featureFlags[link.featureFlag];
  });
}

function SidebarGroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1 mt-5 px-3 text-[10.5px] font-semibold tracking-[0.08em] text-[var(--eh-text-4)] uppercase first:mt-0">
      {children}
    </p>
  );
}

export default function DashboardShell({ children, role }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<DashboardProfileData | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("eh-sidebar-collapsed");
    if (stored === "1") setSidebarCollapsed(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("eh-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }, []);

  const isSchool = role === "SCHOOL_ADMIN";

  const fetchProfile = useCallback(() => {
    fetch("/api/profile")
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          signOut({ callbackUrl: "/auth/signin?notice=suspended" });
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!json || !json.success || !json.data) return;
        setProfile(json.data as DashboardProfileData);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchProfile(); }, [pathname, fetchProfile]);

  useEffect(() => {
    window.addEventListener("profile-updated", fetchProfile);
    return () => window.removeEventListener("profile-updated", fetchProfile);
  }, [fetchProfile]);

  const mainLinks = useMemo(
    () => filterLinks(isSchool ? SCHOOL_MAIN_LINKS : TEACHER_MAIN_LINKS),
    [isSchool]
  );

  const secondaryLinks = useMemo(
    () => filterLinks(isSchool ? SCHOOL_SECONDARY_LINKS : TEACHER_SECONDARY_LINKS),
    [isSchool]
  );

  const accountLinks = useMemo(() => filterLinks(ACCOUNT_LINKS), []);
  const topLinks = mainLinks.slice(0, 5);
  const mobileLinks = [...mainLinks, ...secondaryLinks, ...accountLinks];

  const teacherCompletion = calculateProfileCompletion(profile || {}).percentage;
  const teacherReadiness = getTeacherApplyReadiness(profile || {});

  const shellSummary = isSchool
    ? {
        href: "/dashboard/profile",
        title: profile?.schoolName || "School Profile",
        subtitle:
          [profile?.board ? getBoardLabel(profile.board) : null, profile?.city || null]
            .filter(Boolean)
            .join(" · ") || "Complete your school setup",
        icon: Building2,
        type: "school" as const,
      }
    : {
        href: "/dashboard/profile",
        title: session?.user?.name || "Teacher",
        subtitle:
          profile?.subjects?.slice(0, 2).join(" · ") ||
          profile?.qualification ||
          "Teaching profile",
        icon: GraduationCap,
        type: "teacher" as const,
      };

  const footerPanel = isSchool
    ? {
        title: "School workspace",
        metricLabel: "Setup status",
        metricValue:
          [profile?.schoolName, profile?.city, profile?.board].filter(Boolean).length >= 3
            ? "Ready"
            : "In progress",
        actionLabel: "Update school profile",
        actionHref: "/dashboard/profile",
      }
    : {
        title: `${teacherCompletion}% profile complete`,
        metricLabel: "Next step",
        metricValue: teacherReadiness.ready
          ? "Ready to apply"
          : teacherReadiness.resumeRequired
            ? "Upload resume"
            : "Reach 80% completion",
        actionLabel: "Complete profile",
        actionHref: "/dashboard/profile",
      };

  const schoolSetupReady =
    [profile?.schoolName, profile?.city, profile?.board].filter(Boolean).length >= 3;
  const showFooterPanel = isSchool
    ? !schoolSetupReady
    : teacherCompletion < 100 && !teacherReadiness.ready;

  const searchConfig = isSchool
    ? {
        href: "/dashboard/applicants",
        placeholder: "Search applicants, locations, subjects…",
        param: "search",
      }
    : {
        href: "/dashboard/jobs",
        placeholder: "Search jobs, schools, subjects…",
        param: "search",
      };

  const homeHref = isSchool ? "/dashboard/school" : "/dashboard";

  const isActiveLink = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/school") return pathname === "/dashboard/school";
    if (href.startsWith("/dashboard/settings")) return pathname === "/dashboard/settings";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchValue(searchParams.get(searchConfig.param) || "");
  }, [searchConfig.param, searchParams]);

  const submitSearch = () => {
    const params = new URLSearchParams();
    const nextValue = searchValue.trim();
    if (nextValue) params.set(searchConfig.param, nextValue);
    router.push(
      params.toString() ? `${searchConfig.href}?${params.toString()}` : searchConfig.href
    );
  };

  const completionRingDash =
    shellSummary.type === "teacher"
      ? Math.round((teacherCompletion / 100) * 100.5)
      : null;

  return (
    <div className="app-linkedin min-h-screen bg-[var(--surface-base)]">
      <CommandPalette />
      {/* ── Top header ── */}
      <header className="sticky top-0 z-20 w-full border-b border-[var(--eh-border)] bg-white/98 backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] w-full max-w-[1400px] items-center gap-3 px-4 md:px-6">
          {/* Logo */}
          <Link href={homeHref} aria-label="Dashboard home" className="mr-2 shrink-0">
            <div className="eh-logo-mark h-[26px] w-[26px] rounded-[7px]" />
          </Link>

          {/* Search / Command Palette trigger */}
          <button
            type="button"
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
              document.dispatchEvent(event);
            }}
            className="hidden min-w-[220px] max-w-[340px] flex-1 cursor-text items-center gap-2 rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-1.5 text-[13px] transition-colors hover:border-[var(--eh-border-strong)] md:flex"
          >
            <Search size={13} className="shrink-0 text-[var(--eh-text-4)]" />
            <span className="flex-1 text-left text-[var(--eh-text-4)]">{searchConfig.placeholder}</span>
            <kbd className="shrink-0 rounded border border-[var(--eh-border)] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[var(--eh-text-4)]">
              ⌘K
            </kbd>
          </button>

          {/* Center top nav — desktop XL */}
          <nav className="hidden flex-1 items-stretch justify-center xl:flex">
            {topLinks.map((link) => (
              <TopNavLink
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                active={isActiveLink(link.href)}
              />
            ))}
          </nav>
          <div className="flex-1 xl:hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-0.5 md:gap-1">
            <NotificationBell />
            {featureFlags.messaging ? (
              <Link
                href="/dashboard/messages"
                aria-label="Open messages"
                className="rounded-lg p-2 text-[var(--eh-text-3)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]"
              >
                <MessageSquare size={17} />
              </Link>
            ) : null}

            {/* User menu */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Open user menu"
                className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-[var(--surface-base)]"
              >
                <UserAvatar name={session?.user?.name || ""} avatarUrl={profile?.avatarUrl} size={28} className="ring-2 ring-white" />
                <ChevronDown
                  size={11}
                  className={`text-[var(--eh-text-4)] transition-transform duration-150 ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userMenuOpen ? (
                <div
                  role="menu"
                  aria-label="User menu"
                  className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--eh-border)] bg-white shadow-xl shadow-black/[0.08]"
                >
                  <div className="border-b border-[var(--eh-border)] px-4 py-3">
                    <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">
                      {session?.user?.name}
                    </p>
                    <p className="truncate text-[11px] text-[var(--eh-text-3)]">
                      {session?.user?.email}
                    </p>
                  </div>
                  <div className="p-1">
                    <Link
                      role="menuitem"
                      href="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)]"
                    >
                      <User size={13} className="text-[var(--eh-text-4)]" aria-hidden="true" />
                      Profile
                    </Link>
                    <button
                      role="menuitem"
                      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={13} aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile nav strip */}
        <div className="border-t border-[var(--eh-border)] px-4 py-2 lg:hidden">
          <div className="mb-2 md:hidden">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              className="flex items-center gap-2 rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-2"
            >
              <Search size={13} className="text-[var(--eh-text-4)]" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchConfig.placeholder}
                className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[var(--eh-text)] outline-none placeholder:text-[var(--eh-text-4)]"
              />
            </form>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {mobileLinks.map((link) => {
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "whitespace-nowrap rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                    active
                      ? "border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
                      : "border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-[var(--eh-border-strong)]",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] lg:flex">
        {/* ── Left sidebar ── */}
        <aside
          className={[
            "hidden shrink-0 border-r border-[var(--eh-border)] bg-white py-4 lg:sticky lg:top-[56px] lg:flex lg:h-[calc(100vh-56px)] lg:flex-col lg:overflow-y-auto transition-[width] duration-200",
            sidebarCollapsed ? "w-[56px] px-1.5 overflow-x-hidden" : "w-[232px] px-3",
          ].join(" ")}
        >
          {/* Collapse toggle */}
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "mb-3 flex items-center justify-center rounded-lg p-1.5 text-[var(--eh-text-4)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--eh-text-2)]",
              sidebarCollapsed ? "mx-auto" : "ml-auto",
            ].join(" ")}
          >
            {sidebarCollapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>

          {/* Profile card */}
          {sidebarCollapsed ? (
            <Link
              href={shellSummary.href}
              title={shellSummary.title}
              className="mb-3 flex items-center justify-center"
            >
              <UserAvatar name={session?.user?.name || ""} avatarUrl={profile?.avatarUrl} size={36} />
            </Link>
          ) : (
            <Link
              href={shellSummary.href}
              className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-3 transition-all hover:border-[var(--eh-border-strong)] hover:bg-white hover:shadow-sm"
            >
              <div className="relative shrink-0">
                {shellSummary.type === "teacher" && completionRingDash !== null ? (
                  <svg width="40" height="40" className="absolute inset-0 -rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="var(--eh-primary-100)" strokeWidth="2.5" />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="var(--eh-primary-500)"
                      strokeWidth="2.5"
                      strokeDasharray={`${completionRingDash} 100.5`}
                      strokeLinecap="round"
                    />
                  </svg>
                ) : null}
                <UserAvatar name={session?.user?.name || ""} avatarUrl={profile?.avatarUrl} size={40} className="relative" />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[var(--eh-text)]">
                  {shellSummary.title}
                </span>
                <span className="block truncate text-[11px] text-[var(--eh-text-3)]">
                  {shellSummary.subtitle}
                </span>
              </span>
            </Link>
          )}

          {/* Main nav */}
          {!sidebarCollapsed && <SidebarGroupLabel>{isSchool ? "Workspace" : "Dashboard"}</SidebarGroupLabel>}
          <nav>
            {mainLinks.map((link) => (
              sidebarCollapsed ? (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  aria-label={link.label}
                  className={[
                    "mb-0.5 flex items-center justify-center rounded-lg p-2.5 transition-colors",
                    isActiveLink(link.href)
                      ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-600)]"
                      : "text-[var(--eh-text-4)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text-2)]",
                  ].join(" ")}
                >
                  <link.icon size={17} />
                </Link>
              ) : (
                <SidebarLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  active={isActiveLink(link.href)}
                />
              )
            ))}
          </nav>

          {/* Secondary nav */}
          {!sidebarCollapsed && <SidebarGroupLabel>{isSchool ? "Operations" : "Career kit"}</SidebarGroupLabel>}
          <nav>
            {secondaryLinks.map((link) => (
              sidebarCollapsed ? (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  aria-label={link.label}
                  className={[
                    "mb-0.5 flex items-center justify-center rounded-lg p-2.5 transition-colors",
                    isActiveLink(link.href)
                      ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-600)]"
                      : "text-[var(--eh-text-4)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text-2)]",
                  ].join(" ")}
                >
                  <link.icon size={17} />
                </Link>
              ) : (
                <SidebarLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  active={isActiveLink(link.href)}
                />
              )
            ))}
          </nav>

          {/* Account nav */}
          {accountLinks.length > 0 ? (
            <>
              {!sidebarCollapsed && <SidebarGroupLabel>Account</SidebarGroupLabel>}
              <nav>
                {accountLinks.map((link) => (
                  sidebarCollapsed ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      title={link.label}
                      aria-label={link.label}
                      className={[
                        "mb-0.5 flex items-center justify-center rounded-lg p-2.5 transition-colors",
                        isActiveLink(link.href)
                          ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-600)]"
                          : "text-[var(--eh-text-4)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text-2)]",
                      ].join(" ")}
                    >
                      <link.icon size={17} />
                    </Link>
                  ) : (
                    <SidebarLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      active={isActiveLink(link.href)}
                    />
                  )
                ))}
              </nav>
            </>
          ) : null}

          {/* Footer card — only shown when action is still needed and sidebar is expanded */}
          {showFooterPanel && !sidebarCollapsed ? (
            <div className="mt-auto pt-4">
              <div className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-3.5">
                <p className="text-[12px] font-semibold text-[var(--eh-text)]">{footerPanel.title}</p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">
                      {footerPanel.metricLabel}
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold text-[var(--eh-primary-600)]">
                      {footerPanel.metricValue}
                    </p>
                  </div>
                  {shellSummary.type === "teacher" ? (
                    <span className="text-[22px] font-bold tracking-tight text-[var(--eh-primary-600)]">
                      {teacherCompletion}%
                    </span>
                  ) : null}
                </div>
                <Link
                  href={footerPanel.actionHref}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[var(--eh-primary-600)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--eh-primary-700)]"
                >
                  {footerPanel.actionLabel}
                </Link>
              </div>
            </div>
          ) : null}
        </aside>

        {/* ── Main content ── */}
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-7">
          <DashboardProfileProvider value={profile}>
            <PageTransition>
              {children}
            </PageTransition>
          </DashboardProfileProvider>
        </main>
      </div>
    </div>
  );
}
