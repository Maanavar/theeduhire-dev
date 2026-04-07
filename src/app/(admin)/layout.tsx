import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Briefcase, Building2, BarChart3, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen flex bg-gray-50 font-body">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="font-display text-[18px] font-bold text-brand-600">EduHire</span>
          <span className="ml-2 text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {[
            { href: "/admin", label: "Overview", icon: BarChart3 },
            { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
            { href: "/admin/schools", label: "Schools", icon: Building2 },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
              <Icon size={15} />{label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <LogOut size={14} /> Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 max-w-[1100px]">{children}</main>
    </div>
  );
}
