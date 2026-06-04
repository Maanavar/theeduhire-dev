# EduHire Functional Spec

This document describes what the current EduHire codebase does at a product and system level.

It is intentionally focused on function, behavior, permissions, workflows, and business rules.

It is not a UX/UI specification.

It is written so a product, engineering, or outsourcing team could rebuild the app from this list.

## 1. Product Summary

EduHire is a role-based teacher hiring platform focused on connecting teachers with schools.

There are 3 primary user roles:

- `TEACHER`
- `SCHOOL_ADMIN`
- `ADMIN`

The platform combines:

- public marketing and job discovery
- account creation and authentication
- teacher profile management
- school profile and verification management
- job posting and moderation
- application tracking
- candidate ranking and AI match scoring
- interview scheduling
- saved jobs and alerts
- messaging and notifications
- subscription-gated hiring features
- managed recruitment for schools that want EduHire to handle hiring
- admin moderation, audit logging, and offline-school operations

## 2. Primary User Types

### Teacher

Teachers use EduHire to:

- create an account
- verify email
- complete a teaching profile
- upload resume and supporting teaching assets
- search jobs
- view match-scored recommendations
- save jobs
- apply to jobs
- track application status
- manage interviews
- receive notifications
- create job alerts
- upgrade to a Pro teacher plan

### School Admin

Schools use EduHire to:

- create an account
- verify email
- complete a school profile
- upload logo
- request school verification
- post and edit jobs
- review applicants
- sort and manage applicants
- schedule interviews
- message candidates
- track hiring funnel metrics
- manage billing and plan limits
- request managed recruitment help

### Admin

Admins use EduHire to:

- monitor platform overview
- review and verify schools
- review and verify teachers
- suspend and unsuspend users
- moderate jobs
- create, edit, and delete teacher and school accounts
- manage offline schools
- manage jobs on behalf of offline schools
- review audit logs

## 3. Core Business Entities

The current repo is built around these entities:

- `User`
- `TeacherProfile`
- `SchoolProfile`
- `Experience`
- `Certification`
- `JobPosting`
- `JobRequirement`
- `JobBenefit`
- `ScreeningQuestion`
- `Application`
- `ScreeningAnswer`
- `Resume`
- `SavedJob`
- `JobAlert`
- `AlertHistory`
- `ApplicationStatusHistory`
- `Interview`
- `AIMatchScore`
- `Conversation`
- `Message`
- `Notification`
- `UserSession`
- `SecurityEvent`
- `ProfileView`
- `SchoolSubscription`
- `TeacherSubscription`
- `ManagedRecruitmentRequest`
- `DomainEvent`
- `BackgroundJob`
- `RateLimitEvent`
- `IdempotencyKey`

## 4. Public-Side Product Functions

### Marketing Site

The public site supports:

- homepage with product positioning for teachers and schools
- pricing display for school and teacher plans
- FAQ content
- contact entry points
- CTA flows into signup
- SEO metadata and structured data

### Public Job Discovery

Anonymous users can:

- browse job listings
- filter jobs by subject, board, location, grade level, experience level, urgency, and search term
- sort jobs by latest and salary
- open public job detail pages

Public job pages show:

- school identity
- salary band
- board
- grade level
- job type
- urgency flags
- application deadline
- description
- requirements
- benefits
- school profile details
- applicant count

Public jobs exclude:

- hidden jobs
- expired jobs
- closed jobs
- suspended-school jobs unless the school is an offline-managed school

### Public Teacher Profile Pages

EduHire exposes public teacher profile pages that show:

- profile photo
- name
- current school
- city
- experience
- availability status
- bio
- subjects
- preferred boards
- preferred grades
- preferred role types
- qualification
- work experience entries
- certifications
- expected salary
- TET/CTET status
- teaching mediums
- notice period
- resume count
- child-safety badge when granted
- featured badge for paid teachers

The app also logs profile views for teacher analytics.

### Managed Recruitment Landing Page

There is a public managed recruitment flow where a school can submit:

- contact name
- contact email
- contact phone
- school name
- job title
- job description
- optional requirements
- salary range
- target join date

This creates a managed recruitment request for the EduHire team to process.

## 5. Authentication And Account Lifecycle

### Sign Up

EduHire supports:

- teacher signup
- school admin signup
- Google signup for teacher accounts only

Teacher signup collects:

- name
- email
- password
- optional phone
- experience
- job type preference
- subjects
- city

School signup collects:

- name
- email
- password
- optional phone
- school name
- city
- board

### Sign In

EduHire supports:

- credential login
- role-based redirect after login
- suspension blocking
- email-verification gating

Post-login routing behavior:

- teachers go to teacher dashboard or profile completion if not ready
- schools go to school dashboard or school profile completion if setup is incomplete
- admins go to `/admin`

### Email Verification

The app sends verification emails and blocks credential login until verification is complete.

### Password Recovery

The app supports:

- forgot password request
- reset token generation
- reset token expiry
- password reset submission
- rate limiting on password reset requests

### Account Security

The app supports:

- password change
- password strength enforcement
- active session listing
- per-session revocation
- revoke-all-other-sessions
- security event logging

The `2FA` endpoint currently exists but returns `404`, so two-factor authentication is not implemented yet.

### Account Deletion

Authenticated users can delete their own account through the account delete API.

## 6. Teacher Functional List

### Teacher Profile / Teacher Passport

Teachers can maintain a structured profile with:

- personal identity fields
- avatar
- bio
- qualification
- experience level
- current school
- city
- subjects
- preferred boards
- preferred grades
- expected salary
- availability status
- preferred job types
- notice period
- TET/CTET status
- teaching mediums
- POCSO acknowledgement
- reference-check flag
- code-of-conduct acknowledgement
- demo video
- lesson plan
- work experience entries
- certification entries
- resumes

### Profile Completion And Apply Readiness

Teacher profile completion is scored.

Current readiness rule:

- profile completion must be at least `80%`
- teacher must have at least one resume

If not ready:

- apply is blocked
- dashboard shows blockers

### Resume Management

Teachers can:

- upload resumes
- delete resumes
- download stored resumes
- generate resumes from profile data

Current generated resume templates:

- `ats-friendly`
- `modern`
- `minimal`

Generated resumes are rendered as PDFs from HTML via headless Chromium and stored in Supabase storage.

### Job Browsing

Teachers can:

- browse jobs in dashboard mode
- open detailed job view
- see whether a job is already applied to
- see whether a job is saved

### Saved Jobs

Teachers can:

- save jobs
- unsave jobs
- view saved jobs list

### Applications

Teachers can:

- apply to active jobs
- submit cover letter
- select a resume
- answer required screening questions
- track applications
- filter applications by status and date
- withdraw applications

Apply flow rules include:

- teacher-only access
- duplicate application prevention
- rate limiting
- idempotency protection
- readiness check before apply
- resume ownership validation
- screening question validation
- hidden/closed/expired/deadline-expired job blocking

### Recommendations

Teachers can view AI-ranked recommendations based on stored match scores.

Recommendation data includes:

- match score
- explanation
- match breakdown
- school
- salary
- subject
- board
- grade level

Teachers can filter recommendations by:

- subject
- board
- search term

Teachers can sort recommendations by:

- best match
- most recent
- highest salary

### Interviews

Teachers can:

- view scheduled interviews
- see interview mode, date, duration, location, and meeting link
- confirm interviews
- cancel interviews
- join video interviews through meeting links when provided

### Notifications

Teachers receive in-app notifications for:

- applications
- interviews
- messages
- system events

They can:

- list notifications
- mark one as read
- mark all as read
- archive notifications

### Job Alerts

Teachers can create job alerts using:

- name
- subject
- city
- board
- grade level
- job type
- salary range
- frequency

Frequencies:

- immediate
- daily digest
- weekly digest

Teachers can also:

- pause alerts
- resume alerts
- edit alerts
- delete alerts
- store WhatsApp number and opt-in preference

### Teacher Subscription

Teacher plans:

- `FREE`
- `PRO`

Free teacher plan includes:

- unlimited applications
- fit score
- resume and profile features
- interview scheduling access

Teacher Pro adds:

- featured badge
- priority placement in school searches
- profile view analytics
- instant alert positioning in pricing and subscription flows

Upgrade flow is currently manual via email to EduHire.

## 7. School Functional List

### School Profile

Schools can manage:

- admin name
- school name
- city
- board
- address
- website
- about
- logo
- PF/ESI flag
- payment track record
- working hours
- UDISE code

### School Verification

Schools can submit a verification request.

Verification states:

- `UNVERIFIED`
- `PENDING`
- `VERIFIED`
- `REJECTED`

Only verified schools can post live jobs through the normal school flow.

### Job Posting

Schools can create and edit jobs with:

- title
- subject
- board
- grade level
- job type
- experience text
- experience level enum
- salary min/max
- urgent flag
- join-within-48-hours flag
- requires-TET flag
- application deadline
- description
- requirements list
- benefits list
- screening questions
- status `DRAFT` or `ACTIVE`

Job posting rules:

- school-only or admin
- school must be verified for normal live posting
- posting is rate limited
- plan limit enforcement applies to non-admin school users
- text is sanitized

### Job List Management

Schools can:

- view their posted jobs
- open job detail
- update job status
- close jobs
- reactivate jobs

### Applicant Review

Schools can:

- view applicants for a job
- see ranked candidates
- filter candidates by status, search term, and experience
- sort candidates by match score or application date
- select multiple candidates
- update status in bulk
- add private school notes
- create conversations with candidates
- message all shortlisted candidates
- schedule interviews from candidate list

Candidate board shows:

- match score
- explanation
- teacher profile summary
- resume access
- screening answers
- school notes
- interview state
- safety badge

### Applicant Status Pipeline

Application statuses in use:

- `PENDING`
- `REVIEWED`
- `SHORTLISTED`
- `REJECTED`
- `HIRED`
- `INTERVIEW_SCHEDULED`
- `INTERVIEW_COMPLETED`

Every status change is stored in application status history.

### Messaging

Schools can:

- create conversation threads
- send messages in threads
- load message history
- view contacts
- archive conversation participation state

### Interviews

Schools can:

- schedule interviews
- choose interview mode `VIDEO`, `PHONE`, `IN_PERSON`
- set time and duration
- provide meeting link or location
- update interview status
- mark interview complete
- mark no-show
- cancel interview

### Analytics

Schools on eligible plans can access:

- total jobs
- active jobs
- total applications
- shortlisted count
- hired count
- average time to hire
- 30-day application trend
- job performance table
- recent activity stream

Analytics access is gated:

- `PRO` school plan only

### Live Hiring Updates

The applicant review flow supports live updates using server-sent events with polling fallback.

### Billing And Subscription

School plans:

- `FREE`
- `GROWTH`
- `PRO`

Current plan logic:

- `FREE`: 2 active posts
- `GROWTH`: 10 posts per cycle
- `PRO`: unlimited posts

Feature gating:

- AI shortlist access: `GROWTH` and `PRO`
- teacher contact reveal: `GROWTH` and `PRO`
- analytics: `PRO`

Upgrade flow is currently manual via email.

### Managed Recruitment

Schools can submit managed recruitment requests instead of self-serve hiring.

The managed recruitment workflow stores:

- requirement details
- salary budget
- join date
- status
- candidates presented count
- invoice amount
- paid state
- admin notes

Pricing in the current product copy and data model:

- `INR 10,000` per confirmed hire

## 8. Admin Functional List

### Admin Overview

Admin dashboard provides:

- total users
- teacher count
- school count
- total jobs
- active jobs
- total applications
- recent users/jobs/applications
- pending school verification queue
- pending teacher verification queue
- suspended user count
- verification funnel snapshots
- recent jobs list
- recent signups list

### School Administration

Admins can:

- search schools
- filter by verification state and verified status
- view school detail drawer
- create school user manually
- edit school user and school profile
- delete school
- approve school
- verify school
- unverify school
- reject school
- move school back to pending
- suspend school account
- unsuspend school account

### Teacher Administration

Admins can:

- search teachers
- filter by verification state
- view teacher detail drawer
- create teacher manually
- edit teacher
- delete teacher
- approve teacher verification
- reject teacher verification
- move teacher back to pending
- revoke safety badge
- suspend teacher
- unsuspend teacher

### Job Moderation

Admins can:

- search jobs
- filter by status
- close jobs
- reactivate jobs
- hide jobs from public listings
- unhide jobs
- delete jobs

### Offline Schools

Admins can manage schools that do not have their own digital account.

Offline-school functions:

- create offline school
- edit offline school
- delete offline school
- store offline contact details
- use these schools as owners for admin-managed jobs

### Managed Jobs For Offline Schools

Admins can create and run a full hiring workflow on behalf of offline schools:

- create managed jobs for offline schools
- edit managed jobs
- delete managed jobs
- inspect applicants
- move applicants through statuses
- reject with reason
- mark hired
- schedule interviews

### Audit Log

Admins can review action history for:

- school moderation
- teacher moderation
- job moderation

Audit entries capture:

- entity type
- action type
- actor
- timestamp
- notes
- rejection or suspension reasons when present

## 9. Notifications, Email, And Communications

### In-App Notifications

The platform creates notifications for:

- new application to schools
- interview reminders
- interview updates
- direct messages
- admin/system events

### Email

Current code-backed email flows include:

- email verification
- teacher application confirmation
- teacher application status update
- school new-application alert
- contact form notification to admin
- managed recruitment notification to admin

### Interview Reminder Automation

A cron-secured endpoint creates reminder notifications:

- day-before window
- one-hour-before window

Current reminder implementation is in-app notification based.

## 10. Search, Ranking, And Matching

### Job Search

Jobs are searchable by:

- title
- subject
- description
- school name
- school city

### Candidate Ranking

Schools can retrieve ranked candidates per job.

Ranking is based on stored AI match score records and supporting explanation/breakdown data.

### Teacher Recommendations

Teachers can retrieve top recommended jobs from stored AI match scores.

### AI Job Content Assistance

There is an AI job-improvement endpoint intended to help refine job posting content.

## 11. Security, Trust, And Compliance Functions

### Session And Access Control

The app enforces:

- role-based routing
- role-based API authorization
- session tracking
- session revocation
- suspension-based access blocking

### Rate Limiting

Rate limiting exists for:

- registration
- authentication
- contact form
- password reset
- job posting
- job application
- message creation
- notification sending
- managed recruitment submission
- AI job-improvement usage

### Idempotency

The teacher apply flow uses idempotency keys and replay-safe handling.

### Moderation / Trust Controls

Trust-related functionality includes:

- school verification
- teacher verification
- teacher safety badge
- school suspension
- teacher suspension
- job hiding
- job deletion
- profile visibility signals

### Child-Safety Related Data Points

The current schema and flows include:

- POCSO acknowledgement
- reference-check flag
- code-of-conduct flag
- safety badge grant/revoke

## 12. Storage And Third-Party Services

### Database

- PostgreSQL via Prisma

### File Storage

- Supabase storage

Current buckets/constants indicate support for:

- resumes
- avatars
- school logos
- teacher demo videos
- teacher lesson plans

### Auth

- NextAuth
- credentials auth
- Google auth for teachers

### Email Delivery

- Resend

### PDF Generation

- Puppeteer + Chromium for generated resumes

## 13. Background And Platform Operations

The codebase includes platform-side support for:

- cron-based interview reminder dispatch
- background job processing
- domain event publishing
- domain event consumer tracking
- cache invalidation for dashboard/job/profile surfaces
- smoke tests for teacher, school, admin, auth, API authz, and production hardening

## 14. Feature Flags

The app includes feature flags for:

- pipeline board
- messaging
- notifications center
- settings security
- school live updates

These flags affect whether some modules are visible or active without removing the underlying product area from the codebase.

## 15. Rebuild Checklist

A reproduction of EduHire needs these major modules:

1. Public marketing site with pricing, SEO, contact, managed recruitment entry, and public jobs.
2. Role-based authentication with email verification, password reset, Google teacher signup, and suspension handling.
3. Teacher passport/profile system with media uploads, completion scoring, readiness gating, resumes, demo assets, and public profile.
4. School profile system with verification workflow, logo upload, trust state, and plan-aware hiring access.
5. Job posting engine with filters, requirements, benefits, screening questions, deadlines, expiry, and moderation state.
6. Teacher job actions with save, recommendation, apply, withdraw, and application history tracking.
7. School applicant management with ranking, notes, bulk actions, messaging, interview scheduling, and status pipeline.
8. Notification and communication system with in-app notifications and transactional email.
9. Subscription system with school and teacher plans, posting limits, analytics/contact/AI gating, and upgrade flow.
10. Managed recruitment system for inbound school requirements and admin-operated offline-school hiring.
11. Admin console for school moderation, teacher moderation, job moderation, offline schools, managed jobs, and audit trail.
12. Platform operations layer with security events, session management, rate limiting, cron jobs, domain events, and smoke tests.

## 16. Scope Note

This document reflects the current code-backed functionality in the repository.

Some marketing copy references broader product aspirations, but this spec only includes behavior that is represented in the app structure, schema, routes, page logic, or supporting services in the codebase.
