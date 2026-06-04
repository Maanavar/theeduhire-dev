const fs = require("fs");
const path = require("path");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const { PrismaClient } = require("@prisma/client");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "audit-screenshots", "users");
const VIEWPORT = { width: 1440, height: 1080, isMobile: false, deviceScaleFactor: 1, hasTouch: false };
const SMOKE_PASSWORD = "SmokeTest123!";

const ACCOUNTS = [
  {
    key: "teacher",
    email: "smoke.teacher@eduhire-demo.in",
    role: "TEACHER",
  },
  {
    key: "school",
    email: "smoke.school@eduhire-demo.in",
    role: "SCHOOL_ADMIN",
  },
  {
    key: "outsider-school",
    email: "smoke.outsider-school@eduhire-demo.in",
    role: "SCHOOL_ADMIN",
  },
  {
    key: "pending-school",
    email: "smoke.pending-school@eduhire-demo.in",
    role: "SCHOOL_ADMIN",
  },
  {
    key: "admin",
    email: "smoke.admin@eduhire-demo.in",
    role: "ADMIN",
  },
];

const SHARED_TARGETS = [
  { slug: "home", path: "/" },
  { slug: "jobs", path: "/jobs" },
  { slug: "managed-recruitment", path: "/managed-recruitment" },
  { slug: "privacy", path: "/privacy" },
  { slug: "terms", path: "/terms" },
  { slug: "auth-signin", path: "/auth/signin" },
  { slug: "auth-signup", path: "/auth/signup" },
  { slug: "auth-forgot-password", path: "/auth/forgot-password" },
  { slug: "auth-verify", path: "/auth/verify" },
];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function shortId(id) {
  return String(id).slice(0, 8);
}

async function launchBrowser() {
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
    headless: chromium.headless,
  });
}

async function signIn(page, email, password) {
  await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "domcontentloaded", timeout: 60000 });

  const csrfToken = await page.evaluate(async () => {
    const response = await fetch("/api/auth/csrf", { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }
    const data = await response.json();
    return data.csrfToken;
  });

  const authResult = await page.evaluate(
    async ({ emailAddress, userPassword, csrf }) => {
      const params = new URLSearchParams({
        csrfToken: csrf,
        email: emailAddress,
        password: userPassword,
        callbackUrl: `${window.location.origin}/dashboard`,
        redirect: "false",
        json: "true",
      });

      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        credentials: "same-origin",
      });

      return {
        status: response.status,
        text: await response.text(),
      };
    },
    {
      emailAddress: email,
      userPassword: password,
      csrf: csrfToken,
    }
  );

  const session = await page.evaluate(async () => {
    const response = await fetch("/api/auth/session", { credentials: "same-origin" });
    if (!response.ok) {
      return null;
    }
    return response.json();
  });

  if (!session?.user) {
    throw new Error(`Failed to establish a session for ${email} (status ${authResult.status}): ${authResult.text}`);
  }
}

async function captureRoute(page, route, filePath) {
  let lastStatus = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    lastStatus = response ? response.status() : null;

    if (response && response.ok()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.screenshot({ path: filePath, fullPage: true });
      return;
    }

    if (attempt < 3 && (lastStatus === 404 || lastStatus === 500 || lastStatus === null)) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      continue;
    }

    throw new Error(`Failed to load ${route}: ${lastStatus ?? "no response"}`);
  }
}

async function loadSmokeData(prisma) {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ACCOUNTS.map((account) => account.email),
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teacherProfile: { select: { id: true } },
      schoolProfile: { select: { id: true } },
    },
  });

  const byEmail = new Map(users.map((user) => [user.email, user]));
  const missing = ACCOUNTS.filter((account) => !byEmail.has(account.email));
  if (missing.length > 0) {
    throw new Error(
      `Missing smoke accounts in the database: ${missing.map((account) => account.email).join(", ")}. Run the smoke seed first.`
    );
  }

  const teacher = byEmail.get("smoke.teacher@eduhire-demo.in");
  const school = byEmail.get("smoke.school@eduhire-demo.in");
  const outsiderSchool = byEmail.get("smoke.outsider-school@eduhire-demo.in");
  const pendingSchool = byEmail.get("smoke.pending-school@eduhire-demo.in");
  const admin = byEmail.get("smoke.admin@eduhire-demo.in");

  const job = await prisma.jobPosting.findFirst({
    where: { postedBy: school.id },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  if (!job) {
    throw new Error("No school job found for the smoke school account.");
  }

  return {
    teacher,
    school,
    outsiderSchool,
    pendingSchool,
    admin,
    job,
  };
}

function buildUserTargets(data) {
  const teacherProfileId = data.teacher.teacherProfile?.id;
  const schoolProfileId = data.school.schoolProfile?.id;

  return [
    {
      label: "teacher",
      user: data.teacher,
      folderName: `${slugify(data.teacher.name || "teacher")}-${shortId(data.teacher.id)}`,
      password: SMOKE_PASSWORD,
      targets: [
        { slug: "public-profile", path: `/profile/${data.teacher.id}` },
        { slug: "dashboard-home", path: "/dashboard" },
        { slug: "dashboard-profile", path: "/dashboard/profile" },
        { slug: "dashboard-jobs", path: "/dashboard/jobs" },
        { slug: "dashboard-applications", path: "/dashboard/applications" },
        { slug: "dashboard-interviews", path: "/dashboard/interviews" },
        { slug: "dashboard-messages", path: "/dashboard/messages" },
        { slug: "dashboard-notifications", path: "/dashboard/notifications" },
        { slug: "dashboard-billing", path: "/dashboard/billing" },
        { slug: "dashboard-resumes", path: "/dashboard/resumes" },
        { slug: "dashboard-recommendations", path: "/dashboard/recommendations" },
        { slug: "dashboard-saved", path: "/dashboard/saved" },
        { slug: "dashboard-alerts", path: "/dashboard/alerts" },
        { slug: "dashboard-settings", path: "/dashboard/settings" },
        { slug: "dashboard-pipeline", path: "/dashboard/pipeline" },
      ],
    },
    {
      label: "school",
      user: data.school,
      folderName: `${slugify(data.school.name || "school")}-${shortId(data.school.id)}`,
      password: SMOKE_PASSWORD,
      targets: [
        { slug: "dashboard-home", path: "/dashboard" },
        { slug: "dashboard-profile", path: "/dashboard/profile" },
        { slug: "dashboard-school", path: "/dashboard/school" },
        { slug: "dashboard-jobs", path: "/dashboard/jobs" },
        { slug: "dashboard-my-jobs", path: "/dashboard/my-jobs" },
        { slug: "dashboard-post-job", path: "/dashboard/post-job" },
        { slug: "dashboard-applicants", path: "/dashboard/applicants" },
        { slug: "dashboard-messages", path: "/dashboard/messages" },
        { slug: "dashboard-interviews", path: "/dashboard/interviews" },
        { slug: "dashboard-analytics", path: "/dashboard/analytics" },
        { slug: "dashboard-notifications", path: "/dashboard/notifications" },
        { slug: "dashboard-alerts", path: "/dashboard/alerts" },
        { slug: "dashboard-billing", path: "/dashboard/billing" },
        { slug: "dashboard-subscription", path: "/dashboard/subscription" },
        { slug: "dashboard-settings", path: "/dashboard/settings" },
        { slug: "dashboard-pipeline", path: "/dashboard/pipeline" },
        { slug: "job-applicants", path: `/dashboard/my-jobs/${data.job.id}/applicants` },
      ],
    },
    {
      label: "outsider-school",
      user: data.outsiderSchool,
      folderName: `${slugify(data.outsiderSchool.name || "outsider-school")}-${shortId(data.outsiderSchool.id)}`,
      password: SMOKE_PASSWORD,
      targets: [
        { slug: "dashboard-home", path: "/dashboard" },
        { slug: "dashboard-profile", path: "/dashboard/profile" },
        { slug: "dashboard-school", path: "/dashboard/school" },
        { slug: "dashboard-jobs", path: "/dashboard/jobs" },
        { slug: "dashboard-my-jobs", path: "/dashboard/my-jobs" },
        { slug: "dashboard-post-job", path: "/dashboard/post-job" },
        { slug: "dashboard-applicants", path: "/dashboard/applicants" },
        { slug: "dashboard-messages", path: "/dashboard/messages" },
        { slug: "dashboard-interviews", path: "/dashboard/interviews" },
        { slug: "dashboard-analytics", path: "/dashboard/analytics" },
        { slug: "dashboard-notifications", path: "/dashboard/notifications" },
        { slug: "dashboard-alerts", path: "/dashboard/alerts" },
        { slug: "dashboard-billing", path: "/dashboard/billing" },
        { slug: "dashboard-subscription", path: "/dashboard/subscription" },
        { slug: "dashboard-settings", path: "/dashboard/settings" },
        { slug: "dashboard-pipeline", path: "/dashboard/pipeline" },
      ],
    },
    {
      label: "pending-school",
      user: data.pendingSchool,
      folderName: `${slugify(data.pendingSchool.name || "pending-school")}-${shortId(data.pendingSchool.id)}`,
      password: SMOKE_PASSWORD,
      targets: [
        { slug: "dashboard-home", path: "/dashboard" },
        { slug: "dashboard-profile", path: "/dashboard/profile" },
        { slug: "dashboard-school", path: "/dashboard/school" },
        { slug: "dashboard-jobs", path: "/dashboard/jobs" },
        { slug: "dashboard-my-jobs", path: "/dashboard/my-jobs" },
        { slug: "dashboard-post-job", path: "/dashboard/post-job" },
        { slug: "dashboard-applicants", path: "/dashboard/applicants" },
        { slug: "dashboard-messages", path: "/dashboard/messages" },
        { slug: "dashboard-interviews", path: "/dashboard/interviews" },
        { slug: "dashboard-analytics", path: "/dashboard/analytics" },
        { slug: "dashboard-notifications", path: "/dashboard/notifications" },
        { slug: "dashboard-alerts", path: "/dashboard/alerts" },
        { slug: "dashboard-billing", path: "/dashboard/billing" },
        { slug: "dashboard-subscription", path: "/dashboard/subscription" },
        { slug: "dashboard-settings", path: "/dashboard/settings" },
        { slug: "dashboard-pipeline", path: "/dashboard/pipeline" },
      ],
    },
    {
      label: "admin",
      user: data.admin,
      folderName: `${slugify(data.admin.name || "admin")}-${shortId(data.admin.id)}`,
      password: SMOKE_PASSWORD,
      targets: [
        { slug: "admin-home", path: "/admin" },
        { slug: "admin-teachers", path: "/admin/teachers" },
        { slug: "admin-schools", path: "/admin/schools" },
        { slug: "admin-offline-schools", path: "/admin/offline-schools" },
        { slug: "admin-managed-jobs", path: "/admin/managed-jobs" },
        { slug: "admin-jobs", path: "/admin/jobs" },
        { slug: "admin-audit", path: "/admin/audit" },
      ],
    },
  ].filter((entry) => {
    if (entry.label === "teacher") {
      return Boolean(teacherProfileId);
    }
    if (entry.label === "school" || entry.label === "outsider-school" || entry.label === "pending-school") {
      return Boolean(schoolProfileId || entry.user.role === "SCHOOL_ADMIN");
    }
    return true;
  });
}

async function captureSharedPages(page, sharedDir, jobId) {
  const output = [];
  for (const target of [...SHARED_TARGETS, { slug: "public-job", path: `/jobs/${jobId}` }]) {
    const filePath = path.join(sharedDir, `${target.slug}.png`);
    await captureRoute(page, target.path, filePath);
    output.push({ route: target.path, file: path.relative(process.cwd(), filePath) });
    console.log(`CAPTURED ${path.relative(process.cwd(), filePath)}`);
  }
  return output;
}

async function captureUserFolder(browser, entry) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  await page.setViewport(VIEWPORT);

  const userDir = path.join(OUTPUT_DIR, entry.folderName);
  ensureDir(userDir);

  const manifest = {
    generatedAt: new Date().toISOString(),
    user: {
      id: entry.user.id,
      name: entry.user.name,
      email: entry.user.email,
      role: entry.user.role,
    },
    screenshots: [],
  };

  try {
    await signIn(page, entry.user.email, entry.password);
    for (const target of entry.targets) {
      const filePath = path.join(userDir, `${target.slug}.png`);
      await captureRoute(page, target.path, filePath);
      manifest.screenshots.push({
        route: target.path,
        file: path.relative(process.cwd(), filePath),
      });
      console.log(`CAPTURED ${path.relative(process.cwd(), filePath)}`);
    }

    fs.writeFileSync(path.join(userDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  } finally {
    await page.close();
    await context.close();
  }
}

async function run() {
  ensureDir(OUTPUT_DIR);

  const prisma = new PrismaClient();
  const browser = await launchBrowser();

  try {
    const data = await loadSmokeData(prisma);
    const sharedDir = path.join(OUTPUT_DIR, "shared");
    ensureDir(sharedDir);

    const sharedContext = await browser.createBrowserContext();
    const sharedPage = await sharedContext.newPage();
    sharedPage.setDefaultTimeout(20000);
    await sharedPage.setViewport(VIEWPORT);
    const sharedManifest = {
      generatedAt: new Date().toISOString(),
      screenshots: [],
    };

    try {
      const sharedScreenshots = await captureSharedPages(sharedPage, sharedDir, data.job.id);
      sharedManifest.screenshots = sharedScreenshots;
      fs.writeFileSync(path.join(sharedDir, "manifest.json"), JSON.stringify(sharedManifest, null, 2));
    } finally {
      await sharedPage.close();
      await sharedContext.close();
    }

    for (const entry of buildUserTargets(data)) {
      await captureUserFolder(browser, entry);
    }

    console.log(`DONE ${path.relative(process.cwd(), OUTPUT_DIR)}`);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("Screenshot capture failed:", error);
  process.exitCode = 1;
});
