# EH-035 System States Rollout

## Scope
Unified route-level state handling across the hybrid target screens using shared components from `src/components/system/system-states.tsx`.

## Standardized states
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `SuccessState`
- `NoAccessState`

## Covered routes in this phase
- Public jobs: loading fallbacks in `/jobs`
- Teacher apps: `/dashboard/applications`, `/dashboard/saved`, `/dashboard/alerts`
- School flows: `/dashboard/my-jobs`, `/dashboard/pipeline`, `/dashboard/interviews`, `/dashboard/school`, `/dashboard/post-job`
- New domains: `/dashboard/messages`, `/dashboard/notifications`, `/dashboard/settings` (security tab)

## Notes
- Route-level ad hoc loading card in applications was replaced with `LoadingState`.
- New domain screens (messages, notifications, settings-security) are fully aligned to shared state primitives.
