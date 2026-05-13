# EH-039 Funnel Analytics Instrumentation

Date: 2026-05-09

## Analytics utility
- Added `trackEvent` helper with:
  - Custom browser event: `eduhire:analytics`
  - Optional `window.dataLayer` push

File:
- `src/lib/analytics.ts`

## Events wired
- `job_apply_submitted`
  - Trigger: apply form submit success
  - File: `src/components/forms/apply-form.tsx`
- `pipeline_status_changed`
  - Trigger: school pipeline status drag/drop save
  - File: `src/app/(dashboard)/dashboard/pipeline/page.tsx`
- `interview_status_changed`
  - Trigger: interview status update actions
  - File: `src/app/(dashboard)/dashboard/interviews/page.tsx`
- `message_sent`
  - Trigger: start conversation + send reply
  - File: `src/app/(dashboard)/dashboard/messages/page.tsx`
- `notification_mark_read`
  - Trigger: mark single / mark all read
  - File: `src/app/(dashboard)/dashboard/notifications/page.tsx`
- `security_password_changed`
  - Trigger: settings password update success
  - File: `src/app/(dashboard)/dashboard/settings/page.tsx`

## Validation approach
- Event payload visible through `window` custom event listener.
- If GTM/analytics sink sets `dataLayer`, events are pushed automatically.
