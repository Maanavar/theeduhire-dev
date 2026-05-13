import { apiRequest } from "@/lib/api/client";

export type TeacherDashboardSummary = {
  role: "TEACHER";
  summary: {
    totalApplications: number;
    shortlistedApplications: number;
    hiredApplications: number;
    savedJobs: number;
  };
};

export type SchoolDashboardSummary = {
  role: "SCHOOL_ADMIN";
  summary: {
    totalJobs: number;
    activeJobs: number;
    totalApplicants: number;
    newApplicants: number;
  };
};

export type AdminDashboardSummary = {
  role: "ADMIN";
  summary: {
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
  };
};

export type DashboardSummary =
  | TeacherDashboardSummary
  | SchoolDashboardSummary
  | AdminDashboardSummary;

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>(
    "/api/dashboard/summary",
    undefined,
    "Failed to load dashboard summary"
  );
}
