"use client";

import type { ReactNode } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";

type SchoolDashboardShellProps = {
  children: ReactNode;
};

export default function SchoolDashboardShell({ children }: SchoolDashboardShellProps) {
  return <DashboardShell role="SCHOOL_ADMIN">{children}</DashboardShell>;
}
