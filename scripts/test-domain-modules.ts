import { launchScriptBrowser } from "./lib/browser";
import { ensureSmokeData } from "./lib/smoke-data";

type CheckResult = { name: string; passed: boolean; details: string };

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TIMEOUT_MS = 15000;

async function run() {
  const results: CheckResult[] = [];
  const smoke = await ensureSmokeData();
  const teacherEmail = process.env.TEST_TEACHER_EMAIL || smoke.teacher.email;
  const teacherPassword = process.env.TEST_TEACHER_PASSWORD || smoke.teacher.password;

  const browser = await launchScriptBrowser({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);

  try {
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', teacherEmail);
    await page.type('input[type="password"]', teacherPassword);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    results.push({ name: "Auth for domain QA", passed: new URL(page.url()).pathname.startsWith("/dashboard"), details: page.url() });

    const messagesApi = await page.evaluate(async () => {
      const res = await fetch("/api/messages");
      const json = await res.json();
      return { ok: res.ok, success: json?.success === true };
    });
    results.push({ name: "Messages API contract", passed: messagesApi.ok && messagesApi.success, details: `ok=${messagesApi.ok}` });

    const notificationsApi = await page.evaluate(async () => {
      const res = await fetch("/api/notifications?tab=all");
      const json = await res.json();
      return { ok: res.ok, success: json?.success === true, hasMeta: !!json?.meta };
    });
    results.push({ name: "Notifications API contract", passed: notificationsApi.ok && notificationsApi.success && notificationsApi.hasMeta, details: `ok=${notificationsApi.ok}` });

    const sessionsApi = await page.evaluate(async () => {
      const res = await fetch("/api/settings/security/sessions");
      const json = await res.json();
      return { ok: res.ok, success: json?.success === true, isArray: Array.isArray(json?.data) };
    });
    results.push({ name: "Settings security sessions API contract", passed: sessionsApi.ok && sessionsApi.success && sessionsApi.isArray, details: `ok=${sessionsApi.ok}` });

    await page.goto(`${BASE_URL}/dashboard/messages`, { waitUntil: "networkidle2" });
    results.push({ name: "Messages route reachable", passed: (await page.$("h1")) !== null, details: new URL(page.url()).pathname });

    await page.goto(`${BASE_URL}/dashboard/notifications`, { waitUntil: "networkidle2" });
    results.push({ name: "Notifications route reachable", passed: (await page.$("h1")) !== null, details: new URL(page.url()).pathname });

    await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: "networkidle2" });
    results.push({ name: "Settings route reachable", passed: (await page.$("h1")) !== null, details: new URL(page.url()).pathname });
  } finally {
    await page.close();
    await browser.close();
  }

  const failed = results.filter((r) => !r.passed);
  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"}: ${result.name} - ${result.details}`);
  }
  if (failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error("Domain QA checks failed:", error);
  process.exitCode = 1;
});

