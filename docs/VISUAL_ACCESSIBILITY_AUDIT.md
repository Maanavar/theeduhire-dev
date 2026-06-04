# Visual And Accessibility Audit

Last updated: 2026-06-02

## Scope

Core journeys covered by `npm run test:visual-audit`:

- Teacher signup details
- School signup details
- Job search
- Public job detail
- Teacher job apply surface
- School applicants
- Teacher and school messaging
- Teacher profile
- Teacher and school dashboards

The script captures desktop `1440x1080` and mobile `390x844` screenshots into `audit-screenshots/phase5-6` and writes `accessibility-findings.json`.

## Safety Gate

The audit seeds or refreshes smoke users. It must only run against local, development, staging, or demo databases.

Required environment:

- `DATABASE_SAFETY_LABEL=local`, `development`, `staging`, or `demo`
- `ALLOW_SMOKE_DATA_SCRIPT=I_UNDERSTAND_THIS_WRITES_TEST_DATA`
- `BASE_URL` pointing to the app instance under test

Do not run this against production or an unknown remote database.

## Review Standard

Pass criteria:

- No broken route, blank page, runtime error, or auth loop.
- No horizontal overflow on mobile or desktop.
- Primary controls have accessible names.
- Form controls have visible labels or valid ARIA labels.
- Image assets have `alt` text unless decorative.
- Navigation, buttons, and form fields remain reachable by keyboard.
- Text does not overlap controls or truncate critical information.

## Current Execution Status

Execution was intentionally not run on 2026-06-02 because the local `.env` points at a remote Supabase database without a safety label. The script and guard are ready; run it only after confirming a non-production target.
