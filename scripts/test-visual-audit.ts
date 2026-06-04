import fs from "fs";
import path from "path";
import { launchScriptBrowser, type Page } from "./lib/browser";
import { ensureSmokeData } from "./lib/smoke-data";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "audit-screenshots", "phase5-6");

type CaptureTarget = {
  slug: string;
  path: string | ((smoke: Awaited<ReturnType<typeof ensureSmokeData>>) => string);
  role?: "teacher" | "school";
};

const VIEWPORTS = [
  { label: "desktop", width: 1440, height: 1080, isMobile: false },
  { label: "mobile", width: 390, height: 844, isMobile: true },
] as const;

const TARGETS: CaptureTarget[] = [
  { slug: "home", path: "/" },
  { slug: "job-search", path: "/jobs" },
  { slug: "auth-signin", path: "/auth/signin" },
  { slug: "auth-signup", path: "/auth/signup" },
  { slug: "teacher-signup-details", path: "/auth/signup?role=teacher&step=details" },
  { slug: "school-signup-details", path: "/auth/signup?role=school&step=details" },
  { slug: "job-detail-public", path: (smoke) => `/jobs/${smoke.school.jobId}` },
  { slug: "teacher-job-apply", path: (smoke) => `/jobs/${smoke.school.jobId}`, role: "teacher" },
  { slug: "teacher-dashboard", path: "/dashboard", role: "teacher" },
  { slug: "teacher-profile", path: "/dashboard/profile", role: "teacher" },
  { slug: "teacher-messages", path: "/dashboard/messages", role: "teacher" },
  { slug: "school-dashboard", path: "/dashboard/school", role: "school" },
  { slug: "school-applicants", path: "/dashboard/applicants", role: "school" },
  { slug: "school-messages", path: "/dashboard/messages", role: "school" },
] as const;

type AccessibilityFinding = {
  viewport: string;
  target: string;
  issue: string;
  selector: string;
};

async function signIn(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle2" });
}

async function collectAccessibilityFindings(page: Page): Promise<Omit<AccessibilityFinding, "viewport" | "target">[]> {
  return page.evaluate(() => {
    function describe(element: Element) {
      const id = element.getAttribute("id");
      if (id) return `#${id}`;
      const testId = element.getAttribute("data-testid");
      if (testId) return `[data-testid="${testId}"]`;
      const label = element.getAttribute("aria-label") || element.textContent?.trim();
      return `${element.tagName.toLowerCase()}${label ? `:${label.slice(0, 48)}` : ""}`;
    }

    const findings: Array<{ issue: string; selector: string }> = [];
    document.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt")) {
        findings.push({ issue: "Image missing alt text", selector: describe(img) });
      }
    });

    document.querySelectorAll("input, select, textarea").forEach((field) => {
      const id = field.getAttribute("id");
      const hasLabel = Boolean(
        field.getAttribute("aria-label") ||
          field.getAttribute("aria-labelledby") ||
          (id && document.querySelector(`label[for="${CSS.escape(id)}"]`))
      );
      if (!hasLabel) {
        findings.push({ issue: "Form control missing accessible label", selector: describe(field) });
      }
    });

    document.querySelectorAll("button, a").forEach((control) => {
      const hasName = Boolean(
        control.getAttribute("aria-label") ||
          control.getAttribute("aria-labelledby") ||
          control.textContent?.trim()
      );
      if (!hasName) {
        findings.push({ issue: "Interactive control missing accessible name", selector: describe(control) });
      }
    });

    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      findings.push({
        issue: "Horizontal page overflow",
        selector: `document:${document.documentElement.scrollWidth}px>${window.innerWidth}px`,
      });
    }

    return findings;
  });
}

async function capturePage(page: Page, target: CaptureTarget, pathValue: string, filePath: string) {
  const response = await page.goto(`${BASE_URL}${pathValue}`, {
    waitUntil: "networkidle2",
  });
  if (!response || !response.ok()) {
    throw new Error(`Failed to load ${pathValue}: ${response?.status() ?? "no response"}`);
  }
  await page.screenshot({ path: filePath, fullPage: true });
}

async function run() {
  const smoke = await ensureSmokeData();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const findings: AccessibilityFinding[] = [];

  const browser = await launchScriptBrowser({ headless: true });
  try {
    for (const viewport of VIEWPORTS) {
      for (const target of TARGETS) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          isMobile: viewport.isMobile,
          deviceScaleFactor: viewport.isMobile ? 2 : 1,
          hasTouch: viewport.isMobile,
        });

        if (target.role === "teacher") {
          await signIn(page, smoke.teacher.email, smoke.teacher.password);
        } else if (target.role === "school") {
          await signIn(page, smoke.school.email, smoke.school.password);
        }

        const pathValue = typeof target.path === "function" ? target.path(smoke) : target.path;
        const filePath = path.join(OUTPUT_DIR, `${viewport.label}-${target.slug}.png`);
        await capturePage(page, target, pathValue, filePath);
        const pageFindings = await collectAccessibilityFindings(page);
        findings.push(
          ...pageFindings.map((finding) => ({
            viewport: viewport.label,
            target: target.slug,
            ...finding,
          }))
        );
        console.log(`CAPTURED ${path.relative(process.cwd(), filePath)}`);
        await page.close();
        await context.close();
      }
    }
    const reportPath = path.join(OUTPUT_DIR, "accessibility-findings.json");
    fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
    console.log(`REPORT ${path.relative(process.cwd(), reportPath)} (${findings.length} findings)`);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error("Visual audit capture failed:", error);
  process.exitCode = 1;
});
