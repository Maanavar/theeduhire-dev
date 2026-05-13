# EH-005: Parity QA Rubric and Test Matrix

## Metadata
- Ticket: `EH-005`
- Scope: Screens `01-22`
- Primary companion artifact: `docs/hybrid/EH-001-design-to-code-acceptance-checklist.md`
- Last updated: `2026-05-09`

## Purpose
Define a single QA standard for visual parity, interaction behavior, API/data integrity, role authorization, and accessibility checks across the hybrid rollout.

---

## Severity Model

### P0 / High
- Blocks core user workflow (apply, post job, status update, interview lifecycle, auth flow).
- Authorization or data-leak risk across roles.
- Persistent data corruption or wrong status transitions.
- Hard accessibility blocker for primary task completion.

### P1 / Medium
- Noticeable parity mismatch in key screen sections.
- Non-blocking but incorrect feedback/state behavior (loading/error/empty/success).
- API validation or error semantics inconsistencies that do not leak data.
- Accessibility issue with workaround available.

### P2 / Low
- Cosmetic deviation from design intent with no functional impact.
- Minor copy inconsistency or spacing/typography drift.
- Non-critical keyboard/a11y polish gaps.

---

## Required Evidence Per Ticket
- Route(s) changed.
- Acceptance criteria mapping (explicit pass/fail lines).
- Manual QA notes by role (`TEACHER`, `SCHOOL_ADMIN`, `ADMIN` where relevant).
- API behavior proof for changed endpoints (request/response + status semantics).
- Accessibility spot checks (keyboard + focus + labels + contrast).
- Regression notes for adjacent flows.

---

## QA Rubric Dimensions (Score 0-2)
Score each dimension:
- `0` = fail
- `1` = partial
- `2` = pass

Pass threshold:
- No `0` in critical dimensions (`Interaction`, `Data`, `AuthZ`, `A11y`).
- Total score >= `14/18`.

| Dimension | What to check | Score (0-2) |
|---|---|---|
| Visual parity | Hierarchy, spacing, typography, token consistency |  |
| Interaction fidelity | Primary/secondary actions, transitions, confirmations |  |
| State handling | Loading, empty, error, success, retry behavior |  |
| Data integrity | Correct backend wiring, durable writes, no stale states |  |
| API contract quality | Validation + `400/401/403/404/500` correctness |  |
| AuthZ and scoping | Role permissions + data boundaries |  |
| Accessibility | Keyboard, focus-visible, labels, ARIA/status messaging |  |
| Responsiveness | Desktop + mobile layout integrity |  |
| Regression safety | No breakage in nearby routes/components |  |

---

## Core Test Matrix

| Area | Role | Scenario | Expected |
|---|---|---|---|
| Auth | Teacher | Sign in + role branch | Lands on teacher dashboard flows only |
| Auth | School | Sign in + role branch | Lands on school workflow routes |
| Jobs | School | Post/edit/close/reopen job | Status reflects immediately and persists |
| Applicants | School | Move candidate statuses | Timeline/history + status consistency preserved |
| Pipeline | School | Drag/drop between columns | Status persists and board refresh remains accurate |
| Interviews | School | Schedule/complete/cancel | Lifecycle updates visible to both parties |
| Discovery | Teacher | Filter/search/sort jobs | URL/state sync and accurate list results |
| Apply | Teacher | Submit multi-step apply flow | Submission succeeds with validation; history visible |
| Applications | Teacher | Track status timeline | Status changes match backend history |
| Messages | Both | Thread list/send/read | Role-scoped thread access only |
| Notifications | Both | Read/archive/filter | State persists and unread counts update |
| Settings/Security | Both | Password/session actions | Validation/auth checks and auditable outcomes |

---

## API Validation Checklist (for any changed endpoint)
- Input schema validation present and enforced.
- Unauthorized => `401`; forbidden => `403`; not found => `404`.
- Validation errors return `400` with actionable message.
- Server failures handled as `500` with safe error response.
- Pagination added for potentially large list responses.

---

## Accessibility Checklist (minimum gate)
- Keyboard-only completion of primary tasks.
- Visible focus ring on all interactive controls.
- Form labels and validation errors programmatically associated.
- Async updates (success/error/loading) are perceivable non-visually.
- Text and control contrast meet WCAG 2.2 AA for changed screens.

---

## Regression Sweep Rules
- Verify at least 1 adjacent route per changed route.
- Re-test shared components touched by the ticket in both teacher and school surfaces.
- Confirm no role navigation regressions in sidebar/top-level flows.

---

## Signoff Template

### Ticket
- ID:
- Owner:
- Date:

### Rubric Score
- Visual parity:
- Interaction fidelity:
- State handling:
- Data integrity:
- API contract quality:
- AuthZ and scoping:
- Accessibility:
- Responsiveness:
- Regression safety:
- Total:

### Findings
- High:
- Medium:
- Low:

### Decision
- Status: `PASS` / `PASS WITH CONDITIONS` / `FAIL`
- Required fixes:

