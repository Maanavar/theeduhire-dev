import Navbar from "@/components/layout/navbar";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-58px)]" style={{ background: "var(--surface-base)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-7 py-6 lg:py-8">
            {/* Sidebar */}
            <aside className="hidden lg:block w-[260px] shrink-0">
              <div className="sticky top-[74px]">
                <DashboardSidebar />
              </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0">
              <div className="max-w-[960px] space-y-5">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
