"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, MessageSquare, Plus, Video } from "lucide-react";
import type { SchoolAnalytics } from "@/types";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { featureFlags } from "@/config/feature-flags";
import { getApiErrorMessage } from "@/lib/api/client";
import { createConversation, getAllRankedCandidates, getInterviews, getMyJobs } from "@/lib/api/hiring-client";
import { getSchoolAnalytics, getSchoolProfile } from "@/lib/api/school-client";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import { EmptyState, ErrorState } from "@/components/system/system-states";
import { RowsSkeleton, StatsGridSkeleton } from "@/components/system/dashboard-skeletons";
import { Metric, PageHeader, PageShell, Panel, PanelHeader, StatusBadge } from "@/components/layout/page-shell";

type SchoolJob = { id: string; title: string; status: string; _count: { applications: number } };
type RankedCandidate = {
  id: string;
  applicantId: string;
  status: string;
  appliedAt: string;
  matchScore: number;
  applicant: {
    name: string;
    teacherProfile: { city: string | null; experience: string | null; qualification: string | null; subjects: string[] | null } | null;
  };
};
type InterviewItem = {
  id: string;
  scheduledAt: string;
  type: "VIDEO" | "PHONE" | "IN_PERSON";
  application: { job: { title: string }; applicant?: { name: string } };
};
type SchoolProfileState = {
  schoolName?: string | null;
  city?: string | null;
  board?: string | null;
  about?: string | null;
  logoUrl?: string | null;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED";
  verified?: boolean;
};

const avatarColors = ["#4338ca", "#0f766e", "#be185d", "#b45309", "#0e7490", "#9a3412"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function SchoolDashboardPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);
  const [jobs, setJobs] = useState<SchoolJob[]>([]);
  const [ranked, setRanked] = useState<RankedCandidate[]>([]);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [analyticsData, loadedJobs, interviewsData, profileData] = await Promise.allSettled([
        getSchoolAnalytics(),
        getMyJobs(),
        getInterviews(),
        getSchoolProfile(),
      ]);

      if (analyticsData.status === "rejected") throw analyticsData.reason;
      if (loadedJobs.status === "rejected") throw loadedJobs.reason;

      const jobs = loadedJobs.value as SchoolJob[];
      setAnalytics(analyticsData.value as SchoolAnalytics);
      setJobs(jobs);
      if (interviewsData.status === "fulfilled") {
        setInterviews((interviewsData.value || []) as InterviewItem[]);
      }
      if (profileData.status === "fulfilled") {
        setSchoolProfile(profileData.value as SchoolProfileState);
      }

      const activeJobs = jobs.filter((job) => job.status === "ACTIVE").slice(0, 3);
      if (activeJobs.length > 0) {
        const rankedResults = await Promise.allSettled(
          activeJobs.map((job) => getAllRankedCandidates(job.id))
        );
        const merged = rankedResults
          .filter((result) => result.status === "fulfilled")
          .flatMap((result) => (result as PromiseFulfilledResult<unknown[]>).value as RankedCandidate[]);
        const dedup = new Map<string, RankedCandidate>();
        for (const candidate of merged) {
          if (!dedup.has(candidate.id) || (dedup.get(candidate.id)?.matchScore || 0) < candidate.matchScore) {
            dedup.set(candidate.id, candidate);
          }
        }
        setRanked(Array.from(dedup.values()).sort((a, b) => b.matchScore - a.matchScore).slice(0, 8));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load school dashboard"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      loadDashboard();
    }
  }, [sessionStatus]);

  const summary = analytics?.summary;
  const activeJobs = summary?.activeJobs ?? jobs.filter((job) => job.status === "ACTIVE").length;
  const totalApplications = summary?.totalApplications ?? jobs.reduce((sum, job) => sum + (job._count?.applications || 0), 0);
  const shortlisted = summary?.shortlisted ?? 0;
  const hired = summary?.hired ?? 0;
  const offers = Math.max(shortlisted - hired, 0);
  const firstName = (session?.user?.name || "Admin").split(" ").filter(Boolean)[0] || "Admin";
  const upcomingInterviews = useMemo(
    () =>
      interviews
        .filter((interview) => new Date(interview.scheduledAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [interviews]
  );
  const topApplicants = useMemo(
    () =>
      ranked
        .filter((candidate) => candidate.status !== "REJECTED" && candidate.status !== "HIRED")
        .slice()
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
        .slice(0, 4),
    [ranked]
  );
  const topMatches = useMemo(() => {
    const recentApplicantIds = new Set(topApplicants.map((candidate) => candidate.id));
    return ranked
      .filter((candidate) => !recentApplicantIds.has(candidate.id))
      .filter((candidate) => candidate.status !== "REJECTED" && candidate.status !== "HIRED")
      .slice()
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);
  }, [ranked, topApplicants]);

  const inviteCandidate = async (candidate: RankedCandidate) => {
    try {
      const result = await createConversation({
        participantIds: [candidate.applicantId],
        message: `Hi ${candidate.applicant.name}, your profile looks like a strong fit. Would you be open to a quick conversation?`,
      });
      router.push(`/dashboard/messages?thread=${result.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to invite candidate"));
    }
  };

  const rows = [
    { label: "New", value: totalApplications, color: "#157d4e" },
    { label: "Reviewed", value: Math.max(totalApplications - shortlisted, 0), color: "#98a2b3" },
    { label: "Shortlisted", value: shortlisted, color: "#1d4ed8" },
    { label: "Interview", value: upcomingInterviews.length, color: "#b45309" },
    { label: "Offer", value: offers, color: "#15803d" },
    { label: "Hired this month", value: hired, color: "#166534" },
  ];
  const maxRowValue = Math.max(...rows.map((row) => row.value), 1);
  const trend = analytics?.trend || [];
  const recentWindow = trend.slice(-7);
  const previousWindow = trend.slice(-14, -7);
  const recentApps = recentWindow.reduce((sum, item) => sum + item.applications, 0);
  const previousApps = previousWindow.reduce((sum, item) => sum + item.applications, 0);
  const appDelta = recentApps - previousApps;
  const interviewsNextWeek = upcomingInterviews.filter((entry) => {
    const diff = new Date(entry.scheduledAt).getTime() - Date.now();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const hiredRate = totalApplications > 0 ? Math.round((hired / totalApplications) * 100) : 0;
  const verificationStatus = schoolProfile?.verificationStatus || (schoolProfile?.verified ? "VERIFIED" : "UNVERIFIED");
  const needsProfileFinish = !schoolProfile?.schoolName || !schoolProfile?.city || !schoolProfile?.board || !schoolProfile?.about || !schoolProfile?.logoUrl;

  const deltaLabel = (value: number, positiveSuffix: string, neutralLabel: string) => {
    if (value > 0) return `+${value} ${positiveSuffix}`;
    if (value < 0) return `${value} ${positiveSuffix}`;
    return neutralLabel;
  };

  if (loading) {
    return (
      <PageShell>
        <StatsGridSkeleton />
        <RowsSkeleton rows={4} />
      </PageShell>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load school dashboard"
        message={error}
        actions={
          <button onClick={loadDashboard} className="eh-btn eh-btn-secondary eh-btn-sm">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={`Good morning, ${firstName}`}
        subtitle={`${Math.max(totalApplications - shortlisted, 0)} new applications since your last review.`}
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/applicants" className="eh-btn eh-btn-secondary">
              <Calendar size={14} /> Review applicants
            </Link>
            <Link href="/dashboard/post-job" className="eh-btn eh-btn-primary">
              <Plus size={14} /> Post a job
            </Link>
          </div>
        }
      />

      {verificationStatus !== "VERIFIED" ? (
        <Panel className="border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-amber-700">School trust status</p>
              <p className="mt-1 text-[15px] font-semibold text-amber-950">
                {verificationStatus === "PENDING" ? "Verification in review" : "Verification not submitted"}
              </p>
              <p className="mt-1 text-[13px] text-amber-900">
                {verificationStatus === "PENDING"
                  ? "Your school profile is under review. Keep your school details current while the admin team checks the submission."
                  : needsProfileFinish
                    ? "Finish your school profile, logo, and about section before requesting verification."
                    : "Request verification so your jobs can carry stronger trust signals for teachers."}
              </p>
            </div>
            <Link href="/dashboard/profile" className="eh-btn eh-btn-primary eh-btn-sm">
              {verificationStatus === "PENDING" ? "Review school profile" : "Complete verification"}
            </Link>
          </div>
        </Panel>
      ) : null}

      <OnboardingChecklist role="SCHOOL_ADMIN" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Active jobs" value={activeJobs} hint="Live roles accepting applications" tone="brand" href="/dashboard/my-jobs" />
        <Metric label="New applications" value={totalApplications} hint={deltaLabel(appDelta, "vs last week", "No change this week")} tone="info" href="/dashboard/applicants" />
        <Metric label="Shortlisted" value={shortlisted} hint={`${shortlisted > 0 ? Math.round((shortlisted / Math.max(totalApplications, 1)) * 100) : 0}% conversion`} tone="success" href="/dashboard/applicants" />
        <Metric label="Interviews scheduled" value={upcomingInterviews.length} hint={upcomingInterviews[0] ? `${interviewsNextWeek} this week` : "No interviews"} tone="warning" href="/dashboard/interviews" />
        <Metric label="Offers sent" value={offers} hint={offers > 0 ? `${offers} awaiting response` : "No pending offers"} tone="neutral" href="/dashboard/applicants" />
        <Metric label="Hired this month" value={hired} hint={`${hiredRate}% hire rate`} tone="success" href="/dashboard/applicants" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_1.05fr]">
        <Panel className="p-5">
          <PanelHeader
            title="Application pipeline"
            subtitle={`Across ${activeJobs} active jobs`}
            actions={
              <Link href="/dashboard/pipeline" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]">
                View all <ArrowRight size={13} />
              </Link>
            }
          />

          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-2">
                <span className="text-[13px] font-medium text-[var(--eh-text-2)]">{row.label}</span>
                <div className="h-6 overflow-hidden rounded-md bg-[var(--surface-base)]">
                  <div
                    className="flex h-full items-center pl-2 text-[11px] font-semibold text-white"
                    style={{ width: `${Math.max((row.value / maxRowValue) * 100, row.value > 0 ? 12 : 0)}%`, background: row.color }}
                  >
                    {row.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader
            title="Top applicants"
            actions={
              <Link href="/dashboard/applicants" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]">
                View all <ArrowRight size={13} />
              </Link>
            }
            compact
          />
          <div>
            {topApplicants.map((candidate, idx) => {
              const name = candidate.applicant.name;
              return (
                <div key={candidate.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-t border-[var(--eh-border)] py-3 first:border-t-0 first:pt-0">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                    style={{ background: avatarColors[(idx + 1) % avatarColors.length] }}
                  >
                    {initials(name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[var(--eh-text)]">{name}</p>
                    <p className="truncate text-[12px] text-[var(--eh-text-3)]">
                      {candidate.applicant.teacherProfile?.experience || "Experienced"} · {candidate.applicant.teacherProfile?.city || "Location not set"}
                    </p>
                  </div>
                  <StatusBadge tone="brand">{candidate.matchScore}%</StatusBadge>
                  <Link href="/dashboard/applicants" className="eh-btn eh-btn-secondary eh-btn-sm">Review</Link>
                </div>
              );
            })}
            {topApplicants.length === 0 ? (
              <EmptyState
                title="No applications yet"
                message="Share your active jobs to attract candidates."
                actions={
                  <Link href="/dashboard/my-jobs" className="eh-btn eh-btn-secondary eh-btn-sm">
                    View my jobs
                  </Link>
                }
              />
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-5">
          <PanelHeader
            title="Upcoming interviews"
            actions={<Link href="/dashboard/interviews" className="text-[12px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]">All</Link>}
            compact
          />
          <div className="space-y-2">
            {upcomingInterviews.slice(0, 3).map((interview, idx) => {
              const name = interview.application?.applicant?.name || `Candidate ${idx + 1}`;
              return (
                <div key={interview.id} className="flex gap-3 border-t border-[var(--eh-border)] py-3 first:border-t-0 first:pt-0">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                    style={{ background: avatarColors[idx % avatarColors.length] }}
                  >
                    {initials(name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[var(--eh-text)]">{name}</p>
                    <p className="truncate text-[12px] text-[var(--eh-text-3)]">
                      {interview.application?.job?.title || "Interview"} · {new Date(interview.scheduledAt).toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" })}
                    </p>
                    <StatusBadge tone="brand" className="mt-1">
                      {interview.type === "VIDEO" ? <Video size={11} /> : null}
                      {interview.type === "VIDEO" ? "Online" : "In-person"}
                    </StatusBadge>
                  </div>
                </div>
              );
            })}
            {upcomingInterviews.length === 0 ? (
              <EmptyState
                title="No interviews scheduled yet"
                message="Shortlist candidates to start booking interviews."
                actions={
                  <Link href="/dashboard/applicants" className="eh-btn eh-btn-secondary eh-btn-sm">
                    Open applicants
                  </Link>
                }
              />
            ) : null}
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader
            title="Top matches"
            subtitle="Ranked from profile fit, recency, and role alignment."
            actions={<StatusBadge tone="brand">Fit ranked</StatusBadge>}
            compact
          />
          <div>
            {topMatches.length === 0 ? (
              <EmptyState
                title="No additional matches yet"
                message="New profiles will appear here as applications arrive."
              />
            ) : (
              topMatches.map((candidate, idx) => (
                <div key={`${candidate.id}-top`} className="flex items-center gap-3 border-t border-[var(--eh-border)] py-3 first:border-t-0 first:pt-0">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: avatarColors[(idx + 2) % avatarColors.length] }}
                  >
                    {initials(candidate.applicant.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">{candidate.applicant.name}</p>
                    <p className="truncate text-[12px] text-[var(--eh-text-3)]">
                      {candidate.applicant.teacherProfile?.subjects?.[0] || candidate.applicant.teacherProfile?.qualification || "Teacher"} · {candidate.applicant.teacherProfile?.city || "India"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-brand-700">{candidate.matchScore}%</span>
                    {featureFlags.messaging && (
                      <button
                        type="button"
                        onClick={() => inviteCandidate(candidate)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:text-brand-800"
                      >
                        <MessageSquare size={12} />
                        Invite
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-5">
          <PanelHeader
            title="Operations snapshot"
            subtitle="Keep the metrics close, but let the hiring workflow lead."
            actions={
              <Link href="/dashboard/analytics" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]">
                Analytics <ArrowRight size={13} />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--surface-base)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Response pace</p>
              <p className="mt-1 text-[18px] font-semibold text-[var(--eh-text)]">{appDelta >= 0 ? "Up this week" : "Down this week"}</p>
              <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">{deltaLabel(appDelta, "applications", "No movement")}</p>
            </div>
            <div className="rounded-xl bg-[var(--surface-base)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Interviews next 7 days</p>
              <p className="mt-1 text-[18px] font-semibold text-[var(--eh-text)]">{interviewsNextWeek}</p>
              <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Plan panels and follow-ups early.</p>
            </div>
            <div className="rounded-xl bg-[var(--surface-base)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Hire rate</p>
              <p className="mt-1 text-[18px] font-semibold text-[var(--eh-text)]">{hiredRate}%</p>
              <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Across current applications.</p>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
