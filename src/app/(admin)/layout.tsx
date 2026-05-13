import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <div className="app-linkedin min-h-screen bg-[var(--surface-base)] font-body">
      <AdminSidebar />
      <main className="lg:pl-[260px]">
        <div className="min-h-screen">
          <div className="border-b border-[var(--eh-border)] bg-[var(--surface-overlay)] px-5 py-4 backdrop-blur md:px-8">
            <div className="mx-auto flex max-w-[1180px] items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-3)]">Admin workspace</p>
                <p className="mt-1 text-[13px] text-[var(--eh-text-2)]">Moderation, verification, and platform operations.</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-6 md:px-8">
            <div className="mx-auto max-w-[1180px] transition-opacity duration-200">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
