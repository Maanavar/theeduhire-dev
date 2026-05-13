import { requestJson, requestText, signInWithCredentials } from "./lib/http-session";
import { ensureSmokeData } from "./lib/smoke-data";

type CheckResult = { name: string; passed: boolean; details: string };

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run(): Promise<void> {
  const results: CheckResult[] = [];
  const smoke = await ensureSmokeData();
  const teacherEmail = process.env.TEST_TEACHER_EMAIL || smoke.teacher.email;
  const teacherPassword = process.env.TEST_TEACHER_PASSWORD || smoke.teacher.password;
  const jobId = process.env.TEST_JOB_ID || smoke.school.jobId;
  const resumeId = process.env.TEST_RESUME_ID || smoke.teacher.resumeId;

  const signInResult = await signInWithCredentials({
    baseUrl: BASE_URL,
    email: teacherEmail,
    password: teacherPassword,
    callbackPath: "/dashboard/applications",
  });
  const signInLocation = signInResult.response.headers.get("location") || "";
  const sessionRole = signInResult.session?.user?.role;
  const cookies = signInResult.cookies;
  results.push({
    name: "Teacher sign-in redirect",
    passed:
      signInResult.response.ok &&
      sessionRole === "TEACHER" &&
      signInResult.redirectUrl.includes("/dashboard/applications"),
    details: `status=${signInResult.response.status} role=${sessionRole || "unknown"} location=${signInResult.redirectUrl || signInLocation || "none"}`,
  });

  const jobsResponse = await requestText(`${BASE_URL}/jobs`, {}, cookies);
  results.push({
    name: "Discover jobs page reachable",
    passed: jobsResponse.status >= 300 && jobsResponse.status < 400 && jobsResponse.headers.get("location") === "/dashboard/jobs",
    details: `status=${jobsResponse.status} location=${jobsResponse.headers.get("location") || "none"}`,
  });

  if (jobId) {
    const detailResponse = await requestText(`${BASE_URL}/jobs/${jobId}`, {}, cookies);
    results.push({
      name: "Job detail route reachable",
      passed:
        detailResponse.status >= 300 &&
        detailResponse.status < 400 &&
        detailResponse.headers.get("location") === `/dashboard/jobs?selected=${jobId}`,
      details: `status=${detailResponse.status} location=${detailResponse.headers.get("location") || "none"}`,
    });

    const jobApi = await requestJson<{
      success?: boolean;
      data?: { screeningQuestions?: Array<{ id: string; question: string; required: boolean }> };
    }>(`${BASE_URL}/api/jobs/${jobId}`, {}, cookies);

    if (!jobApi.response.ok || !jobApi.data?.success) {
      results.push({
        name: "Apply API lifecycle check",
        passed: false,
        details: `Unable to load job metadata: status=${jobApi.response.status}`,
      });
    } else {
      const screeningAnswers = (jobApi.data.data?.screeningQuestions || [])
        .filter((question) => question.required)
        .map((question) => ({
          questionId: question.id,
          question: question.question,
          answer: "Yes, I hold valid TET/CTET credentials.",
        }));

      const applyAttempt = await requestJson<{ success?: boolean; error?: string }>(
        `${BASE_URL}/api/jobs/${jobId}/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coverLetter: "Regression apply check",
            resumeId,
            screeningAnswers,
          }),
        },
        cookies
      );

      results.push({
        name: "Apply API lifecycle check",
        passed: (applyAttempt.response.ok && !!applyAttempt.data?.success) || applyAttempt.response.status === 409,
        details:
          applyAttempt.response.status === 409
            ? "Already applied (accepted)"
            : `status=${applyAttempt.response.status}${applyAttempt.data?.error ? ` error=${applyAttempt.data.error}` : ""}`,
      });
    }
  } else {
    results.push({ name: "Apply API lifecycle check", passed: true, details: "Skipped: TEST_JOB_ID not provided" });
  }

  const applicationsResponse = await requestText(`${BASE_URL}/dashboard/applications`, {}, cookies);
  results.push({
    name: "Applications tracking page reachable",
    passed: applicationsResponse.ok,
    details: `status=${applicationsResponse.status}`,
  });

  const interviewsResponse = await requestText(`${BASE_URL}/dashboard/interviews`, {}, cookies);
  results.push({
    name: "Interviews page reachable",
    passed: interviewsResponse.ok,
    details: `status=${interviewsResponse.status}`,
  });

  const profileResponse = await requestText(`${BASE_URL}/dashboard/profile`, {}, cookies);
  results.push({
    name: "Profile page reachable",
    passed: profileResponse.ok,
    details: `status=${profileResponse.status}`,
  });

  const failed = results.filter((r) => !r.passed);
  for (const r of results) console.log(`${r.passed ? "PASS" : "FAIL"}: ${r.name} - ${r.details}`);
  if (failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error("Teacher workflow regression run failed:", error);
  process.exitCode = 1;
});
