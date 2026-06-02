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
      <main className="lg:pl-[220px]">
        <div className="min-h-screen px-5 py-6 md:px-8">
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
