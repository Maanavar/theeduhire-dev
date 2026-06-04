# Production Readiness Checklist

Last updated: 2026-06-02

## Before Every Release

- `npm install` completed from the lockfile.
- `npm audit` reports 0 vulnerabilities or documented accepted risk.
- `npm run lint` passes with 0 warnings.
- `npm run typecheck` passes.
- `npm run typecheck:scripts` passes.
- `npm run build` passes.
- Prisma migrations are committed and reviewed.
- `npx prisma migrate deploy --schema prisma/schema.prisma` is planned for deployment.
- `.env.example` matches all runtime variables used by code.
- Production secrets are rotated if exposed, stale, or copied into local logs.
- `public/designs/**` is excluded from production deploys.

## Database And Scripts

- Destructive scripts are never run against production.
- `DATABASE_SAFETY_LABEL` is set for script runs.
- `CONFIRM_DESTRUCTIVE_DB_SCRIPT` is set only for intentional local/demo destructive runs.
- `ALLOW_SMOKE_DATA_SCRIPT` is set only for local/demo/staging smoke runs.
- Seed and reset passwords come from env and are not defaults.

## Product QA

- Run `npm run test:visual-audit` against a safe local/demo/staging target.
- Review desktop and mobile screenshots for signup, search, apply, applicants, messaging, and profile flows.
- Review `audit-screenshots/phase5-6/accessibility-findings.json`.
- Verify keyboard navigation for sign-in, signup, job search, apply, applicants, messaging, and profile edit.
- Verify no mobile horizontal overflow or overlapping text.

## Rollback

- Confirm the previous production deployment is still available.
- Confirm database migrations are backward compatible or have a documented rollback path.
- Confirm cron jobs can be disabled quickly by rotating or removing `CRON_SECRET`.
- Confirm email sending can be disabled by removing `RESEND_API_KEY`.
