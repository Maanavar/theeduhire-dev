import { PrismaClient } from "@prisma/client";
import {
  requestJson,
  requestText,
  signInWithCredentials,
} from "./lib/http-session";
import { ensureSmokeData } from "./lib/smoke-data";

type CheckResult = { name: string; passed: boolean; details: string };

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  const smoke = await ensureSmokeData();
  const results: CheckResult[] = [];

  const teacher = await signInWithCredentials({
    baseUrl: BASE_URL,
    email: smoke.teacher.email,
    password: smoke.teacher.password,
    callbackPath: "/dashboard",
  });
  const school = await signInWithCredentials({
    baseUrl: BASE_URL,
    email: smoke.school.email,
    password: smoke.school.password,
    callbackPath: "/dashboard/school",
  });
  const outsiderSchool = await signInWithCredentials({
    baseUrl: BASE_URL,
    email: smoke.outsiderSchool.email,
    password: smoke.outsiderSchool.password,
    callbackPath: "/dashboard/school",
  });
  const admin = await signInWithCredentials({
    baseUrl: BASE_URL,
    email: smoke.admin.email,
    password: smoke.admin.password,
    callbackPath: "/admin",
  });

  const teacherAdminStats = await requestJson<{ success?: boolean; error?: string }>(
    `${BASE_URL}/api/admin/stats`,
    {},
    teacher.cookies
  );
  results.push({
    name: "Teacher blocked from admin stats",
    passed: teacherAdminStats.response.status === 403,
    details: `status=${teacherAdminStats.response.status}`,
  });

  const teacherApplicants = await requestJson<{ success?: boolean; error?: string }>(
    `${BASE_URL}/api/jobs/${smoke.school.jobId}/candidates/ranked`,
    {},
    teacher.cookies
  );
  results.push({
    name: "Teacher blocked from school applicant data",
    passed: teacherApplicants.response.status === 403,
    details: `status=${teacherApplicants.response.status}`,
  });

  const schoolApplicants = await requestJson<{ success?: boolean; data?: unknown[] }>(
    `${BASE_URL}/api/jobs/${smoke.school.jobId}/candidates/ranked`,
    {},
    school.cookies
  );
  results.push({
    name: "Owning school can access applicants",
    passed:
      schoolApplicants.response.ok &&
      schoolApplicants.data?.success === true &&
      Array.isArray(schoolApplicants.data?.data),
    details: `status=${schoolApplicants.response.status}`,
  });

  const outsiderApplicants = await requestJson<{ success?: boolean; error?: string }>(
    `${BASE_URL}/api/jobs/${smoke.school.jobId}/candidates/ranked`,
    {},
    outsiderSchool.cookies
  );
  results.push({
    name: "Other school blocked from unrelated applicants",
    passed: outsiderApplicants.response.status === 403,
    details: `status=${outsiderApplicants.response.status}`,
  });

  const publicResume = await fetch(`${BASE_URL}/api/resumes/${smoke.teacher.resumeId}`, {
    redirect: "manual",
  });
  results.push({
    name: "Public user blocked from private resume",
    passed: publicResume.status === 401,
    details: `status=${publicResume.status}`,
  });

  const adminStats = await requestJson<{ success?: boolean }>(
    `${BASE_URL}/api/admin/stats`,
    {},
    admin.cookies
  );
  results.push({
    name: "Admin can access admin stats",
    passed: adminStats.response.ok && adminStats.data?.success === true,
    details: `status=${adminStats.response.status}`,
  });

  const adminResume = await requestText(
    `${BASE_URL}/api/resumes/${smoke.teacher.resumeId}`,
    {},
    admin.cookies
  );
  results.push({
    name: "Admin can access private resume",
    passed: adminResume.status >= 300 && adminResume.status < 400,
    details: `status=${adminResume.status}`,
  });

  const teacherSessionToken = teacher.session.user?.sessionToken || "";
  await prisma.userSession.updateMany({
    where: {
      userId: smoke.teacher.userId,
      sessionToken: teacherSessionToken,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  const revokedProfile = await requestJson<{ success?: boolean; error?: string }>(
    `${BASE_URL}/api/profile`,
    {},
    teacher.cookies
  );
  results.push({
    name: "Revoked session is rejected",
    passed: revokedProfile.response.status === 401,
    details: `status=${revokedProfile.response.status}`,
  });

  const failed = results.filter((result) => !result.passed);
  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"}: ${result.name} - ${result.details}`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run()
  .catch((error) => {
    console.error("API authorization regression run failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
