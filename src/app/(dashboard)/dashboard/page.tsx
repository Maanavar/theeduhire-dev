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
  Eye,
  FileText,
  Lock,
  Sparkles,
  Star,
  UserRoundCog,
  TrendingUp,
} from "lucide-react";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import { calculateProfileCompletion, getTeacherApplyReadiness } from "@/lib/profileCompletion";
import { getTeacherPlan } from "@/lib/subscription";

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
    upcomingInterviews,
    savedCount,
    profile,
    resumeCount,
    user,
    topRecommendations,
    teacherPlan,
    profileViews30d,
    profileViews7d,
    recentViewers,
  ] = await Promise.all([
    prisma.application.count({ where: { applicantId: userId } }),
    prisma.application.count({ where: { applicantId: userId, status: "PENDING" } }),
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
      take: 4,
      select: {
        id: true,
        score: true,
        explanation: true,
        job: {
          select: {
            id: true,
            title: true,
            school: { select: { schoolName: true } },
          },
        },
      },
    }),
    getTeacherPlan(userId),
    prisma.profileView.count({ where: { teacherId: userId, viewedAt: { gte: ago30d } } }),
    prisma.profileView.count({ where: { teacherId: userId, viewedAt: { gte: ago7d } } }),
    prisma.profileView.findMany({
      where: { teacherId: userId, viewerId: { not: null } },
      orderBy: { viewedAt: "desc" },
      take: 5,
      select: {
        id: true,
        viewedAt: true,
        viewer: {
          select: {
            name: true,
            avatarUrl: true,
            schoolProfile: { select: { schoolName: true } },
          },
        },
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
    pendingCount === 0 &&
    upcomingInterviews.length === 0 &&
    savedCount === 0;

  const metrics = [
    {
      label: "Applications",
      value: applicationCount,
      helper: "All submitted roles",
      tone: "brand" as const,
      href: "/dashboard/applications",
    },
    {
      label: "Pending review",
      value: pendingCount,
      helper: "Awaiting school action",
      tone: "warning" as const,
      href: "/dashboard/applications",
    },
    {
      label: "Interviews",
      value: upcomingInterviews.length,
      helper: upcomingInterviews[0]
        ? `Next ${new Date(upcomingInterviews[0].scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
        : "None scheduled",
      tone: "info" as const,
      href: "/dashboard/interviews",
    },
    {
      label: "Saved jobs",
      value: savedCount,
      helper: "Roles to revisit",
      tone: "neutral" as const,
      href: "/dashboard/saved",
    },
    {
      label: "Profile",
      value: `${completion}%`,
      helper: completion >= 80 ? "Strong visibility" : "Needs more detail",
      tone: "success" as const,
      href: "/dashboard/profile",
    },
    {
      label: "Best AI match",
      value: topMatch ? `${topMatch}%` : "—",
      helper: topRecommendations[0]
        ? topRecommendations[0].job.school.schoolName
        : "Complete profile to unlock",
      tone: "brand" as const,
      href: "/dashboard/recommendations",
    },
  ];

  const toneAccent: Record<string, string> = {
    brand: "bg-[var(--eh-primary-500)]",
    warning: "bg-amber-400",
    info: "bg-sky-500",
    neutral: "bg-slate-400",
    success: "bg-emerald-500",
  };
  const toneValue: Record<string, string> = {
    brand: "text-[var(--eh-primary-700)]",
    warning: "text-amber-700",
    info: "text-sky-700",
    neutral: "text-[var(--eh-text)]",
    success: "text-emerald-700",
  };

  return (
    <PageShell className="space-y-5 lg:space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--eh-border)] pb-5">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
            Teacher dashboard
          </p>
          <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)] sm:text-[26px]">
            {firstVisit ? `Welcome to EduHire, ${firstName}` : `Welcome back, ${firstName}`}
          </h1>
          <p className="mt-1.5 text-[14px] leading-6 text-[var(--eh-text-3)]">
            {firstVisit
              ? "Start with your profile, upload your resume, and explore matched teaching roles."
              : pendingCount > 0
                ? `${pendingCount} application${pendingCount === 1 ? "" : "s"} waiting on school review.`
                : "Discover fresh roles, track interviews, and stay visible to schools."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/jobs" className="eh-btn eh-btn-secondary">
            <BriefcaseBusiness size={14} />
            Browse jobs
          </Link>
          <Link href="/dashboard/profile" className="eh-btn eh-btn-primary">
            <UserRoundCog size={14} />
            Update profile
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
            <QuickStartStep
              step={1}
              href="/dashboard/profile"
              title="Finish your profile"
              body="Add qualification, subjects, city, and a short bio."
            />
            <QuickStartStep
              step={2}
              href="/dashboard/profile#resume"
              title="Upload your resume"
              body="Required before you can apply to any job on EduHire."
            />
            <QuickStartStep
              step={3}
              href="/dashboard/jobs"
              title="Browse matched jobs"
              body="See fit scores, school details, and role requirements."
            />
          </div>
        </Panel>
      ) : null}

      {/* ── Metrics row ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="group rounded-xl border border-[var(--eh-border)] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[var(--eh-border-strong)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
          >
            <div className={`mb-3 h-0.5 w-6 rounded-full ${toneAccent[m.tone]}`} />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
              {m.label}
            </p>
            <p className={`mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em] ${toneValue[m.tone]}`}>
              {m.value}
            </p>
            <p className="mt-2 text-[12px] leading-[1.4] text-[var(--eh-text-3)]">{m.helper}</p>
          </Link>
        ))}
      </div>

      {/* ── Recommendations + Interviews ── */}
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Panel className="p-5">
          <PanelHeader
            title="Recommended roles"
            subtitle="Strongest matches based on subject, board, and preference overlap."
            actions={
              <Link
                href="/dashboard/recommendations"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)] transition-colors"
              >
                Open workspace <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="space-y-2">
            {topRecommendations.length === 0 ? (
              <p className="text-[13px] text-[var(--eh-text-3)]">
                Complete your profile to unlock personalized recommendations.
              </p>
            ) : (
              topRecommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/dashboard/jobs?selected=${rec.job.id}`}
                  className="group flex items-center gap-4 rounded-lg border border-[var(--eh-border)] p-3.5 transition-all hover:border-[var(--eh-border-strong)] hover:bg-[var(--surface-base)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[var(--eh-text)]">
                      {rec.job.title}
                    </p>
                    <p className="truncate text-[12px] text-[var(--eh-text-3)]">
                      {rec.job.school.schoolName}
                    </p>
                    {rec.explanation ? (
                      <p className="mt-1.5 line-clamp-1 text-[12px] text-[var(--eh-text-2)]">
                        {rec.explanation}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="rounded-md border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-2 py-0.5 text-[11px] font-bold text-[var(--eh-primary-700)]">
                      {Math.round(rec.score * 100)}%
                    </span>
                    <span className="text-[11px] font-medium text-[var(--eh-text-4)] group-hover:text-[var(--eh-primary-600)] transition-colors">
                      View role →
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader
            title="Upcoming interviews"
            subtitle="Next scheduled conversations with schools."
            actions={
              <Link
                href="/dashboard/interviews"
                className="text-[12px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)] transition-colors"
              >
                All
              </Link>
            }
          />
          <div className="space-y-2">
            {upcomingInterviews.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--eh-border)] px-4 py-6 text-center">
                <CalendarClock size={20} className="mx-auto mb-2 text-[var(--eh-text-4)]" />
                <p className="text-[13px] text-[var(--eh-text-3)]">No interviews scheduled yet.</p>
              </div>
            ) : (
              upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex gap-3 rounded-lg border border-[var(--eh-border)] p-3.5"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--eh-primary-50)]">
                    <CalendarClock size={14} className="text-[var(--eh-primary-600)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">
                      {interview.application.job.title}
                    </p>
                    <p className="truncate text-[12px] text-[var(--eh-text-3)]">
                      {interview.application.job.school.schoolName}
                    </p>
                    <p className="mt-1.5 text-[11px] font-medium text-[var(--eh-text-4)]">
                      {new Date(interview.scheduledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* ── Profile views widget ── */}
      <ProfileViewsWidget
        views30d={profileViews30d}
        views7d={profileViews7d}
        isPro={teacherPlan.plan === "PRO"}
        recentViewers={recentViewers as RecentViewer[]}
      />

      {/* ── Career momentum + Profile signal ── */}
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel className="p-5">
          <PanelHeader title="Career momentum" subtitle="Stay sharp with focused, high-impact actions." />
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction
              href="/dashboard/applications"
              icon={<FileText size={15} />}
              title="Track applications"
              body="Monitor status changes and school timelines."
              tone="brand"
            />
            <QuickAction
              href="/dashboard/jobs"
              icon={<Sparkles size={15} />}
              title="Explore openings"
              body="Browse active roles across boards and grades."
              tone="violet"
            />
            <QuickAction
              href="/dashboard/saved"
              icon={<Bookmark size={15} />}
              title="Revisit saved roles"
              body="Return before schools close the shortlist."
              tone="amber"
            />
            <QuickAction
              href="/dashboard/alerts"
              icon={<BellRing size={15} />}
              title="Tune job alerts"
              body="Get the right roles with cleaner filters."
              tone="emerald"
            />
          </div>
        </Panel>

        <Panel className="flex flex-col p-5">
          <PanelHeader title="Profile signal" compact />
          <div className="flex flex-1 flex-col gap-3">
            <SignalTile
              icon={<TrendingUp size={14} />}
              label="Completion"
              value={`${completion}%`}
              helper={completion >= 80 ? "High visibility" : "Needs polish"}
              tone={completion >= 80 ? "success" : "warning"}
            />
            <SignalTile
              icon={<FileText size={14} />}
              label="Saved resumes"
              value={String(resumeCount)}
              helper={resumeCount > 0 ? "Ready to apply" : "Add one resume"}
              tone={resumeCount > 0 ? "success" : "neutral"}
            />
            <SignalTile
              icon={<Sparkles size={14} />}
              label="Best match"
              value={topMatch ? `${topMatch}%` : "—"}
              helper={
                topRecommendations[0] ? topRecommendations[0].job.title : "Unlock with profile"
              }
              tone="brand"
            />
          </div>
          <div className="mt-4 border-t border-[var(--eh-border)] pt-4">
            <Link
              href="/dashboard/profile"
              className="flex w-full items-center justify-between rounded-lg bg-[var(--eh-primary-600)] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--eh-primary-700)]"
            >
              Open profile
              <ArrowRight size={14} />
            </Link>
          </div>
        </Panel>
      </div>

      {/* ── Alert nudge ── */}
      <div className="flex items-center gap-3 rounded-xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-4 py-3">
        <BellRing size={15} className="shrink-0 text-[var(--eh-primary-600)]" />
        <p className="flex-1 text-[13px] text-[var(--eh-primary-700)]">
          Stay in the first wave when matching roles go live.
        </p>
        <Link
          href="/dashboard/alerts"
          className="shrink-0 text-[13px] font-semibold text-[var(--eh-primary-700)] underline underline-offset-2 hover:text-[var(--eh-primary-900)]"
        >
          Configure alerts
        </Link>
      </div>

      {/* ── Teacher Pro upsell (free plan only) ── */}
      {teacherPlan.plan === "FREE" && (
        <div className="flex flex-col gap-4 rounded-xl border border-[var(--eh-border)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Star size={16} className="text-amber-600" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--eh-text)]">
                Unlock Teacher Pro — ₹199/month
              </p>
              <p className="mt-1 text-[13px] leading-[1.6] text-[var(--eh-text-3)]">
                Priority placement in school searches · Instant job alerts · Profile view analytics
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/subscription"
            className="eh-btn eh-btn-secondary shrink-0"
          >
            See Pro features <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </PageShell>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface RecentViewer {
  id: string;
  viewedAt: Date;
  viewer: {
    name: string | null;
    avatarUrl: string | null;
    schoolProfile: { schoolName: string } | null;
  } | null;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function QuickStartStep({
  step,
  href,
  title,
  body,
}: {
  step: number;
  href: string;
  title: string;
  body: string;
}) {
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
  href,
  icon,
  title,
  body,
  tone,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  body: string;
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

function SignalTile({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: "brand" | "success" | "warning" | "neutral";
}) {
  const valueColor: Record<typeof tone, string> = {
    brand: "text-[var(--eh-primary-700)]",
    success: "text-emerald-700",
    warning: "text-amber-700",
    neutral: "text-[var(--eh-text)]",
  };
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--eh-border)] px-3.5 py-3">
      <span className="text-[var(--eh-text-4)]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
          {label}
        </p>
        <p className="mt-0.5 text-[11px] leading-4 text-[var(--eh-text-3)]">{helper}</p>
      </div>
      <span className={`text-[18px] font-bold leading-none tracking-tight ${valueColor[tone]}`}>
        {value}
      </span>
    </div>
  );
}

function ProfileViewsWidget({
  views30d,
  views7d,
  isPro,
  recentViewers,
}: {
  views30d: number;
  views7d: number;
  isPro: boolean;
  recentViewers: RecentViewer[];
}) {
  return (
    <Panel className="p-5">
      <PanelHeader
        title="Profile views"
        subtitle="Schools and recruiters who viewed your public profile."
        actions={
          isPro ? null : (
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Star size={10} /> Upgrade to Pro
            </Link>
          )
        }
      />

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3 text-center">
          <p className="text-[24px] font-bold leading-none tracking-tight text-[var(--eh-primary-700)]">
            {isPro ? views30d : "—"}
          </p>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--eh-text-4)]">
            Last 30 days
          </p>
        </div>
        <div className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3 text-center">
          <p className="text-[24px] font-bold leading-none tracking-tight text-[var(--eh-primary-700)]">
            {isPro ? views7d : "—"}
          </p>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--eh-text-4)]">
            Last 7 days
          </p>
        </div>
      </div>

      {isPro ? (
        recentViewers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--eh-border)] px-4 py-6 text-center">
            <Eye size={18} className="mx-auto mb-2 text-[var(--eh-text-4)]" />
            <p className="text-[13px] text-[var(--eh-text-3)]">
              No viewers yet — schools will appear here when they visit your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
              Recent viewers
            </p>
            {recentViewers.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--eh-border)] px-3.5 py-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[13px] font-bold text-[var(--eh-primary-700)]">
                  {v.viewer?.name?.charAt(0) ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">
                    {v.viewer?.name ?? "Unknown"}
                  </p>
                  {v.viewer?.schoolProfile?.schoolName && (
                    <p className="truncate text-[12px] text-[var(--eh-text-3)]">
                      {v.viewer.schoolProfile.schoolName}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-[var(--eh-text-4)]">
                  {new Date(v.viewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-[var(--eh-border)]">
          {/* Ghost rows */}
          <div className="space-y-2 p-3 blur-sm select-none pointer-events-none" aria-hidden>
            {[
              { name: "Priya Sharma", school: "Delhi Public School" },
              { name: "Rahul Verma", school: "The Heritage School" },
              { name: "Anjali Menon", school: "Podar International" },
            ].map((g) => (
              <div
                key={g.name}
                className="flex items-center gap-3 rounded-lg bg-[var(--surface-base)] px-3.5 py-2.5"
              >
                <div className="h-8 w-8 rounded-full bg-[var(--eh-primary-100)]" />
                <div>
                  <p className="text-[13px] font-semibold text-[var(--eh-text)]">{g.name}</p>
                  <p className="text-[12px] text-[var(--eh-text-3)]">{g.school}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-[2px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
              <Lock size={16} className="text-amber-600" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-[var(--eh-text)]">See who viewed your profile</p>
              <p className="mt-0.5 text-[12px] text-[var(--eh-text-3)]">
                Upgrade to Pro to unlock viewer insights
              </p>
            </div>
            <Link
              href="/dashboard/subscription"
              className="eh-btn eh-btn-secondary"
            >
              Upgrade to Pro <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </Panel>
  );
}
