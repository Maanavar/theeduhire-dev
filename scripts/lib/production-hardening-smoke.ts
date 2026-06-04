import { PrismaClient } from "@prisma/client";
import {
  requestJson,
  signInWithCredentials,
} from "./http-session";
import { ensureSmokeData } from "./smoke-data";

export type CheckResult = {
  name: string;
  passed: boolean;
  details: string;
};

const prisma = new PrismaClient();

export async function runProductionHardeningSmoke(baseUrl: string): Promise<CheckResult[]> {
  const smoke = await ensureSmokeData();
  const results: CheckResult[] = [];

  await prisma.teacherProfile.update({
    where: { userId: smoke.teacher.userId },
    data: {
      verificationStatus: "UNVERIFIED",
      verificationSubmittedAt: null,
      verificationTimestamp: null,
      verificationNotes: null,
      verificationRejectionReason: null,
      verifiedByAdminId: null,
      safetyBadgeGranted: false,
    },
  });

  await prisma.schoolProfile.update({
    where: { id: smoke.pendingSchool.schoolId },
    data: {
      verified: false,
      verificationStatus: "UNVERIFIED",
      verificationSubmittedAt: null,
      verificationTimestamp: null,
      verificationNotes: null,
      verificationRejectionReason: null,
      verifiedByAdminId: null,
    },
  });

  await prisma.user.updateMany({
    where: { id: { in: [smoke.teacher.userId, smoke.pendingSchool.userId] } },
    data: {
      isSuspended: false,
      suspendedAt: null,
      suspendedUntil: null,
      suspensionReason: null,
      suspendedByAdminId: null,
    },
  });

  await prisma.jobPosting.update({
    where: { id: smoke.school.jobId },
    data: {
      status: "ACTIVE",
      isHidden: false,
      hiddenAt: null,
      hiddenByAdminId: null,
      moderationNotes: null,
    },
  });

  const teacher = await signInWithCredentials({
    baseUrl,
    email: smoke.teacher.email,
    password: smoke.teacher.password,
    callbackPath: "/dashboard/profile",
  });
  const school = await signInWithCredentials({
    baseUrl,
    email: smoke.pendingSchool.email,
    password: smoke.pendingSchool.password,
    callbackPath: "/dashboard/profile",
  });
  const admin = await signInWithCredentials({
    baseUrl,
    email: smoke.admin.email,
    password: smoke.admin.password,
    callbackPath: "/admin",
  });

  const teacherVerifyRequest = await requestJson<{ success?: boolean; data?: { verificationStatus?: string } }>(
    `${baseUrl}/api/profile/verify`,
    { method: "POST" },
    teacher.cookies
  );
  results.push({
    name: "Teacher can request verification",
    passed: teacherVerifyRequest.response.ok && teacherVerifyRequest.data?.data?.verificationStatus === "PENDING",
    details: `status=${teacherVerifyRequest.response.status} verificationStatus=${teacherVerifyRequest.data?.data?.verificationStatus || "none"}`,
  });

  const approveTeacher = await requestJson<{ success?: boolean }>(
    `${baseUrl}/api/admin/teachers`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherUserId: smoke.teacher.userId,
        action: "approve",
        notes: "Smoke approved",
        grantSafetyBadge: true,
      }),
    },
    admin.cookies
  );
  const approvedTeacher = await prisma.teacherProfile.findUniqueOrThrow({
    where: { userId: smoke.teacher.userId },
    select: { verificationStatus: true, safetyBadgeGranted: true, verifiedByAdminId: true },
  });
  results.push({
    name: "Admin can approve teacher verification",
    passed:
      approveTeacher.response.ok &&
      approvedTeacher.verificationStatus === "VERIFIED" &&
      approvedTeacher.safetyBadgeGranted === true &&
      approvedTeacher.verifiedByAdminId === smoke.admin.userId,
    details: `status=${approveTeacher.response.status} verificationStatus=${approvedTeacher.verificationStatus} badge=${approvedTeacher.safetyBadgeGranted}`,
  });

  const schoolVerifyRequest = await requestJson<{ success?: boolean; data?: { verificationStatus?: string } }>(
    `${baseUrl}/api/profile/verify`,
    { method: "POST" },
    school.cookies
  );
  results.push({
    name: "School can request verification",
    passed: schoolVerifyRequest.response.ok && schoolVerifyRequest.data?.data?.verificationStatus === "PENDING",
    details: `status=${schoolVerifyRequest.response.status} verificationStatus=${schoolVerifyRequest.data?.data?.verificationStatus || "none"}`,
  });

  const rejectSchool = await requestJson<{ success?: boolean }>(
    `${baseUrl}/api/admin/schools`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: smoke.pendingSchool.schoolId,
        action: "reject",
        reason: "Smoke rejection",
      }),
    },
    admin.cookies
  );
  const rejectedSchool = await prisma.schoolProfile.findUniqueOrThrow({
    where: { id: smoke.pendingSchool.schoolId },
    select: { verificationStatus: true, verificationRejectionReason: true },
  });
  results.push({
    name: "Admin can reject school verification",
    passed:
      rejectSchool.response.ok &&
      rejectedSchool.verificationStatus === "REJECTED" &&
      rejectedSchool.verificationRejectionReason === "Smoke rejection",
    details: `status=${rejectSchool.response.status} verificationStatus=${rejectedSchool.verificationStatus}`,
  });

  const hideJob = await requestJson<{ success?: boolean }>(
    `${baseUrl}/api/admin/jobs`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: smoke.school.jobId,
        action: "hide",
        notes: "Smoke hidden",
      }),
    },
    admin.cookies
  );
  const hiddenJob = await prisma.jobPosting.findUniqueOrThrow({
    where: { id: smoke.school.jobId },
    select: { isHidden: true },
  });
  const publicHiddenJob = await fetch(`${baseUrl}/api/jobs/${smoke.school.jobId}`);
  results.push({
    name: "Hidden job is blocked publicly",
    passed: hideJob.response.ok && hiddenJob.isHidden === true && publicHiddenJob.status === 404,
    details: `hideStatus=${hideJob.response.status} jobHidden=${hiddenJob.isHidden} publicStatus=${publicHiddenJob.status}`,
  });

  const showJob = await requestJson<{ success?: boolean }>(
    `${baseUrl}/api/admin/jobs`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: smoke.school.jobId,
        action: "show",
      }),
    },
    admin.cookies
  );
  const visibleJob = await prisma.jobPosting.findUniqueOrThrow({
    where: { id: smoke.school.jobId },
    select: { isHidden: true },
  });
  results.push({
    name: "Admin can restore hidden job",
    passed: showJob.response.ok && visibleJob.isHidden === false,
    details: `status=${showJob.response.status} jobHidden=${visibleJob.isHidden}`,
  });

  const suspendTeacher = await requestJson<{ success?: boolean }>(
    `${baseUrl}/api/admin/teachers`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherUserId: smoke.teacher.userId,
        action: "suspend",
        reason: "Smoke suspension",
      }),
    },
    admin.cookies
  );
  const suspendedTeacher = await prisma.user.findUniqueOrThrow({
    where: { id: smoke.teacher.userId },
    select: { isSuspended: true },
  });
  const suspendedProfileResponse = await requestJson<{ success?: boolean; error?: string }>(
    `${baseUrl}/api/profile`,
    {},
    teacher.cookies
  );
  results.push({
    name: "Suspended teacher loses authenticated access",
    passed:
      suspendTeacher.response.ok &&
      suspendedTeacher.isSuspended === true &&
      suspendedProfileResponse.response.status === 403,
    details: `suspendStatus=${suspendTeacher.response.status} suspended=${suspendedTeacher.isSuspended} profileStatus=${suspendedProfileResponse.response.status}`,
  });

  const unsuspendTeacher = await requestJson<{ success?: boolean }>(
    `${baseUrl}/api/admin/teachers`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherUserId: smoke.teacher.userId,
        action: "unsuspend",
      }),
    },
    admin.cookies
  );
  const unsuspendedTeacher = await prisma.user.findUniqueOrThrow({
    where: { id: smoke.teacher.userId },
    select: { isSuspended: true },
  });
  results.push({
    name: "Admin can unsuspend teacher",
    passed: unsuspendTeacher.response.ok && unsuspendedTeacher.isSuspended === false,
    details: `status=${unsuspendTeacher.response.status} suspended=${unsuspendedTeacher.isSuspended}`,
  });

  const suspendSchool = await requestJson<{ success?: boolean }>(
    `${baseUrl}/api/admin/schools`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: smoke.pendingSchool.schoolId,
        action: "suspend",
        reason: "Smoke school suspension",
      }),
    },
    admin.cookies
  );
  const suspendedSchool = await prisma.user.findUniqueOrThrow({
    where: { id: smoke.pendingSchool.userId },
    select: { isSuspended: true },
  });
  const suspendedSchoolProfileResponse = await requestJson<{ success?: boolean; error?: string }>(
    `${baseUrl}/api/profile`,
    {},
    school.cookies
  );
  results.push({
    name: "Suspended school loses authenticated access",
    passed:
      suspendSchool.response.ok &&
      suspendedSchool.isSuspended === true &&
      suspendedSchoolProfileResponse.response.status === 403,
    details: `suspendStatus=${suspendSchool.response.status} suspended=${suspendedSchool.isSuspended} profileStatus=${suspendedSchoolProfileResponse.response.status}`,
  });

  const unsuspendSchool = await requestJson<{ success?: boolean }>(
    `${baseUrl}/api/admin/schools`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: smoke.pendingSchool.schoolId,
        action: "unsuspend",
      }),
    },
    admin.cookies
  );
  const unsuspendedSchool = await prisma.user.findUniqueOrThrow({
    where: { id: smoke.pendingSchool.userId },
    select: { isSuspended: true },
  });
  results.push({
    name: "Admin can unsuspend school",
    passed: unsuspendSchool.response.ok && unsuspendedSchool.isSuspended === false,
    details: `status=${unsuspendSchool.response.status} suspended=${unsuspendedSchool.isSuspended}`,
  });

  return results;
}

export async function disconnectProductionHardeningPrisma() {
  await prisma.$disconnect();
}
