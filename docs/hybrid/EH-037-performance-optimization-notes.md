# EH-037 Performance Optimization Notes

Date: 2026-05-09

## Changes implemented
- Code-split heavy dashboard modules on applications page using dynamic imports:
  - `StatsCards`
  - `JobDetailModal`
  - `ApplicationTimeline`
- Preserved memoized grouping/filtering in pipeline and interviews routes.
- Avoided unnecessary blocking rendering for secondary modules.

## File updates
- `src/app/(dashboard)/dashboard/applications/page.tsx`

## Expected impact
- Reduced initial JS cost for `/dashboard/applications`.
- Faster time-to-interactive on first dashboard load in teacher flow.
- Improved route hydration behavior for heavy modal/timeline components.
