"use client";

import type { ReactNode } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";

type TeacherDashboardShellProps = {
  children: ReactNode;
};

export default function TeacherDashboardShell({ children }: TeacherDashboardShellProps) {
  return <DashboardShell role="TEACHER">{children}</DashboardShell>;
}
