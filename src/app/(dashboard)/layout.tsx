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
      <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-gray-50/50 to-white">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8">
          <div className="flex gap-8 py-6 lg:py-8">
            {/* Sidebar - Hidden on mobile, fixed width on desktop */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-24">
                <DashboardSidebar />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <div className="max-w-[1000px] space-y-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
