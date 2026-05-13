"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";
import { formatSalary, timeAgo, getBoardLabel } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import ApplyForm from "@/components/forms/apply-form";
import type { JobWithDetails } from "@/types";
import { trackEvent } from "@/lib/analytics";

interface Props {
  jobId: string | null;
}

type MatchInsights = {
  score: number;
  explanation: string;
  breakdown?: {
    subject?: number;
    location?: number;
    board?: number;
    salary?: number;
    experience?: number;
    tet?: number;
  } | null;
} | null;

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  FRESHER: "Fresher",
  ONE_TO_TWO_YEARS: "1-2 years",
  TWO_TO_FIVE_YEARS: "2-5 years",
  FIVE_TO_TEN_YEARS: "5-10 years",
  TEN_PLUS_YEARS: "10+ years",
};

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-3/4 rounded-xl" />
        <div className="skeleton h-4 w-2/5 rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[80, 96, 72, 88].map((width, index) => (
          <div key={index} className="skeleton h-8 rounded-full" style={{ width }} />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton h-20 rounded-[22px]" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-5/6 rounded" />
        <div className="skeleton h-3.5 w-4/5 rounded" />
      </div>
    </div>
  );
}

export default function JobDetailPanel({ jobId }: Props) {
  const { data: session } = useSession();
  const [job, setJob] = useState<(JobWithDetails & { isApplied: boolean; isSaved: boolean; matchInsights?: MatchInsights }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const fetchJob = useCallback(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/jobs/${jobId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setJob(data.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    return fetchJob();
  }, [fetchJob, session?.user?.id]);

  useEffect(() => {
    if (!job) return;
    trackEvent("job_viewed", {
      jobId: job.id,
      source: "dashboard_split_view",
    });
  }, [job]);

  const handleSave = async () => {
    if (!session?.user) {
      toast.error("Sign in to save jobs");
      return;
    }
    if (!job) return;
    setSavingJob(true);
    try {
      const res = await fetch("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (data.success) {
        const saved = data.data.saved;
        setJob((prev) => (prev ? { ...prev, isSaved: saved } : prev));
        toast.success(saved ? "Job saved!" : "Removed from saved");
        trackEvent("job_saved", { jobId: job.id, saved });
      } else {
        toast.error(data.error || "Failed to save job");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingJob(false);
    }
  };

  const handleApplySuccess = () => {
    setJob((prev) => (prev ? { ...prev, isApplied: true } : prev));
  };

  if (!jobId) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-base)]">
          <Briefcase size={24} className="text-[var(--eh-text-4)]" />
        </div>
        <h3 className="font-display text-[24px] leading-[1] tracking-[-0.03em] text-[var(--eh-text)]">
          Select a position
        </h3>
        <p className="mt-3 max-w-[220px] text-sm leading-[1.6] text-[var(--eh-text-3)]">
          Choose any job from the list to open the full role summary and actions.
        </p>
      </div>
    );
  }

  if (isLoading) return <DetailSkeleton />;
  if (!job) return null;

  const jobTypeLabel =
    job.jobType === "FULL_TIME"
      ? "Full-Time"
      : job.jobType === "PART_TIME"
        ? "Part-Time"
        : job.jobType === "CONTRACT"
          ? "Contract"
          : "Visiting Faculty";

  const isSchoolAdmin = session?.user?.role === "SCHOOL_ADMIN";
  const matchInsights = !isSchoolAdmin ? job.matchInsights ?? null : null;
  const fitBreakdown = matchInsights?.breakdown
    ? [
        { label: "Subject", value: Math.round((matchInsights.breakdown.subject ?? 0) * 100) },
        { label: "Location", value: Math.round((matchInsights.breakdown.location ?? 0) * 100) },
        { label: "Board", value: Math.round((matchInsights.breakdown.board ?? 0) * 100) },
        { label: "Salary", value: Math.round((matchInsights.breakdown.salary ?? 0) * 100) },
        { label: "Experience", value: Math.round((matchInsights.breakdown.experience ?? 0) * 100) },
        ...(typeof matchInsights.breakdown.tet === "number"
          ? [{ label: "TET", value: Math.round((matchInsights.breakdown.tet ?? 0) * 100) }]
          : []),
      ]
    : [];

  return (
    <>
      <div className="scrollbar-thin max-h-[calc(100vh-220px)] overflow-y-auto lg:max-h-[calc(100vh-200px)]">
        <div className="space-y-6 p-6">
          <div className="rounded-[32px] border border-[var(--eh-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--eh-text-4)]">Role workspace</p>
            <div className="mt-3 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-white">
                {job.school.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.school.logoUrl} alt={`${job.school.schoolName} logo`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[12px] font-semibold text-[var(--eh-text-3)]">
                    {(job.school.schoolName || "S").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <h1 className="font-display text-[30px] leading-[0.98] tracking-[-0.04em] text-[var(--eh-text)]">
                    {job.title}
                  </h1>
                  {job.school.verified ? <BadgeCheck size={18} className="mt-1 shrink-0 text-eh-primary" /> : null}
                </div>
                <p className="mt-2 text-[14px] font-medium text-[var(--eh-text-3)]">{job.school.schoolName}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: MapPin, label: job.school.city },
                { icon: BookOpen, label: getBoardLabel(job.board) },
                { icon: Users, label: `Grade ${job.gradeLevel}` },
                { icon: Briefcase, label: jobTypeLabel },
                ...((job.experienceLevel && EXPERIENCE_LEVEL_LABELS[job.experienceLevel])
                  ? [{ icon: Clock, label: EXPERIENCE_LEVEL_LABELS[job.experienceLevel] }]
                  : job.experience
                    ? [{ icon: Clock, label: job.experience }]
                    : []),
              ].map((chip) => (
                <span
                  key={`${chip.label}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--eh-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--eh-text-2)]"
                >
                  <chip.icon size={12} className="text-[var(--eh-text-4)]" />
                  {chip.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-3 py-1.5 text-xs font-semibold text-[var(--eh-primary-700)]">
                <DollarSign size={12} />
                {formatSalary(job.salaryMin, job.salaryMax)}
              </span>
            </div>
          </div>

          {matchInsights ? (
            <section className="overflow-hidden rounded-[30px] border border-[#dbe6ff] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_50%,#eef2ff_100%)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-[420px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4f46e5]">Selection chance</p>
                  <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
                    {matchInsights.score}% match with this job
                  </h2>
                  <p className="mt-2 text-[14px] leading-7 text-slate-600">
                    {matchInsights.explanation || "This score reflects how closely your current profile aligns with the job description."}
                  </p>
                </div>
                <div className="min-w-[170px] rounded-[28px] border border-white/80 bg-white/80 px-5 py-4 text-right shadow-[0_14px_40px_rgba(79,70,229,0.10)] backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Winning probability</p>
                  <p className="mt-2 text-[48px] font-semibold leading-none tracking-[-0.05em] text-[#312e81]">{matchInsights.score}%</p>
                  <p className="mt-2 text-[12px] text-slate-500">Profile fit against subject, location, board, salary, and experience.</p>
                </div>
              </div>

              {fitBreakdown.length > 0 ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {fitBreakdown.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-semibold text-slate-700">{item.label}</span>
                        <span className="text-[12px] font-semibold text-[#4f46e5]">{item.value}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-[linear-gradient(90deg,#4f46e5_0%,#60a5fa_100%)]" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] bg-[var(--surface-base)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Posted</p>
              <p className="mt-2 text-[15px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">{timeAgo(job.postedAt)}</p>
            </div>
            <div className="rounded-[22px] bg-[var(--surface-base)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Applicants</p>
              <p className="mt-2 text-[15px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">
                {job._count?.applications ?? 0} applicant{job._count?.applications !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-[22px] bg-[var(--surface-base)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">School</p>
              <p className="mt-2 text-[15px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">
                {job.school.verified ? "Verified profile" : "Profile available"}
              </p>
            </div>
          </div>

          <section className="rounded-[30px] border border-[var(--eh-border)] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--eh-text-4)]">Job description</p>
            <div className="mt-4 whitespace-pre-line text-[14px] leading-[1.9] text-[var(--eh-text-2)]">
              {job.description}
            </div>
          </section>

          {job.requirements.length > 0 && (
            <section className="rounded-[26px] border border-[var(--eh-border)] bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Requirements</p>
              <ul className="mt-4 space-y-3">
                {job.requirements.map((req: any) => (
                  <li key={req.id} className="flex items-start gap-3 text-[14px] leading-[1.75] text-[var(--eh-text-2)]">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--eh-primary-600)]" />
                    {req.text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.benefits.length > 0 && (
            <section className="rounded-[26px] border border-[var(--eh-border)] bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Benefits</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {job.benefits.map((benefit: any) => (
                  <span
                    key={benefit.id}
                    className="rounded-full border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-3 py-1.5 text-xs font-semibold text-[var(--eh-primary-700)]"
                  >
                    {benefit.text}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="rounded-[26px] bg-[var(--surface-base)] p-4 text-xs text-[var(--eh-text-3)]">
            <div className="flex flex-wrap gap-5">
              {job.school.website ? (
                <a
                  href={job.school.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-eh-primary"
                >
                  <ExternalLink size={12} />
                  {job.school.website.replace(/https?:\/\//, "")}
                </a>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} />
                Posted {timeAgo(job.postedAt)}
              </span>
              {job._count ? (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} />
                  {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
          </div>

          {!isSchoolAdmin && (
            <div className="flex flex-wrap gap-2.5">
              {job.isApplied ? (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={15} />
                  Applied
                </div>
              ) : (
                <button
                  onClick={() => setApplyOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-brand transition-all duration-[120ms] hover:-translate-y-px hover:bg-brand-600 active:translate-y-0"
                >
                  Apply for this position
                  <ArrowRight size={14} />
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={savingJob}
                className={[
                  "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-[120ms] disabled:opacity-50",
                  job.isSaved
                    ? "border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
                    : "border-[var(--eh-border)] text-[var(--eh-text-2)] hover:border-brand-500 hover:bg-[var(--eh-primary-50)] hover:text-brand-600",
                ].join(" ")}
              >
                {job.isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {job.isSaved ? "Saved" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      <ApplyForm
        jobId={job.id}
        jobTitle={job.title}
        schoolName={job.school.schoolName}
        screeningQuestions={job.screeningQuestions || []}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSuccess={handleApplySuccess}
      />
    </>
  );
}
