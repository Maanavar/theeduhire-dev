import {
  requestJson,
  requestText,
  signInWithCredentials,
} from "./lib/http-session";
import { ensureSmokeData, disconnectSmokePrisma } from "./lib/smoke-data";
import {
  runProductionHardeningSmoke,
  disconnectProductionHardeningPrisma,
} from "./lib/production-hardening-smoke";

type CheckResult = { name: string; passed: boolean; details: string };

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  const smoke = await ensureSmokeData();
  const results: CheckResult[] = [];

  const admin = await signInWithCredentials({
    baseUrl: BASE_URL,
    email: smoke.admin.email,
    password: smoke.admin.password,
    callbackPath: "/admin",
  });

  const adminRole = admin.session.user?.role;
  results.push({
    name: "Admin sign-in redirect",
    passed:
      admin.response.ok &&
      adminRole === "ADMIN" &&
      admin.redirectUrl.includes("/admin"),
    details: `status=${admin.response.status} role=${adminRole || "unknown"} location=${admin.redirectUrl || "none"}`,
  });

  const adminHome = await requestText(`${BASE_URL}/admin`, {}, admin.cookies);
  results.push({
    name: "Admin dashboard reachable",
    passed: adminHome.ok,
    details: `status=${adminHome.status}`,
  });

  const adminSchools = await requestText(`${BASE_URL}/admin/schools`, {}, admin.cookies);
  results.push({
    name: "Admin schools page reachable",
    passed: adminSchools.ok,
    details: `status=${adminSchools.status}`,
  });

  const adminJobs = await requestText(`${BASE_URL}/admin/jobs`, {}, admin.cookies);
  results.push({
    name: "Admin jobs page reachable",
    passed: adminJobs.ok,
    details: `status=${adminJobs.status}`,
  });

  const verifyPending = await requestJson<{ success?: boolean }>(
    `${BASE_URL}/api/admin/schools`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: smoke.pendingSchool.schoolId,
        action: "approve",
      }),
    },
    admin.cookies
  );
  results.push({
    name: "Admin can verify pending school",
    passed: verifyPending.response.ok && verifyPending.data?.success === true,
    details: `status=${verifyPending.response.status}`,
  });

  const restorePending = await requestJson<{ success?: boolean }>(
    `${BASE_URL}/api/admin/schools`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: smoke.pendingSchool.schoolId,
        action: "mark-pending",
      }),
    },
    admin.cookies
  );
  results.push({
    name: "Admin can restore pending verification state",
    passed: restorePending.response.ok && restorePending.data?.success === true,
    details: `status=${restorePending.response.status}`,
  });

  const closeJob = await requestJson<{ success?: boolean }>(
    `${BASE_URL}/api/admin/jobs`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: smoke.school.jobId,
        action: "close",
      }),
    },
    admin.cookies
  );
  results.push({
    name: "Admin can close job",
    passed: closeJob.response.ok && closeJob.data?.success === true,
    details: `status=${closeJob.response.status}`,
  });

  const activateJob = await requestJson<{ success?: boolean }>(
    `${BASE_URL}/api/admin/jobs`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: smoke.school.jobId,
        action: "activate",
      }),
    },
    admin.cookies
  );
  results.push({
    name: "Admin can reactivate job",
    passed: activateJob.response.ok && activateJob.data?.success === true,
    details: `status=${activateJob.response.status}`,
  });

  const adminTeachers = await requestText(`${BASE_URL}/admin/teachers`, {}, admin.cookies);
  results.push({
    name: "Admin teachers page reachable",
    passed: adminTeachers.ok,
    details: `status=${adminTeachers.status}`,
  });

  const productionHardening = await runProductionHardeningSmoke(BASE_URL);
  results.push(...productionHardening.map((result) => ({
    ...result,
    name: `Hardening: ${result.name}`,
  })));

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
    console.error("Admin workflow regression run failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([disconnectSmokePrisma(), disconnectProductionHardeningPrisma()]);
  });
