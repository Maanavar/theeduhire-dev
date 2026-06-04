# EduHire School Dashboard — Design System & Implementation Spec
> Based on Figma mockups (June 2026). All school screens. Do NOT change API/data logic — only UI layer.

---

## Design Language

### Color Palette (existing tokens — use as-is)
```
Primary brand:  #0a66c2  (--eh-primary-500/600)
Brand dark:     #004182  (--eh-primary-700)
Brand light bg: #eef3f8  (--eh-primary-50)
Text primary:   #101828  (--eh-text)
Text secondary: #344054  (--eh-text-2)
Text muted:     #667085  (--eh-text-3)
Text faint:     #98a2b3  (--eh-text-4)
Border:         #e3e8ef  (--eh-border)
Border strong:  #d2dae5  (--eh-border-strong)
Surface base:   #f4f2ee  (--surface-base)  ← page bg in app-linkedin theme
Surface white:  #ffffff  (--surface-raised)
```

### Typography
- Page titles: `text-[26px] font-semibold tracking-[-0.022em]` 
- Section titles: `text-[15px] font-semibold tracking-[-0.014em]`
- Labels/eyebrow: `text-[11px] font-semibold uppercase tracking-[0.09em] text-[--eh-text-4]`
- Body: `text-[14px] text-[--eh-text-3]`
- Small detail: `text-[12px] text-[--eh-text-3]`

### Spacing & Layout
- Page content: `space-y-5 lg:space-y-6` (PageShell)
- Cards: `rounded-xl border border-[--eh-border] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]`
- Card padding: `p-5` (standard), `p-4` (compact)
- Header border-bottom: `border-b border-[--eh-border] pb-5 mb-0` (handled by PageHeader)

### Button System (existing eh-btn classes)
- Primary: `eh-btn eh-btn-primary` → brand blue filled
- Secondary: `eh-btn eh-btn-secondary` → white border
- Small: add `eh-btn-sm`

### Badge System (StatusBadge component)
- `tone="brand"` → blue (New)
- `tone="success"` → green (Shortlisted, Hired, Active)
- `tone="warning"` → amber (Interview, Draft)
- `tone="danger"` → red (Rejected, Closed)
- `tone="neutral"` → slate (Reviewed)
- `tone="info"` → sky blue

---

## Sidebar Navigation (School)

### Design from mockup:
```
[EduHire Logo]  [Search bar ⌘K]              [🔔3] [💬2] [Avatar ▼]

LEFT SIDEBAR (232px):
  [Profile card: school name + location]

  WORKSPACE
  • Dashboard      (LayoutDashboard)
  • Jobs           (Briefcase)
  • Applicants     (Users)
  • Interviews     (Calendar)
  • Messages  2    (MessageSquare)  ← feature flag
  • Analytics      (BarChart2)

  OPERATIONS
  • Billing & Plan (CreditCard)
  • School Profile (Building2)
  • Settings       (Settings)       ← feature flag

  [Footer: plan info + upgrade CTA]
```

The mockup adds "Managed Recruitment" as a nav item below Messages. Wire it to `/dashboard/managed-recruitment` if page exists, otherwise skip.

---

## Screen Specifications

### 1. Dashboard Home (`/dashboard/school`)

**Header:**
- "School Verified ✓" banner (green, only if verified)
- Eyebrow: "School dashboard"
- H1: "Good morning, {firstName}" 
- Subtitle: "{N} new applications since your last review."
- Actions: `[Review applicants]` `[+ Post New Job]`

**KPI Row (6 cards):** Active Jobs | Total Applications | Shortlisted | Interviews | Hired | Avg Time to Hire
- Each card: thin accent bar top (color-coded), label, big number, hint text

**Two-column section:**
- Left (wider): "Hiring Pipeline" — horizontal stages (New→Reviewed→Shortlisted→Interview→Hired) with counts and arrows
- Right: "Job Performance" table — Job title, Applicants, Shortlisted, Interviews, Status badge

**"Top Candidates to Review":** Full-width panel with candidate cards (avatar, name, role, exp, badge info, match %, action buttons: Shortlist / Message / Schedule Interview / View Profile / more menu)

**Bottom CTA banner:** Managed Recruitment upsell with illustration

---

### 2. Jobs (`/dashboard/my-jobs`)

**Header:**
- H1: "Jobs"
- Subtitle: "Create, manage, and monitor all your school job postings."
- Primary CTA: `[+ Post New Job]`

**KPI Row (5 stats):** Total Jobs | Active Jobs | Drafts | Closed Jobs | Total Applicants

**Filter bar:** Search by title | Status dropdown | Subject dropdown | Board dropdown | Sort by

**Table columns:** Job Title (bold, subtitle = type) | Subject | Board | Posted Date (with "X days ago") | Applicants (with avatar stack) | Shortlisted | Status badge | Actions (View + ⋮ menu)

**Right sidebar panel:** "Your Plan Usage" (job post count progress bar) + "Need more job posts?" upgrade + "Let EduHire handle your recruitment" managed recruitment CTA

---

### 3. Applicants (`/dashboard/applicants`)

**Header:**
- H1: "Applicants"
- Subtitle: "Review, filter, and manage all candidates applying to your school jobs."
- Actions: `[Export]` `[Bulk Actions ▼]`

**Status tabs with counts:** All Applicants 128 | New 42 | Reviewed 31 | Shortlisted 12 | Interview 6 | Hired 2 | Rejected 18

**Filter bar:** Search by name/skill | All Jobs ▼ | All Status ▼ | All Experience ▼ | All Match Score ▼ | Filters

**Table (NOT cards — table rows):**
Columns: Applicant (avatar + name + email + phone) | Applied For (job + board + grades) | Status badge | Match Score (colored pill) | Experience | Applied On | Actions (View + Shortlist + ⋮)

Each row has the candidate avatar, contact details, and inline action buttons.

**Pagination:** showing X-Y of N applicants, rows per page selector

---

### 4. Interviews (`/dashboard/interviews`)

**Header:**
- H1: "Interviews"
- Subtitle: "Schedule, track, and manage candidate interviews."
- Actions: `[+ Schedule Interview]` `[Export]`

**KPI Row (5):** All Interviews | Today | Upcoming (next 7 days) | Completed (this month) | Cancelled (this month)

**Filter bar:** Search by candidate/job | All Jobs ▼ | All Interview Types ▼ | All Statuses ▼ | Select Date | Filters

**Table columns:** Candidate (avatar + name + email + phone) | Job (title + subject) | Interview Type (icon + label) | Date & Time (sortable ↓) | Interviewer (avatar + name) | Status badge | Actions (Join/View/Reschedule + ⋮)

**Right sidebar:** 
- "Today's Interviews" timeline (4 items)
- Mini calendar with dots on scheduled days
- "Upcoming Interviews" list (3 items)

---

### 5. Analytics (`/dashboard/analytics`)

**Header:**
- H1: "Analytics" 
- Subtitle: "Track hiring performance, pipeline health, and job outcomes."
- Actions: date range picker | `[Export Report]`

**KPI Row (7):** Total Applications | Active Jobs | Shortlisted | Interviews | Hired | Avg Time to Hire

**Charts grid:**
- Applications Trend line chart (30-day) + Applications by Job donut chart
- Hiring Funnel progress bar (Applied→Reviewed→Shortlisted→Interviewed→Hired with conversion %)

**Bottom tables:**
- "Top Performing Jobs" table
- "Source & Quality Insights" table
- Right: Plan Access card + "Best Hiring Day" + "Upcoming Reporting Notes"

**Sub-page: "Hiring Funnel Insights"** (`/analytics/funnel` or tab):
- Funnel overview steps with drop counts
- Stage Drop-off Reasons, Interviewer Performance table
- Candidate Geography donut, Board Preference donut
- Recent Funnel Activity feed

---

### 6. Billing & Plan (`/dashboard/billing`)

**Header:**
- H1: "Billing & Plan"
- Subtitle: "Manage your subscription, billing, and unlock more hiring power for your school."

**Usage KPI Row:** Active Job Posts (progress) | AI Shortlist Access | Contact Reveal Access | Analytics | Billing Status

**Plan comparison cards (3 columns):** FREE | GROWTH (Current) | PRO
- Each: plan name, price, CTA button, "Up to N active job posts" highlight
- Feature comparison table below

**Billing History table:** Invoice # | Billing Cycle | Amount | Payment Status badge | Date | Action (download ↓)

**Right sidebar:** 
- "Current Plan" card (plan name, posts used, renews date, Upgrade + Manage buttons)
- Illustration + "Need more hiring power?" upsell with checklist
- `[Upgrade Now]` CTA

---

### 7. School Profile (`/dashboard/profile`)

**Header:**
- H1: "Edit School Profile"
- Subtitle: "Update your school information, credentials, and profile details."

**Main form (left ~2/3):**
- Section: "Basic Information" — School Name, Admin Name, City (dropdown), Board (dropdown), Address, Website, About School (textarea 500 chars)
- Section: "Academic & Operational Details" — Working Hours, Grade Levels, Medium of Instruction, School Type, Student Strength, Teacher Count, UDISE Code
- Section: "Trust & Compliance" — 4 compliance checkboxes (PF/ESI, Payment Track Record, Child Safety/POCSO, Hiring Support), with sub-fields (PF Number, Last Reviewed, Policy Document upload, Support Contact)

**Right sidebar (~1/3):**
- School Logo upload (512x512px recommended)
- Banner Image upload (1600x400px, max 2MB)
- "Profile Completeness" widget (% bar + checklist items)
- "Public Preview" card (mini school card preview)
- Tips panel

**Footer:** `[Cancel]` `[Save Changes]`

---

### 8. Notifications (`/dashboard/notifications`)

**Header:**
- H1: "Notifications"
- Subtitle: "Stay updated with important activity across your school account."

**Tab bar:** All | Unread 3 | Applications | Interviews | Messages | System

**Toolbar:** "Showing 1–12 of 28 notifications" | `[✓ Mark all as read]` `[Archive]`

**Notification list (grouped by Today / Yesterday / Earlier):**
Each item: icon (color-coded by type) | title (bold) | description | time | unread blue dot

**Right sidebar:**
- "Notification Settings" panel: Email On/Off | Push On/Off | SMS Off/On | Weekly Digest On/Off
- "Quick Filters" panel: All / Unread / Applications / Interviews / Messages / System (with counts)
- "Stay in the loop" banner with bell illustration

---

## Managed Recruitment (`/dashboard/managed-recruitment`)

**Header:**
- H1: "Managed Recruitment"
- Subtitle: "Let our expert recruiters find and deliver the right talent for your school."
- CTA: `[+ Request Managed Recruitment]`

**KPI Row (5):** Total Requests | Active Roles | Candidates Presented | Interviews Coordinated | Unpaid Invoices

**Filter bar + Table:** Job Title | Subject | Join Date | Salary Budget | Status badge | Candidates Presented (avatar stack + count) | Invoice Amount | Payment Status | Actions (⋯)

**Right sidebar:**
- Service explanation steps (Sourcing → Screening → Shortlisting → Interview Coordination → Onboarding)
- Transparent Pricing: ₹10,000 per confirmed hire
- "Request Preview" card (fills from last selected row)

---

## Implementation Rules

1. **Never remove/change data logic** — only change JSX/className
2. **Reuse existing components**: Panel, PageHeader, PageShell, StatusBadge, Metric, DataTable from page-shell.tsx
3. **Table layout for lists**: Replace card-grid with proper `<table>` where design shows table rows (Applicants, Jobs, Interviews)
4. **Right sidebar pattern**: Use `xl:grid-cols-[1fr_320px]` for pages with right panel
5. **Feature flags**: Keep all existing featureFlag guards
6. **Subscription locks**: Keep all lock/upgrade states, just restyle them
7. **Empty states**: Keep existing EmptyState components, update surrounding layout
8. **Mobile**: The top nav + mobile strip already handles mobile; focus on desktop layout
