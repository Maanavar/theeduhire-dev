"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileText, Bookmark, User, PlusCircle, List, Users, Bell, File } from "lucide-react";

const TEACHER_LINKS = [
  { href: "/dashboard/applications", label: "My Applications", icon: FileText },
  { href: "/dashboard/saved",        label: "Saved Jobs",       icon: Bookmark },
  { href: "/dashboard/resumes",      label: "Resumes",          icon: File },
  { href: "/dashboard/alerts",       label: "Job Alerts",       icon: Bell },
  { href: "/dashboard/profile",      label: "My Profile",       icon: User },
];

const SCHOOL_LINKS = [
  { href: "/dashboard/post-job",  label: "Post a Job",    icon: PlusCircle },
  { href: "/dashboard/my-jobs",   label: "My Listings",   icon: List },
  { href: "/dashboard/profile",   label: "School Profile", icon: User },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isSchool = session?.user?.role === "SCHOOL_ADMIN";
  const links = isSchool ? SCHOOL_LINKS : TEACHER_LINKS;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-black/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-gradient rounded-lg flex items-center justify-center flex-shrink-0">
            {isSchool
              ? <span className="text-xs">🏫</span>
              : <span className="text-xs">👨‍🏫</span>
            }
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
              Dashboard
            </p>
            <p className="text-xs font-medium text-gray-600 mt-0.5">
              {isSchool ? "School Admin" : "Teacher"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="p-2.5">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-[120ms] mb-0.5 ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-black/[0.04] hover:text-gray-900"
              }`}
            >
              <Icon
                size={15}
                className={isActive ? "text-brand-500" : "text-gray-400"}
              />
              {link.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
