"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FileText, Bookmark, User, PlusCircle, List, Users,
} from "lucide-react";

const TEACHER_LINKS = [
  { href: "/dashboard/applications", label: "My Applications", icon: FileText },
  { href: "/dashboard/saved", label: "Saved Jobs", icon: Bookmark },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
];

const SCHOOL_LINKS = [
  { href: "/dashboard/post-job", label: "Post a Job", icon: PlusCircle },
  { href: "/dashboard/my-jobs", label: "My Listings", icon: List },
  { href: "/dashboard/profile", label: "School Profile", icon: User },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isSchool = session?.user?.role === "SCHOOL_ADMIN";
  const links = isSchool ? SCHOOL_LINKS : TEACHER_LINKS;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
      <div className="p-6">
        <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {isSchool ? "School Dashboard" : "Teacher Dashboard"}
        </h2>

        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all ${
                  isActive
                    ? "bg-brand-50 text-brand-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
