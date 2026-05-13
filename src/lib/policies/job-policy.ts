import type { UserRole } from "@prisma/client";

export interface PolicyUser {
  id: string;
  role: UserRole;
}

export interface JobResource {
  postedBy: string;
  schoolId: string;
}

export function canManageJob(user: PolicyUser, job: JobResource, schoolProfileId?: string | null): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role !== "SCHOOL_ADMIN") return false;
  if (job.postedBy === user.id) return true;
  return Boolean(schoolProfileId && schoolProfileId === job.schoolId);
}
