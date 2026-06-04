import { launchScriptBrowser } from "./lib/browser";

type CheckResult = {
  name: string;
  passed: boolean;
  details: string;
};

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TIMEOUT_MS = 15000;

async function run(): Promise<void> {
  const browser = await launchScriptBrowser({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);

  const results: CheckResult[] = [];

  try {
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() =>
      document.body.innerText.includes("Welcome back")
    );
    results.push({
      name: "Sign-in page remains stable without forced redirect",
      passed: new URL(page.url()).pathname === "/auth/signin",
      details: page.url(),
    });

    await page.goto(`${BASE_URL}/auth/signup`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        document.body.innerText.includes("Continue as Teacher") &&
        document.body.innerText.includes("Continue as School Admin")
    );
    results.push({
      name: "Signup starts on role-selection step",
      passed: new URL(page.url()).pathname === "/auth/signup",
      details: page.url(),
    });

    await page.goto(`${BASE_URL}/auth/signup?role=teacher&step=details`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(() =>
      document.body.innerText.includes("Create your teacher account")
    );
    results.push({
      name: "Signup teacher branch resolves to details step",
      passed: page.url().includes("role=teacher") && page.url().includes("step=details"),
      details: page.url(),
    });

    await page.goto(`${BASE_URL}/auth/signup?role=school&step=details`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(() =>
      document.body.innerText.includes("Create your school hiring account")
    );
    results.push({
      name: "Signup school branch resolves to details step",
      passed: page.url().includes("role=school") && page.url().includes("step=details"),
      details: page.url(),
    });
  } finally {
    await page.close();
    await browser.close();
  }

  const failed = results.filter((result) => !result.passed);
  for (const result of results) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"}: ${result.name} - ${result.details}`
    );
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Auth role-branching regression run failed:", error);
  process.exitCode = 1;
});
