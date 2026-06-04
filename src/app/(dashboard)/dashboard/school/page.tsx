"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Lock,
  MessageSquare,
  Plus,
  Shield,
  Star,
  Users,
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
import { Panel, PageShell, StatusBadge } from "@/components/layout/page-shell";
import { UserAvatar } from "@/components/ui/user-avatar";

type SchoolJob = { id: string; title: string; status: string; subject?: string; _count: { applications: number }; shortlisted?: number };
type RankedCandidate = {
  id: string;
  applicantId: string;
  status: string;
  appliedAt: string;
  matchScore: number;
  applicant: {
    id?: string;
    name: string;
    avatarUrl?: string | null;
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
  const { status: sessionStatus } = useSession();
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
  const activeJobs = summary?.activeJobs ?? jobs.filter((j) => j.status === "ACTIVE").length;
  const totalApplications = summary?.totalApplications ?? jobs.reduce((sum, j) => sum + (j._count?.applications || 0), 0);
  const shortlisted = summary?.shortlisted ?? 0;
  const hired = summary?.hired ?? 0;

  const trend = analytics?.trend || [];
  const recentWindow = trend.slice(-7);
  const previousWindow = trend.slice(-14, -7);
  const recentApps = recentWindow.reduce((s, i) => s + i.applications, 0);
  const previousApps = previousWindow.reduce((s, i) => s + i.applications, 0);
  const appDelta = recentApps - previousApps;


  const upcomingInterviews = useMemo(
    () =>
      interviews
        .filter((i) => new Date(i.scheduledAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [interviews]
  );

  const topCandidates = useMemo(
    () =>
      ranked
        .filter((c) => c.status !== "REJECTED" && c.status !== "HIRED")
        .slice(0, 4),
    [ranked]
  );

  const verificationStatus: "VERIFIED" | "PENDING" | "UNVERIFIED" =
    schoolProfile?.verificationStatus ||
    (schoolProfile?.verified ? "VERIFIED" : "UNVERIFIED");

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
    { label: "New", value: totalApplications, color: "text-[var(--eh-primary-700)]", bg: "bg-[var(--eh-primary-50)]" },
    { label: "Reviewed", value: Math.max(totalApplications - shortlisted, 0), color: "text-[var(--eh-text-2)]", bg: "bg-slate-50" },
    { label: "Shortlisted", value: shortlisted, color: "text-violet-700", bg: "bg-violet-50" },
    { label: "Interview", value: upcomingInterviews.length, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Hired", value: hired, color: "text-emerald-700", bg: "bg-emerald-50" },
  ];

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
      {/* ── Verification success banner ── */}
      {verificationStatus === "VERIFIED" ? (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <div>
              <p className="text-[14px] font-semibold text-emerald-900">School Verified</p>
              <p className="text-[13px] text-emerald-700">
                Your school is verified. You can now publish jobs and connect with the best educators.
              </p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="eh-btn eh-btn-sm shrink-0 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50">
            View School Profile
          </Link>
        </div>
      ) : verificationStatus === "PENDING" || verificationStatus === "UNVERIFIED" ? (
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
                : "Complete your school profile to request verification and build trust with candidates."}
            </p>
          </div>
          <Link href="/dashboard/profile" className="eh-btn eh-btn-primary eh-btn-sm shrink-0">
            {verificationStatus === "PENDING" ? "Review profile" : "Complete verification"}
          </Link>
        </div>
      ) : null}

      <OnboardingChecklist role="SCHOOL_ADMIN" schoolPlan={analyticsLocked ? "FREE" : undefined} />

      {/* ── KPI metrics ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active Jobs", value: activeJobs, hint: "Currently open", tone: "neutral" as const, textColor: "text-[var(--eh-primary-700)]", href: "/dashboard/my-jobs" },
          { label: "Total Applications", value: totalApplications, hint: appDelta > 0 ? `↑ ${appDelta} this week` : appDelta < 0 ? `↓ ${Math.abs(appDelta)} this week` : "No change this week", tone: appDelta > 0 ? "up" as const : appDelta < 0 ? "down" as const : "neutral" as const, textColor: "text-sky-700", href: "/dashboard/applicants" },
          { label: "Shortlisted", value: analyticsLocked ? "—" : shortlisted, hint: analyticsLocked ? "Plan upgrade required" : "Awaiting your review", tone: "neutral" as const, textColor: "text-violet-700", href: "/dashboard/applicants", locked: analyticsLocked },
          { label: "Interviews This Week", value: upcomingInterviews.length, hint: "Scheduled ahead", tone: "neutral" as const, textColor: "text-amber-700", href: "/dashboard/interviews" },
        ].map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="group relative rounded-xl border border-[var(--eh-border)] bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all hover:border-[var(--eh-border-strong)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
          >
            {(m as any).locked ? <Lock size={11} className="absolute right-3 top-3 text-slate-400" /> : null}
            <p className="text-[12px] font-semibold text-[var(--eh-text-3)]">{m.label}</p>
            <p className={`mt-2 text-[32px] font-bold leading-none tracking-[-0.03em] ${(m as any).locked ? "text-slate-300" : m.textColor}`}>
              {m.value}
            </p>
            <p className={`mt-2 text-[12px] leading-[1.4] font-medium ${m.tone === "up" ? "text-emerald-600" : m.tone === "down" ? "text-red-500" : "text-[var(--eh-text-4)]"}`}>{m.hint}</p>
          </Link>
        ))}
      </div>

      {/* ── Hiring Pipeline + Job Performance ── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {/* Hiring Pipeline */}
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--eh-text)]">Hiring Pipeline</h2>
            </div>
            <Link href="/dashboard/applicants" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)] transition-colors">
              View all applicants <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            {pipelineStages.map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-1 flex-1 min-w-0">
                <div className={`flex-1 min-w-0 rounded-xl ${stage.bg} border border-[var(--eh-border)] px-3 py-3 text-center`}>
                  <p className={`text-[22px] font-bold leading-none ${stage.color}`}>{stage.value}</p>
                  <p className="mt-1 text-[11px] font-medium text-[var(--eh-text-3)]">{stage.label}</p>
                </div>
                {i < pipelineStages.length - 1 && (
                  <ChevronRight size={14} className="shrink-0 text-[var(--eh-text-4)]" />
                )}
              </div>
            ))}
          </div>
        </Panel>

        {/* Job Performance */}
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-[var(--eh-text)]">Job Performance</h2>
            <Link href="/dashboard/my-jobs" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)] transition-colors">
              See all jobs <ChevronRight size={13} />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <EmptyState title="No jobs posted yet" message="Post your first job to start tracking performance." actions={<Link href="/dashboard/post-job" className="eh-btn eh-btn-primary eh-btn-sm"><Plus size={13} /> Post a job</Link>} />
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--eh-border)]">
                  <th className="pb-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Job Title</th>
                  <th className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Applicants</th>
                  <th className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Shortlisted</th>
                  <th className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Interviews</th>
                  <th className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 6).map((job) => (
                  <tr key={job.id} className="border-b border-[var(--eh-border)] last:border-0">
                    <td className="py-2.5 pr-2 font-medium text-[var(--eh-text)]">{job.title}</td>
                    <td className="py-2.5 text-right text-[var(--eh-text-2)]">{job._count.applications}</td>
                    <td className="py-2.5 text-right text-[var(--eh-text-2)]">{job.shortlisted ?? 0}</td>
                    <td className="py-2.5 text-right text-[var(--eh-text-2)]">—</td>
                    <td className="py-2.5 text-right">
                      <StatusBadge tone={job.status === "ACTIVE" ? "success" : job.status === "DRAFT" ? "warning" : "neutral"}>
                        {job.status === "ACTIVE" ? "Active" : job.status === "DRAFT" ? "Draft" : "Closed"}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      {/* ── Top Candidates to Review ── */}
      <Panel className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--eh-text)]">Top Candidates to Review</h2>
          </div>
          <Link href="/dashboard/applicants" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)] transition-colors">
            See all <ChevronRight size={13} />
          </Link>
        </div>
        {topCandidates.length === 0 ? (
          <EmptyState
            title="No candidates yet"
            message="Share your active jobs to attract candidates."
            actions={<Link href="/dashboard/my-jobs" className="eh-btn eh-btn-secondary eh-btn-sm">View my jobs</Link>}
          />
        ) : (
          <div className="space-y-3">
            {topCandidates.map((candidate) => {
              const name = candidate.applicant.name;
              const profile = candidate.applicant.teacherProfile;
              const score = candidate.matchScore;
              const scoreColor = score >= 90 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : score >= 75 ? "text-[var(--eh-primary-700)] bg-[var(--eh-primary-50)] border-[var(--eh-primary-100)]" : "text-amber-700 bg-amber-50 border-amber-200";
              return (
                <div key={candidate.id} className="flex items-center gap-4 rounded-xl border border-[var(--eh-border)] px-4 py-3.5 transition-all hover:border-[var(--eh-border-strong)] hover:shadow-sm">
                  <UserAvatar name={name} avatarUrl={candidate.applicant.avatarUrl} size={44} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-[var(--eh-text)]">{name}</p>
                      {profile?.subjects?.[0] && (
                        <span className="text-[12px] text-[var(--eh-text-3)]">
                          {profile.subjects[0]} Teacher · {profile.experience || "Experienced"} · {profile.city || "India"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Available immediately
                      </span>
                      {(profile as any)?.safetyBadgeGranted && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-2 py-0.5 text-[11px] font-semibold text-[var(--eh-primary-700)]">
                          <Shield size={10} /> Safety Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-md border px-2.5 py-1 text-[13px] font-bold ${scoreColor}`}>
                      {score}% Match
                    </span>
                    <Link href="/dashboard/applicants" className="eh-btn eh-btn-secondary eh-btn-sm">
                      <Star size={13} /> Shortlist
                    </Link>
                    {featureFlags.messaging && (
                      <button
                        type="button"
                        onClick={() => inviteCandidate(candidate)}
                        className="eh-btn eh-btn-secondary eh-btn-sm"
                      >
                        <MessageSquare size={13} /> Message
                      </button>
                    )}
                    <Link
                      href={`/dashboard/applicants/${candidate.applicant.id || candidate.applicantId}`}
                      className="eh-btn eh-btn-secondary eh-btn-sm"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ── Managed Recruitment CTA ── */}
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--eh-border)] bg-white p-6 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-5">
          <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--eh-primary-50)] sm:flex">
            <Users size={22} className="text-[var(--eh-primary-600)]" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--eh-text)]">Let EduHire handle your hiring</p>
            <p className="mt-1 text-[13px] leading-[1.6] text-[var(--eh-text-3)]">
              Our Managed Recruitment Service takes care of everything — from sourcing and screening to shortlisting and interview coordination. You focus on students, we&apos;ll handle the rest.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {["Verified & pre-screened Candidates", "End-to-End Hiring Support", "Faster Hiring, Better Quality"].map((feat) => (
                <span key={feat} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--eh-text-3)]">
                  <CheckCircle2 size={12} className="text-emerald-500" /> {feat}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Link href="/dashboard/managed-recruitment" className="eh-btn eh-btn-primary shrink-0">
          Explore Managed Recruitment <ArrowRight size={14} />
        </Link>
      </div>
    </PageShell>
  );
}
