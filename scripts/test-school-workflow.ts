import { requestJson, requestText, signInWithCredentials } from "./lib/http-session";
import { ensureSmokeData } from "./lib/smoke-data";

type CheckResult = { name: string; passed: boolean; details: string };

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run(): Promise<void> {
  const results: CheckResult[] = [];
  const smoke = await ensureSmokeData();
  const schoolEmail = process.env.TEST_SCHOOL_EMAIL || smoke.school.email;
  const schoolPassword = process.env.TEST_SCHOOL_PASSWORD || smoke.school.password;
  const applicationId = process.env.TEST_APPLICATION_ID || smoke.school.applicationId;
  const jobId = process.env.TEST_JOB_ID || smoke.school.jobId;

  const signInResult = await signInWithCredentials({
    baseUrl: BASE_URL,
    email: schoolEmail,
    password: schoolPassword,
    callbackPath: "/dashboard/school",
  });
  const cookies = signInResult.cookies;
  const sessionRole = signInResult.session?.user?.role;

  results.push({
    name: "School sign-in redirect",
    passed:
      signInResult.response.ok &&
      sessionRole === "SCHOOL_ADMIN" &&
      signInResult.redirectUrl.includes("/dashboard/school"),
    details: `status=${signInResult.response.status} role=${sessionRole || "unknown"} location=${signInResult.redirectUrl || "none"}`,
  });

  const jobsResponse = await requestText(`${BASE_URL}/dashboard/my-jobs`, {}, cookies);
  results.push({
    name: "Listings page reachable",
    passed: jobsResponse.ok,
    details: `status=${jobsResponse.status}`,
  });

  const applicantsUrl = jobId
    ? `${BASE_URL}/dashboard/applicants?jobId=${jobId}`
    : `${BASE_URL}/dashboard/applicants`;
  const applicantsResponse = await requestText(applicantsUrl, {}, cookies);
  results.push({
    name: "Applicants page reachable",
    passed: applicantsResponse.ok,
    details: `status=${applicantsResponse.status}`,
  });

  const pipelineResponse = await requestText(`${BASE_URL}/dashboard/pipeline`, {}, cookies);
  results.push({
    name: "Pipeline page reachable",
    passed: pipelineResponse.ok,
    details: `status=${pipelineResponse.status}`,
  });

  const interviewsResponse = await requestText(`${BASE_URL}/dashboard/interviews`, {}, cookies);
  results.push({
    name: "Interviews page reachable",
    passed: interviewsResponse.ok,
    details: `status=${interviewsResponse.status}`,
  });

  if (applicationId) {
    const apiResult = await requestJson<{ success?: boolean; error?: string }>(
      `${BASE_URL}/api/applications/${applicationId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVIEWED" }),
      },
      cookies
    );
    results.push({
      name: "Optional status transition check",
      passed: apiResult.response.ok && !!apiResult.data?.success,
      details: apiResult.response.ok ? "REVIEWED status update succeeded" : `Failed: ${apiResult.data?.error || "unknown"}`,
    });
  } else {
    results.push({ name: "Optional status transition check", passed: true, details: "Skipped: application id not available" });
  }

  const failed = results.filter((r) => !r.passed);
  for (const r of results) console.log(`${r.passed ? "PASS" : "FAIL"}: ${r.name} - ${r.details}`);
  if (failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error("School workflow regression run failed:", error);
  process.exitCode = 1;
});
