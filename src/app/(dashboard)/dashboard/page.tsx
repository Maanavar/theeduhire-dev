import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell, SectionCard, SectionHeader } from "@/components/layout/page-shell";
import {
  ArrowRight,
  BellRing,
  Bookmark,
  BriefcaseBusiness,
  CalendarClock,
  FileText,
  Sparkles,
  UserRoundCog,
} from "lucide-react";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import { calculateProfileCompletion, getTeacherApplyReadiness } from "@/lib/profileCompletion";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  if (session.user.role === "SCHOOL_ADMIN") redirect("/dashboard/school");
  if (session.user.role === "ADMIN") redirect("/admin");

  const userId = session.user.id;

  const [applicationCount, pendingCount, upcomingInterviews, savedCount, profile, resumeCount, user, topRecommendations] = await Promise.all([
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
            school: {
              select: {
                schoolName: true,
              },
            },
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
    resumes: Array.from({ length: resumeCount }).map((_, index) => ({ id: String(index) })),
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
    resumes: Array.from({ length: resumeCount }).map((_, index) => ({ id: String(index) })),
  });
  const firstName = session.user.name?.split(" ")[0] ?? "Teacher";
  const topMatch = topRecommendations[0] ? Math.round(topRecommendations[0].score * 100) : 0;
  const firstVisit = applicationCount === 0 && pendingCount === 0 && upcomingInterviews.length === 0 && savedCount === 0;

  return (
    <PageShell className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.026em] text-[var(--eh-text)] sm:text-[30px]">
            {firstVisit ? `Welcome to EduHire, ${firstName}` : `Welcome back, ${firstName}`}
          </h1>
          <p className="mt-1.5 max-w-3xl text-[14px] leading-6 text-[var(--eh-text-3)]">
            {firstVisit
              ? "Start with your profile, upload your resume, and explore your first set of matched teaching roles."
              : pendingCount > 0
              ? `${pendingCount} application${pendingCount === 1 ? "" : "s"} are waiting on school review.`
              : "You're set up to discover fresh roles, track interviews, and stay visible to schools."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/jobs" className="eh-btn eh-btn-secondary">
            <BriefcaseBusiness size={14} /> Browse jobs
          </Link>
          <Link href="/dashboard/profile" className="eh-btn eh-btn-primary">
            <UserRoundCog size={14} /> Update profile
          </Link>
        </div>
      </div>

      <OnboardingChecklist role="TEACHER" teacherCompletion={completion} />

      {!readiness.ready ? (
        <SectionCard className="border-amber-200 bg-amber-50 p-5">
          <SectionHeader
            title="Profile readiness"
            subtitle="You will land in more complete applications once these gaps are closed."
            actions={
              <Link href="/dashboard/profile" className="eh-btn eh-btn-primary eh-btn-sm">
                Finish profile
              </Link>
            }
          />
          <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
            <div className="rounded-2xl border border-amber-100 bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700">Ready to apply</p>
              <p className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.04em] text-amber-900">{readiness.completion}%</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {readiness.blockers.map((blocker) => (
                <div key={blocker} className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-[13px] text-amber-900">
                  {blocker}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      ) : null}

      {firstVisit ? (
        <SectionCard className="border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] p-5">
          <SectionHeader title="Start Here" subtitle="Three quick steps to unlock better matches and applications." />
          <div className="grid gap-3 md:grid-cols-3">
            <QuickAction
              href="/dashboard/profile"
              icon={<UserRoundCog size={15} className="text-eh-primary" />}
              title="Finish your profile"
              body="Add qualification, subjects, city, and a short bio so schools can understand your fit."
            />
            <QuickAction
              href="/dashboard/profile#resume"
              icon={<FileText size={15} className="text-eh-primary" />}
              title="Upload your resume"
              body="A resume is mandatory before you can apply for jobs on EduHire."
            />
            <QuickAction
              href="/dashboard/jobs"
              icon={<BriefcaseBusiness size={15} className="text-eh-primary" />}
              title="Browse matched jobs"
              body="Open the jobs workspace to see fit scores, school details, and role requirements."
            />
          </div>
        </SectionCard>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Applications" value={String(applicationCount)} helper="All submitted roles" tone="slate" href="/dashboard/applications" />
        <MetricCard label="Pending review" value={String(pendingCount)} helper="Awaiting school action" tone="amber" href="/dashboard/applications" />
        <MetricCard label="Interviews" value={String(upcomingInterviews.length)} helper={upcomingInterviews[0] ? `Next ${new Date(upcomingInterviews[0].scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "No interviews yet"} tone="indigo" href="/dashboard/interviews" />
        <MetricCard label="Saved jobs" value={String(savedCount)} helper="Roles you want to revisit" tone="blue" href="/dashboard/saved" />
        <MetricCard label="Profile completion" value={`${completion}%`} helper={completion >= 80 ? "Strong visibility" : "Add more hiring signals"} tone="emerald" href="/dashboard/profile" />
        <MetricCard label="Best AI match" value={topMatch ? `${topMatch}%` : "--"} helper={topRecommendations[0] ? topRecommendations[0].job.school.schoolName : "Recommendations will appear here"} tone="violet" href="/dashboard/recommendations" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <SectionCard className="border-[var(--eh-border)] bg-white p-5">
          <SectionHeader
            title="Recommended roles"
            subtitle="Your strongest current matches based on subject, board, and preference overlap."
            actions={
              <Link href="/dashboard/recommendations" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]">
                Open workspace <ArrowRight size={13} />
              </Link>
            }
          />
          <div className="space-y-3">
            {topRecommendations.length === 0 ? (
              <p className="text-[13px] text-[var(--eh-text-3)]">Complete your profile to unlock personalized recommendations.</p>
            ) : (
              topRecommendations.map((rec) => (
                <div key={rec.id} className="grid gap-3 rounded-2xl border border-[var(--eh-border)] p-4 transition-colors hover:border-[var(--eh-border-strong)] md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-[var(--eh-text)]">{rec.job.title}</p>
                        <p className="truncate text-[12px] text-[var(--eh-text-3)]">{rec.job.school.schoolName}</p>
                      </div>
                      <span className="rounded-full border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-2.5 py-1 text-[11px] font-semibold text-[var(--eh-primary-700)]">
                        {Math.round(rec.score * 100)}% match
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] text-[var(--eh-text-2)]">{rec.explanation || "Strong fit for your teaching profile."}</p>
                  </div>
                  <Link href={`/dashboard/jobs?selected=${rec.job.id}`} className="eh-btn eh-btn-secondary eh-btn-sm">
                    View role
                  </Link>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard className="border-[var(--eh-border)] bg-white p-5">
          <SectionHeader
            title="Upcoming interviews"
            subtitle="Your next scheduled conversations with schools."
            actions={<Link href="/dashboard/interviews" className="text-[12px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]">All</Link>}
          />
          <div className="space-y-3">
            {upcomingInterviews.length === 0 ? (
              <p className="text-[13px] text-[var(--eh-text-3)]">No interviews scheduled yet.</p>
            ) : (
              upcomingInterviews.map((interview) => (
                <div key={interview.id} className="rounded-2xl border border-[var(--eh-border)] p-4">
                  <p className="text-[14px] font-semibold text-[var(--eh-text)]">{interview.application.job.title}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--eh-text-3)]">{interview.application.job.school.schoolName}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2.5 py-1 text-[11px] font-medium text-[var(--eh-text-2)]">
                    <CalendarClock size={12} />
                    {new Date(interview.scheduledAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard className="border-[var(--eh-border)] bg-white p-5">
          <SectionHeader title="Career momentum" subtitle="Keep your search sharp with a few focused actions." />
          <div className="grid gap-3 md:grid-cols-2">
            <QuickAction
              href="/dashboard/applications"
              icon={<FileText size={15} className="text-eh-primary" />}
              title="Track applications"
              body="See status changes, withdraw where needed, and follow each school timeline."
            />
            <QuickAction
              href="/dashboard/jobs"
              icon={<Sparkles size={15} className="text-eh-primary" />}
              title="Explore fresh openings"
              body="Browse active teaching jobs across schools, boards, and grade levels."
            />
            <QuickAction
              href="/dashboard/saved"
              icon={<Bookmark size={15} className="text-eh-primary" />}
              title="Revisit saved roles"
              body="Return to bookmarked opportunities before schools close the shortlist."
            />
            <QuickAction
              href="/dashboard/alerts"
              icon={<BellRing size={15} className="text-eh-primary" />}
              title="Tune job alerts"
              body="Get the right roles sooner with cleaner subject and board preferences."
            />
          </div>
        </SectionCard>

        <SectionCard className="overflow-hidden border-[var(--eh-primary-100)] bg-[linear-gradient(180deg,#ffffff_0%,#f6f9fc_100%)] p-5">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.018em] text-[var(--eh-text)]">Profile signal</h2>
            <p className="mt-1 text-[13px] leading-5 text-[var(--eh-text-3)]">
              {completion >= 80
                ? "Your profile is in a strong place for search and matching."
                : "A few more details will push you higher in search and matching."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SignalTile label="Completion" value={`${completion}%`} helper={completion >= 80 ? "High visibility" : "Needs polish"} />
            <SignalTile label="Saved resumes" value={String(resumeCount)} helper={resumeCount > 0 ? "Ready to apply" : "Add one resume"} />
            <SignalTile label="Best match" value={topMatch ? `${topMatch}%` : "--"} helper={topRecommendations[0] ? topRecommendations[0].job.title : "Unlock with profile depth"} />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-4 py-3">
            <p className="text-[13px] text-[var(--eh-text-2)]">Keep your profile current so schools see the right subjects, boards, and classroom strengths.</p>
            <Link href="/dashboard/profile" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--eh-primary-500)] px-3 py-1.5 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--eh-primary-700)]">
              Open profile <ArrowRight size={13} />
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard className="border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] p-5">
        <div className="flex items-start gap-3">
          <BellRing className="mt-0.5 h-4 w-4 text-[var(--eh-primary-700)]" />
          <p className="text-sm text-[var(--eh-primary-700)]">
            Stay in the first wave when matching roles go live.
            <Link href="/dashboard/alerts" className="ml-1 font-semibold underline">
              Configure alerts
            </Link>
          </p>
        </div>
      </SectionCard>
    </PageShell>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone,
  href,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "slate" | "amber" | "indigo" | "blue" | "emerald" | "violet";
  href?: string;
}) {
  const toneMap = {
    slate: { shell: "border-slate-200 bg-white", chip: "bg-slate-700", value: "text-slate-900" },
    amber: { shell: "border-amber-200 bg-white", chip: "bg-amber-500", value: "text-amber-700" },
    indigo: { shell: "border-indigo-200 bg-white", chip: "bg-indigo-600", value: "text-indigo-700" },
    blue: { shell: "border-sky-200 bg-white", chip: "bg-sky-500", value: "text-sky-700" },
    emerald: { shell: "border-emerald-200 bg-white", chip: "bg-emerald-500", value: "text-emerald-700" },
    violet: { shell: "border-violet-200 bg-white", chip: "bg-violet-500", value: "text-violet-700" },
  };
  const palette = toneMap[tone];
  const inner = (
    <>
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--eh-text-3)]">{label}</p>
          <p className={`mt-3 text-[36px] font-semibold leading-none tracking-[-0.04em] md:text-[40px] ${palette.value}`}>{value}</p>
        </div>
        <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${palette.chip}`}>
          <span className="sr-only">Live</span>
        </span>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <p className="text-[12px] text-[var(--eh-text-3)]">{helper}</p>
        <span className="h-px flex-1 bg-black/5" />
      </div>
    </>
  );
  const cls = `group relative overflow-hidden rounded-2xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-200 hover:border-[var(--eh-border-strong)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${palette.shell}${href ? " cursor-pointer" : ""}`;
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

function SignalTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-[var(--eh-border)] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--eh-text-3)]">{label}</p>
      <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[var(--eh-text)]">{value}</p>
      <p className="mt-2 text-[12px] text-[var(--eh-text-3)]">{helper}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-[var(--eh-border)] bg-white p-4 transition-all hover:border-[var(--eh-border-strong)] hover:bg-[var(--surface-base)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--eh-primary-50)]">
        {icon}
      </div>
      <p className="text-[14px] font-semibold text-[var(--eh-text)]">{title}</p>
      <p className="mt-1 text-[12px] leading-5 text-[var(--eh-text-3)]">{body}</p>
    </Link>
  );
}
