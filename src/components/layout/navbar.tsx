"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu, X, Plus, LogOut, User, LayoutDashboard, ChevronDown,
} from "lucide-react";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isTeacher = session?.user?.role === "TEACHER";
  const isSchool = session?.user?.role === "SCHOOL_ADMIN";
  const isAuthed = status === "authenticated" && !!session?.user;
  const isOnDashboard = pathname.startsWith("/dashboard");

  const dashboardHref = isSchool ? "/dashboard/my-jobs" : "/dashboard/applications";

  // "Post a Job" is shown when: school admin (always), or not logged in (to funnel to signup)
  // NEVER shown to logged-in teachers — they can't post jobs
  const showPostCta = isSchool || !isAuthed;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-gray-50/85 backdrop-blur-xl border-b border-gray-200/60 h-[60px] px-5">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="font-display text-[22px] font-bold text-brand-600 group-hover:opacity-80 transition-opacity">
              EduHire
            </span>
            <span className="font-body text-[10px] font-semibold bg-accent-50 text-accent-500 px-2 py-0.5 rounded-full tracking-wide">
              TN
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-[13.5px] font-medium transition-all ${
                    isActive
                      ? "text-brand-500 bg-brand-50"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Auth area */}
            {status === "loading" && (
              <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse ml-2" />
            )}

            {!isAuthed && status !== "loading" && (
              <>
                {/* Sign In dropdown */}
                <div className="relative ml-1">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="px-3.5 py-2 rounded-lg text-[13.5px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center gap-1"
                  >
                    Sign In
                    <ChevronDown size={12} className="text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-fade-up">
                      <Link
                        href="/auth/signin-teacher"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-lg">👨‍🏫</span> Teacher Sign In
                      </Link>
                      <Link
                        href="/auth/signin-school"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-lg">🏫</span> School Admin Sign In
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  href="/auth/signup?role=school"
                  className="ml-1 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13.5px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                >
                  <Plus size={14} />
                  Post a Job
                </Link>
              </>
            )}

            {isAuthed && (
              <>
                {isSchool && (
                  <Link
                    href="/dashboard/post-job"
                    className="ml-1 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13.5px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                  >
                    <Plus size={14} />
                    Post a Job
                  </Link>
                )}

                {/* User dropdown */}
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-7 h-7 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 text-[11px] font-bold">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-[13px] font-medium text-gray-700 max-w-[100px] truncate hidden lg:block">
                      {session.user.name}
                    </span>
                    <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full hidden md:block">
                      {isTeacher ? "Teacher" : isSchool ? "School" : "Admin"}
                    </span>
                    <ChevronDown size={13} className="text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-fade-up">
                      <div className="px-3.5 py-2 border-b border-gray-100">
                        <p className="text-[13px] font-medium text-gray-900 truncate">{session.user.name}</p>
                        <p className="text-[11.5px] text-gray-400 truncate">{session.user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                          {isTeacher ? "👨‍🏫 Teacher" : isSchool ? "🏫 School Admin" : "⚙️ Admin"}
                        </span>
                      </div>

                      <Link href={dashboardHref} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
                        <LayoutDashboard size={14} /> Dashboard
                      </Link>

                      <Link href="/dashboard/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
                        <User size={14} /> My Profile
                      </Link>

                      {session.user.role === "ADMIN" && (
                        <Link href="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                          <LayoutDashboard size={14} /> Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMenuOpen(true)}>
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-[280px] bg-white p-5 flex flex-col gap-1.5 shadow-xl animate-[slideInR_0.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="self-end p-2 text-gray-400 hover:text-gray-600" onClick={() => setMenuOpen(false)}>
              <X size={20} />
            </button>

            {isAuthed && (
              <div className="px-4 py-3 mb-2 bg-gray-50 rounded-xl">
                <p className="text-[14px] font-medium truncate">{session?.user.name}</p>
                <p className="text-[12px] text-gray-400 truncate">{session?.user.email}</p>
              </div>
            )}

            {NAV_LINKS.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                    isActive ? "text-brand-500 bg-brand-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}>
                  {link.label}
                </Link>
              );
            })}

            {isAuthed && (
              <>
                {isOnDashboard ? (
                  // Dashboard-specific navigation
                  <>
                    <Link href={dashboardHref} onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-gray-50">
                      {isSchool ? "My Listings" : "My Applications"}
                    </Link>
                    <Link href="/dashboard/saved" onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-gray-50">
                      Saved Jobs
                    </Link>
                    {isSchool && (
                      <Link href="/dashboard/post-job" onClick={() => setMenuOpen(false)}
                        className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-gray-50">
                        Post a Job
                      </Link>
                    )}
                    <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-gray-50">
                      {isSchool ? "School Profile" : "My Profile"}
                    </Link>
                  </>
                ) : (
                  // Regular navigation
                  <>
                    <Link href={dashboardHref} onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-gray-50">
                      Dashboard
                    </Link>
                    <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-gray-50">
                      My Profile
                    </Link>
                  </>
                )}
              </>
            )}

            {!isAuthed && (
              <>
                <div className="px-4 py-2 text-[13px] font-semibold text-gray-400 uppercase tracking-wide">
                  Sign In As
                </div>
                <Link href="/auth/signin-teacher" onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-gray-50 flex items-center gap-3">
                  <span className="text-lg">👨‍🏫</span> Teacher
                </Link>
                <Link href="/auth/signin-school" onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-gray-50 flex items-center gap-3">
                  <span className="text-lg">🏫</span> School Admin
                </Link>
                <div className="border-t border-gray-100 my-2"></div>
                <Link href="/auth/signup?role=school" onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors flex items-center gap-3">
                  <Plus size={16} />
                  Post a Job
                </Link>
              </>
            )}

            {/* Post a Job: only for school admin or unauthenticated users */}
            {showPostCta && (
              <Link
                href={isSchool ? "/dashboard/post-job" : "/auth/signup?role=school"}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-xl text-[15px] font-semibold bg-brand-500 text-white"
              >
                <Plus size={16} /> Post a Job
              </Link>
            )}

            {isAuthed && (
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-red-500 hover:bg-red-50 mt-2">
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInR {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
