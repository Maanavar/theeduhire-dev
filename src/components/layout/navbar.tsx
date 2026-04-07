"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Plus, LogOut, User, LayoutDashboard, ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Browse Jobs" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isTeacher = session?.user?.role === "TEACHER";
  const isSchool  = session?.user?.role === "SCHOOL_ADMIN";
  const isAuthed  = status === "authenticated" && !!session?.user;
  const isOnDashboard = pathname.startsWith("/dashboard");
  const dashboardHref = isSchool ? "/dashboard/my-jobs" : "/dashboard/applications";
  const showPostCta = isSchool || !isAuthed;

  const initials = session?.user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <nav
        className={`sticky top-0 z-50 h-[58px] px-5 transition-all duration-200 ${
          scrolled
            ? "bg-glass-nav border-b border-black/[0.06] shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-full">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-brand-gradient rounded-lg flex items-center justify-center shadow-brand">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5C4 1.5 2 3.5 2 6.5c0 2 1 3.5 2.5 4.5L7 12.5l2.5-1.5C11 9.5 12 8 12 6c0-3-2-4.5-5-4.5z" fill="white" fillOpacity=".9"/>
              </svg>
            </div>
            <span className="font-display text-[19px] font-bold text-gray-900 tracking-[-0.02em] group-hover:text-brand-600 transition-colors duration-150">
              EduHire
            </span>
            <span className="text-[10px] font-semibold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full tracking-wide border border-brand-100">
              TN
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-[120ms] ${
                    isActive
                      ? "text-brand-600 bg-brand-50"
                      : "text-gray-500 hover:text-gray-900 hover:bg-black/[0.04]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-2">
            {status === "loading" && (
              <div className="w-24 h-8 skeleton rounded-lg" />
            )}

            {!isAuthed && status !== "loading" && (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-black/[0.04] transition-all duration-[120ms]"
                  >
                    Sign In
                    <ChevronDown
                      size={13}
                      className={`text-gray-400 transition-transform duration-[120ms] ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-black/[0.06] py-1.5 z-50 animate-scale-in">
                      <Link
                        href="/auth/signin-teacher"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl mx-1.5"
                      >
                        <span className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-base">👨‍🏫</span>
                        <div>
                          <div className="font-medium leading-none mb-0.5">Teacher</div>
                          <div className="text-xs text-gray-400">Apply for jobs</div>
                        </div>
                      </Link>
                      <Link
                        href="/auth/signin-school"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl mx-1.5"
                      >
                        <span className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center text-base">🏫</span>
                        <div>
                          <div className="font-medium leading-none mb-0.5">School Admin</div>
                          <div className="text-xs text-gray-400">Post & manage jobs</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/auth/signup?role=school"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-[120ms] shadow-brand hover:shadow-brand-lg hover:-translate-y-px active:translate-y-0"
                >
                  <Plus size={14} />
                  Post a Job
                </Link>
              </>
            )}

            {isAuthed && (
              <div className="flex items-center gap-2">
                {isSchool && (
                  <Link
                    href="/dashboard/post-job"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-[120ms] shadow-brand hover:-translate-y-px active:translate-y-0"
                  >
                    <Plus size={14} />
                    Post a Job
                  </Link>
                )}

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/[0.04] transition-all duration-[120ms] group"
                  >
                    <div className="w-7 h-7 bg-brand-gradient rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {initials}
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[96px] truncate hidden lg:block">
                      {session.user.name}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`text-gray-400 transition-transform duration-[120ms] ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-black/[0.06] py-1.5 z-50 animate-scale-in">
                      <div className="px-4 py-3 border-b border-gray-100/80 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{session.user.email}</p>
                        <span className="inline-block mt-1.5 text-[10px] font-semibold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                          {isTeacher ? "Teacher" : isSchool ? "School Admin" : "Admin"}
                        </span>
                      </div>

                      <Link href={dashboardHref} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded-xl mx-1.5">
                        <LayoutDashboard size={14} className="text-gray-400" /> Dashboard
                      </Link>
                      <Link href="/dashboard/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded-xl mx-1.5">
                        <User size={14} className="text-gray-400" /> My Profile
                      </Link>
                      {session.user.role === "ADMIN" && (
                        <Link href="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-xl mx-1.5">
                          <LayoutDashboard size={14} /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-gray-100/80 mt-1 pt-1">
                        <button
                          onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-xl mx-1.5 text-left"
                          style={{ width: "calc(100% - 12px)" }}
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-black/[0.05] transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[300px] bg-white flex flex-col shadow-2xl animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-[58px] border-b border-gray-100">
              <span className="font-display text-[17px] font-bold text-gray-900">Menu</span>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {isAuthed && (
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-gray-50 rounded-2xl">
                  <div className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{session?.user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session?.user.email}</p>
                  </div>
                </div>
              )}

              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                      isActive ? "text-brand-600 bg-brand-50" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}>
                    {link.label}
                  </Link>
                );
              })}

              {isAuthed && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <Link href={dashboardHref} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-gray-600 hover:bg-gray-50">
                    <LayoutDashboard size={16} className="text-gray-400" />
                    {isSchool ? "My Listings" : "My Applications"}
                  </Link>
                  {isSchool && (
                    <Link href="/dashboard/post-job" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-gray-600 hover:bg-gray-50">
                      <Plus size={16} className="text-gray-400" />
                      Post a Job
                    </Link>
                  )}
                  <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-gray-600 hover:bg-gray-50">
                    <User size={16} className="text-gray-400" />
                    {isSchool ? "School Profile" : "My Profile"}
                  </Link>
                </>
              )}

              {!isAuthed && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <p className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Sign in as</p>
                  <Link href="/auth/signin-teacher" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-gray-600 hover:bg-gray-50">
                    <span className="text-lg">👨‍🏫</span> Teacher
                  </Link>
                  <Link href="/auth/signin-school" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-gray-600 hover:bg-gray-50">
                    <span className="text-lg">🏫</span> School Admin
                  </Link>
                </>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              {showPostCta && (
                <Link
                  href={isSchool ? "/dashboard/post-job" : "/auth/signup?role=school"}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-[15px] font-semibold bg-brand-500 text-white shadow-brand"
                >
                  <Plus size={16} /> Post a Job
                </Link>
              )}
              {isAuthed && (
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-[15px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
