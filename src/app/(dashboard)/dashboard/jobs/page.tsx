import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import JobFilters from "@/components/jobs/job-filters";
import JobSplitView from "@/components/jobs/job-split-view";
import { LoadingState } from "@/components/system/system-states";
import { getSession } from "@/lib/session";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompletion } from "@/lib/profileCompletion";
import { PageHeader, PageShell, Panel, PanelHeader } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Browse Teaching Jobs",
  description: "Explore teaching roles inside the EduHire teacher dashboard.",
};

export default async function DashboardJobsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  if (session.user.role === "SCHOOL_ADMIN") redirect("/dashboard/school");
  if (session.user.role === "ADMIN") redirect("/admin");

  const userId = session.user.id;

  const [profile, resumeCount, user] = await Promise.all([
    prisma.teacherProfile.findUnique({
      where: { userId },
      include: { experiences: { select: { id: true } }, certifications: { select: { id: true } } },
    }),
    prisma.resume.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } }),
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

  const topSkills = ["Mathematics", "Teaching", "Financial Management", "Curriculum Design", "Student Engagement"];

  return (
    <PageShell>
      <PageHeader
        title="Browse Jobs"
        subtitle="Find the perfect teaching opportunity that matches your expertise."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="min-w-0 space-y-4">
          <Suspense fallback={<LoadingState title="Loading filters" message="Preparing search filters." />}>
            <JobFilters basePath="/dashboard/jobs" />
          </Suspense>

          <Suspense fallback={<LoadingState title="Loading jobs" message="Fetching available teaching opportunities." />}>
            <JobSplitView basePath="/dashboard/jobs" />
          </Suspense>
        </div>

        {/* Right sidebar */}
        <div className="hidden xl:flex xl:flex-col xl:gap-4">
          {/* Profile completion */}
          <Panel className="p-5">
            <p className="mb-3 text-[13px] font-semibold text-[var(--eh-text)]">Improve Your Chances</p>
            <div className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--eh-border)" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="var(--eh-primary-600)" strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - completion / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[22px] font-bold tracking-tight text-[var(--eh-primary-700)]">{completion}%</span>
            </div>
            <p className="text-center text-[12px] text-[var(--eh-text-3)]">
              {completion < 90
                ? "Your profile is not fully complete. Complete your profile to get better matches."
                : "Your profile is strong. Schools are more likely to reach out."}
            </p>
            {completion < 100 && (
              <Link
                href="/dashboard/profile"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--eh-primary-600)] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--eh-primary-700)]"
              >
                Complete Profile <ArrowRight size={12} />
              </Link>
            )}
          </Panel>

          {/* Top Skills in Demand */}
          <Panel className="p-5">
            <PanelHeader title="Top Skills in Demand" compact />
            <div className="flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2.5 py-1 text-[11px] font-medium text-[var(--eh-text-2)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Panel>

          {/* Resume Tips */}
          <Panel className="p-5">
            <PanelHeader title="Resume Tips" compact />
            <div className="space-y-2">
              {[
                "A strong resume increases your chances of getting shortlisted.",
                "Tailor your resume for each job you apply to.",
              ].map((tip, i) => (
                <div key={i} className="flex gap-2 rounded-lg bg-[var(--surface-base)] px-3 py-2">
                  <TrendingUp size={12} className="mt-0.5 shrink-0 text-[var(--eh-primary-600)]" />
                  <p className="text-[12px] leading-[1.4] text-[var(--eh-text-3)]">{tip}</p>
                </div>
              ))}
              <Link href="/dashboard/resumes" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                Improve My Resume <ArrowRight size={11} />
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
