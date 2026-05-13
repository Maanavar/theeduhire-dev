"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  User,
  Users,
  X,
} from "lucide-react";
import { useLang } from "@/lib/i18n/context";

const TEACHER_AUTH_LINKS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/applications", label: "Applications", icon: FileText },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

const SCHOOL_AUTH_LINKS = [
  { href: "/dashboard/school", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/my-jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/applicants", label: "Applicants", icon: Users },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { lang, t, toggleLang } = useLang();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const isAuthed = status === "authenticated" && !!session?.user;
  const isSchool = session?.user?.role === "SCHOOL_ADMIN";
  const dashboardHref = isSchool ? "/dashboard/school" : "/dashboard";
  const initials =
    session?.user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const isHomepage = pathname === "/";

  const translatedNavLinks = [
    { href: "/", label: t.nav.home },
    { href: "/#for-schools", label: t.nav.forSchools },
    { href: "/#for-teachers", label: t.nav.forTeachers },
    { href: "/#platform", label: t.nav.howItWorks },
    { href: "/#questions", label: t.nav.faq },
    { href: "/#contact", label: t.nav.contact },
  ];

  const publicLinks = translatedNavLinks.map((link) =>
    isSchool && link.href === "/jobs" ? { ...link, href: "/dashboard/school" } : link
  );
  const authLinks = isSchool ? SCHOOL_AUTH_LINKS : TEACHER_AUTH_LINKS;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        className={[
          "sticky top-0 z-50 border-b px-5 transition-all duration-300 md:px-8",
          isAuthed
            ? "h-[64px] border-[var(--eh-border)] bg-white/92 backdrop-blur-[20px]"
            : scrolled
              ? "h-[64px] border-[var(--eh-border)] bg-white/82 backdrop-blur-[22px]"
              : isHomepage
                ? "h-[64px] border-transparent bg-transparent"
                : "h-[64px] border-transparent bg-white/50 backdrop-blur-[10px]",
        ].join(" ")}
      >
        <div className={`mx-auto flex h-full items-center justify-between gap-4 ${isAuthed ? "max-w-[1120px]" : "max-w-[1320px]"}`}>
          <Link href={isAuthed ? dashboardHref : "/"} className="inline-flex shrink-0 items-center gap-2.5">
            <div className="eh-logo-mark h-[30px] w-[30px] rounded-[10px]" />
            {!isAuthed ? (
              <div>
                <span className="block font-display text-[21px] font-semibold leading-none tracking-[-0.03em] text-[var(--eh-text)]">EduHire</span>
                <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--eh-text-4)] sm:block">
                  Education hiring
                </span>
              </div>
            ) : null}
          </Link>

          {isAuthed ? (
            <div className="hidden items-center gap-1 lg:flex">
              {authLinks.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      "flex min-w-[88px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-[var(--surface-base)] text-[var(--eh-text)]"
                        : "text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]",
                    ].join(" ")}
                  >
                    <Icon size={15} className={active ? "text-[var(--color-brand-600)]" : "text-[var(--eh-text-4)]"} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="hidden items-center gap-1 md:flex">
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-2 text-[13.5px] font-medium text-[var(--eh-text-2)] transition-colors hover:bg-white/70 hover:text-[var(--eh-text)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={toggleLang}
              title={lang === "en" ? "Switch to Tamil" : "Switch to English"}
              className="rounded-full border border-[var(--eh-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--eh-text-3)] transition-colors hover:bg-white/70 hover:text-[var(--eh-text)]"
            >
              {lang === "en" ? "தமிழ்" : "EN"}
            </button>
            {!isAuthed && status !== "loading" ? (
              <>
                <Link
                  href="/auth/signin"
                  className="rounded-full px-3 py-2 text-[13.5px] font-medium text-[var(--eh-text-2)] transition-colors hover:bg-white/70 hover:text-[var(--eh-text)]"
                >
                  {t.nav.signIn}
                </Link>
                {isHomepage ? (
                  <>
                    <Link href="/jobs" className="eh-btn eh-btn-secondary px-[16px] py-[8px] text-[13px]">
                      {t.nav.exploreJobs}
                    </Link>
                    <Link href="/auth/signup" className="eh-btn eh-btn-primary px-[16px] py-[8px] text-[13px]">
                      {t.nav.startHiring} <ArrowUpRight size={14} />
                    </Link>
                  </>
                ) : (
                  <Link href="/auth/signup" className="eh-btn eh-btn-primary px-[16px] py-[8px] text-[13px]">
                    {t.nav.createAccount}
                  </Link>
                )}
              </>
            ) : null}

            {isAuthed ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors hover:bg-[var(--surface-base)]"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                    {initials}
                  </span>
                  <span className="hidden text-left lg:block">
                    <span className="block max-w-[120px] truncate text-[12px] font-semibold leading-none text-[var(--eh-text)]">
                      {session.user.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-none text-[var(--eh-text-4)]">
                      {isSchool ? "School admin" : "Teacher"}
                    </span>
                  </span>
                  <ChevronDown size={13} className={`text-[var(--eh-text-4)] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[var(--eh-border)] bg-white py-1.5 shadow-xl">
                    <div className="mb-1 border-b border-[var(--eh-border)] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-[var(--eh-text)]">{session.user.name}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--eh-text-4)]">{session.user.email}</p>
                    </div>
                    <Link href={dashboardHref} onClick={() => setUserMenuOpen(false)} className="mx-1.5 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">
                      <LayoutDashboard size={14} className="text-[var(--eh-text-4)]" /> {t.nav.dashboard}
                    </Link>
                    <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)} className="mx-1.5 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">
                      <User size={14} className="text-[var(--eh-text-4)]" /> {isSchool ? t.nav.schoolProfile : t.nav.myProfile}
                    </Link>
                    <div className="mt-1 border-t border-[var(--eh-border)] pt-1">
                      <button
                        onClick={toggleLang}
                        className="mx-1.5 flex w-[calc(100%-12px)] items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"
                      >
                        <span className="text-[12px] font-semibold">{lang === "en" ? "தமிழ்" : "EN"}</span>
                        {lang === "en" ? "Switch to Tamil" : "Switch to English"}
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="mx-1.5 flex w-[calc(100%-12px)] items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
                      >
                        <LogOut size={14} /> {t.nav.signOut}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--eh-text-2)] transition-colors hover:bg-white/70 md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="animate-slide-in-right absolute bottom-0 right-0 top-0 flex w-[320px] flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-[64px] items-center justify-between border-b border-[var(--eh-border)] px-5">
              <div>
                <span className="block font-display text-[18px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">
                  {isAuthed ? t.nav.workspace : "EduHire"}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--eh-text-4)]">
                  {isAuthed ? t.nav.navigation : t.nav.educationHiring}
                </span>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--eh-text-4)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--eh-text-2)]"
                onClick={() => setMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {!isAuthed ? (
              <div className="border-b border-[var(--eh-border)] bg-white/95 px-4 py-4 backdrop-blur">
                <div className="space-y-2">
                  <Link href="/auth/signup?role=school" onClick={() => setMenuOpen(false)} className="flex w-full items-center justify-center rounded-full bg-[var(--color-brand-600)] px-4 py-3 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(31,155,99,0.22)]">
                    Start hiring
                  </Link>
                  <Link href="/jobs" onClick={() => setMenuOpen(false)} className="flex w-full items-center justify-center rounded-full border border-[var(--eh-border)] px-4 py-3 text-[14px] font-semibold text-[var(--eh-text-2)]">
                    Explore jobs
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="flex-1 space-y-1 overflow-y-auto p-4">
              {(isAuthed ? authLinks : publicLinks).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center rounded-xl px-4 py-3 text-[15px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-[var(--eh-border)]" />
              {!isAuthed ? (
                <>
                  <Link href="/auth/signin" onClick={() => setMenuOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-[15px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">
                    {t.nav.signIn}
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-[15px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">
                    {t.nav.createAccount}
                  </Link>
                </>
              ) : (
                <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-[15px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">
                  {isSchool ? t.nav.schoolProfile : t.nav.myProfile}
                </Link>
              )}
              <button
                onClick={() => { toggleLang(); setMenuOpen(false); }}
                className="flex w-full items-center rounded-xl px-4 py-3 text-[15px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"
              >
                {lang === "en" ? "தமிழில் பார்க்கவும்" : "View in English"}
              </button>
            </div>

            <div className="space-y-2 border-t border-[var(--eh-border)] p-4">
              {!isAuthed ? (
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="flex w-full items-center justify-center rounded-xl border border-[var(--eh-border)] px-4 py-3 text-[15px] font-semibold text-[var(--eh-text)]">
                  Create account
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-[15px] font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
