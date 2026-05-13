import DashboardShell from "@/components/layout/dashboard-shell";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <DashboardShell role={session?.user?.role === "SCHOOL_ADMIN" ? "SCHOOL_ADMIN" : "TEACHER"}>
      {children}
    </DashboardShell>
  );
}
