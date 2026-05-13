# EH-001: Design-to-Code Acceptance Checklist

## Metadata
- Ticket: `EH-001`
- Source refs:
  - `public/designs/eduhire/EduHire.html`
  - `public/designs/eduhire/EduHire-print.html`
  - `EDUHIRE_DESIGN_README_SPEC.md`
  - `EDUHIRE_HYBRID_IMPLEMENTATION_PLAN.md`
- Roles in scope: `TEACHER`, `SCHOOL_ADMIN`, `ADMIN` (admin parity only where explicitly scoped)

## How to use this checklist
For each screen, mark `PASS` only when all four gates are met:
1. Visual parity
2. Interaction parity
3. Data wiring parity
4. Accessibility parity

Status values:
- `PASS`
- `FAIL`
- `N/A` (must include reason)

---

## Global Gates (Apply to every screen)

### Visual
- Layout hierarchy matches design intent (section rhythm, spacing, composition).
- Token usage is consistent (color, typography, radius, elevation, motion).
- Responsive behavior works at desktop and mobile breakpoints.

### Interaction
- Primary and secondary actions are present and discoverable.
- Loading, success, error, and empty states are implemented.
- Destructive actions require explicit confirmation.

### Data
- Every primary action is connected to persistent backend behavior.
- Role-based visibility and action rules are enforced.
- Error semantics are consistent (`400/401/403/404/500` where applicable).

### Accessibility (WCAG 2.2 AA target)
- Full keyboard operability for primary flow controls.
- Focus-visible styles on actionable elements.
- Labels, errors, and status messaging are screen-reader friendly.
- Contrast passes for text and interactive states.

---

## Screen-by-Screen Acceptance Matrix

| ID | Screen | Route / Surface | Visual | Interaction | Data | A11y | Overall | Notes |
|---|---|---|---|---|---|---|---|---|
| 01 | Marketing homepage | `/` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 02 | Sign in | `/auth/signin` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 03 | Role select | `/auth/signup` role step | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 04 | Teacher signup | `/auth/signup` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 05 | School dashboard | `/dashboard/school` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 06 | Jobs all postings | `/dashboard/my-jobs` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 07 | Post a job | `/dashboard/post-job` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 08 | Applicants for a job | `/dashboard/my-jobs/[id]/applicants` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 09 | Pipeline (Kanban) | `/dashboard/pipeline` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 10 | Interview scheduling | `/dashboard/interviews` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 11 | Teacher home feed | `/dashboard` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 12 | Job discovery | `/jobs` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 13 | Job detail | `/jobs/[id]` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 14 | Apply flow (screening) | apply modal / flow | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 15 | My applications | `/dashboard/applications` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 16 | Teacher profile | `/dashboard/profile` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 17 | Messages (school) | `/dashboard/messages` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 18 | Messages (teacher) | `/dashboard/messages` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 19 | Notifications (teacher) | `/dashboard/notifications` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 20 | Notifications (school) | `/dashboard/notifications` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 21 | Settings security | `/dashboard/settings` | FAIL | FAIL | FAIL | FAIL | FAIL | |
| 22 | System and empty states | shared across all routes | FAIL | FAIL | FAIL | FAIL | FAIL | |

---

## Per-Screen Detailed Criteria

### 01 Marketing homepage
- Visual: hero, trust band, feature rhythm, and CTA hierarchy align with design.
- Interaction: CTA targets are preserved and clear.
- Data: existing metrics/content sources remain correct.
- A11y: heading structure and landmark navigation are valid.

### 02 Sign in
- Visual: shared auth shell + role card parity.
- Interaction: explicit role choice before redirect.
- Data: existing auth provider and error flow unchanged.
- A11y: role cards are keyboard selectable and clearly labeled.

### 03 Role select
- Visual: dedicated role selection step parity.
- Interaction: selection persists into signup flow.
- Data: selected role is reliably passed to registration payload.
- A11y: state announcement for selected role.

### 04 Teacher signup
- Visual: sectioned structure and clarity improvements parity.
- Interaction: inline validation and password guidance.
- Data: `/api/auth/register` contract preserved.
- A11y: all validation errors announced and linked to fields.

### 05 School dashboard
- Visual: widget hierarchy and quick action placement parity.
- Interaction: per-widget loading/empty/error handling.
- Data: analytics and recent activity are role-scoped.
- A11y: cards, buttons, and charts provide meaningful labels.

### 06 Jobs all postings
- Visual: table/filter/chip ergonomics parity.
- Interaction: search/filter/pagination/bulk affordances.
- Data: `/api/my-jobs` and status updates remain accurate.
- A11y: table navigation and action controls keyboard friendly.

### 07 Post a job
- Visual: grouped IA and sticky action bar parity.
- Interaction: requirement/benefit entry UX parity.
- Data: `/api/jobs` payload compatibility preserved.
- A11y: grouped fields have correct labels/legends.

### 08 Applicants for a job
- Visual: card-table hybrid and timeline clarity parity.
- Interaction: quick status transitions and note actions.
- Data: applicant status writes are durable and auditable.
- A11y: status changes provide non-visual feedback.

### 09 Pipeline (Kanban)
- Visual: board columns and candidate card density parity.
- Interaction: drag/drop with optimistic update + rollback.
- Data: status changes persist through existing application APIs.
- A11y: keyboard alternative for status movement exists.

### 10 Interview scheduling
- Visual: split-view scheduling parity.
- Interaction: create/confirm/cancel interactions with feedback.
- Data: `/api/interviews` lifecycle preserved for both roles.
- A11y: date/time controls and status updates are announced.

### 11 Teacher home feed
- Visual: recommendations/alerts/reminders hierarchy parity.
- Interaction: modules link to next actions.
- Data: feed modules are personalized and role scoped.
- A11y: feed cards have descriptive labels and order.

### 12 Job discovery
- Visual: filter panel/chips/list structure parity.
- Interaction: persistent filters and save feedback.
- Data: query params and fetch behavior remain stable.
- A11y: filter controls are fully keyboard operable.

### 13 Job detail
- Visual: detail hierarchy + sticky apply rail parity.
- Interaction: apply/save behavior remains smooth.
- Data: existing job detail and save/apply integration preserved.
- A11y: sticky rail remains reachable and labeled.

### 14 Apply flow (screening)
- Visual: multi-step flow parity.
- Interaction: step validation and progress clarity.
- Data: apply submission supports optional screening answers.
- A11y: step changes and errors are announced.

### 15 My applications
- Visual: timeline emphasis and filter clarity parity.
- Interaction: filter/export/state handling.
- Data: history/status mapping accurate.
- A11y: timeline semantics readable by assistive tech.

### 16 Teacher profile
- Visual: cleaner section hierarchy parity.
- Interaction: edit/upload and completion guidance.
- Data: profile APIs remain backward compatible.
- A11y: form controls and upload affordances are accessible.

### 17 Messages (school)
- Visual: split thread list + conversation pane parity.
- Interaction: send/read/unread behavior parity.
- Data: conversation membership checks enforced.
- A11y: message list updates are announced appropriately.

### 18 Messages (teacher)
- Visual: role variant parity with shared base components.
- Interaction: thread and composer parity.
- Data: teacher can only access authorized threads.
- A11y: consistent keyboard flow with school variant.

### 19 Notifications (teacher)
- Visual: inbox tabs/filters/actions parity.
- Interaction: mark read/archive flows.
- Data: persistent read/archive states per user.
- A11y: unread/read state is non-color dependent.

### 20 Notifications (school)
- Visual: same inbox system with school event relevance.
- Interaction: bulk/read actions parity.
- Data: event filtering and pagination correctness.
- A11y: notification actions are screen-reader labeled.

### 21 Settings security
- Visual: account/security tab hierarchy parity.
- Interaction: password update, sessions view/revoke, 2FA readiness.
- Data: audited security actions and validation.
- A11y: sensitive actions include confirmation and status messaging.

### 22 System and empty states
- Visual: reusable, consistent state components.
- Interaction: retry and recovery paths are clear.
- Data: state variants map correctly to real fetch/action outcomes.
- A11y: state messages are semantic and announced when dynamic.

---

## Reviewer Signoff
- Design signoff: `PENDING`
- Engineering signoff: `PENDING`
- QA signoff: `PENDING`
- Last updated: `2026-05-09`
