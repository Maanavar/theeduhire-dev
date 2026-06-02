"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Lock,
  MessageSquare,
  Plus,
  Video,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { SchoolAnalytics } from "@/types";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { featureFlags } from "@/config/feature-flags";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  createConversation,
  getAllRankedCandidates,
  getInterviews,
  getMyJobs,
} from "@/lib/api/hiring-client";
import { getSchoolAnalytics, getSchoolProfile } from "@/lib/api/school-client";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import { EmptyState, ErrorState } from "@/components/system/system-states";
import { RowsSkeleton, StatsGridSkeleton } from "@/components/system/dashboard-skeletons";
import {
  Panel,
  PanelHeader,
  PageShell,
  StatusBadge,
} from "@/components/layout/page-shell";
import { UserAvatar } from "@/components/ui/user-avatar";

type SchoolJob = { id: string; title: string; status: string; _count: { applications: number } };
type RankedCandidate = {
  id: string;
  applicantId: string;
  status: string;
  appliedAt: string;
  matchScore: number;
  applicant: {
    name: string;
    teacherProfile: {
      city: string | null;
      experience: string | null;
      qualification: string | null;
      subjects: string[] | null;
    } | null;
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


export default function SchoolDashboardPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);
  const [analyticsLocked, setAnalyticsLocked] = useState(false);
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

      if (loadedJobs.status === "rejected") throw loadedJobs.reason;

      const jobs = loadedJobs.value as SchoolJob[];
      setJobs(jobs);

      if (analyticsData.status === "rejected") {
        const msg = getApiErrorMessage(analyticsData.reason, "");
        if (msg.includes("PLAN_UPGRADE_REQUIRED") || (analyticsData.reason as any)?.error === "PLAN_UPGRADE_REQUIRED") {
          setAnalyticsLocked(true);
        }
        // non-fatal — continue loading the rest of the dashboard
      } else {
        setAnalytics(analyticsData.value as SchoolAnalytics);
      }
      if (interviewsData.status === "fulfilled") {
        setInterviews((interviewsData.value || []) as InterviewItem[]);
      }
      if (profileData.status === "fulfilled") {
        setSchoolProfile(profileData.value as SchoolProfileState);
      }

      const activeJobs = jobs.filter((j) => j.status === "ACTIVE").slice(0, 3);
      if (activeJobs.length > 0) {
        const rankedResults = await Promise.allSettled(
          activeJobs.map((j) => getAllRankedCandidates(j.id))
        );
        const merged = rankedResults
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => (r as PromiseFulfilledResult<{ candidates: unknown[] }>).value.candidates as RankedCandidate[]);
        const dedup = new Map<string, RankedCandidate>();
        for (const c of merged) {
          if (!dedup.has(c.id) || (dedup.get(c.id)?.matchScore || 0) < c.matchScore) {
            dedup.set(c.id, c);
          }
        }
        setRanked(
          Array.from(dedup.values())
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 8)
        );
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load school dashboard"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") loadDashboard();
  }, [sessionStatus]);

  const summary = analytics?.summary;
  const activeJobs =
    summary?.activeJobs ?? jobs.filter((j) => j.status === "ACTIVE").length;
  const totalApplications =
    summary?.totalApplications ??
    jobs.reduce((sum, j) => sum + (j._count?.applications || 0), 0);
  const shortlisted = summary?.shortlisted ?? 0;
  const hired = summary?.hired ?? 0;
  const offers = Math.max(shortlisted - hired, 0);

  const firstName = (session?.user?.name || "Admin").split(" ").filter(Boolean)[0] || "Admin";

  const upcomingInterviews = useMemo(
    () =>
      interviews
        .filter((i) => new Date(i.scheduledAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [interviews]
  );

  const topApplicants = useMemo(
    () =>
      ranked
        .filter((c) => c.status !== "REJECTED" && c.status !== "HIRED")
        .slice()
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
        .slice(0, 4),
    [ranked]
  );

  const topMatches = useMemo(() => {
    const recentIds = new Set(topApplicants.map((c) => c.id));
    return ranked
      .filter((c) => !recentIds.has(c.id))
      .filter((c) => c.status !== "REJECTED" && c.status !== "HIRED")
      .slice()
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);
  }, [ranked, topApplicants]);

  const trend = analytics?.trend || [];
  const recentWindow = trend.slice(-7);
  const previousWindow = trend.slice(-14, -7);
  const recentApps = recentWindow.reduce((s, i) => s + i.applications, 0);
  const previousApps = previousWindow.reduce((s, i) => s + i.applications, 0);
  const appDelta = recentApps - previousApps;

  const interviewsNextWeek = upcomingInterviews.filter((e) => {
    const diff = new Date(e.scheduledAt).getTime() - Date.now();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const hiredRate =
    totalApplications > 0 ? Math.round((hired / totalApplications) * 100) : 0;

  const verificationStatus =
    schoolProfile?.verificationStatus ||
    (schoolProfile?.verified ? "VERIFIED" : "UNVERIFIED");

  const needsProfileFinish =
    !schoolProfile?.schoolName ||
    !schoolProfile?.city ||
    !schoolProfile?.board ||
    !schoolProfile?.about ||
    !schoolProfile?.logoUrl;

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

  const pipelineStages = [
    { label: "New", value: totalApplications, color: "#0a66c2" },
    { label: "Reviewed", value: Math.max(totalApplications - shortlisted, 0), color: "#64748b" },
    { label: "Shortlisted", value: shortlisted, color: "#2563eb" },
    { label: "Interview", value: upcomingInterviews.length, color: "#d97706" },
    { label: "Offer", value: offers, color: "#059669" },
    { label: "Hired", value: hired, color: "#166534" },
  ];
  const maxStageValue = Math.max(...pipelineStages.map((s) => s.value), 1);

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
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--eh-border)] pb-5">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
            School dashboard
          </p>
          <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)] sm:text-[26px]">
            Good morning, {firstName}
          </h1>
          <p className="mt-1.5 text-[14px] leading-6 text-[var(--eh-text-3)]">
            {Math.max(totalApplications - shortlisted, 0)} new applications since your last review.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/applicants" className="eh-btn eh-btn-secondary">
            <Calendar size={14} />
            Review applicants
          </Link>
          <Link href="/dashboard/post-job" className="eh-btn eh-btn-primary">
            <Plus size={14} />
            Post a job
          </Link>
        </div>
      </div>

      {/* ── Verification banner ── */}
      {verificationStatus !== "VERIFIED" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-amber-700">
                {verificationStatus === "PENDING" ? "Verification in review" : "Not verified"}
              </p>
            </div>
            <p className="mt-1 text-[13px] text-amber-900">
              {verificationStatus === "PENDING"
                ? "Your school profile is under admin review. Keep details current while it's checked."
                : needsProfileFinish
                  ? "Finish your school profile, logo, and about section before requesting verification."
                  : "Request verification so your jobs carry stronger trust signals for teachers."}
            </p>
          </div>
          <Link href="/dashboard/profile" className="eh-btn eh-btn-primary eh-btn-sm shrink-0">
            {verificationStatus === "PENDING" ? "Review profile" : "Complete verification"}
          </Link>
        </div>
      ) : null}

      <OnboardingChecklist role="SCHOOL_ADMIN" schoolPlan={analyticsLocked ? "FREE" : undefined} />

      {/* ── Plan upgrade banner (FREE plan) ── */}
      {analyticsLocked ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--eh-border)] bg-gradient-to-r from-slate-50 to-white px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Lock size={15} className="text-slate-500" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[var(--eh-text)]">Analytics on Pro plan</p>
              <p className="text-[12px] text-[var(--eh-text-3)]">Upgrade to unlock your full hiring funnel, conversion rates, and trend data.</p>
            </div>
          </div>
          <Link href="/dashboard/subscription" className="eh-btn eh-btn-primary eh-btn-sm shrink-0">
            Upgrade plan
          </Link>
        </div>
      ) : null}

      {/* ── KPI metrics ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Active jobs", value: activeJobs, hint: "Live roles", color: "bg-[var(--eh-primary-500)]", textColor: "text-[var(--eh-primary-700)]", href: "/dashboard/my-jobs", locked: false },
          { label: "Applications", value: totalApplications, hint: analyticsLocked ? "Upgrade for trends" : (appDelta > 0 ? `+${appDelta} vs last week` : appDelta < 0 ? `${appDelta} vs last week` : "No change"), color: "bg-sky-500", textColor: "text-sky-700", href: "/dashboard/applicants", locked: false },
          { label: "Shortlisted", value: analyticsLocked ? "—" : shortlisted, hint: analyticsLocked ? "Pro feature" : `${shortlisted > 0 ? Math.round((shortlisted / Math.max(totalApplications, 1)) * 100) : 0}% conversion`, color: "bg-violet-500", textColor: "text-violet-700", href: analyticsLocked ? "/dashboard/subscription" : "/dashboard/applicants", locked: analyticsLocked },
          { label: "Interviews", value: upcomingInterviews.length, hint: `${interviewsNextWeek} this week`, color: "bg-amber-400", textColor: "text-amber-700", href: "/dashboard/interviews", locked: false },
          { label: "Offers sent", value: analyticsLocked ? "—" : offers, hint: analyticsLocked ? "Pro feature" : (offers > 0 ? "Awaiting response" : "None pending"), color: "bg-emerald-400", textColor: "text-emerald-700", href: analyticsLocked ? "/dashboard/subscription" : "/dashboard/applicants", locked: analyticsLocked },
          { label: "Hired", value: analyticsLocked ? "—" : hired, hint: analyticsLocked ? "Pro feature" : `${hiredRate}% hire rate`, color: "bg-emerald-600", textColor: "text-emerald-800", href: analyticsLocked ? "/dashboard/subscription" : "/dashboard/applicants", locked: analyticsLocked },
        ].map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className={[
              "group relative rounded-xl border bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all",
              m.locked
                ? "border-[var(--eh-border)] opacity-60 hover:opacity-80"
                : "border-[var(--eh-border)] hover:border-[var(--eh-border-strong)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]",
            ].join(" ")}
          >
            {m.locked ? (
              <Lock size={11} className="absolute right-3 top-3 text-slate-400" />
            ) : null}
            <div className={`mb-3 h-0.5 w-6 rounded-full ${m.color}`} />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
              {m.label}
            </p>
            <p className={`mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em] ${m.locked ? "text-slate-300" : m.textColor}`}>
              {m.value}
            </p>
            <p className="mt-2 text-[12px] leading-[1.4] text-[var(--eh-text-3)]">{m.hint}</p>
          </Link>
        ))}
      </div>

      {/* ── Pipeline + Top applicants ── */}
      <div className="grid gap-4 xl:grid-cols-[1.65fr_1.05fr]">
        <Panel className="p-5">
          <PanelHeader
            title="Application pipeline"
            subtitle={`Across ${activeJobs} active job${activeJobs === 1 ? "" : "s"}`}
            actions={
              analyticsLocked ? (
                <Link href="/dashboard/subscription" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)] transition-colors">
                  <Lock size={11} /> Upgrade
                </Link>
              ) : (
                <Link
                  href="/dashboard/pipeline"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)] transition-colors"
                >
                  View all <ArrowRight size={12} />
                </Link>
              )
            }
          />
          {analyticsLocked ? (
            <div className="relative select-none overflow-hidden rounded-lg">
              {/* Blurred ghost pipeline */}
              <div className="pointer-events-none space-y-2.5 blur-sm opacity-30">
                {["New", "Reviewed", "Shortlisted", "Interview", "Offer", "Hired"].map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-[90px] shrink-0 text-[13px] font-medium text-[var(--eh-text-2)]">{label}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-[var(--surface-base)]">
                        <div className="absolute left-0 top-0 h-full rounded-md" style={{ width: `${Math.max(80 - i * 14, 10)}%`, background: "#0a66c2" }} />
                      </div>
                      <span className="w-7 shrink-0 text-right text-[12px] font-semibold tabular-nums text-[var(--eh-text-2)]">—</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <p className="text-[13px] font-semibold text-[var(--eh-text)]">Pipeline analytics on Pro</p>
                <Link href="/dashboard/subscription" className="eh-btn eh-btn-primary eh-btn-sm">Upgrade plan</Link>
              </div>
            </div>
          ) : (
          <div className="space-y-2.5">
            {pipelineStages.map((stage) => {
              const pct = Math.round((stage.value / maxStageValue) * 100);
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="w-[90px] shrink-0 text-[13px] font-medium text-[var(--eh-text-2)]">
                    {stage.label}
                  </span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-[var(--surface-base)]">
                      <div
                        className="absolute left-0 top-0 h-full rounded-md transition-all duration-500"
                        style={{
                          width: stage.value > 0 ? `${Math.max(pct, 8)}%` : "0%",
                          background: stage.color,
                        }}
                      />
                    </div>
                    <span className="w-7 shrink-0 text-right text-[12px] font-semibold tabular-nums text-[var(--eh-text-2)]">
                      {stage.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </Panel>

        <Panel className="p-5">
          <PanelHeader
            title="Top applicants"
            actions={
              <Link
                href="/dashboard/applicants"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)] transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            }
            compact
          />
          <div>
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
            ) : (
              topApplicants.map((candidate) => {
                const name = candidate.applicant.name;
                return (
                  <div
                    key={candidate.id}
                    className="flex items-center gap-3 border-t border-[var(--eh-border)] py-3 first:border-t-0 first:pt-0"
                  >
                    <UserAvatar name={name} avatarUrl={(candidate.applicant as any).avatarUrl} size={32} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">{name}</p>
                      <p className="truncate text-[11px] text-[var(--eh-text-3)]">
                        {candidate.applicant.teacherProfile?.experience || "Experienced"} ·{" "}
                        {candidate.applicant.teacherProfile?.city || "Location not set"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-md border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--eh-primary-700)]">
                        {candidate.matchScore}%
                      </span>
                      <Link
                        href="/dashboard/applicants"
                        className="eh-btn eh-btn-secondary eh-btn-sm"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>
      </div>

      {/* ── Interviews + Top matches ── */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-5">
          <PanelHeader
            title="Upcoming interviews"
            actions={
              <Link
                href="/dashboard/interviews"
                className="text-[12px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)] transition-colors"
              >
                All
              </Link>
            }
            compact
          />
          <div className="space-y-2">
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
            ) : (
              upcomingInterviews.slice(0, 3).map((interview, idx) => {
                const name = interview.application?.applicant?.name || `Candidate ${idx + 1}`;
                return (
                  <div
                    key={interview.id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--eh-border)] px-3.5 py-3"
                  >
                    <UserAvatar name={name} size={32} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">{name}</p>
                      <p className="truncate text-[11px] text-[var(--eh-text-3)]">
                        {interview.application?.job?.title}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-semibold text-[var(--eh-text-2)]">
                        {new Date(interview.scheduledAt).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <div className="mt-0.5 flex items-center justify-end gap-1">
                        {interview.type === "VIDEO" ? (
                          <Video size={10} className="text-[var(--eh-text-4)]" />
                        ) : null}
                        <span className="text-[10px] text-[var(--eh-text-4)]">
                          {interview.type === "VIDEO" ? "Online" : "In-person"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader
            title="Top matches"
            subtitle="Ranked by profile fit, recency, and role alignment."
            actions={
              <StatusBadge tone="brand">AI ranked</StatusBadge>
            }
            compact
          />
          <div>
            {topMatches.length === 0 ? (
              <EmptyState
                title="No additional matches yet"
                message="New profiles appear here as applications arrive."
              />
            ) : (
              topMatches.map((candidate) => (
                <div
                  key={`${candidate.id}-top`}
                  className="flex items-center gap-3 border-t border-[var(--eh-border)] py-3 first:border-t-0 first:pt-0"
                >
                  <UserAvatar name={candidate.applicant.name} avatarUrl={(candidate.applicant as any).avatarUrl} size={28} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">
                      {candidate.applicant.name}
                    </p>
                    <p className="truncate text-[11px] text-[var(--eh-text-3)]">
                      {candidate.applicant.teacherProfile?.subjects?.[0] ||
                        candidate.applicant.teacherProfile?.qualification ||
                        "Teacher"}{" "}
                      · {candidate.applicant.teacherProfile?.city || "India"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--eh-primary-700)]">
                      {candidate.matchScore}%
                    </span>
                    {featureFlags.messaging && (
                      <button
                        type="button"
                        onClick={() => inviteCandidate(candidate)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)] transition-colors"
                      >
                        <MessageSquare size={11} />
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

      {/* ── Operations snapshot ── */}
      <Panel className="p-5">
        <PanelHeader
          title="Operations snapshot"
          subtitle="Key signals across your current hiring cycle."
          actions={
            analyticsLocked ? (
              <Link href="/dashboard/subscription" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)] transition-colors">
                <Lock size={11} /> Upgrade for full analytics
              </Link>
            ) : (
              <Link
                href="/dashboard/analytics"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)] transition-colors"
              >
                Full analytics <ArrowRight size={12} />
              </Link>
            )
          }
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <OpsCard
            label="Application pace"
            value={analyticsLocked ? "—" : (appDelta >= 0 ? "Up this week" : "Down this week")}
            detail={analyticsLocked ? "Upgrade to see trends" : (appDelta > 0 ? `+${appDelta} vs last week` : appDelta < 0 ? `${appDelta} vs last week` : "No movement")}
            locked={analyticsLocked}
            icon={
              analyticsLocked ? <Lock size={16} className="text-slate-400" /> :
              appDelta > 0 ? (
                <TrendingUp size={16} className="text-emerald-600" />
              ) : appDelta < 0 ? (
                <TrendingDown size={16} className="text-red-500" />
              ) : (
                <Minus size={16} className="text-slate-400" />
              )
            }
          />
          <OpsCard
            label="Interviews · next 7 days"
            value={String(interviewsNextWeek)}
            detail="Plan panels and follow-ups early."
            icon={<Calendar size={16} className="text-amber-600" />}
          />
          <OpsCard
            label="Hire rate"
            value={analyticsLocked ? "—" : `${hiredRate}%`}
            detail={analyticsLocked ? "Upgrade to see hire rate" : "Across current applications."}
            locked={analyticsLocked}
            icon={analyticsLocked ? <Lock size={16} className="text-slate-400" /> : <TrendingUp size={16} className="text-[var(--eh-primary-600)]" />}
          />
        </div>
      </Panel>
    </PageShell>
  );
}

function OpsCard({
  label,
  value,
  detail,
  icon,
  locked,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  locked?: boolean;
}) {
  return (
    <div className={["flex gap-3 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-4", locked ? "opacity-60" : ""].join(" ").trim()}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--eh-border)] bg-white">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
          {label}
        </p>
        <p className={["mt-1 text-[18px] font-semibold leading-none tracking-[-0.02em]", locked ? "text-slate-300" : "text-[var(--eh-text)]"].join(" ")}>
          {value}
        </p>
        <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">{detail}</p>
      </div>
    </div>
  );
}
