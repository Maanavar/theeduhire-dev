# EH-041 Platform Reliability + Realtime Roadmap

Date: 2026-05-10

## Goal
Implement the remaining platform-hardening work in a sequence that fits the current EduHire stack:

- Next.js App Router
- NextAuth JWT sessions
- Prisma + PostgreSQL (Supabase)
- Route-handler driven side effects
- Client polling on admin pages
- Lightweight browser-script regression checks

This is implementable, but it should not be treated as one feature. The safest path is to establish an event backbone first, then move read/write paths and UX onto it in phases.

## Current state summary

### What exists today
- Core job, application, interview, notification, messaging, and analytics flows exist.
- Feature-flag support exists, but only for a few UI modules.
- Match scoring exists as a deterministic function in `src/lib/ai-match.ts`.
- Ranked applicants are computed on read in `src/app/api/jobs/[id]/candidates/ranked/route.ts`.
- Analytics are aggregated on read in `src/app/api/dashboard/analytics/route.ts`.
- Role checks exist in `src/middleware.ts` and `src/lib/session.ts`.
- Browser workflow scripts exist in `scripts/test-*.ts`.

### Main architectural gaps
- Applicants and pipeline pages still poll every 15 seconds.
- Side effects are coupled directly to route handlers.
- AI score recomputation writes to the database during reads.
- Analytics queries will get slower and less stable as data grows.
- Authorization policy is duplicated across middleware and API handlers.
- Idempotency is only partially enforced via unique constraints.
- Logging and metrics are mostly `console.*`.
- Rollout controls exist, but not yet as kill-switch-grade operational controls.

## Recommended implementation order

1. Establish domain events + idempotency + observability.
2. Move AI refresh and notifications onto background processing.
3. Replace polling with realtime subscriptions on top of the event stream.
4. Add analytics read models and operational rollout controls.
5. Finish with deterministic E2E and UX polish after behavior is stable.

This order matters. Realtime without a dependable event source becomes fragile, and analytics/read-model work is much easier once writes emit consistent events.

## Phase 0: Foundation decisions

### Decisions to lock before coding
- Event transport:
  - Recommended: Postgres outbox table + worker loop.
  - Optional later: external broker if throughput truly demands it.
- Background jobs:
  - Recommended: database-backed queue first.
  - Keep retries, dead-letter state, and job dedupe in schema.
- Realtime transport:
  - Recommended first: SSE for admin dashboards.
  - Add WebSocket only if bidirectional features become necessary.
- Observability sink:
  - Minimum: structured JSON logs + request IDs + business metrics table/export.
  - Better: OpenTelemetry-compatible tracing if hosting setup supports it.

### Deliverables
- ADR doc for event transport, queue choice, SSE vs WebSocket, and telemetry sink.
- Shared correlation ID strategy for request -> event -> job -> notification flow.

## Phase 1: Domain event backbone

### Scope
- Add domain event model and publisher utility.
- Emit events from write paths only after successful DB commit.
- Introduce consumers for notifications, analytics projections, audit logs, and AI refresh scheduling.

### First events
- `teacher_registered`
- `application_created`
- `application_status_changed`
- `job_posted`
- `job_updated`
- `teacher_profile_updated`
- `interview_scheduled`
- `notification_created`

### Repo impact
- Add Prisma models for:
  - `DomainEvent`
  - `DomainEventConsumerCheckpoint` or consumer delivery table
- Refactor routes such as:
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/jobs/[id]/apply/route.ts`
  - `src/app/api/applications/[id]/status/route.ts`
  - interview create/update routes
- Extract side effects from route handlers into event consumers.

### Acceptance criteria
- Writes succeed even if email/analytics consumers are temporarily failing.
- Every important mutation emits exactly one canonical domain event.
- Consumers can replay from stored events.

## Phase 2: Idempotency + consistency guarantees

### Scope
- Add idempotency keys for user-triggered writes and worker jobs.
- Prevent duplicate side effects during retries, refreshes, and double submits.

### Priority endpoints
- `POST /api/auth/register`
- `POST /api/jobs/[id]/apply`
- interview scheduling routes
- notification dispatch jobs
- AI refresh jobs

### Recommended design
- Add `IdempotencyKey` table keyed by:
  - actor
  - operation
  - client key
- Persist request hash, response status, and response body reference.
- Add job execution dedupe table keyed by:
  - event ID
  - consumer name
  - attempt lineage

### Acceptance criteria
- Double-clicking apply/register does not create duplicates.
- Retried workers do not resend the same email or duplicate projections.
- Operational replay is safe.

## Phase 3: Unified authorization policy layer

### Scope
- Centralize role and ownership checks into a single policy module.
- Stop encoding authorization separately in middleware, route handlers, and UI branches.

### Recommended shape
- Add modules such as:
  - `src/lib/policies/application-policy.ts`
  - `src/lib/policies/job-policy.ts`
  - `src/lib/policies/message-policy.ts`
  - shared policy result helpers
- Keep middleware focused on authentication and route gating.
- Make route handlers call policy functions for resource-level access.

### Current drift to remove
- `src/middleware.ts` contains route-role logic.
- `src/lib/session.ts` handles auth presence and session validity.
- Individual routes separately perform ownership checks.

### Acceptance criteria
- One canonical policy function per resource/action.
- Permissions matrix can be tested without browser automation.
- Audit review can trace every protected action to one policy rule.

## Phase 4: Background AI ranking refresh

### Scope
- Stop recomputing match score on read.
- Recompute scores when relevant source data changes.
- Add queue, retries, staleness tracking, and freshness SLA.

### Triggers
- teacher profile change
- job posting change
- application creation
- optional periodic backfill/revalidation

### Recommended design
- New models:
  - `MatchScoreRefreshJob`
  - extend `AIMatchScore` with source version/fingerprint metadata
- Job payload includes:
  - `jobId`
  - `applicantId`
  - trigger reason
  - source versions
- Read path returns stored score only.
- If score is stale, surface freshness metadata rather than recomputing inline.

### Target SLA
- P95 score freshness under 60 seconds after relevant writes.
- Admin ranked applicant views never perform DB writes.

### Acceptance criteria
- `src/app/api/jobs/[id]/candidates/ranked/route.ts` becomes read-only.
- Worker retries handle transient failures.
- Score age is visible for debugging and observability.

## Phase 5: Realtime admin updates

### Scope
- Replace 15-second polling on applicants and pipeline views with server-pushed updates.
- Broadcast application and status events across tabs.

### First pages to migrate
- `src/app/(dashboard)/dashboard/applicants/page.tsx`
- `src/app/(dashboard)/dashboard/pipeline/page.tsx`

### Recommended design
- SSE endpoint per authenticated admin/school context.
- Events fan out from domain event consumers or projection updates.
- Client keeps local optimistic UI for status moves, then reconciles from stream.

### Why SSE first
- Simpler in App Router than full socket lifecycle.
- Good fit for mostly server-to-client updates.
- Easier to proxy and debug.

### Acceptance criteria
- New application appears in admin views in under 1 second in normal conditions.
- Status changes propagate across two open tabs.
- Polling remains behind a kill switch as fallback during rollout.

## Phase 6: Denormalized analytics read models

### Scope
- Move dashboard analytics from query-on-read to projection tables.
- Pre-aggregate minute/hour buckets and top-level counters.

### Suggested read models
- `AnalyticsApplicationBucket`
- `AnalyticsHiringFunnelSnapshot`
- `AnalyticsJobPerformanceSnapshot`
- `AnalyticsOperationalMetric`

### Projection sources
- `application_created`
- `application_status_changed`
- `job_posted`
- `interview_scheduled`
- `hire_completed`

### Benefits
- Faster dashboard responses
- Stable query cost
- Better support for business alerts and trend analysis

### Acceptance criteria
- `src/app/api/dashboard/analytics/route.ts` reads only projection tables.
- Projection lag is measured and alertable.
- Historical rebuild can be run from stored events.

## Phase 7: Full observability

### Scope
- Replace ad hoc console logging with structured logs.
- Add tracing and business metrics around the new event/job backbone.

### Minimum telemetry set
- Structured logs with:
  - request ID
  - user ID
  - role
  - route
  - event ID
  - job ID
  - latency
  - outcome
- Traces:
  - register
  - apply
  - status change
  - AI refresh
  - notification dispatch
- Business metrics:
  - time-to-hire
  - application conversion by stage
  - AI refresh latency
  - SSE delivery lag
  - event consumer failure rate

### Alerts
- Failure spike in event consumers
- Match refresh lag above SLA
- SSE connection error spike
- duplicate idempotency conflict spike

### Acceptance criteria
- Every domain event and background job is traceable end-to-end.
- On-call can identify whether a failed user-visible update was caused by write path, projection, or stream delivery.

## Phase 8: End-to-end contract tests

### Scope
- Upgrade the current Puppeteer smoke scripts into deterministic, seeded contract tests.
- Test behavior, latency envelopes, and authorization matrices.

### Coverage
- teacher registers -> applies -> admin sees application
- admin status changes -> teacher sees update
- AI score refresh completes within SLA
- permissions matrix:
  - teacher denied school-only routes/actions
  - school denied teacher-only sensitive actions
  - admin access where intended
- realtime contract:
  - application appears in admin view within X seconds

### Test strategy
- Seed deterministic fixtures.
- Use test-only helpers to observe emitted events and projection completion.
- Keep browser E2E thin; move most permission and contract assertions into API-level integration tests.

### Acceptance criteria
- Tests do not depend on manual credentials.
- Latency assertions are deterministic enough for CI.
- Permissions matrix is automated and reviewable.

## Phase 9: Release hardening

### Scope
- Expand feature flags into operational rollout controls with kill switches and rollback automation.

### Controls to add
- write-path flag
- consumer flag
- SSE flag
- analytics projection flag
- AI background refresh flag
- fallback-to-polling flag

### Rollout method
1. Dark launch event publishing.
2. Enable consumers without user-facing dependence.
3. Switch AI read path to stored scores.
4. Enable SSE for internal users.
5. Canary by school cohort.
6. Enable analytics read models.
7. Remove old polling/query-on-read path only after stability window.

### CI/release requirements
- signed checklist artifact
- migration compatibility checks
- rollback command docs
- canary health gates
- automatic rollback on failure thresholds

### Acceptance criteria
- New subsystems can be disabled independently.
- Rollback does not require emergency code changes.
- Release readiness is auditable in CI.

## UX quality pass

This should be intentionally later, not first.

### Why
- Realtime, projections, and policy changes will alter state handling and copy.
- Doing visual polish before system behavior settles creates rework.

### Scope
- remove warning debt
- unify copy tone
- consolidate spacing/typography tokens
- accessibility polish for live updates
- tasteful motion for state transitions

### Notes for this repo
- Existing UI already has custom visual work; preserve that direction.
- Realtime surfaces must include a11y announcements and reduced-motion handling.

## Proposed milestone breakdown

### Milestone A: Platform spine
- Phase 0
- Phase 1
- Phase 2
- Phase 3

Outcome:
- reliable event source
- safe retries
- centralized permissions

### Milestone B: Async intelligence
- Phase 4
- Phase 7 baseline

Outcome:
- AI ranking moved off read path
- measurable freshness and failure handling

### Milestone C: Live operations
- Phase 5
- Phase 6

Outcome:
- live admin views
- scalable analytics

### Milestone D: Product hardening
- Phase 8
- Phase 9
- UX quality pass

Outcome:
- safe rollout
- deterministic contracts
- premium finish

## Suggested first implementation ticket list

1. Add event/outbox Prisma schema and migration.
2. Add event publisher utility and wrap application/register/status-change writes.
3. Add idempotency table and middleware/helper for apply/register.
4. Extract notifications/email into event consumers.
5. Introduce policy modules and convert application/job routes first.
6. Add AI refresh queue tables and worker loop.
7. Convert ranked-candidates endpoint to read-only stored scores.
8. Add SSE endpoint and migrate applicants page.
9. Migrate pipeline page to SSE + optimistic reconciliation.
10. Add analytics projection tables and swap dashboard reads.
11. Add structured logging/tracing around events/jobs.
12. Replace script-based smoke tests with seeded contract tests in CI.

## Recommendation

Yes, we should implement all of this, but as a 4-milestone platform program rather than a single feature branch.

If we start in the wrong order, we will create fragile complexity. If we start with the event backbone, idempotency, and policy consolidation, the rest of the list becomes much cheaper and safer to ship.
