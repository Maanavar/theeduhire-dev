"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MapPin, BookOpen, Users, Briefcase, Clock, DollarSign,
  ArrowRight, Bookmark, BookmarkCheck, BadgeCheck, CheckCircle2, ExternalLink,
} from "lucide-react";
import { formatSalary, timeAgo, getBoardLabel } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import ApplyForm from "@/components/forms/apply-form";
import type { JobWithDetails } from "@/types";

interface Props {
  jobId: string | null;
}

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-5">
      <div className="space-y-2">
        <div className="skeleton h-7 w-3/4 rounded-xl" />
        <div className="skeleton h-4 w-2/5 rounded-lg" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[80, 96, 72, 88].map((w, i) => (
          <div key={i} className="skeleton h-6 rounded-lg" style={{ width: w }} />
        ))}
      </div>
      <div className="skeleton h-px w-full rounded" />
      <div className="space-y-2">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-5/6 rounded" />
        <div className="skeleton h-3.5 w-4/5 rounded" />
        <div className="skeleton h-3.5 w-3/4 rounded" />
      </div>
    </div>
  );
}

export default function JobDetailPanel({ jobId }: Props) {
  const { data: session } = useSession();
  const [job, setJob] = useState<JobWithDetails & { isApplied: boolean; isSaved: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const fetchJob = useCallback(() => {
    if (!jobId) { setJob(null); return; }
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/jobs/${jobId}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled && data.success) setJob(data.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [jobId]);

  useEffect(() => { return fetchJob(); }, [fetchJob]);

  const handleSave = async () => {
    if (!session?.user) { toast.error("Sign in to save jobs"); return; }
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
        setJob((prev) => prev ? { ...prev, isSaved: saved } : prev);
        toast.success(saved ? "Job saved!" : "Removed from saved");
      } else {
        toast.error(data.error || "Failed to save job");
      }
    } catch { toast.error("Network error"); }
    finally { setSavingJob(false); }
  };

  const handleApplySuccess = () => {
    setJob((prev) => prev ? { ...prev, isApplied: true } : prev);
  };

  // Empty state
  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Briefcase size={24} className="text-gray-400" />
        </div>
        <h3 className="font-display text-[18px] font-semibold text-gray-500 italic mb-1">
          Select a position
        </h3>
        <p className="text-sm text-gray-400 max-w-[200px]">
          Click any job from the list to view full details
        </p>
      </div>
    );
  }

  if (isLoading) return <DetailSkeleton />;
  if (!job) return null;

  const jobTypeLabel =
    job.jobType === "FULL_TIME"  ? "Full-Time"      :
    job.jobType === "PART_TIME"  ? "Part-Time"       :
    job.jobType === "CONTRACT"   ? "Contract"        :
    "Visiting Faculty";

  const isSchoolAdmin = session?.user?.role === "SCHOOL_ADMIN";

  return (
    <>
      <div className="overflow-y-auto max-h-[calc(100vh-220px)] lg:max-h-[calc(100vh-200px)] scrollbar-thin">
        <div className="p-6">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-start gap-2 mb-1">
              <h1 className="font-display text-[22px] lg:text-[24px] font-bold text-gray-900 leading-tight tracking-[-0.02em] flex-1">
                {job.title}
              </h1>
              {job.school.verified && (
                <BadgeCheck size={18} className="text-brand-500 mt-1 flex-shrink-0" />
              )}
            </div>
            <p className="text-[15px] text-gray-500 font-medium">{job.school.schoolName}</p>
          </div>

          {/* Meta chips */}
          <div className="flex gap-2 flex-wrap mb-5">
            {[
              { icon: <MapPin size={12} />, label: job.school.city },
              { icon: <BookOpen size={12} />, label: getBoardLabel(job.board) },
              { icon: <Users size={12} />, label: `Grade ${job.gradeLevel}` },
              { icon: <Briefcase size={12} />, label: jobTypeLabel },
              ...(job.experience ? [{ icon: <Clock size={12} />, label: job.experience }] : []),
            ].map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-lg font-medium">
                <span className="text-gray-400">{chip.icon}</span>
                {chip.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
              <DollarSign size={12} />
              {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
          </div>

          <div className="h-px bg-black/[0.05] mb-5" />

          {/* Description */}
          <section className="mb-6">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-3">
              About the Role
            </h3>
            <div className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </section>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <section className="mb-6">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-3">
                Requirements
              </h3>
              <ul className="space-y-2">
                {job.requirements.map((req) => (
                  <li key={req.id} className="flex items-start gap-2.5 text-[14px] text-gray-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                    {req.text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Benefits */}
          {job.benefits.length > 0 && (
            <section className="mb-6">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-3">
                Benefits
              </h3>
              <div className="flex gap-2 flex-wrap">
                {job.benefits.map((ben) => (
                  <span key={ben.id} className="text-xs bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg font-medium border border-brand-100">
                    {ben.text}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Meta row */}
          <div
            className="rounded-xl p-4 flex gap-5 flex-wrap text-xs text-gray-500 mb-5"
            style={{ background: "var(--surface-base)" }}
          >
            {job.school.website && (
              <a
                href={job.school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-brand-600 transition-colors font-medium"
              >
                <ExternalLink size={12} />
                {job.school.website.replace(/https?:\/\//, "")}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              Posted {timeAgo(job.postedAt)}
            </span>
            {job._count && (
              <span className="flex items-center gap-1.5">
                <Users size={12} />
                {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* CTA actions */}
          {!isSchoolAdmin && (
            <div className="flex gap-2.5 flex-wrap">
              {job.isApplied ? (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <CheckCircle2 size={15} />
                  Applied
                </div>
              ) : (
                <button
                  onClick={() => setApplyOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-[120ms] shadow-brand hover:-translate-y-px active:translate-y-0"
                >
                  Apply for this position
                  <ArrowRight size={14} />
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={savingJob}
                className={[
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-[120ms] disabled:opacity-50",
                  job.isSaved
                    ? "border-brand-200 text-brand-600 bg-brand-50 hover:border-brand-300"
                    : "border-black/[0.09] text-gray-600 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50",
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
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSuccess={handleApplySuccess}
      />
    </>
  );
}
