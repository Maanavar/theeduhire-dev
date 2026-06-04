import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell, Panel, PanelHeader } from "@/components/layout/page-shell";
import {
  ArrowRight,
  BellRing,
  Bookmark,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileText,
  Lock,
  MapPin,
  Sparkles,
  Star,
  TrendingUp,
  UserRoundCog,
} from "lucide-react";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import { calculateProfileCompletion, getTeacherApplyReadiness } from "@/lib/profileCompletion";
import { getTeacherPlan } from "@/lib/subscription";
import { formatSalary } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  if (session.user.role === "SCHOOL_ADMIN") redirect("/dashboard/school");
  if (session.user.role === "ADMIN") redirect("/admin");

  const userId = session.user.id;

  const now = new Date();
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    applicationCount,
    pendingCount,
    shortlistedCount,
    offeredCount,
    rejectedCount,
    upcomingInterviews,
    savedCount,
    profile,
    resumeCount,
    user,
    topRecommendations,
    teacherPlan,
    profileViews30d,
    profileViews7d,
    recentApplications,
  ] = await Promise.all([
    prisma.application.count({ where: { applicantId: userId } }),
    prisma.application.count({ where: { applicantId: userId, status: "PENDING" } }),
    prisma.application.count({ where: { applicantId: userId, status: "SHORTLISTED" } }),
    prisma.application.count({ where: { applicantId: userId, status: "HIRED" } }),
    prisma.application.count({ where: { applicantId: userId, status: "REJECTED" } }),
    prisma.interview.findMany({
      where: { application: { applicantId: userId }, scheduledAt: { gte: new Date() } },
      include: { application: { include: { job: { include: { school: true } } } } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    }),
    prisma.savedJob.count({ where: { userId } }),
    prisma.teacherProfile.findUnique({
      where: { userId },
      include: {
        experiences: { select: { id: true } },
        certifications: { select: { id: true } },
      },
    }),
    prisma.resume.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } }),
    prisma.aIMatchScore.findMany({
      where: { applicantId: userId },
      orderBy: { score: "desc" },
      take: 3,
      select: {
        id: true,
        score: true,
        explanation: true,
        job: {
          select: {
            id: true,
            title: true,
            jobType: true,
            salaryMin: true,
            salaryMax: true,
            subject: true,
            board: true,
            school: { select: { schoolName: true, verified: true, city: true } },
          },
        },
      },
    }),
    getTeacherPlan(userId),
    prisma.profileView.count({ where: { teacherId: userId, viewedAt: { gte: ago30d } } }),
    prisma.profileView.count({ where: { teacherId: userId, viewedAt: { gte: ago7d } } }),
    prisma.application.findMany({
      where: { applicantId: userId },
      orderBy: { appliedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        appliedAt: true,
        job: { select: { title: true, school: { select: { schoolName: true } } } },
      },
    }),
  ]);

  const completion = calculateProfileCompletion({
    avatarUrl: user?.avatarUrl,
    bio: profile?.bio,
    qualification: profile?.qualification,
    experience: profile?.experience,
    city: profile?.city,
    subjects: profile?.subjects || [],
    preferredBoards: profile?.preferredBoards || [],
    preferredGrades: profile?.preferredGrades || [],
    experiences: profile?.experiences || [],
    certifications: profile?.certifications || [],
    resumes: Array.from({ length: resumeCount }).map((_, i) => ({ id: String(i) })),
  }).percentage;

  const readiness = getTeacherApplyReadiness({
    avatarUrl: user?.avatarUrl,
    bio: profile?.bio,
    qualification: profile?.qualification,
    experience: profile?.experience,
    city: profile?.city,
    subjects: profile?.subjects || [],
    preferredBoards: profile?.preferredBoards || [],
    preferredGrades: profile?.preferredGrades || [],
    experiences: profile?.experiences || [],
    certifications: profile?.certifications || [],
    resumes: Array.from({ length: resumeCount }).map((_, i) => ({ id: String(i) })),
  });

  const firstName = session.user.name?.split(" ")[0] ?? "Teacher";
  const topMatch = topRecommendations[0] ? Math.round(topRecommendations[0].score * 100) : 0;
  const firstVisit =
    applicationCount === 0 &&
    upcomingInterviews.length === 0 &&
    savedCount === 0;

  const reviewedCount = applicationCount - pendingCount - shortlistedCount - offeredCount - rejectedCount;

  const activityFeed = recentApplications.map((app) => ({
    id: app.id,
    text: app.status === "PENDING"
      ? `Applied to ${app.job.title} at ${app.job.school.schoolName}`
      : app.status === "SHORTLISTED"
        ? `Shortlisted for ${app.job.title} at ${app.job.school.schoolName}`
        : app.status === "INTERVIEW_SCHEDULED"
          ? `Interview scheduled for ${app.job.title}`
          : app.status === "HIRED"
            ? `Offer received from ${app.job.school.schoolName}`
            : `Application updated for ${app.job.title}`,
    time: app.appliedAt,
    icon: app.status === "SHORTLISTED" ? "shortlist" : app.status === "HIRED" ? "offer" : "apply",
  }));

  const interviewActivity = upcomingInterviews.slice(0, 2).map((iv) => ({
    id: `iv-${iv.id}`,
    text: `Interview scheduled at ${iv.application.job.school.schoolName}`,
    time: iv.scheduledAt,
    icon: "interview",
  }));

  const allActivity = [...interviewActivity, ...activityFeed].slice(0, 5);

  return (
    <PageShell className="space-y-5 lg:space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--eh-border)] pb-5">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
            Dashboard
          </p>
          <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)] sm:text-[26px]">
            {firstVisit ? `Welcome to EduHire, ${firstName}!` : `Welcome back, ${firstName}!`}
          </h1>
          <p className="mt-1.5 text-[14px] leading-6 text-[var(--eh-text-3)]">
            {firstVisit
              ? "Start with your profile, upload your resume, and explore matched teaching roles."
              : "Here's what's happening with your job search."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/profile" className="eh-btn eh-btn-secondary">
            <UserRoundCog size={14} />
            Update Profile
          </Link>
          <Link href="/dashboard/jobs" className="eh-btn eh-btn-primary">
            <BriefcaseBusiness size={14} />
            Find Jobs
          </Link>
        </div>
      </div>

      <OnboardingChecklist role="TEACHER" teacherCompletion={completion} />

      {/* ── Profile readiness alert ── */}
      {!readiness.ready ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-amber-900">
                Profile not ready to apply
              </p>
              <p className="mt-1 text-[13px] text-amber-800">
                Close these gaps to submit complete applications and rank higher in school searches.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {readiness.blockers.map((blocker) => (
                  <span
                    key={blocker}
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-white px-2.5 py-1 text-[12px] font-medium text-amber-800"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {blocker}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center rounded-xl border border-amber-200 bg-white px-4 py-3 text-center">
              <span className="text-[28px] font-bold leading-none tracking-tight text-amber-700">
                {readiness.completion}%
              </span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                Ready
              </span>
            </div>
          </div>
          <div className="mt-3 border-t border-amber-200 pt-3">
            <Link href="/dashboard/profile" className="eh-btn eh-btn-primary eh-btn-sm">
              Finish profile
            </Link>
          </div>
        </div>
      ) : null}

      {/* ── First visit quick start ── */}
      {firstVisit ? (
        <Panel className="p-5">
          <PanelHeader
            title="Get started"
            subtitle="Three steps to unlock better matches and applications."
          />
          <div className="grid gap-3 md:grid-cols-3">
            <QuickStartStep step={1} href="/dashboard/profile" title="Finish your profile" body="Add qualification, subjects, city, and a short bio." />
            <QuickStartStep step={2} href="/dashboard/profile#resume" title="Upload your resume" body="Required before you can apply to any job on EduHire." />
            <QuickStartStep step={3} href="/dashboard/jobs" title="Browse matched jobs" body="See fit scores, school details, and role requirements." />
          </div>
        </Panel>
      ) : null}

      {/* ── Main two-column layout ── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* KPI stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Applications" value={applicationCount} sub="Total submitted" tone="brand" href="/dashboard/applications" />
            <StatCard label="Interviews" value={upcomingInterviews.length} sub="Upcoming" tone="info" href="/dashboard/interviews" />
            <StatCard label="Shortlisted" value={shortlistedCount} sub="By schools" tone="success" href="/dashboard/applications" />
            <StatCard label="Offered" value={offeredCount} sub="This cycle" tone="emerald" href="/dashboard/applications" />
          </div>

          {/* Application overview + Activity feed */}
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            {/* Application overview */}
            <Panel className="p-5">
              <PanelHeader
                title="Application Overview"
                subtitle="Last 30 Days"
                actions={
                  <Link href="/dashboard/applications" className="text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                    View Applications →
                  </Link>
                }
              />
              <div className="space-y-3">
                <StatusRow label="Under Review" count={pendingCount} color="bg-amber-400" total={applicationCount} />
                <StatusRow label="Shortlisted" count={shortlistedCount} color="bg-emerald-500" total={applicationCount} />
                <StatusRow label="Offered" count={offeredCount} color="bg-[var(--eh-primary-500)]" total={applicationCount} />
                <StatusRow label="Rejected" count={rejectedCount} color="bg-red-400" total={applicationCount} />
              </div>
              {applicationCount > 0 && (
                <Link
                  href="/dashboard/applications"
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--eh-border)] py-2 text-[13px] font-medium text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)]"
                >
                  View All Applications <ArrowRight size={13} />
                </Link>
              )}
            </Panel>

            {/* Activity feed */}
            <Panel className="p-5">
              <PanelHeader
                title="Activity Feed"
                actions={
                  <Link href="/dashboard/applications" className="text-[12px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]">
                    View All →
                  </Link>
                }
              />
              {allActivity.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--eh-border)] px-4 py-8 text-center">
                  <TrendingUp size={18} className="mx-auto mb-2 text-[var(--eh-text-4)]" />
                  <p className="text-[13px] text-[var(--eh-text-3)]">Your activity will appear here once you start applying.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allActivity.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        item.icon === "shortlist" ? "bg-emerald-50 text-emerald-600"
                        : item.icon === "offer" ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-600)]"
                        : item.icon === "interview" ? "bg-sky-50 text-sky-600"
                        : "bg-[var(--surface-base)] text-[var(--eh-text-4)]"
                      }`}>
                        {item.icon === "shortlist" ? <CheckCircle2 size={13} />
                          : item.icon === "offer" ? <Star size={13} />
                          : item.icon === "interview" ? <CalendarClock size={13} />
                          : <FileText size={13} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] leading-[1.4] text-[var(--eh-text-2)]">{item.text}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--eh-text-4)]">
                          {new Date(item.time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* Quick Actions */}
          <Panel className="p-5">
            <PanelHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction href="/dashboard/resumes" icon={<FileText size={15} />} title="Complete Resume" body="Boost your visibility" tone="violet" />
              <QuickAction href="/dashboard/alerts" icon={<BellRing size={15} />} title="Create Job Alert" body="Never miss a match" tone="amber" />
              <QuickAction href="/dashboard/interviews" icon={<CalendarClock size={15} />} title="Interviews Prep" body="Review & schedule" tone="brand" />
              <QuickAction href="/dashboard/resumes" icon={<Bookmark size={15} />} title="My Documents" body="Manage your files" tone="emerald" />
            </div>
          </Panel>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Profile Strength */}
          <Panel className="p-5 text-center">
            <p className="mb-3 text-[13px] font-semibold text-[var(--eh-text)]">Profile Strength</p>
            <div className="relative mx-auto mb-3 flex h-28 w-28 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--eh-border)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="var(--eh-primary-600)" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - completion / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[26px] font-bold tracking-tight text-[var(--eh-primary-700)]">{completion}%</span>
            </div>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline"
            >
              Complete Profile <ArrowRight size={11} />
            </Link>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-[var(--surface-base)] px-2 py-2">
                <p className="text-[18px] font-bold text-[var(--eh-text)]">{applicationCount}</p>
                <p className="text-[10px] text-[var(--eh-text-4)]">Applications</p>
              </div>
              <div className="rounded-lg bg-[var(--surface-base)] px-2 py-2">
                <p className="text-[18px] font-bold text-[var(--eh-text)]">{upcomingInterviews.length}</p>
                <p className="text-[10px] text-[var(--eh-text-4)]">Interviews</p>
              </div>
              <div className="rounded-lg bg-[var(--surface-base)] px-2 py-2">
                <p className="text-[18px] font-bold text-[var(--eh-text)]">{savedCount}</p>
                <p className="text-[10px] text-[var(--eh-text-4)]">Saved</p>
              </div>
              <div className="rounded-lg bg-[var(--surface-base)] px-2 py-2">
                <p className="text-[18px] font-bold text-[var(--eh-text)]">{teacherPlan.plan === "PRO" ? profileViews30d : "—"}</p>
                <p className="text-[10px] text-[var(--eh-text-4)]">Views</p>
              </div>
            </div>
          </Panel>

          {/* Job Alerts */}
          <Panel className="p-4">
            <PanelHeader
              title="Job Alerts"
              compact
              actions={
                <Link href="/dashboard/alerts" className="text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                  View All
                </Link>
              }
            />
            <div className="rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-2.5 text-center">
              <BellRing size={16} className="mx-auto mb-1 text-[var(--eh-primary-600)]" />
              <p className="text-[12px] text-[var(--eh-text-3)]">Stay in the first wave when matching roles go live.</p>
              <Link href="/dashboard/alerts" className="mt-2 inline-block text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                Configure alerts →
              </Link>
            </div>
          </Panel>

          {/* Profile Views (Pro gated) */}
          <Panel className="p-4">
            <PanelHeader
              title="Profile Views"
              compact
              actions={
                !teacherPlan || teacherPlan.plan !== "PRO" ? (
                  <Link href="/dashboard/subscription" className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100">
                    <Star size={9} /> Pro
                  </Link>
                ) : null
              }
            />
            {teacherPlan.plan === "PRO" ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[var(--surface-base)] px-2 py-2 text-center">
                  <p className="text-[20px] font-bold text-[var(--eh-primary-700)]">{profileViews30d}</p>
                  <p className="text-[10px] text-[var(--eh-text-4)]">Last 30 days</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-base)] px-2 py-2 text-center">
                  <p className="text-[20px] font-bold text-[var(--eh-primary-700)]">{profileViews7d}</p>
                  <p className="text-[10px] text-[var(--eh-text-4)]">Last 7 days</p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg border border-[var(--eh-border)]">
                <div className="space-y-2 p-2.5 blur-sm select-none pointer-events-none" aria-hidden>
                  {["Delhi Public School", "Heritage School", "Podar Intl"].map((s) => (
                    <div key={s} className="flex items-center gap-2 rounded bg-[var(--surface-base)] px-2 py-1.5">
                      <div className="h-6 w-6 rounded-full bg-[var(--eh-primary-100)]" />
                      <p className="text-[12px] text-[var(--eh-text-3)]">{s}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/75 backdrop-blur-[2px]">
                  <Lock size={14} className="text-amber-600" />
                  <p className="text-center text-[11px] font-medium text-[var(--eh-text-2)]">Upgrade to Pro to see viewers</p>
                  <Link href="/dashboard/subscription" className="eh-btn eh-btn-secondary eh-btn-sm">Upgrade</Link>
                </div>
              </div>
            )}
          </Panel>

          {/* Career Tips */}
          <Panel className="p-4">
            <PanelHeader title="Career Tips" compact actions={<Link href="/dashboard/recommendations" className="text-[11px] text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]">View all</Link>} />
            <div className="space-y-2">
              {[
                { tip: "Get started with a 90% profile — schools are 3× more likely to reach out.", icon: <TrendingUp size={12} /> },
                { tip: "Add a demo video to stand out from other applicants.", icon: <Eye size={12} /> },
                { tip: "Set up alerts to get matched jobs before they fill up.", icon: <BellRing size={12} /> },
              ].map((item, i) => (
                <div key={i} className="flex gap-2 rounded-lg bg-[var(--surface-base)] px-3 py-2">
                  <span className="mt-0.5 shrink-0 text-[var(--eh-primary-600)]">{item.icon}</span>
                  <p className="text-[12px] leading-[1.4] text-[var(--eh-text-3)]">{item.tip}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Recommended for You ── */}
      {topRecommendations.length > 0 && (
        <Panel className="p-5">
          <PanelHeader
            title="Recommended for You"
            subtitle="Top matches based on your profile and preferences."
            actions={
              <Link href="/dashboard/recommendations" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                View All <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            {topRecommendations.map((rec) => {
              const score = Math.round(rec.score * 100);
              return (
                <Link
                  key={rec.id}
                  href={`/dashboard/jobs?selected=${rec.job.id}`}
                  className="group flex flex-col gap-3 rounded-xl border border-[var(--eh-border)] p-4 transition-all hover:border-[var(--eh-border-strong)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[14px] font-bold text-[var(--eh-primary-700)]">
                      {rec.job.school.schoolName.charAt(0)}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      score >= 85 ? "bg-emerald-50 text-emerald-700" : score >= 70 ? "bg-amber-50 text-amber-700" : "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
                    }`}>
                      {score}% match
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[var(--eh-text)]">{rec.job.title}</p>
                    <p className="truncate text-[12px] text-[var(--eh-text-3)]">{rec.job.school.schoolName}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--eh-text-4)]">
                      {rec.job.school.city && <span className="flex items-center gap-1"><MapPin size={10} />{rec.job.school.city}</span>}
                      {rec.job.board && <span>{rec.job.board}</span>}
                      {(rec.job.salaryMin || rec.job.salaryMax) && (
                        <span>{formatSalary(rec.job.salaryMin ?? 0)}–{formatSalary(rec.job.salaryMax ?? 0)}/mo</span>
                      )}
                    </div>
                  </div>
                  <span className="mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--eh-primary-600)] px-3 py-2 text-[12px] font-semibold text-white transition-colors group-hover:bg-[var(--eh-primary-700)]">
                    Apply Now
                  </span>
                </Link>
              );
            })}
          </div>
        </Panel>
      )}

      {/* ── Teacher Pro upsell (free plan only) ── */}
      {teacherPlan.plan === "FREE" && (
        <div className="flex flex-col gap-4 rounded-xl border border-[var(--eh-border)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Star size={16} className="text-amber-600" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--eh-text)]">Unlock Teacher Pro</p>
              <p className="mt-1 text-[13px] leading-[1.6] text-[var(--eh-text-3)]">
                Priority placement in school searches · Instant job alerts · Profile view analytics
              </p>
            </div>
          </div>
          <Link href="/dashboard/subscription" className="eh-btn eh-btn-secondary shrink-0">
            See Pro features <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </PageShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, tone, href,
}: {
  label: string; value: number; sub: string;
  tone: "brand" | "info" | "success" | "emerald"; href: string;
}) {
  const accentBar: Record<typeof tone, string> = {
    brand: "bg-[var(--eh-primary-500)]",
    info: "bg-sky-500",
    success: "bg-emerald-500",
    emerald: "bg-emerald-400",
  };
  const valueColor: Record<typeof tone, string> = {
    brand: "text-[var(--eh-primary-700)]",
    info: "text-sky-700",
    success: "text-emerald-700",
    emerald: "text-emerald-700",
  };
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[var(--eh-border)] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all hover:border-[var(--eh-border-strong)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
    >
      <div className={`mb-2.5 h-0.5 w-6 rounded-full ${accentBar[tone]}`} />
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">{label}</p>
      <p className={`mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em] ${valueColor[tone]}`}>{value}</p>
      <p className="mt-1.5 text-[12px] text-[var(--eh-text-3)]">{sub}</p>
    </Link>
  );
}

function StatusRow({ label, count, color, total }: { label: string; count: number; color: string; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="w-[110px] shrink-0 text-[12px] text-[var(--eh-text-3)]">{label}</p>
      <div className="flex-1 overflow-hidden rounded-full bg-[var(--surface-base)] h-1.5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="w-7 shrink-0 text-right text-[12px] font-semibold text-[var(--eh-text)]">{count}</p>
    </div>
  );
}

function QuickStartStep({ step, href, title, body }: { step: number; href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-4 transition-all hover:border-[var(--eh-border-strong)] hover:bg-white hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]"
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-600)] text-[10px] font-bold text-white">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[var(--eh-text)]">{title}</p>
        <p className="mt-0.5 text-[12px] leading-5 text-[var(--eh-text-3)]">{body}</p>
      </div>
    </Link>
  );
}

function QuickAction({
  href, icon, title, body, tone,
}: {
  href: string; icon: ReactNode; title: string; body: string;
  tone: "brand" | "violet" | "amber" | "emerald";
}) {
  const iconStyle: Record<typeof tone, string> = {
    brand: "bg-[var(--eh-primary-50)] text-[var(--eh-primary-600)]",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-4 transition-all hover:border-[var(--eh-border-strong)] hover:bg-white hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]"
    >
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconStyle[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[var(--eh-text)]">{title}</p>
        <p className="mt-0.5 text-[12px] leading-5 text-[var(--eh-text-3)]">{body}</p>
      </div>
    </Link>
  );
}
