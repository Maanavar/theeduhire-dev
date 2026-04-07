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
