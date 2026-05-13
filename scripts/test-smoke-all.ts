import { requestJson, requestText, signInWithCredentials } from "./lib/http-session";
import { ensureSmokeData, disconnectSmokePrisma } from "./lib/smoke-data";
import {
  runProductionHardeningSmoke,
  disconnectProductionHardeningPrisma,
} from "./lib/production-hardening-smoke";

type CheckResult = { name: string; passed: boolean; details: string };

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runAdminWorkflow(): Promise<CheckResult[]> {
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
    name: "Admin: sign-in redirect",
    passed: admin.response.ok && adminRole === "ADMIN" && admin.redirectUrl.includes("/admin"),
    details: `status=${admin.response.status} role=${adminRole || "unknown"} location=${admin.redirectUrl || "none"}`,
  });

  for (const [name, path] of [
    ["Admin: dashboard reachable", "/admin"],
    ["Admin: schools page reachable", "/admin/schools"],
    ["Admin: jobs page reachable", "/admin/jobs"],
    ["Admin: teachers page reachable", "/admin/teachers"],
  ] as const) {
    const res = await requestText(`${BASE_URL}${path}`, {}, admin.cookies);
    results.push({ name, passed: res.ok, details: `status=${res.status}` });
  }

  const verifyPending = await requestJson<{ success?: boolean }>(
    `${BASE_URL}/api/admin/schools`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: smoke.pendingSchool.schoolId, action: "approve" }),
    },
    admin.cookies
  );
  results.push({
    name: "Admin: can verify pending school",
    passed: verifyPending.response.ok && verifyPending.data?.success === true,
    details: `status=${verifyPending.response.status}`,
  });

  const restorePending = await requestJson<{ success?: boolean }>(
    `${BASE_URL}/api/admin/schools`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: smoke.pendingSchool.schoolId, action: "mark-pending" }),
    },
    admin.cookies
  );
  results.push({
    name: "Admin: can restore pending verification state",
    passed: restorePending.response.ok && restorePending.data?.success === true,
    details: `status=${restorePending.response.status}`,
  });

  const closeJob = await requestJson<{ success?: boolean }>(
    `${BASE_URL}/api/admin/jobs`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: smoke.school.jobId, action: "close" }),
    },
    admin.cookies
  );
  results.push({
    name: "Admin: can close job",
    passed: closeJob.response.ok && closeJob.data?.success === true,
    details: `status=${closeJob.response.status}`,
  });

  const activateJob = await requestJson<{ success?: boolean }>(
    `${BASE_URL}/api/admin/jobs`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: smoke.school.jobId, action: "activate" }),
    },
    admin.cookies
  );
  results.push({
    name: "Admin: can reactivate job",
    passed: activateJob.response.ok && activateJob.data?.success === true,
    details: `status=${activateJob.response.status}`,
  });

  return results;
}

function printSection(title: string, results: CheckResult[]) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`);
  for (const r of results) {
    console.log(`  ${r.passed ? "PASS" : "FAIL"}: ${r.name} — ${r.details}`);
  }
}

async function run() {
  console.log(`\nEduHire smoke suite  BASE_URL=${BASE_URL}\n${"═".repeat(64)}`);

  const adminResults = await runAdminWorkflow();
  const hardeningResults = await runProductionHardeningSmoke(BASE_URL);

  const allResults = [
    ...adminResults.map((r) => ({ ...r, suite: "Admin workflow" })),
    ...hardeningResults.map((r) => ({ ...r, suite: "Production hardening" })),
  ];

  printSection("Admin workflow", adminResults);
  printSection("Production hardening", hardeningResults);

  const failed = allResults.filter((r) => !r.passed);
  const passed = allResults.length - failed.length;

  console.log(`\n${"═".repeat(64)}`);
  console.log(`Result: ${passed}/${allResults.length} passed${failed.length > 0 ? ` — ${failed.length} FAILED` : " ✓"}`);

  if (failed.length > 0) {
    console.log("\nFailed checks:");
    for (const r of failed) {
      console.log(`  ✗ [${r.suite}] ${r.name} — ${r.details}`);
    }
    process.exitCode = 1;
  }
}

run()
  .catch((err) => {
    console.error("Smoke suite failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([disconnectSmokePrisma(), disconnectProductionHardeningPrisma()]);
  });
