import fs from "fs";
import path from "path";
import puppeteer, { type Page } from "puppeteer";
import { ensureSmokeData } from "./lib/smoke-data";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "audit-screenshots", "phase5-6");

type CaptureTarget = {
  slug: string;
  path: string;
  role?: "teacher" | "school";
};

const VIEWPORTS = [
  { label: "desktop", width: 1440, height: 1080, isMobile: false },
  { label: "mobile", width: 390, height: 844, isMobile: true },
] as const;

const TARGETS: CaptureTarget[] = [
  { slug: "home", path: "/" },
  { slug: "jobs", path: "/jobs" },
  { slug: "auth-signin", path: "/auth/signin" },
  { slug: "auth-signup", path: "/auth/signup" },
  { slug: "teacher-dashboard", path: "/dashboard", role: "teacher" },
  { slug: "teacher-profile", path: "/dashboard/profile", role: "teacher" },
  { slug: "school-dashboard", path: "/dashboard/school", role: "school" },
  { slug: "school-applicants", path: "/dashboard/applicants", role: "school" },
] as const;

async function signIn(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle2" });
}

async function capturePage(page: Page, target: CaptureTarget, filePath: string) {
  const response = await page.goto(`${BASE_URL}${target.path}`, {
    waitUntil: "networkidle2",
  });
  if (!response || !response.ok()) {
    throw new Error(`Failed to load ${target.path}: ${response?.status() ?? "no response"}`);
  }
  await page.screenshot({ path: filePath, fullPage: true });
}

async function run() {
  const smoke = await ensureSmokeData();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
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

        const filePath = path.join(OUTPUT_DIR, `${viewport.label}-${target.slug}.png`);
        await capturePage(page, target, filePath);
        console.log(`CAPTURED ${path.relative(process.cwd(), filePath)}`);
        await page.close();
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error("Visual audit capture failed:", error);
  process.exitCode = 1;
});
