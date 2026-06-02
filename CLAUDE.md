# EduHire — Claude Code Reference

Teacher-school hiring platform for Tamil Nadu. Next.js 15 App Router + Prisma + Supabase + NextAuth v4.

---

## Stack

| Layer       | Choice                                              |
|-------------|-----------------------------------------------------|
| Framework   | Next.js 15 App Router                               |
| Language    | TypeScript 5.7                                      |
| Auth        | NextAuth v4, JWT, 30-day session                    |
| DB          | Supabase Postgres via Prisma 6                      |
| Storage     | Supabase Storage                                    |
| Email       | Resend (`src/lib/email.ts`)                         |
| UI          | Tailwind 3 + shadcn/ui                              |
| Forms       | react-hook-form + Zod                               |
| State       | Zustand 5 (client), Server Actions (server)         |
| AI          | Anthropic Claude — recs + JD improvement            |
| PDF         | Puppeteer Core + @sparticuz/chromium                |
| Charts      | Recharts                                            |
| Animation   | Framer Motion 12                                    |
| Toasts      | Sonner                                              |

---

## Roles

| Role           | Entry point            | Notes                                      |
|----------------|------------------------|--------------------------------------------|
| `TEACHER`      | `/dashboard/applications` | Google OAuth always lands here           |
| `SCHOOL_ADMIN` | `/dashboard/school`    | Credentials signup only                    |
| `ADMIN`        | `/admin`               | Platform superadmin                        |

Google OAuth → always `TEACHER`. School admins register via `/auth/signup` with credentials.

---

## Route Structure

```
src/app/
  (public)/
    page.tsx                  Landing
    jobs/
      page.tsx                Job board
      [id]/page.tsx           Job detail + apply
    profile/[id]/page.tsx     Public teacher profile

  (auth)/
    auth/
      signin/page.tsx
      signup/page.tsx

  (dashboard)/
    layout.tsx                Role-aware sidebar
    dashboard/
      page.tsx                Role-aware home (redirects by role)
      my-jobs/                School: posted jobs | Teacher: applied jobs
      post-job/               School only
      pipeline/               School only (FF: PIPELINE_BOARD)
      applicants/             School only
      applications/           Teacher only
      profile/                Both roles
      analytics/              School only
      school/                 School profile page
      alerts/                 Teacher only
      recommendations/        Teacher only (AI-powered)
      interviews/             Both roles
      saved/                  Teacher only
      resumes/                Teacher only
      notifications/          Both (FF: NOTIFICATIONS_CENTER)
      billing/                Both
      subscription/           Both
      settings/               Both
      messages/               Both (FF: MESSAGING)

  (admin)/
    layout.tsx                Admin guard
    admin/
      page.tsx                Dashboard
      schools/page.tsx
      teachers/page.tsx
      jobs/page.tsx
      audit/page.tsx

  api/
    auth/[...nextauth]/       NextAuth handler
    jobs/
      route.ts                GET list, POST create
      [id]/
        route.ts              GET, PATCH, DELETE
        apply/route.ts        Teacher apply
        applicants/route.ts   School view applicants
        candidates/ranked/    AI-ranked candidate list
    applications/
      [id]/
        status/route.ts       PATCH status
        history/route.ts      GET status log
    alerts/
      route.ts                CRUD job alerts
      send/route.ts           Trigger alert email
    ai/
      recommendations/        Teacher AI recs
      improve-job/            JD improver
    profile/route.ts          Own profile GET/PATCH
    users/[id]/profile/       Public read
    dashboard/analytics/      School stats
    billing/route.ts          Subscription info
    contact/route.ts          Rate-limited contact form
    schools/route.ts          School profile CRUD
    teacher-documents/        Resume/video/lesson plans
    interviews/route.ts       Schedule + manage
    notifications/route.ts    In-app notifications
    messages/                 (FF: MESSAGING — flagged)
    settings/route.ts         Account settings
    resumes/generate/         PDF generation
    admin/
      schools/route.ts
      teachers/route.ts
      jobs/route.ts
      stats/route.ts
      audit/route.ts
    cron/                     Protected by CRON_SECRET
    managed-recruitment/      School submits req, admin sources
    upload/                   Supabase storage upload
    profile-views/            View tracking
    saved-jobs/               Teacher save/unsave
    account/                  Account management
```

---

## Middleware (`src/middleware.ts`)

Runs on: `/`, `/dashboard/:path*`, `/auth/:path*`, `/api/admin/:path*`, `/admin/:path*`

| Condition                        | Action                                    |
|----------------------------------|-------------------------------------------|
| `/dashboard/*` + no token        | Redirect → `/auth/signin?callbackUrl=…`   |
| School-only route + TEACHER      | Redirect → `/dashboard/applications`      |
| Teacher-only route + SCHOOL_ADMIN| Redirect → `/dashboard/school`            |
| `/auth/*` + token (SCHOOL_ADMIN) | Redirect → `/dashboard/school`            |
| `/auth/*` + token (ADMIN)        | Redirect → `/admin`                       |
| `/auth/*` + token (TEACHER)      | Redirect → `/dashboard/applications`      |
| `/` + token                      | Redirect by role (same as above)          |

School-only routes: `school, post-job, my-jobs, applicants, pipeline, analytics`
Teacher-only routes: `applications, saved, resumes, alerts, recommendations`

---

## Data Models (key fields)

```
User
  id, email, role (TEACHER|SCHOOL_ADMIN|ADMIN)
  name, image, passwordHash, createdAt

TeacherProfile
  userId, subjects[], grades[], boards[]
  location, district, state
  experience, experienceLevel (enum)
  bio, availability (enum), verified (enum)
  salaryMin, salaryMax, preferredJobType

SchoolProfile
  userId, schoolName, board (enum)
  location, district, city, state, pincode
  description, website, logo
  verificationStatus (enum)

Job (JobPosting)
  id, schoolId (→ SchoolProfile)
  title, subject, grade, board
  jobType (enum), experienceLevel (enum)
  experience, salaryMin, salaryMax
  location, description
  status (DRAFT|ACTIVE|CLOSED|EXPIRED)

Application
  id, jobId, teacherId
  status (PENDING|REVIEWED|SHORTLISTED|REJECTED|HIRED|INTERVIEW_SCHEDULED|INTERVIEW_COMPLETED)
  matchScore (0–100), coverLetter, rejectionReason (enum)

Interview
  applicationId, scheduledAt, type (VIDEO|PHONE|IN_PERSON)
  status (PENDING|CONFIRMED|CANCELLED|COMPLETED|NO_SHOW)
  meetingLink, notes

Alert
  teacherId, subject, location, jobType
  frequency (IMMEDIATE|DAILY_DIGEST|WEEKLY_DIGEST), active

Notification
  userId, type (GENERAL|APPLICATION|INTERVIEW|MESSAGE|SYSTEM)
  title, message, read, link

SchoolSubscription
  schoolUserId, plan (FREE|GROWTH|PRO), status (ACTIVE|TRIALING|PAST_DUE|CANCELED)
  postsUsedThisCycle, cycleResetAt

TeacherSubscription
  teacherUserId, plan (FREE|PRO), status

ManagedRecruitment
  schoolId, requirements, status (PENDING|IN_PROGRESS|COMPLETED|CANCELLED)
```

Full schema: [prisma/schema.prisma](prisma/schema.prisma)

---

## AI Matching Engine (`src/lib/ai-match.ts`)

Pure scoring function — no DB access, fully deterministic.

| Factor   | Weight | Logic                                       |
|----------|--------|---------------------------------------------|
| Subject  | 40%    | Jaccard similarity on subject arrays        |
| Location | 20%    | Exact district match → 1.0, city → 0.5     |
| Board    | 20%    | Exact board match                           |
| Salary   | 10%    | Range overlap ratio                         |
| Experience | 10%  | Numeric range overlap                       |

Returns `MatchResult { score, scorePercent, breakdown, explanation }`.

AI narrative recommendations use Claude (ANTHROPIC_MODEL) via `/api/ai/recommendations`.

---

## Subscription Gates (`src/lib/subscription.ts`)

| Plan   | School job posts | AI features | Pipeline board | Managed recruitment |
|--------|-----------------|-------------|----------------|---------------------|
| FREE   | 2 / cycle       | No          | No             | No                  |
| GROWTH | 10 / cycle      | Yes         | Yes            | No                  |
| PRO    | Unlimited       | Yes         | Yes            | Yes                 |

| Teacher Plan | Features                                  |
|--------------|-------------------------------------------|
| FREE         | Apply, basic profile                      |
| PRO          | Priority listing, advanced filters        |

Gate functions: `canPostJob(userId)`, `getSchoolPlan(userId)`, `getTeacherPlan(userId)`.
No subscription record = treated as FREE.

---

## Feature Flags (`src/config/feature-flags.ts`)

All flags are `NEXT_PUBLIC_*` env vars (read as `"0"`/`"1"`).
Use `isFeatureEnabled(flagName)` to check. Wrap flagged UI with this — never check env directly in components.

| Flag key               | Env var                              | Default | Status        |
|------------------------|--------------------------------------|---------|---------------|
| `pipelineBoard`        | `NEXT_PUBLIC_FF_PIPELINE_BOARD`      | off     | In development|
| `messaging`            | `NEXT_PUBLIC_FF_MESSAGING`           | off     | Flagged       |
| `notificationsCenter`  | `NEXT_PUBLIC_FF_NOTIFICATIONS_CENTER`| off     | Flagged       |
| `settingsSecurity`     | `NEXT_PUBLIC_FF_SETTINGS_SECURITY`   | off     | Flagged       |
| `twoFactorAuth`        | `NEXT_PUBLIC_FF_2FA`                 | off     | Flagged       |
| `schoolLiveUpdates`    | `NEXT_PUBLIC_FF_SCHOOL_LIVE_UPDATES` | **on**  | Live          |

Rollout order: PIPELINE_BOARD → MESSAGING → NOTIFICATIONS_CENTER → SETTINGS_SECURITY → TWO_FACTOR

---

## Key Libraries

| File                             | Purpose                                      |
|----------------------------------|----------------------------------------------|
| `src/lib/auth.ts`                | NextAuth config, session + JWT shape         |
| `src/lib/prisma.ts`              | Prisma singleton — always use this           |
| `src/lib/subscription.ts`        | Plan gates, post-limit checks                |
| `src/lib/ai-match.ts`            | Deterministic candidate scoring              |
| `src/lib/notifications.ts`       | Create in-app notifications                  |
| `src/lib/email.ts`               | Resend templates                             |
| `src/lib/storage.ts`             | Supabase storage helpers                     |
| `src/lib/rate-limit.ts`          | In-memory rate limiter (per-IP)              |
| `src/lib/sanitize.ts`            | Strip/escape user strings                    |
| `src/lib/security.ts`            | CSRF, security event logging                 |
| `src/lib/session.ts`             | Session token helpers                        |
| `src/lib/logger.ts`              | Structured logger                            |
| `src/lib/domain-events.ts`       | Domain event bus                             |
| `src/lib/background-jobs.ts`     | Background job queue                         |
| `src/lib/analytics.ts`           | School analytics helpers                     |
| `src/lib/utils.ts`               | `cn()` and misc utils                        |
| `src/config/constants.ts`        | Enums, dropdown values, experience ranges    |
| `src/config/feature-flags.ts`    | Flag reader                                  |

### API clients (no raw fetch in components)

| File                             | Covers                       |
|----------------------------------|------------------------------|
| `src/lib/api/client.ts`          | Base fetch wrapper           |
| `src/lib/api/jobs-client.ts`     | Job CRUD                     |
| `src/lib/api/applications-client.ts` | Application actions      |
| `src/lib/api/profile-client.ts`  | Profile read/write           |
| `src/lib/api/school-client.ts`   | School profile               |
| `src/lib/api/teacher-client.ts`  | Teacher-specific             |
| `src/lib/api/alerts-client.ts`   | Job alerts                   |
| `src/lib/api/interview.ts`       | Interview schedule           |
| `src/lib/api/dashboard-client.ts`| Analytics                    |
| `src/lib/api/hiring-client.ts`   | Hiring pipeline              |
| `src/lib/api/admin-client.ts`    | Admin actions                |

### Validators (`src/lib/validators/`)

Zod schemas: `job.ts`, `application.ts`, `profile.ts`, `interview.ts`

### Policies (`src/lib/policies/`)

Authorization policies: `job-policy.ts`, `application-policy.ts`, `document-policy.ts`

---

## Supabase Storage Buckets

| Bucket              | Max size | Allowed types         |
|---------------------|----------|-----------------------|
| `Resumes`           | 5 MB     | pdf, doc, docx        |
| `avatar`            | —        | image/*               |
| `school-logos`      | —        | image/*               |
| `TeacherDemoVideos` | 100 MB   | video/*               |
| `TeacherLessonPlans`| 10 MB    | pdf, pptx, doc        |

---

## Environment Variables

```bash
# Database
DATABASE_URL=          # Supabase pooler (pgbouncer=true)
DIRECT_URL=            # Direct connection for migrations

# App
NEXTAUTH_URL=
NEXT_PUBLIC_APP_URL=
APP_URL=
NEXTAUTH_SECRET=       # openssl rand -base64 32

# Google OAuth (TEACHER only)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
RESEND_API_KEY=
EMAIL_FROM=            # EduHire <noreply@theeduhire.in>
ADMIN_EMAIL=

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=       # claude-3-5-sonnet-latest

# Ops
CRON_SECRET=           # All /api/cron/* routes check this
SEED_DEFAULT_PASSWORD=

# Feature flags (0 = off, 1 = on)
NEXT_PUBLIC_FF_PIPELINE_BOARD=0
NEXT_PUBLIC_FF_MESSAGING=0
NEXT_PUBLIC_FF_NOTIFICATIONS_CENTER=0
NEXT_PUBLIC_FF_SETTINGS_SECURITY=0
NEXT_PUBLIC_FF_2FA=0
NEXT_PUBLIC_FF_SCHOOL_LIVE_UPDATES=1

# Future / not yet wired
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
# MSG91_AUTH_KEY=
# POSTHOG_KEY=
```

---

## Commands

```bash
# Dev
npm run dev
npm run build
npm run lint

# Database
npm run db:push          # Schema push without migration history
npm run db:migrate       # Create + run migration (use for prod)
npm run db:studio        # Prisma Studio GUI
npm run db:generate      # Regenerate Prisma client

# Seeding
npm run db:seed          # Base seed (users, profiles)
npm run db:seed:jobs     # Job postings
npm run db:seed:schools  # School profiles
npm run db:seed:phase4   # Phase 4 data
npm run db:reseed:demo   # Wipe + full reseed
npm run db:seed:smoke    # Minimal smoke-test dataset

# Background queues
npm run queues:process   # Process platform background queues

# Tests (TypeScript scripts, not Jest)
npm run test:auth-branching
npm run test:school-workflow
npm run test:teacher-workflow
npm run test:admin-workflow
npm run test:domain-modules
npm run test:api-authz
npm run test:production-hardening
npm run test:visual-audit
npm run test:smoke           # Run all smoke tests
```

---

## Auth Flow

1. POST `/auth/signin` — credentials or Google OAuth
2. Google sign-in **always** creates/finds a `TEACHER` role user
3. JWT payload: `{ id, email, name, role, sessionToken }`
4. Session TTL: 30 days
5. Middleware enforces role-based redirects on every request
6. API routes must re-validate session + role before any DB write

---

## Coding Conventions

**Auth & security**
- Always call `getServerSession(authOptions)` at the top of every API route; check `session.user.role` before any DB operation
- Never skip role checks even when the route seems "safe"
- Use policies in `src/lib/policies/` for authorization logic
- Rate-limit all public mutations via `src/lib/rate-limit.ts`
- Sanitize all user-supplied strings via `src/lib/sanitize.ts`

**Database**
- Always import from `src/lib/prisma.ts` — never `new PrismaClient()`
- Prefer `select` over returning full models to avoid over-fetching
- Use `DIRECT_URL` for migrations, `DATABASE_URL` for queries (pgbouncer-compatible)

**Components**
- Server Components by default; add `"use client"` only when you need hooks, events, or browser APIs
- Never call `fetch()` directly in components — use the API clients in `src/lib/api/*-client.ts`
- Validate all form input with Zod schemas in `src/lib/validators/`
- Wrap any feature-flagged UI with `isFeatureEnabled(flagName)` from `src/config/feature-flags.ts`

**Style**
- No comments unless the WHY is non-obvious
- No docstrings or multi-line comment blocks
- Tailwind utility classes; `cn()` from `src/lib/utils.ts` for conditional class merging

---

## Component Structure

```
src/components/
  ui/                  Primitive shadcn/ui components (button, badge, modal, etc.)
  forms/               Form components (apply-form, post-job-form, profile-form, contact-form)
  dashboard/           Dashboard widgets (school-analytics, etc.)
  admin/               Admin-specific components
  analytics/           Chart components (Recharts)
  applications/        Application list / cards
  interviews/          Interview scheduling UI
  jobs/                Job cards, filters
  layout/              Nav, sidebar, shell
  marketing/           Landing page sections
  notifications/       Notification items
  profile/             Profile view/edit
  recommendations/     AI recommendation cards
  system/              Error boundaries, loading states
  OnboardingChecklist.tsx   New user onboarding flow
```

---

## Branch: `mvp+1`

Active work on this branch:
- Subscription system (school + teacher plans, billing dashboard)
- Admin panel improvements (schools, teachers, audit log)
- Managed recruitment flow
- May 2026 audit fixes (11 bugs: encoding, wrong links, hardcoded avatars, admin redirect, flag guards, sign-out dropdown, RSVP, inline confirm, legacy file cleanup)

Planned (not yet wired): Razorpay payments, MSG91 SMS, PostHog analytics.
