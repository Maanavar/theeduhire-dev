import type { UserRole } from "@prisma/client";

export interface PolicyUser {
  id: string;
  role: UserRole;
}

export interface JobResource {
  postedBy: string;
  schoolId: string;
}

export interface JobVisibilityResource {
  isHidden: boolean;
  school: {
    isOfflineManaged: boolean;
    user: {
      isSuspended: boolean;
    };
  };
}

export function canManageJob(user: PolicyUser, job: JobResource, schoolProfileId?: string | null): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role !== "SCHOOL_ADMIN") return false;
  if (job.postedBy === user.id) return true;
  return Boolean(schoolProfileId && schoolProfileId === job.schoolId);
}

export function canBypassJobModeration(user?: Pick<PolicyUser, "role"> | null): boolean {
  return user?.role === "ADMIN" || user?.role === "SCHOOL_ADMIN";
}

export function canViewJobWithModeration(
  job: JobVisibilityResource,
  user?: Pick<PolicyUser, "role"> | null
): boolean {
  const schoolSuspended = job.school.user.isSuspended && !job.school.isOfflineManaged;
  if (!job.isHidden && !schoolSuspended) return true;
  return canBypassJobModeration(user);
}
