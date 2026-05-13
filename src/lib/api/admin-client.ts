import { apiRequest, apiRequestWithMeta } from "@/lib/api/client";

export type AdminSchool = {
  id: string;
  schoolName: string;
  city: string;
  board: string;
  verified: boolean;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verificationSubmittedAt?: string | null;
  verificationTimestamp?: string | null;
  verificationNotes?: string | null;
  verificationRejectionReason?: string | null;
  user: {
    id: string;
    email: string;
    createdAt: string;
    isSuspended: boolean;
    suspendedAt?: string | null;
    suspendedUntil?: string | null;
    suspensionReason?: string | null;
  };
  _count: { jobPostings: number };
};

export type AdminJob = {
  id: string;
  title: string;
  status: string;
  postedAt: string;
  subject: string;
  isHidden: boolean;
  moderationNotes?: string | null;
  school: { schoolName: string; city: string; verified: boolean };
  _count: { applications: number };
};

export type AdminTeacher = {
  id: string;
  userId: string;
  qualification?: string | null;
  city?: string | null;
  subjects: string[];
  demoVideoUrl?: string | null;
  lessonPlanUrl?: string | null;
  pocsoAcknowledged: boolean;
  referenceCheckDone: boolean;
  codeOfConductSigned: boolean;
  safetyBadgeGranted: boolean;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verificationSubmittedAt?: string | null;
  verificationTimestamp?: string | null;
  verificationNotes?: string | null;
  verificationRejectionReason?: string | null;
  user: {
    name: string;
    email: string;
    createdAt: string;
    isSuspended: boolean;
    suspendedAt?: string | null;
    suspendedUntil?: string | null;
    suspensionReason?: string | null;
  };
  _count: { experiences: number; certifications: number };
};

export type AdminListMeta = {
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function getAdminSchools(params: URLSearchParams) {
  return apiRequestWithMeta<AdminSchool[], string, AdminListMeta>(
    `/api/admin/schools?${params}`,
    undefined,
    "Failed to load schools"
  );
}

export function updateSchoolVerification(
  schoolId: string,
  action: "approve" | "verify" | "unverify" | "reject" | "mark-pending" | "suspend" | "unsuspend",
  extras?: { notes?: string; reason?: string; suspendedUntil?: string | null }
) {
  return apiRequest<AdminSchool>(
    "/api/admin/schools",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId, action, ...extras }),
    },
    "School verification action failed"
  );
}

export function getAdminJobs(params: URLSearchParams) {
  return apiRequestWithMeta<AdminJob[], string, AdminListMeta>(
    `/api/admin/jobs?${params}`,
    undefined,
    "Failed to load jobs"
  );
}

export function adminJobAction(jobId: string, action: "close" | "activate" | "delete" | "hide" | "show", notes?: string) {
  return apiRequest<AdminJob>(
    "/api/admin/jobs",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, action, notes }),
    },
    "Job action failed"
  );
}

export function getAdminTeachers(params: URLSearchParams) {
  return apiRequestWithMeta<AdminTeacher[], string, AdminListMeta>(
    `/api/admin/teachers?${params}`,
    undefined,
    "Failed to load teachers"
  );
}

export function updateTeacherVerification(
  teacherUserId: string,
  action: "approve" | "reject" | "mark-pending" | "revoke-badge" | "suspend" | "unsuspend",
  extras?: { notes?: string; reason?: string; suspendedUntil?: string | null; grantSafetyBadge?: boolean }
) {
  return apiRequest<AdminTeacher>(
    "/api/admin/teachers",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherUserId, action, ...extras }),
    },
    "Teacher verification action failed"
  );
}
