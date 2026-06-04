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
  CreditCard,
  FileBadge2,
  FileText,
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
  UserCheck,
} from "lucide-react";
import { featureFlags } from "@/config/feature-flags";
import NotificationBell from "@/components/notifications/notification-bell";
import { CommandPalette } from "@/components/layout/command-palette";
import { PageTransition } from "@/components/layout/page-transition";
import { calculateProfileCompletion, getTeacherApplyReadiness } from "@/lib/profileCompletion";
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Browse Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/recommendations", label: "Recommended", icon: Sparkles },
  { href: "/dashboard/saved", label: "Saved Jobs", icon: BookMarked },
  { href: "/dashboard/applications", label: "My Applications", icon: FileText },
  { href: "/dashboard/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare, featureFlag: "messaging" },
  { href: "/dashboard/alerts", label: "Job Alerts", icon: BellRing },
];

const TEACHER_SECONDARY_LINKS: NavLink[] = [
  { href: "/dashboard/resumes", label: "Resumes & Docs", icon: FileBadge2 },
  { href: "/dashboard/notifications", label: "Notifications", icon: BellRing, featureFlag: "notificationsCenter" },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const SCHOOL_MAIN_LINKS: NavLink[] = [
  { href: "/dashboard/school", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/my-jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/applicants", label: "Applicants", icon: Users },
  { href: "/dashboard/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
  { href: "/dashboard/managed-recruitment", label: "Managed Recruitment", icon: UserCheck },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: KanbanSquare, featureFlag: "pipelineBoard" },
];

const SCHOOL_SECONDARY_LINKS: NavLink[] = [
  { href: "/dashboard/billing", label: "Billing & Plan", icon: CreditCard },
  { href: "/dashboard/profile", label: "School Profile", icon: Building2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/school-verification", label: "Verification", icon: Shield },
  { href: "/dashboard/notifications", label: "Notifications", icon: BellRing, featureFlag: "notificationsCenter" },
];

const ACCOUNT_LINKS: NavLink[] = [
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
      <span
        className={[
          "absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--eh-primary-600)] transition-all duration-200",
          active ? "h-[60%] opacity-100 scale-y-100" : "h-[20%] opacity-0 scale-y-0",
        ].join(" ")}
        style={{ transformOrigin: "center" }}
      />
      <Icon
        size={15}
        aria-hidden="true"
        className={active ? "text-[var(--eh-primary-600)]" : "text-[var(--eh-text-4)] group-hover:text-[var(--eh-text-3)] transition-colors"}
      />
      {label}
    </Link>
  );
}

function filterLinks(links: NavLink[]) {
  return links.filter((link) => {
    if (!link.featureFlag) return true;
    return featureFlags[link.featureFlag];
  });
}

export default function DashboardShell({ children, role }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<DashboardProfileData | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);

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
  const mobileLinks = [...mainLinks, ...secondaryLinks, ...accountLinks];

  const teacherCompletion = calculateProfileCompletion(profile || {}).percentage;
  const teacherReadiness = getTeacherApplyReadiness(profile || {});

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

  return (
    <div className="app-linkedin min-h-screen bg-[var(--surface-base)]">
      <CommandPalette />

      {/* ── Top header ── */}
      <header className="sticky top-0 z-20 w-full border-b border-[var(--eh-border)] bg-white">
        <div className="flex h-[60px] items-center">
          {/* Logo — same width as sidebar so search aligns with content */}
          <Link href={homeHref} aria-label="Dashboard home" className="flex h-full w-[200px] shrink-0 items-center gap-2.5 border-r border-[var(--eh-border)] px-5">
            <div className="eh-logo-mark h-[32px] w-[32px] rounded-[9px]" />
            <span className="hidden text-[17px] font-bold tracking-tight text-[var(--eh-text)] lg:block">
              EduHire
            </span>
          </Link>

          {/* Search bar — left-aligned, starts at content edge */}
          <div className="hidden flex-1 px-5 md:block">
            <button
              type="button"
              onClick={() => {
                const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
                document.dispatchEvent(event);
              }}
              className="flex w-full max-w-[520px] cursor-text items-center gap-2.5 rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-2 text-[13.5px] text-[var(--eh-text-4)] transition-colors hover:border-[var(--eh-border-strong)] hover:bg-white"
            >
              <Search size={14} className="shrink-0 text-[var(--eh-text-4)]" />
              <span className="flex-1 text-left">{searchConfig.placeholder}</span>
            </button>
          </div>

          {/* Right: notifications + messages + user */}
          <div className="ml-auto flex items-center gap-1 pr-4">
            <NotificationBell />

            {featureFlags.messaging && (
              <Link
                href="/dashboard/messages"
                aria-label="Messages"
                className="relative rounded-full p-2 text-[var(--eh-text-3)] transition-colors hover:bg-[var(--surface-base)]"
              >
                <MessageSquare size={19} />
              </Link>
            )}

            {/* User menu */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Open user menu"
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-base)]"
              >
                <UserAvatar
                  name={session?.user?.name || ""}
                  avatarUrl={profile?.avatarUrl}
                  size={34}
                  className="ring-2 ring-white"
                />
                <div className="hidden text-left sm:block">
                  <p className="text-[13px] font-semibold leading-tight text-[var(--eh-text)]">
                    {session?.user?.name?.split(" ")[0] || "User"}
                  </p>
                  <p className="text-[11px] leading-tight text-[var(--eh-text-3)]">
                    {isSchool ? "School Admin" : "Teacher"}
                  </p>
                </div>
                <ChevronDown
                  size={13}
                  className={`hidden text-[var(--eh-text-4)] transition-transform duration-150 sm:block ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  aria-label="User menu"
                  className="eh-popover absolute right-0 z-30 mt-2 w-52 overflow-hidden"
                >
                  <div className="border-b border-[var(--eh-border)] px-4 py-3">
                    <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">{session?.user?.name}</p>
                    <p className="truncate text-[11px] text-[var(--eh-text-3)]">{session?.user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      role="menuitem"
                      href="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="eh-popover-item"
                    >
                      <User size={13} aria-hidden="true" />
                      Profile
                    </Link>
                    <button
                      role="menuitem"
                      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                      className="eh-popover-item danger"
                    >
                      <LogOut size={13} aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search + nav strip */}
        <div className="border-t border-[var(--eh-border)] px-4 py-2 lg:hidden">
          <div className="mb-2 md:hidden">
            <form
              onSubmit={(e) => { e.preventDefault(); submitSearch(); }}
              className="flex items-center gap-2 rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-2"
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
                    "whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
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

      <div className="flex">
        {/* ── Left sidebar ── */}
        <aside className="hidden w-[200px] shrink-0 lg:flex lg:flex-col lg:sticky lg:top-[60px] lg:h-[calc(100vh-60px)] lg:overflow-y-auto border-r border-[var(--eh-border)] bg-white px-2 py-4">

          {/* Main nav */}
          {!isSchool && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--eh-text-4)]">
              Main
            </p>
          )}
          <nav className="flex flex-col gap-0.5">
            {mainLinks.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                active={isActiveLink(link.href)}
              />
            ))}
          </nav>

          {/* Divider */}
          <div className="my-2 h-px bg-[var(--eh-border)]" />

          {/* Secondary nav */}
          {!isSchool && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--eh-text-4)]">
              Profile & Account
            </p>
          )}
          <nav className="flex flex-col gap-0.5">
            {secondaryLinks.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                active={isActiveLink(link.href)}
              />
            ))}
          </nav>

          {/* Account nav */}
          {accountLinks.length > 0 && (
            <>
              <div className="my-2 h-px bg-[var(--eh-border)]" />
              <nav className="flex flex-col gap-0.5">
                {accountLinks.map((link) => (
                  <SidebarLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    icon={link.icon}
                    active={isActiveLink(link.href)}
                  />
                ))}
              </nav>
            </>
          )}

          {/* Footer upgrade card */}
          <div className="mt-auto pt-3">
            {isSchool ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-amber-500 text-[14px]">★</span>
                  <p className="text-[12px] font-bold text-amber-800">Grow Faster</p>
                </div>
                <p className="text-[11px] leading-[1.5] text-amber-700">
                  Upgrade to unlock premium features and priority support.
                </p>
                <Link
                  href="/dashboard/billing"
                  className="mt-2.5 inline-flex w-full items-center justify-center rounded-lg bg-[var(--eh-primary-600)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--eh-primary-700)]"
                >
                  Upgrade Plan
                </Link>
              </div>
            ) : teacherCompletion < 100 && !teacherReadiness.ready ? (
              <div className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-3">
                <p className="text-[12px] font-semibold text-[var(--eh-text)]">{teacherCompletion}% profile complete</p>
                <p className="mt-1 text-[11px] text-[var(--eh-text-3)]">
                  {teacherReadiness.resumeRequired ? "Upload your resume to apply" : "Reach 80% to start applying"}
                </p>
                <Link
                  href="/dashboard/profile"
                  className="mt-2.5 inline-flex w-full items-center justify-center rounded-lg bg-[var(--eh-primary-600)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--eh-primary-700)]"
                >
                  Complete Profile
                </Link>
              </div>
            ) : null}
          </div>
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
