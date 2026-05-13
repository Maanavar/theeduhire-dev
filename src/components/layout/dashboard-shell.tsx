"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import type { ComponentType, ReactNode } from "react";
import {
  BellRing,
  BookMarked,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
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
import { calculateProfileCompletion, getTeacherApplyReadiness } from "@/lib/profileCompletion";
import { getBoardLabel } from "@/lib/utils";
import {
  DashboardProfileProvider,
  type DashboardProfileData,
} from "@/components/layout/dashboard-profile-context";

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
        "mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-medium transition-colors",
        active
          ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)] ring-1 ring-[var(--eh-primary-100)]"
          : "text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]",
      ].join(" ")}
    >
      <Icon size={15} className={active ? "text-[var(--eh-primary-600)]" : "text-[var(--eh-text-4)]"} />
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
      title={label}
      className={[
        "group relative flex h-[60px] w-[56px] items-center justify-center border-b-2 transition-colors",
        active
          ? "border-[var(--eh-primary-600)] text-[var(--eh-text)]"
          : "border-transparent text-[var(--eh-text-3)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]",
      ].join(" ")}
    >
      <Icon size={18} className={active ? "text-eh-primary" : "text-[var(--eh-text-3)]"} />
      <span className="sr-only">{label}</span>
      <span
        className={[
          "pointer-events-none absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--eh-border)] bg-white px-2 py-1 text-[11px] font-medium text-[var(--eh-text)] opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
          active ? "text-eh-primary" : "",
        ].join(" ")}
      >
        {label}
      </span>
    </Link>
  );
}

function availabilityLabel(status?: string | null) {
  if (status === "ACTIVELY_LOOKING") return "Actively looking";
  if (status === "OPEN_TO_OFFERS") return "Open to offers";
  return "Profile in progress";
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

  useEffect(() => {
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
  }, [pathname]);

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

  const initials =
    (session?.user?.name || (isSchool ? "School Admin" : "Teacher"))
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || (isSchool ? "SA" : "TR");

  const teacherCompletion = calculateProfileCompletion(profile || {}).percentage;
  const teacherReadiness = getTeacherApplyReadiness(profile || {});

  const shellSummary = isSchool
    ? {
        href: "/dashboard/profile",
        title: profile?.schoolName || "School Profile",
        subtitle: [profile?.board ? getBoardLabel(profile.board) : null, profile?.city || null].filter(Boolean).join(" | ") || "Complete your school setup",
        icon: Building2,
      }
    : {
        href: "/dashboard/profile",
        title: session?.user?.name || "Teacher",
        subtitle:
          profile?.subjects?.slice(0, 2).join(" / ") ||
          profile?.qualification ||
          "Teaching profile",
        icon: GraduationCap,
      };

  const footerPanel = isSchool
    ? {
        title: "School workspace",
        body: "Keep profile details and verification current so applicants trust every listing.",
        metricLabel: "Setup status",
        metricValue: [profile?.schoolName, profile?.city, profile?.board].filter(Boolean).length >= 3 ? "Ready" : "In progress",
        actionLabel: "Update school profile",
      }
    : {
        title: `Profile ${teacherCompletion}% complete`,
        body: profile?.city || profile?.currentSchool || availabilityLabel(profile?.availabilityStatus),
        metricLabel: "Next best move",
        metricValue: teacherReadiness.ready
          ? "Ready to apply"
          : teacherReadiness.resumeRequired
            ? "Upload resume"
            : "Reach 80% completion",
        actionLabel: "Complete profile",
      };

  const searchConfig = isSchool
    ? {
        href: "/dashboard/applicants",
        placeholder: "Search applicants, locations, or subjects",
        param: "search",
      }
    : {
        href: "/dashboard/jobs",
        placeholder: "Search jobs, schools, or subjects",
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
    router.push(params.toString() ? `${searchConfig.href}?${params.toString()}` : searchConfig.href);
  };

  const SummaryIcon = shellSummary.icon;

  return (
    <div className="app-linkedin min-h-screen bg-[var(--surface-base)]">
      <header className="sticky top-0 z-20 w-full border-b border-[var(--eh-border)] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] w-full max-w-[1360px] items-center gap-3 px-4 md:px-6">
          <Link href={homeHref} aria-label="Dashboard home" className="mr-3 shrink-0">
            <div className="eh-logo-mark h-[28px] w-[28px] rounded-[8px]" />
          </Link>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
            className="hidden min-w-[240px] max-w-[380px] flex-1 items-center gap-2 rounded-full border border-[var(--eh-border)] bg-white px-3 py-2 transition-colors focus-within:border-[var(--eh-primary-300)] focus-within:bg-white focus-within:shadow-[0_0_0_4px_var(--eh-primary-100)] hover:border-[var(--eh-border-strong)] md:flex"
          >
            <Search size={14} className="shrink-0 text-[var(--eh-text-4)]" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={searchConfig.placeholder}
              className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[var(--eh-text)] outline-none placeholder:text-[var(--eh-text-4)]"
            />
            <button
              type="submit"
              aria-label="Search"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)] transition-colors hover:bg-[var(--eh-primary-100)]"
            >
              <Search size={13} />
            </button>
          </form>

          <nav className="hidden flex-1 items-stretch justify-center xl:flex">
            {topLinks.map((link) => (
              <TopNavLink key={link.href} href={link.href} label={link.label} icon={link.icon} active={isActiveLink(link.href)} />
            ))}
          </nav>
          <div className="flex-1 xl:hidden" />

          <div className="flex items-center gap-1 md:gap-2">
            {featureFlags.notificationsCenter ? <NotificationBell /> : null}
            {featureFlags.messaging ? (
              <Link href="/dashboard/messages" aria-label="Open messages" className="rounded-full p-2 text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)]">
                <MessageSquare size={18} />
              </Link>
            ) : null}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-[var(--surface-base)]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--eh-primary-600)] text-[11px] font-semibold text-white">
                  {initials}
                </span>
                <ChevronDown size={12} className={`text-[var(--eh-text-4)] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {userMenuOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-[var(--eh-border)] bg-white p-1.5 shadow-lg">
                  <div className="mb-1 border-b border-[var(--eh-border)] px-3 py-2.5">
                    <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">{session?.user?.name}</p>
                    <p className="truncate text-[11px] text-[var(--eh-text-3)]">{session?.user?.email}</p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"
                  >
                    <User size={13} /> Profile
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--eh-border)] px-4 py-2.5 lg:hidden">
          <div className="mb-2.5 md:hidden">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
              className="flex w-full items-center gap-2 rounded-full border border-[var(--eh-border)] bg-white px-4 py-2"
            >
              <Search size={14} className="text-[var(--eh-text-4)]" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={searchConfig.placeholder}
                className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[var(--eh-text)] outline-none placeholder:text-[var(--eh-text-4)]"
              />
              <button type="submit" aria-label="Search" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]">
                <Search size={13} />
              </button>
            </form>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mobileLinks.map((link) => {
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold",
                    active ? "border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]" : "border-[var(--eh-border)] bg-white text-[var(--eh-text-2)]",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1360px] lg:flex">
        <aside className="hidden w-[240px] shrink-0 border-r border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-5 lg:sticky lg:top-[60px] lg:flex lg:h-[calc(100vh-60px)] lg:flex-col lg:overflow-y-auto">
          <Link
            href={shellSummary.href}
            className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--eh-border)] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[var(--eh-border-strong)] hover:bg-[var(--surface-base)]"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]">
              <SummaryIcon size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-[var(--eh-text)]">{shellSummary.title}</span>
              <span className="block truncate text-[11px] text-[var(--eh-text-3)]">{shellSummary.subtitle}</span>
            </span>
          </Link>

          <nav>
            {mainLinks.map((link) => (
              <SidebarLink key={link.href} href={link.href} label={link.label} icon={link.icon} active={isActiveLink(link.href)} />
            ))}
          </nav>

          <div className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--eh-text-4)]">
            {isSchool ? "Operations" : "Career kit"}
          </div>
          <nav className="mt-1">
            {secondaryLinks.map((link) => (
              <SidebarLink key={link.href} href={link.href} label={link.label} icon={link.icon} active={isActiveLink(link.href)} />
            ))}
          </nav>

          {accountLinks.length > 0 ? (
            <>
              <div className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--eh-text-4)]">Account</div>
              <nav className="mt-1">
                {accountLinks.map((link) => (
                  <SidebarLink key={link.href} href={link.href} label={link.label} icon={link.icon} active={isActiveLink(link.href)} />
                ))}
              </nav>
            </>
          ) : null}

          <div className="mt-auto rounded-2xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] p-4">
            <p className="text-[12px] font-semibold text-[var(--eh-primary-700)]">{footerPanel.title}</p>
            <p className="mt-1 text-[12px] text-[var(--eh-primary-600)]">{footerPanel.body}</p>
            <div className="mt-3 rounded-xl border border-white/80 bg-white/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--eh-primary-600)]">{footerPanel.metricLabel}</p>
              <p className="mt-1 text-[12px] font-medium text-[var(--eh-primary-700)]">{footerPanel.metricValue}</p>
            </div>
            <Link href="/dashboard/profile" className="mt-3 inline-flex items-center text-[12px] font-semibold text-eh-primary">
              {footerPanel.actionLabel}
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <DashboardProfileProvider value={profile}>
            {children}
          </DashboardProfileProvider>
        </main>
      </div>
    </div>
  );
}
