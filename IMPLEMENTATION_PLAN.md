# EduHire — Marketing vs. Webapp Gap Implementation Plan

**Date:** 2026-05-11  
**Branch:** mvp+1  
**Purpose:** Close every gap between what the marketing site promises and what the webapp delivers.  
**Audience:** Any coding agent with read access to this repo.

---

## How to read this document

- Each task has a **Goal**, **Why it matters**, **Exact files to touch**, and **Precise code changes**.
- Tasks are grouped into sprints. Do Sprint 1 before Sprint 2, etc.
- Every file path is relative to the repo root.
- Every line number is verified against the current codebase as of 2026-05-11.
- After every schema change, run `npx prisma migrate dev --name <task-name>` and `npx prisma generate`.
- After every change, run `npx tsc --noEmit` to catch type errors.

---

## Sprint 1 — Quick Wins (no schema changes, ship same day)

---

### Task 1.1 — Fix Karnataka placeholder defaults in signup

**Goal:** Remove Bengaluru/Karnataka hardcoded defaults that contradict the Tamil Nadu-first positioning.

**Files:**
- `src/app/(auth)/auth/signup/page.tsx`

**Changes:**

1. Line 49 — change default location state:
   ```ts
   // BEFORE
   const [location, setLocation] = useState("Bengaluru, Karnataka");
   // AFTER
   const [location, setLocation] = useState("");
   ```

2. Line 50 — change default subjects:
   ```ts
   // BEFORE
   const [subjects, setSubjects] = useState<string[]>(["Mathematics", "Physics"]);
   // AFTER
   const [subjects, setSubjects] = useState<string[]>([]);
   ```

3. Line 47 — change default experience:
   ```ts
   // BEFORE
   const [experience, setExperience] = useState("6 years");
   // AFTER
   const [experience, setExperience] = useState("");
   ```

**Verify:** Open `/auth/signup?role=teacher&step=details` — all fields must start blank.

---

### Task 1.2 — Fix salary label inconsistency (INR/year vs monthly)

**Goal:** The schema stores salary as **monthly INR** (confirmed: `prisma/schema.prisma:172, :265-266`). The post-job form labels it as `/year` and the public profile renders it as `L / year`. Fix all display points to show monthly.

**Files:**
- `src/app/(dashboard)/dashboard/post-job/page.tsx`
- `src/app/(public)/profile/[id]/page.tsx`

**Changes:**

File 1 — `post-job/page.tsx`, lines 485 and 489:
```tsx
// BEFORE
<label className="eh-label">Min salary (INR/year)</label>
...
<label className="eh-label">Max salary (INR/year)</label>

// AFTER
<label className="eh-label">Min salary (₹/month)</label>
...
<label className="eh-label">Max salary (₹/month)</label>
```

File 2 — `profile/[id]/page.tsx`, line 242:
```tsx
// BEFORE
₹{(profile.expectedSalary / 100000).toFixed(1)}L / year

// AFTER
₹{profile.expectedSalary.toLocaleString("en-IN")}/month
```

Also search for any other salary rendering in `src/app/(dashboard)/dashboard/applicants/page.tsx` and `src/app/(dashboard)/dashboard/recommendations/page.tsx` — anywhere `expectedSalary` or `salaryMin`/`salaryMax` is displayed, ensure it shows `/month` not `/year`.

**Verify:** Post a job, view a teacher profile — salary units must be consistent everywhere.

---

### Task 1.3 — Surface fit score dimension breakdown in Recommendations UI

**Goal:** `src/lib/ai-match.ts` already computes `breakdown: { subject, location, board, salary, experience }` and stores it. The recommendations page shows only an overall % — surface the breakdown.

**How the data flows:**  
`computeMatchScore()` → stored in `AIMatchScore` table → served by `GET /api/ai/recommendations` → displayed in `src/app/(dashboard)/dashboard/recommendations/page.tsx`

**Files:**
- `src/app/api/ai/recommendations/route.ts`
- `src/app/(dashboard)/dashboard/recommendations/page.tsx`

**Step 1 — Check what the recommendations API returns.**  
Open `src/app/api/ai/recommendations/route.ts` and verify whether `breakdown` is included in the select/return. If `breakdown` is not in the Prisma select, add it:
```ts
select: {
  score: true,
  explanation: true,
  breakdown: true,   // ADD THIS if missing
  updatedAt: true,
}
```

**Step 2 — In `recommendations/page.tsx`**, find where `matchScore` or `scorePercent` is rendered for each recommendation card. Below the existing score display, add dimension bars:

```tsx
{rec.breakdown && (
  <div className="mt-2 space-y-1">
    {[
      { label: "Subject", value: rec.breakdown.subject },
      { label: "Location", value: rec.breakdown.location },
      { label: "Board", value: rec.breakdown.board },
      { label: "Salary", value: rec.breakdown.salary },
      { label: "Experience", value: rec.breakdown.experience },
    ].map(({ label, value }) => (
      <div key={label} className="flex items-center gap-2">
        <span className="w-16 text-[11px] text-[var(--eh-text-4)]">{label}</span>
        <div className="h-1.5 flex-1 rounded-full bg-[var(--eh-border)]">
          <div
            className="h-1.5 rounded-full bg-[var(--eh-accent)]"
            style={{ width: `${Math.round(value * 100)}%` }}
          />
        </div>
        <span className="w-8 text-right text-[11px] text-[var(--eh-text-3)]">
          {Math.round(value * 100)}%
        </span>
      </div>
    ))}
  </div>
)}
```

**Verify:** Dashboard → Recommendations — each job card should show 5 dimension bars.

---

## Sprint 2 — Schema Expansion (requires migration)

Run one migration per task, or batch all schema changes into one migration at the end of this sprint.

---

### Task 2.1 — Expand AvailabilityStatus enum + add preferredJobType to TeacherProfile

**Goal 1:** Marketing promises 6 availability states. Schema has 3. Fix both the enum and validator.  
**Goal 2:** Signup collects `preferredJobType` (Full-time/Part-time/Substitute/Online/Hybrid) at `src/app/(auth)/auth/signup/page.tsx:342-348` but `src/app/api/auth/register/route.ts:134-142` never saves it to the database. Fix the data loss.

**Files:**
- `prisma/schema.prisma`
- `src/lib/validators/profile.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/(auth)/auth/signup/page.tsx`
- `src/app/(dashboard)/dashboard/profile/page.tsx`

**Step 1 — Schema changes in `prisma/schema.prisma`:**

Replace the `AvailabilityStatus` enum (lines 66-70):
```prisma
// BEFORE
enum AvailabilityStatus {
  ACTIVELY_LOOKING
  OPEN_TO_OFFERS
  NOT_LOOKING
}

// AFTER
enum AvailabilityStatus {
  ACTIVELY_LOOKING
  OPEN_TO_OFFERS
  NOT_LOOKING
  IMMEDIATE_JOINER
  PART_TIME_ONLY
  ONLINE_ONLY
  EXAM_SEASON
}
```

Add fields to `TeacherProfile` model (after line 173, before `createdAt`):
```prisma
preferredJobTypes  String[]  @default([]) @map("preferred_job_types")
noticePeriodDays   Int?      @map("notice_period_days")
tetStatus          String?   @map("tet_status")   // "NONE" | "TET" | "CTET" | "BOTH"
teachingMediums    String[]  @default([]) @map("teaching_mediums")
```

**Step 2 — Validator update in `src/lib/validators/profile.ts`:**

Replace `availabilityStatusSchema` (lines 5-9):
```ts
// BEFORE
export const availabilityStatusSchema = z.enum([
  "ACTIVELY_LOOKING",
  "OPEN_TO_OFFERS",
  "NOT_LOOKING",
]);

// AFTER
export const availabilityStatusSchema = z.enum([
  "ACTIVELY_LOOKING",
  "OPEN_TO_OFFERS",
  "NOT_LOOKING",
  "IMMEDIATE_JOINER",
  "PART_TIME_ONLY",
  "ONLINE_ONLY",
  "EXAM_SEASON",
]);
```

Add new fields to `teacherProfileSchema` object (after `availabilityStatus` field):
```ts
preferredJobTypes: z.array(z.string()).default([]),
noticePeriodDays: z.coerce.number().int().min(0).max(365).optional(),
tetStatus: z.enum(["NONE", "TET", "CTET", "BOTH"]).optional(),
teachingMediums: z.array(z.string()).default([]),
```

**Step 3 — Fix data loss in `src/app/api/auth/register/route.ts`:**

In the `teacherProfile.create` block (lines 134-142), add the new fields:
```ts
// BEFORE
await tx.teacherProfile.create({
  data: {
    userId: newUser.id,
    experience: teacherProfile?.experience?.trim() || null,
    city: teacherProfile?.city?.trim() || null,
    subjects: normalizedSubjects,
  },
});

// AFTER
await tx.teacherProfile.create({
  data: {
    userId: newUser.id,
    experience: teacherProfile?.experience?.trim() || null,
    city: teacherProfile?.city?.trim() || null,
    subjects: normalizedSubjects,
    preferredJobTypes: Array.isArray(teacherProfile?.preferredJobType)
      ? teacherProfile.preferredJobType
      : teacherProfile?.preferredJobType
      ? [teacherProfile.preferredJobType]
      : [],
  },
});
```

**Step 4 — Fix signup payload in `src/app/(auth)/auth/signup/page.tsx`:**

Find the `fetch("/api/auth/register", ...)` call (around line 113). The body includes `teacherProfile: { ... }`. Add `preferredJobType: jobType` to that object:
```ts
teacherProfile: {
  experience,
  city: location,
  subjects,
  preferredJobType: jobType,   // ADD THIS
},
```

**Step 5 — Update the profile edit form in `src/app/(dashboard)/dashboard/profile/page.tsx`:**

Find the `availabilityStatus` select/dropdown. Add the 4 new enum options alongside their display labels:
```
IMMEDIATE_JOINER  → "Available immediately"
PART_TIME_ONLY    → "Part-time only"
ONLINE_ONLY       → "Online classes only"
EXAM_SEASON       → "Exam season / revision"
```

Also add UI fields for `tetStatus` (dropdown: None / TET / CTET / Both) and `teachingMediums` (multi-select chips: Tamil / English / Hindi / Other).

**Run migration:**
```bash
npx prisma migrate dev --name expand-teacher-profile
npx prisma generate
npx tsc --noEmit
```

---

### Task 2.2 — Add Teacher Passport fields (TET, demo video, lesson plan)

**Goal:** Marketing promises a "Teacher Passport" that includes demo class videos, lesson plans, and TET/CTET status. The schema has none of these. Add them and wire up upload + display.

**Files:**
- `prisma/schema.prisma`
- `src/app/api/profile/route.ts`
- `src/app/api/upload/resume/route.ts` (clone pattern for demo video)
- `src/app/(dashboard)/dashboard/profile/page.tsx`
- `src/app/(public)/profile/[id]/page.tsx`
- `src/app/(dashboard)/dashboard/my-jobs/[id]/applicants/page.tsx`

**Step 1 — Schema changes in `prisma/schema.prisma`:**

Add to `TeacherProfile` model (these may overlap with Task 2.1 — batch them into the same migration):
```prisma
demoVideoUrl    String?  @map("demo_video_url")
lessonPlanUrl   String?  @map("lesson_plan_url")
pocsoAcknowledged Boolean @default(false) @map("pocso_acknowledged")
```

**Step 2 — Create upload endpoint for demo video:**

Create new file `src/app/api/upload/demo-video/route.ts`.  
Copy the entire content of `src/app/api/upload/resume/route.ts` as a starting point.  
Change:
- The allowed MIME types to: `["video/mp4", "video/quicktime", "video/webm"]`
- Max file size to 100MB
- After successful upload, update `teacherProfile.demoVideoUrl` with the returned URL (same pattern as the resume upload updates the Resume model)

**Step 3 — Create upload endpoint for lesson plan:**

Create new file `src/app/api/upload/lesson-plan/route.ts`.  
Same pattern as demo-video upload but:
- Allowed MIME types: `["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]`
- Max file size: 10MB
- After upload, update `teacherProfile.lessonPlanUrl`

**Step 4 — Update profile API to read/write new fields:**

In `src/app/api/profile/route.ts`, ensure the GET response includes `demoVideoUrl`, `lessonPlanUrl`, `pocsoAcknowledged`, `tetStatus`, `teachingMediums`, `preferredJobTypes`, `noticePeriodDays`.

In the PATCH handler, accept and update these same fields (they flow through `teacherProfileSchema` which was updated in Task 2.1).

**Step 5 — Add "Teacher Passport" section to profile edit page:**

In `src/app/(dashboard)/dashboard/profile/page.tsx`, add a new section card after the existing qualifications section titled "Teaching Credentials":

- **TET/CTET Status** — dropdown (None / TET cleared / CTET cleared / Both cleared)
- **Teaching Medium** — multi-select chips (Tamil / English / Hindi / Other)
- **Notice Period** — number input with label "Notice period (days)"
- **Demo Class Video** — file upload button, calls `POST /api/upload/demo-video`, shows video player if `demoVideoUrl` is set
- **Lesson Plan** — file upload button, calls `POST /api/upload/lesson-plan`, shows link if `lessonPlanUrl` is set
- **POCSO Acknowledgement** — checkbox: "I have read and agree to follow POCSO (Protection of Children from Sexual Offences) guidelines in all school interactions." Sets `pocsoAcknowledged: true` on save.

**Step 6 — Show demo video on public profile:**

In `src/app/(public)/profile/[id]/page.tsx`, after the bio section, add:
```tsx
{profile.demoVideoUrl && (
  <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Demo Class</p>
    <video
      className="mt-3 w-full rounded-xl"
      controls
      src={profile.demoVideoUrl}
      preload="metadata"
    />
  </section>
)}
```

Also expose `demoVideoUrl`, `lessonPlanUrl`, `pocsoAcknowledged`, `tetStatus`, `teachingMediums` in `src/app/api/users/[id]/profile/route.ts` (the public profile response, lines 67-87).

**Step 7 — Show demo video indicator in applicant list:**

In `src/app/(dashboard)/dashboard/my-jobs/[id]/applicants/page.tsx`, wherever each applicant card is rendered, add a small "Demo available" badge if the applicant's teacher profile has `demoVideoUrl` set. The ranked-candidates API (`src/app/api/jobs/[id]/candidates/ranked/route.ts`) already includes the full `teacherProfile` — just read `teacherProfile.demoVideoUrl` from the response.

**Run migration:**
```bash
npx prisma migrate dev --name teacher-passport-fields
npx prisma generate
npx tsc --noEmit
```

---

### Task 2.3 — Add school trust signal fields

**Goal:** Marketing promises teachers can see a school's salary band, PF/ESI status, and payment track record. These fields don't exist on SchoolProfile.

**Files:**
- `prisma/schema.prisma`
- `src/app/api/profile/route.ts`
- `src/lib/validators/profile.ts`
- `src/app/(dashboard)/dashboard/school/page.tsx`
- `src/app/(public)/jobs/[id]/page.tsx`

**Step 1 — Schema changes:**

Add to `SchoolProfile` model in `prisma/schema.prisma` (after `logoUrl` line):
```prisma
hasPfEsi            Boolean  @default(false) @map("has_pf_esi")
paymentTrackRecord  String?  @map("payment_track_record")  // "ON_TIME" | "DELAYED" | "MIXED"
workingHours        String?  @map("working_hours")          // e.g. "8am–4pm, Mon–Sat"
udiseCode           String?  @map("udise_code")
```

**Step 2 — Update school profile validator:**

In `src/lib/validators/profile.ts`, add to `schoolProfileSchema`:
```ts
hasPfEsi: z.boolean().optional(),
paymentTrackRecord: z.enum(["ON_TIME", "DELAYED", "MIXED"]).optional(),
workingHours: z.string().max(100).optional(),
udiseCode: z.string().max(20).optional(),
```

**Step 3 — Update school profile edit page:**

In `src/app/(dashboard)/dashboard/school/page.tsx`, add a "Trust & Compliance" section with fields for:
- UDISE Code (text input)
- PF/ESI provided (toggle/checkbox)
- Payment track record (select: On time / Sometimes delayed / Mixed)
- Working hours (text input)

**Step 4 — Show on job detail page:**

In `src/app/(public)/jobs/[id]/page.tsx`, in the school info sidebar, add:
```tsx
{school.hasPfEsi && (
  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-700 border border-green-200">
    PF/ESI provided
  </span>
)}
{school.paymentTrackRecord && (
  <div>
    <p className="text-[11px] text-[var(--eh-text-4)]">Payment history</p>
    <p className="mt-0.5 text-[13px] font-semibold">
      {school.paymentTrackRecord === "ON_TIME" ? "Pays on time" :
       school.paymentTrackRecord === "DELAYED" ? "Sometimes delayed" : "Mixed record"}
    </p>
  </div>
)}
{school.workingHours && (
  <div>
    <p className="text-[11px] text-[var(--eh-text-4)]">Working hours</p>
    <p className="mt-0.5 text-[13px]">{school.workingHours}</p>
  </div>
)}
```

**Run migration:**
```bash
npx prisma migrate dev --name school-trust-signals
npx prisma generate
npx tsc --noEmit
```

---

### Task 2.4 — Add urgent vacancy / replacement pool flags

**Goal:** Marketing promises a "replacement pool" of teachers who can join within 48 hours, and urgent job flags. Neither the job nor teacher model supports this.

**Files:**
- `prisma/schema.prisma`
- `src/app/(dashboard)/dashboard/post-job/page.tsx`
- `src/app/api/jobs/route.ts`
- `src/app/(public)/jobs/page.tsx`
- `src/app/(public)/jobs/[id]/page.tsx`

**Step 1 — Schema changes:**

Add to `JobPosting` model:
```prisma
isUrgent          Boolean  @default(false) @map("is_urgent")
requiredWithin48h Boolean  @default(false) @map("required_within_48h")
```

(Note: `IMMEDIATE_JOINER` availability status added in Task 2.1 covers the teacher side.)

**Step 2 — Add toggle to job posting form:**

In `src/app/(dashboard)/dashboard/post-job/page.tsx`, add after the `jobType` field:
```tsx
<div className="flex items-center gap-3">
  <input
    type="checkbox"
    id="isUrgent"
    checked={form.isUrgent}
    onChange={(e) => setField("isUrgent", e.target.checked)}
    className="rounded"
  />
  <label htmlFor="isUrgent" className="text-[13px] font-medium">
    Urgent vacancy — needed within 48 hours
  </label>
</div>
```

Also add `isUrgent` and `requiredWithin48h` to the form state and the Zod schema used for job creation validation.

**Step 3 — Pass fields through the API:**

In `src/app/api/jobs/route.ts` POST handler, the `createJobSchema` Zod schema (find it, likely in `src/lib/validators/job.ts` or inline) needs `isUrgent: z.boolean().default(false)`. Include it in the `prisma.jobPosting.create` data.

**Step 4 — Show urgent badge on job cards and detail page:**

In `src/app/(public)/jobs/page.tsx` job card, if `job.isUrgent`, show a red "Urgent" badge.  
In `src/app/(public)/jobs/[id]/page.tsx` job header, show a similar badge.

**Step 5 — Add "Urgent / Replacement" filter tab:**

In `src/app/(public)/jobs/page.tsx`, add a filter chip "Urgent Only". When active, add `isUrgent: true` to the jobs query params.  
In `src/app/api/jobs/route.ts` GET handler, if query param `urgent=true`, add `where: { isUrgent: true }` to the Prisma query.

**Run migration:**
```bash
npx prisma migrate dev --name urgent-vacancy-flags
npx prisma generate
npx tsc --noEmit
```

---

## Sprint 3 — Trust & Safety (high-impact, medium effort)

---

### Task 3.1 — Block unverified schools from posting jobs

**Goal:** Marketing says "verified schools only." Currently any school with a profile can post jobs. Fix the gate.

**Files:**
- `src/app/api/jobs/route.ts`

**Change — lines 161-164, the school lookup select:**

```ts
// BEFORE
: await prisma.schoolProfile.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, userId: true, city: true, schoolName: true },
  });

// AFTER
: await prisma.schoolProfile.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, userId: true, city: true, schoolName: true, verificationStatus: true },
  });
```

Then after line 172 (after the `if (!school)` block), add:
```ts
if (auth.user.role !== "ADMIN" && school.verificationStatus !== "VERIFIED") {
  return NextResponse.json(
    { success: false, error: "Only verified schools can post jobs. Please complete verification first." },
    { status: 403 }
  );
}
```

**Also update the verify checklist** in `src/app/api/profile/verify/route.ts` to require UDISE code (added in Task 2.3). After line 40 (the `logoUrl` check), add:
```ts
if (!school.udiseCode?.trim()) missingFields.push("UDISE code");
```

**Verify:** As a school with `verificationStatus: UNVERIFIED`, attempt to POST to `/api/jobs` — must get 403 with a clear message.

---

### Task 3.2 — Child safety compliance checklist

**Goal:** Marketing prominently promises POCSO compliance, background checks, and a child-safety badge. Implement a functional checklist.

**Note:** `pocsoAcknowledged` field is already added to TeacherProfile in Task 2.2. This task adds the remaining fields and the admin-verified safety badge.

**Files:**
- `prisma/schema.prisma`
- `src/app/(dashboard)/dashboard/profile/page.tsx`
- `src/app/(public)/profile/[id]/page.tsx`
- `src/app/(dashboard)/dashboard/my-jobs/[id]/applicants/page.tsx`

**Step 1 — Add remaining safety fields to schema:**

Add to `TeacherProfile` (batch into existing migration or new one):
```prisma
referenceCheckDone  Boolean  @default(false) @map("reference_check_done")
codeOfConductSigned Boolean  @default(false) @map("code_of_conduct_signed")
safetyBadgeGranted  Boolean  @default(false) @map("safety_badge_granted")
```

`safetyBadgeGranted` is set to `true` by an admin (or automatically when all 3 self-declarations are true — use the latter for MVP).

**Step 2 — Add declarations to profile page:**

In `src/app/(dashboard)/dashboard/profile/page.tsx`, in the "Teaching Credentials" section from Task 2.2, add a "Child Safety" sub-section with 3 checkboxes:

```tsx
<div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
  <p className="text-[12px] font-semibold text-amber-800">Child Safety Declarations</p>
  <label className="flex items-start gap-2.5 cursor-pointer">
    <input type="checkbox" checked={form.pocsoAcknowledged} onChange={...} className="mt-0.5" />
    <span className="text-[13px] text-[var(--eh-text-2)]">
      I have read the POCSO Act guidelines and commit to child-safe conduct in all school interactions.
    </span>
  </label>
  <label className="flex items-start gap-2.5 cursor-pointer">
    <input type="checkbox" checked={form.referenceCheckDone} onChange={...} className="mt-0.5" />
    <span className="text-[13px] text-[var(--eh-text-2)]">
      I consent to reference checks from my previous employer(s) upon shortlisting.
    </span>
  </label>
  <label className="flex items-start gap-2.5 cursor-pointer">
    <input type="checkbox" checked={form.codeOfConductSigned} onChange={...} className="mt-0.5" />
    <span className="text-[13px] text-[var(--eh-text-2)]">
      I accept the EduHire Code of Conduct for educators.
    </span>
  </label>
</div>
```

**Step 3 — Auto-grant safety badge:**

In `src/app/api/profile/route.ts` PATCH handler, after updating the profile, add:
```ts
const allDeclared =
  updatedProfile.pocsoAcknowledged &&
  updatedProfile.referenceCheckDone &&
  updatedProfile.codeOfConductSigned;

if (allDeclared && !updatedProfile.safetyBadgeGranted) {
  await prisma.teacherProfile.update({
    where: { userId: auth.user.id },
    data: { safetyBadgeGranted: true },
  });
}
```

**Step 4 — Show safety badge on public profile:**

In `src/app/(public)/profile/[id]/page.tsx`, in the sidebar details section, add:
```tsx
{profile.safetyBadgeGranted && (
  <div className="flex items-center gap-1.5 rounded-xl bg-green-50 border border-green-200 px-3 py-2">
    <ShieldCheck size={14} className="text-green-600" />
    <span className="text-[12px] font-semibold text-green-700">Child Safety Verified</span>
  </div>
)}
```

**Step 5 — Show safety badge in applicant list:**

In `src/app/(dashboard)/dashboard/my-jobs/[id]/applicants/page.tsx`, show a shield icon next to applicant name if `teacherProfile.safetyBadgeGranted` is true.

**Run migration:**
```bash
npx prisma migrate dev --name child-safety-fields
npx prisma generate
```

---

### Task 3.3 — Fix document privacy in ranked-candidates API

**Goal:** `src/app/api/jobs/[id]/candidates/ranked/route.ts:60` returns raw `fileUrl` for attached resumes. Marketing says "consent-only sharing" — raw file URLs bypass any future consent layer. Replace with ID-based access.

**Files:**
- `src/app/api/jobs/[id]/candidates/ranked/route.ts`
- `src/app/api/resumes/[id]/route.ts`

**Step 1 — Strip `fileUrl` from ranked-candidates response:**

In `src/app/api/jobs/[id]/candidates/ranked/route.ts`, change the resume select (line 59-61):
```ts
// BEFORE
resume: {
  select: { id: true, fileUrl: true, fileName: true },
},

// AFTER
resume: {
  select: { id: true, fileName: true },   // fileUrl removed
},
```

**Step 2 — Verify the resume download route is auth-gated:**

Open `src/app/api/resumes/[id]/route.ts`. Confirm it:
1. Requires authentication (`requireAuth`)
2. Only allows the owner (teacher) or a school that has an active application from that teacher to download

If the route does not check application relationship, add:
```ts
// Check: requester is the resume owner OR a school admin with a pending/shortlisted application
const resume = await prisma.resume.findUnique({ where: { id }, select: { userId: true, fileUrl: true } });
if (!resume) return 404;

if (auth.user.id !== resume.userId) {
  // Check if school has an application from this teacher
  const hasApplication = await prisma.application.findFirst({
    where: {
      applicant: { id: resume.userId },
      job: { school: { userId: auth.user.id } },
      status: { in: ["SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "HIRED"] },
    },
  });
  if (!hasApplication) return 403;
}
// Return redirect or signed URL
```

**Step 3 — Update frontend to use ID-based download:**

In `src/app/(dashboard)/dashboard/my-jobs/[id]/applicants/page.tsx` (lines 635-646), replace any direct `fileUrl` links with:
```tsx
<a href={`/api/resumes/${resume.id}`} target="_blank" rel="noopener noreferrer">
  View Resume
</a>
```

---

## Sprint 4 — Match Quality & Fit Score Accuracy

---

### Task 4.1 — Add TET dimension to match scoring

**Goal:** Marketing claims "82% fit. Missing: TNTET cert" — the match engine must actually score TET. Currently `src/lib/ai-match.ts` scores subject, location, board, salary, experience only.

**Files:**
- `src/lib/ai-match.ts`
- `prisma/schema.prisma` (already has `tetStatus` from Task 2.1)

**Step 1 — Add TET score function in `src/lib/ai-match.ts`:**

Below the existing score functions, add:
```ts
function scoreTet(teacherTet: string | null | undefined, jobRequiresTet: boolean | null | undefined): number {
  if (!jobRequiresTet) return 1.0; // job doesn't require TET — no penalty
  if (!teacherTet || teacherTet === "NONE") return 0.0; // job requires it, teacher doesn't have it
  return 1.0; // teacher has TET/CTET
}
```

**Step 2 — Add `requiresTet` field to JobPosting schema:**

In `prisma/schema.prisma`, add to `JobPosting`:
```prisma
requiresTet  Boolean  @default(false) @map("requires_tet")
```

Add this field to the job posting form in `src/app/(dashboard)/dashboard/post-job/page.tsx` as a checkbox: "TET/CTET required."

**Step 3 — Wire into `computeMatchScore`:**

In `src/lib/ai-match.ts`, update `computeMatchScore`:
```ts
const tet = scoreTet(teacher.tetStatus, job.requiresTet);

const weights = {
  subject: 0.35,   // reduced from 0.40
  location: 0.20,
  board: 0.15,     // reduced from 0.20
  salary: 0.10,
  experience: 0.10,
  tet: 0.10,       // new
};

// Include tet in weighted sum
const score = subject * weights.subject + location * weights.location + ... + tet * weights.tet;

// Add to breakdown
return { score, scorePercent, breakdown: { subject, location, board, salary, experience, tet }, explanation };
```

**Step 4 — Add gap message for missing TET:**

In the explanation generation (around line 172 in `ai-match.ts`), add:
```ts
if (job.requiresTet && (!teacher.tetStatus || teacher.tetStatus === "NONE")) {
  reasons.push("Missing: TET/CTET certificate required for this role");
}
```

**Run migration:**
```bash
npx prisma migrate dev --name tet-scoring
npx prisma generate
```

---

## Sprint 5 — WhatsApp & Tamil (highest effort, do last)

---

### Task 5.1 — WhatsApp opt-in infrastructure

**Goal:** Build the data layer and opt-in UI for WhatsApp notifications. The actual WhatsApp API integration (Twilio or Meta Cloud) is a separate deployment decision — this task prepares everything except the send call so it can be wired in.

**Files:**
- `prisma/schema.prisma`
- `src/app/(dashboard)/dashboard/alerts/page.tsx`
- `src/app/api/alerts/route.ts`
- `src/app/api/alerts/send/route.ts`

**Step 1 — Schema:**

Add to `User` model:
```prisma
whatsappNumber  String?  @map("whatsapp_number")
whatsappOptin   Boolean  @default(false) @map("whatsapp_optin")
```

**Step 2 — Settings UI:**

In `src/app/(dashboard)/dashboard/alerts/page.tsx`, add a "WhatsApp Notifications" section:
```tsx
<section className="rounded-2xl border border-[var(--eh-border)] bg-white p-5">
  <p className="font-semibold text-[14px]">WhatsApp Alerts</p>
  <p className="text-[13px] text-[var(--eh-text-3)] mt-1">
    Receive job alerts and interview reminders on WhatsApp.
  </p>
  <div className="mt-4 space-y-3">
    <input
      type="tel"
      placeholder="+91 98765 43210"
      value={whatsappNumber}
      onChange={(e) => setWhatsappNumber(e.target.value)}
      className="input-base"
    />
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={whatsappOptin} onChange={(e) => setWhatsappOptin(e.target.checked)} />
      <span className="text-[13px]">Send me job alerts on WhatsApp</span>
    </label>
  </div>
</section>
```

Save to a `PATCH /api/settings/profile` endpoint (create if needed, or extend `PATCH /api/profile`).

**Step 3 — Extend alert send logic:**

In `src/app/api/alerts/send/route.ts`, after the existing email dispatch block, add a stub:
```ts
// WhatsApp dispatch — wire to Twilio/Meta when credentials are available
if (user.whatsappOptin && user.whatsappNumber) {
  // TODO: await sendWhatsAppMessage(user.whatsappNumber, message);
  // Placeholder: log for now
  console.log(`[WhatsApp stub] Would send to ${user.whatsappNumber}: ${subject}`);
}
```

**Run migration:**
```bash
npx prisma migrate dev --name whatsapp-optin
npx prisma generate
```

---

### Task 5.2 — Tamil / English language toggle (i18n foundation)

**Goal:** Add `next-intl` and create Tamil translations for the 4 most teacher-facing pages. Full app translation is a longer project — this ships the foundation and the highest-value pages.

**Pages to translate first:**
1. `/` (homepage / landing)
2. `/jobs` (job browse)
3. `/auth/signup` (signup)
4. `/dashboard/profile` (teacher profile edit)

**Step 1 — Install next-intl:**
```bash
npm install next-intl
```

**Step 2 — Create message files:**

Create `messages/en.json` — extract all user-facing strings from the 4 pages above into keys.  
Create `messages/ta.json` — Tamil translations for all the same keys.

Example structure:
```json
{
  "nav": { "findJobs": "Find Jobs", "forSchools": "For Schools" },
  "home": { "hero": "India's first teacher hiring platform built for trust." },
  "signup": { "title": "Create your account", "role.teacher": "I'm a Teacher", "role.school": "I'm a School" }
}
```

**Step 3 — Configure next-intl:**

Follow the next-intl App Router setup: create `i18n.ts`, update `next.config.ts`, wrap the root layout.  
Store the user's language preference in `localStorage` (key: `eh-lang`, values: `en` | `ta`).

**Step 4 — Add language toggle to navbar:**

In the public layout `src/app/(public)/layout.tsx` and dashboard layout `src/app/(dashboard)/layout.tsx`, add a small toggle:
```tsx
<button onClick={toggleLanguage} className="text-[12px] font-medium">
  {lang === "en" ? "தமிழ்" : "English"}
</button>
```

---

## Remaining items (no sprint assigned — decide priority)

### Task X.1 — Pipeline / Kanban view for schools

`src/app/(dashboard)/dashboard/pipeline/page.tsx` already exists. Build it as a Kanban with columns: Applied → Shortlisted → Interview Scheduled → Offer Sent → Joined. Data is all available from the application status + history tables. No schema changes needed.

### Task X.2 — Teacher-side AI assistant

Currently AI helps schools (improve-job endpoint). Add teacher-side AI:
- "Improve my profile bio" — `POST /api/ai/improve-profile`
- "Prepare interview questions for this job" — `POST /api/ai/interview-prep`

Both can use the same Claude API pattern as `src/app/api/ai/improve-job/route.ts`.

### Task X.3 — Salary range suggestions in job posting

In `src/app/api/ai/improve-job/route.ts`, extend the AI prompt to also return a `suggestedSalaryRange: { min, max }` field based on subject, board, grade level, and city. Surface the suggestion in the post-job form as a hint below the salary inputs.

---

## Summary table

| Sprint | Task | Files changed | Schema? | Effort |
|--------|------|--------------|---------|--------|
| 1 | 1.1 Fix Karnataka placeholders | signup/page.tsx | No | 15 min |
| 1 | 1.2 Fix salary unit labels | post-job/page.tsx, profile/[id]/page.tsx | No | 20 min |
| 1 | 1.3 Surface fit score breakdown UI | recommendations/page.tsx, recommendations API | No | 1 hr |
| 2 | 2.1 Availability enum + preferredJobType | schema, validators, register API, signup, profile | Yes | 2 hr |
| 2 | 2.2 Teacher Passport (TET, demo video, POCSO) | schema, 2 new upload routes, profile page, public profile, applicants page | Yes | 4 hr |
| 2 | 2.3 School trust signals | schema, validators, school profile page, job detail page | Yes | 2 hr |
| 2 | 2.4 Urgent vacancy flags | schema, post-job form, jobs API, jobs listing | Yes | 2 hr |
| 3 | 3.1 Block unverified schools from posting | jobs/route.ts, profile/verify/route.ts | No | 30 min |
| 3 | 3.2 Child safety checklist + badge | schema, profile page, public profile, applicants page, profile API | Yes | 3 hr |
| 3 | 3.3 Fix document privacy in ranked candidates | ranked/route.ts, resumes/[id]/route.ts, applicants page | No | 1 hr |
| 4 | 4.1 TET dimension in match scoring | ai-match.ts, schema, post-job form | Yes | 2 hr |
| 5 | 5.1 WhatsApp opt-in infra | schema, alerts page, alerts send route | Yes | 2 hr |
| 5 | 5.2 Tamil i18n foundation | next.config.ts, layouts, 4 pages, 2 message files | No | 1 day |

**Total schema migrations needed: 6**  
`expand-teacher-profile`, `teacher-passport-fields`, `school-trust-signals`, `urgent-vacancy-flags`, `child-safety-fields`, `tet-scoring`, `whatsapp-optin`

You can batch tasks 2.1 + 2.2 + 2.3 + 2.4 + 3.2 + 4.1 + 5.1 into a single migration called `gap-closure-v1` if you want fewer migration files.
