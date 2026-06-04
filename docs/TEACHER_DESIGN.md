# EduHire Teacher Dashboard — Design System & Implementation Spec
> Based on Figma mockups (June 2026). All teacher screens. Do NOT change API/data logic — only UI layer.

---

## Design Language

Identical token system as school dashboard. See SCHOOL_DESIGN.md for the full palette.

```
Primary brand:  #0a66c2  (--eh-primary-500/600)
Brand dark:     #004182  (--eh-primary-700)
Brand light bg: #eef3f8  (--eh-primary-50)
Text primary:   #101828  (--eh-text)
Text secondary: #344054  (--eh-text-2)
Text muted:     #667085  (--eh-text-3)
Text faint:     #98a2b3  (--eh-text-4)
Border:         #e3e8ef  (--eh-border)
Surface base:   #f4f2ee  (--surface-base)
Surface white:  #ffffff  (--surface-raised)
```

### Typography
- Page titles: `text-[26px] font-semibold tracking-[-0.022em]`
- Section titles: `text-[15px] font-semibold tracking-[-0.014em]`
- Labels/eyebrow: `text-[11px] font-semibold uppercase tracking-[0.09em] text-[--eh-text-4]`
- Body: `text-[14px] text-[--eh-text-3]`
- Small detail: `text-[12px] text-[--eh-text-3]`

---

## Sidebar Navigation (Teacher)

### Figma design:
```
LEFT SIDEBAR (200px):
  [Profile card: avatar + name + "Mathematics Teacher"]

  MAIN
  • Dashboard         (LayoutDashboard)
  • Browse Jobs       (Briefcase)       → /dashboard/jobs
  • Recommended       (Sparkles)        → /dashboard/recommendations
  • Saved Jobs        (BookMarked)      → /dashboard/saved
  • My Applications   (FileText)        → /dashboard/applications
  • Interviews        (CalendarDays)    → /dashboard/interviews
  • Messages     ●    (MessageSquare)   → /dashboard/messages (FF: messaging)
  • Job Alerts        (BellRing)        → /dashboard/alerts

  PROFILE & ACCOUNT
  • Resumes & Docs    (FileBadge2)      → /dashboard/resumes
  • Notifications  ●  (Bell)            → /dashboard/notifications
  • Subscription      (CreditCard)      → /dashboard/subscription
  • Settings          (Settings)        → /dashboard/settings

  [Footer: profile completion % bar + "Complete Profile" CTA if < 100%]
  [OR: Pro upgrade CTA if already complete]
```

Nav group labels: "MAIN" and "PROFILE & ACCOUNT" (eyebrow-style text-[10px] uppercase tracking)

---

## Screen Specifications

### 1. Dashboard Home (`/dashboard`)

**Header:**
- Eyebrow: "Dashboard"
- H1: "Welcome back, {firstName}!" (warm greeting)
- Subtitle: "Here's what's happening with your job search."
- Actions: `[Update Profile]` (secondary) `[Find Jobs]` (primary blue)

**Profile Strength widget (top-left panel):**
- Label: "Profile Strength"
- Big circular progress ring: `{pct}%` in center, brand blue fill
- Below: "Complete Profile →" link
- Signal row below ring: `{applicationCount}` Applications | `{upcomingInterviews}` Interviews | saved count | profile views

**Stat cards row (4 cards across top):**
- Applications (total count) → link to /dashboard/applications
- Interviews (upcoming) → link to /dashboard/interviews  
- Shortlisted (count of SHORTLISTED status) → link to /dashboard/applications?status=SHORTLISTED
- Offered (count of HIRED) → link to /dashboard/applications?status=HIRED

**Two-column main section:**
- Left (wider ~65%): "Application Overview" panel
  - Last 30 Days label + "View Applications →" link
  - Status breakdown: Under Review | Shortlisted | Offered | Rejected (each with count + small bar)
  - "View All Applications →" button at bottom
- Right (~35%): "Activity Feed" panel  
  - List of 5 recent activity items (application submitted, interview scheduled, shortlisted, etc.)
  - Each item: icon, text, time-ago
  - "View All →" link

**Quick Actions panel (right sidebar on large screens OR below main on medium):**
- 4 quick action cards in 2x2 grid:
  - Complete Resume (violet icon) → /dashboard/resumes
  - Create Job Alert (amber icon) → /dashboard/alerts
  - Interviews Prep → /dashboard/interviews
  - My Documents → /dashboard/resumes

**Bottom: "Recommended For You" section**
- Section title + "View All →" link
- 3 job cards side by side (same card format as Browse Jobs but compact)
- Each: school logo, match %, job title, school name, location + type + grade + salary, "Apply Now" button

**Right sidebar widgets (when layout is `xl:grid-cols-[1fr_300px]`):**
- "Job Alerts" panel: toggle ON/OFF, show count of active alerts, "View All" link
- "Career Tips" panel: 2–3 tip items with icons

---

### 2. Browse Jobs (`/dashboard/jobs`)

**Header:**
- H1: "Browse Jobs"
- Subtitle: "Find the perfect teaching opportunity that matches your expertise."
- No action buttons (search is enough)

**Filter bar (single row):**
- Location input (map pin icon)
- Subject dropdown
- Job Type dropdown (Full-time / Part-time / Contract)
- Board dropdown (CBSE / State Board / etc.)
- Salary range dropdown
- `[More Filters]` button
- `[Save Search]` + `[Job Alerts]` buttons (right side)
- "24 jobs found" count + "Sort by: Most Relevant" dropdown

**Job list (left ~65%):**
- Each job card:
  - Top-right: match score badge (`92% match` in brand blue pill) + bookmark icon
  - School logo (circular, 44px)
  - Job title (bold, 15px)
  - School name + verified badge (blue checkmark if verified)
  - Location · Job Type · Grade range
  - Board · Salary range · Posted X days ago
  - `[Apply Now]` button (brand blue, right side)
  - Match score bar (thin brand-blue progress bar, labeled "XX% Match")

**Right sidebar (~35%):**
- "Improve Your Chances" panel:
  - Profile completion % circular gauge (brand blue)
  - "Your profile is X% complete"
  - "Complete your profile to get better matches"
  - `[Complete Profile →]` link
- "Top Skills in Demand" panel:
  - List of skill tags: Mathematics, Teaching, Financial Management, Curriculum Design, Student Engagement
- "Resume Tips" panel:
  - 1–2 tip items

---

### 3. My Applications (`/dashboard/applications`)

**Header:**
- H1: "My Applications"
- Subtitle: "Track and manage all your job applications in one place."
- Actions: `[Export]` (secondary) `[New Application]` (primary — links to /dashboard/jobs)

**Status tabs with counts:**
All (N) | Applied (N) | Shortlisted (N) | Interviews (N) | Offered (N) | Rejected (N)

**Filter bar:** Search input | `[Filter]` button | Sort By dropdown

**Application list (left ~65%):**
- Each row (card with left border color by status):
  - School logo (40px) + School name + verified badge
  - Job title (bold)
  - Status badge (colored, with dot)
  - Applied date ("Applied on May 13, 2026")
  - `[View Details]` button (right)
- Expandable row shows: Cover letter preview, application timeline

**Right sidebar (~35%):**
- "Application Insights" panel:
  - Donut chart with status breakdown (brand blue = applied, green = shortlisted, etc.)
  - Legend with counts: Applied (2), Shortlisted (3), Interview (1), Offered (1)
- "Track Your Progress" panel:
  - Mini sparkline chart (30 days of applications activity)
- "Resume Review" panel:
  - `[Get Resume Review]` CTA
- "Need Help?" panel:
  - Contact Support link

---

### 4. Recommended For You (`/dashboard/recommendations`)

**Header:**
- H1: "Recommended for You"
- Subtitle: "AI-powered job matches based on your profile and preferences."
- Actions: `[View 4 more]` pill-style + `[Better Salary Range]` + `[High Match]` filter toggles

**Filter row:**
- Sort by: Highest Match / Latest / Best Salary (toggle group)

**Job list (left ~65%):**
- Each card:
  - School logo (circular 44px) + verified badge
  - Match score badge (top right): `XX%` in colored pill (green ≥85%, amber 70–84%)
  - Job title + school name + location · job type · grade · salary
  - "Why it matches" section with 3–4 bullet points in a subtle box:
    - ✓ Your mathematics background is a strong match
    - ✓ Your experience level matches (5+ years required)  
    - ✓ CBD location matches your preference
  - `[View Job]` button

**Right sidebar (~35%):**
- "Your Profile Completion" circular gauge + `[Complete Profile]` button
- "Top Skills in Demand" tag list

---

### 5. Saved Jobs (`/dashboard/saved`)

**Header:**
- H1: "Saved Jobs"
- Subtitle: "Jobs you've saved to review and apply later."
- Actions: `[Manage Folders]` (secondary)

**Tab bar:** Saved (N) | Bookmarked (N) | Applied (N)

**Sort bar:** Sort by: Date Saved / Match Score / Salary

**Job list (left ~65%):**
- Each card (same layout as Browse Jobs but with "Saved on [date]" label):
  - School logo + verified badge
  - Match score badge (top right)
  - Job title + school name
  - Location · Job Type · Grade · Board
  - Salary range
  - "Saved on May 20, 2026" (small, muted)
  - `[View Job]` + `[Apply Now]` buttons

**Right sidebar (~35%):**
- "Save smarter with Pro" upsell panel:
  - Checkmark list: Get notified when saved jobs close, Priority access to saved jobs, etc.
  - `[Upgrade to Pro →]` button
- "Job Alerts" panel (mini): list of active alerts + `[View All]`
- "Recently Viewed" panel: 3 recent jobs list

---

### 6. Interviews (`/dashboard/interviews`)

**Header:**
- H1: "Interviews"
- Subtitle: "Manage your upcoming and past interview history."
- Actions: `[Add to Calendar]` (secondary)

**Tabs:** Upcoming (N) | Completed (N) | Cancelled (N)

**Upcoming interviews (left ~65%):**
- Each card:
  - School logo + job title
  - School name + city
  - Interview type badge (VIDEO / PHONE / IN_PERSON)
  - Countdown: "In X Days" (amber pill if ≤3 days, green otherwise)
  - Date range: "Mon, Jun 16 · 10:00–11:00 AM"
  - `[Join Interview]` or `[View Details]` button + meeting link

**Past interviews section:**
- Same card format, status badges: Completed (green) | Cancelled (red) | No-Show

**Right sidebar (~35%):**
- "Interview Prep Center" panel:
  - Short description + 3 topic chips (Common Questions, Tech Prep, Behavioral)
  - `[Explore Prep Center →]` link
- "Your Progress" donut: X% Completed / Y% Cancelled (with legend)
- "Upcoming Reminders" list: 3 items with date + school name

---

### 7. Job Alerts (`/dashboard/alerts`)

**Header:**
- H1: "Job Alerts"
- Subtitle: "Stay updated with the latest job opportunities that match your preferences."
- Actions: `[+ Create New Alert]` (primary)

**Alert Insights sidebar panel (right ~35%):**
- "Alerts sent this week": N (with sparkline)
- Stat row: Emails Sent | New Matches | New Jobs

**Alert list (left ~65%):**
- Each card:
  - Alert name (bold) + Active/Paused badge
  - Filter tags: subject • location • type • board • salary
  - "Last sent X ago" + "N new jobs" count
  - Toggle ON/OFF switch (right side)

**Paused Alerts section** (below active, collapsible)

**Right sidebar (~35%):**
- "Alert Insights" stats panel (emails sent sparkline)
- "Tips to Get Better Alerts" panel:
  - 3 numbered tips
- "Need Help?" panel

---

### 8. Resume & Documents (`/dashboard/resumes`)

**Header:**
- H1: "Resume & Documents"
- Subtitle: "Manage your resume and other documents to apply with confidence."
- Actions: `[+ Upload New Document]` (primary)

**Resume Tip sidebar (right ~35%):**
- Resume Tips: keep updated, highlight key skills, use clear concise format
- "View all tips →" link
- Storage Usage bar (used / total)
- "Manage Storage →" link
- "Upload New Document" drop zone (dashed border)

**Main content (left ~65%):**
- Featured resume card at top:
  - `Priya_Sharma_Resume.docx` with `[Prime Resume]` badge (green)
  - `[Edit Resume]` + `[Download]` buttons
  - Sub-text: "Make your profile 90% (!) complete by adding more details." (with "Improve Now →")
- "All Documents" table:
  - Columns: Document Name | Type | Last Updated On | Size | Actions (Download + Delete)
  - Each row: file icon + name + type badge + date + size + icons
- "View all Annual Documents (N) →" link at bottom

---

### 9. Subscription (`/dashboard/subscription`)

**Header:**
- H1: "Subscription"
- Subtitle: "Choose the right plan to accelerate your teaching career."
- Toggle: `[Monthly]` / `[Yearly (Save 20%)]`

**Plan cards (3 columns):** Basic | Pro ⭐ Most Popular | Premium
- Basic: ₹0/month, "Current Plan" (grey CTA), grey features
- Pro: ₹X/month (billed annually ₹X,XXX), `[Upgrade to Pro]` (brand blue), highlighted features
- Premium: ₹X/month, `[Upgrade to Premium]` (outline), premium features

**Features comparison list per card:**
- Basic: Browse jobs, Basic job alerts, Apply to 5 jobs/month
- Pro: Unlimited job applications, Resume builder, Profile boost, Priority listing, Daily alerts, Resume Bonus (per month), Profile Analytics, AI Match explanations
- Premium: Everything in Pro + Dedicated Support, Managed Placement, Advanced Search Filters, Profile Priority Listing

**Security badge:** "Secure, Private, Trusted" banner below cards

**Save more CTA:** "Save more with yearly plans! Get 20% off when you choose annual billing." `[Switch to Yearly & Save]`

**Right sidebar (~35%):**
- "Current Plan" card:
  - Plan name badge + plan features checklist
  - Billing History mini table (3 rows: date, amount, status)
  - `[Compare Plans]` link
- "Frequently Asked Questions" accordion: 4–5 questions
- "Need account support?" contact link

---

### 10. Application Detail (`/dashboard/applications/[id]`)

**Header:**
- Back arrow + "My Applications > CBSE" breadcrumb
- Job title (large, 22px)
- School name + verified badge + location
- Status badge (top right): Shortlisted (green)

**Progress tracker (horizontal stepper):**
Applied → Reviewed → Shortlisted → Interview Scheduled → Interview Completed → Hired
- Filled dots for completed stages, current stage highlighted brand blue

**Two-column layout:**
- Left (~65%):
  - "Submitted Resume": file name + `[View Resume]` button
  - "Cover Letter" section: text preview
  - "Screening Answers" section (if any questions were asked)
  - "Recent Activity" timeline feed (5 items with dates)
- Right (~35%):
  - "Next Steps" panel:
    - Current status summary
    - Upcoming: Interview on May 16, 2026
    - `[Add to Calendar]` button
    - `[Complete steps]` note
  - "School Contact" panel: recruiter name + phone + email
  - "Application Summary" panel: Match Score % + Subject + Experience + Location + Phone
  - Quick action buttons: `[View Job Detail]` `[Email School]` `[Message]` `[Withdraw]`

---

### 11. Job Detail (`/dashboard/jobs/[id]`)

**Header (top bar):**
- Back arrow + "Browse Jobs" breadcrumb
- Job title (h1, 22px)
- School name + verified badge + location · job type · Posted X ago
- Actions: `[Save Job]` (bookmark icon) `[Apply Now]` (primary blue, right side)

**Tabs:** Job Details | School Info | About the Role | Requirements | Benefits

**Left main (~65%):**
- "Key Responsibilities" section: 5–6 bullet points
- "Your Match Score" prominent panel:
  - Big ring gauge: `XX%` in center
  - "Excellent Match ✓" label
  - "Why it's a great match" bullet list
- Details grid: Subject | Job Type | Board | Experience | Salary | Location | Joining Date

**Right sidebar (~35%):**
- "Similar Jobs" panel: 3 cards (school name + job title + match %)
- "Job Insights" panel: Views | Applicants | Application Deadline
- "More about Pro" upsell panel

---

### 12. Apply for Job (`/dashboard/jobs/[id]/apply` or modal)

**Header:**
- Back arrow + "Apply for Job"
- Progress stepper (5 steps): Job Details → Personal Info → Experience → Documents → Review & Submit

**Left form (~65%):**
- Step 1 — "Job Details": pre-filled read-only (Job Title, School, Location, Job Type, Subject/Department, Expected Joining Date, Cover Letter textarea)
- "How did you find this job?" dropdown
- "Save & Continue" / "Next →" button
- Note: "Your application is saved as a draft and you can continue it later."

**Right sidebar (~35%):**
- "Job Summary": school logo, job title, school name, location, posting details
- "Application Tips" panel:
  - Attach your resume
  - Write a strong cover letter  
  - Review before submitting

---

## Sidebar nav updates for Teacher

Update `TEACHER_MAIN_LINKS` in dashboard-shell.tsx:
```ts
const TEACHER_MAIN_LINKS = [
  { href: "/dashboard",              label: "Dashboard",      icon: LayoutDashboard },
  { href: "/dashboard/jobs",         label: "Browse Jobs",    icon: BriefcaseBusiness },
  { href: "/dashboard/recommendations", label: "Recommended", icon: Sparkles },
  { href: "/dashboard/saved",        label: "Saved Jobs",     icon: BookMarked },
  { href: "/dashboard/applications", label: "My Applications",icon: FileText },
  { href: "/dashboard/interviews",   label: "Interviews",     icon: CalendarDays },
  { href: "/dashboard/messages",     label: "Messages",       icon: MessageSquare, featureFlag: "messaging" },
  { href: "/dashboard/alerts",       label: "Job Alerts",     icon: BellRing },
];

const TEACHER_SECONDARY_LINKS = [
  { href: "/dashboard/resumes",       label: "Resumes & Docs", icon: FileBadge2 },
  { href: "/dashboard/notifications", label: "Notifications",  icon: Bell, featureFlag: "notificationsCenter" },
  { href: "/dashboard/subscription",  label: "Subscription",   icon: CreditCard },
  { href: "/dashboard/settings",      label: "Settings",       icon: Settings },
];
```

Add nav group labels ("MAIN", "PROFILE & ACCOUNT") above each nav section.

---

## Implementation Rules

1. **Never remove/change data logic** — only change JSX/className
2. **Reuse existing components**: Panel, PageHeader, PageShell, StatusBadge, PanelHeader, Toolbar from page-shell.tsx
3. **Right sidebar pattern**: Use `xl:grid-cols-[1fr_300px]` or `xl:grid-cols-[1fr_320px]` for pages with right panel
4. **Feature flags**: Keep all existing featureFlag guards
5. **Subscription locks**: Keep all lock/upgrade states, just restyle them
6. **Empty states**: Keep existing EmptyState components, update surrounding layout
7. **Mobile**: Top nav + mobile strip already handles mobile; focus on desktop layout
8. **Match score badges**: Use existing MatchScoreBadge component or StatusBadge with appropriate tone
9. **No new API routes**: All pages already have their data fetching — just revamp UI
