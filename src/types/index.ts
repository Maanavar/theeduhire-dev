// Shared TypeScript types
// Extends Prisma-generated types with frontend-specific shapes

import type {
  User,
  JobPosting,
  Application,
  SchoolProfile,
  TeacherProfile,
  JobRequirement,
  JobBenefit,
  ApplicationStatusHistory,
  ApplicationStatus,
} from "@prisma/client";

// Job with all relations loaded (for detail view)
export type JobWithDetails = JobPosting & {
  school: SchoolProfile;
  requirements: JobRequirement[];
  benefits: JobBenefit[];
  _count?: { applications: number };
};

// Job list item (lighter, for split-pane list)
export type JobListItem = Pick<
  JobPosting,
  "id" | "title" | "subject" | "board" | "gradeLevel" | "jobType" |
  "salaryMin" | "salaryMax" | "postedAt" | "status" | "experience"
> & {
  school: Pick<SchoolProfile, "schoolName" | "city" | "verified" | "logoUrl">;
};

// Application with related data
export type ApplicationWithJob = Application & {
  job: JobPosting & { school: Pick<SchoolProfile, "schoolName" | "city"> };
};

export type ApplicationWithTeacher = Application & {
  applicant: User & { teacherProfile: TeacherProfile | null };
};

// API response wrapper
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Status history with changedByUser details
export type StatusHistoryEntry = ApplicationStatusHistory & {
  changedByUser: Pick<User, "name">;
};

// Application with full history (Phase 3)
export type ApplicationWithHistory = ApplicationWithJob & {
  statusHistory: StatusHistoryEntry[];
};

// School analytics data (Phase 3)
export type SchoolAnalytics = {
  summary: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    shortlisted: number;
    hired: number;
    avgTimeToHireDays: number | null;
  };
  trend: Array<{
    date: string; // "2026-03-10"
    applications: number;
  }>;
  jobPerformance: Array<{
    jobId: string;
    title: string;
    applicationCount: number;
    shortlistedCount: number;
    hiredCount: number;
  }>;
  recentActivity: Array<{
    applicantName: string;
    jobTitle: string;
    toStatus: ApplicationStatus;
    changedAt: string;
  }>;
};
