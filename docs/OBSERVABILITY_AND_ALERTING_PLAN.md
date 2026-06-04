# Observability And Alerting Plan

Last updated: 2026-06-02

## Critical Signals

- Auth: failed login spikes, password reset volume, session revocation failures.
- Cron: alert send failures, cleanup failures, interview reminder failures.
- Uploads: content mismatch rejects, Supabase write/delete failures, oversized file rejects.
- Email: Resend send failures, bounce/complaint webhook events, admin contact failures.
- Jobs/applications: apply failures, notification send authorization denies, status update failures.
- AI: recommendation/improve-job provider failures, latency, and fallback usage.

## Minimum Production Setup

- Centralized error capture for all API routes and server actions.
- Structured logs with request id, route, user id when authenticated, role, status code, and latency.
- Alerting on repeated 5xx responses, cron failures, email failures, storage failures, and auth anomaly spikes.
- Dashboard panels for build version, deploy time, cron health, email health, upload health, and API error rate.
- Retention policy that avoids logging secrets, tokens, full resumes, passwords, or Supabase service role keys.

## Alert Thresholds

- Any cron endpoint failure: alert immediately.
- API 5xx rate above 1% over 10 minutes: alert.
- Password reset attempts above normal baseline: warn, then alert if sustained for 15 minutes.
- Upload reject rate above 10% over 15 minutes: warn.
- Email failure rate above 2% over 15 minutes: alert.

## Implementation Notes

- Keep `CRON_SECRET`, Supabase service role keys, OAuth secrets, and email API keys out of logs.
- Add webhook ingestion for email bounce/complaint events before enabling high-volume transactional mail.
- Record audit events for admin moderation, password changes, and session revocations.
