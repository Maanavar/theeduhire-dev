"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MapPin, BookOpen, Users, Briefcase, Clock, DollarSign,
  ArrowRight, Bookmark, BookmarkCheck, BadgeCheck, CheckCircle2,
} from "lucide-react";
import { formatSalary, timeAgo, getBoardLabel } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import ApplyForm from "@/components/forms/apply-form";
import type { JobWithDetails } from "@/types";

interface Props {
  jobId: string | null;
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

  useEffect(() => {
    return fetchJob();
  }, [fetchJob]);

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
        setJob((prev) => prev ? { ...prev, isSaved: saved } : prev);
        toast.success(saved ? "Job saved!" : "Job removed from saved");
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
    setJob((prev) => prev ? { ...prev, isApplied: true } : prev);
  };

  // Empty state
  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-20">
        <Briefcase size={32} className="text-gray-300" />
        <h3 className="font-display text-xl text-gray-500 italic">Select a job to view details</h3>
        <p className="text-[13px]">Click on any position from the list</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-7 space-y-5 animate-pulse">
        <div className="h-7 w-3/4 bg-gray-100 rounded" />
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 w-20 bg-gray-100 rounded-full" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-gray-100 rounded" />
          <div className="h-3.5 w-full bg-gray-100 rounded" />
          <div className="h-3.5 w-2/3 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!job) return null;

  const jobTypeLabel =
    job.jobType === "FULL_TIME" ? "Full-Time"
    : job.jobType === "PART_TIME" ? "Part-Time"
    : job.jobType === "CONTRACT" ? "Contract"
    : "Visiting Faculty";

  const isSchoolAdmin = session?.user?.role === "SCHOOL_ADMIN";

  return (
    <>
      <div className="overflow-y-auto max-h-[calc(100vh-220px)] lg:max-h-[calc(100vh-200px)] scrollbar-thin">
        <div className="p-6 lg:p-7">
          {/* Header */}
          <div className="mb-5">
            <h1 className="font-display text-[24px] lg:text-[26px] font-bold text-gray-900 leading-tight">
              {job.title}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-[15px] text-gray-500">{job.school.schoolName}</p>
              {job.school.verified && <BadgeCheck size={15} className="text-brand-500" />}
            </div>
          </div>

          {/* Meta tags */}
          <div className="flex gap-3 flex-wrap mb-6">
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
              <MapPin size={14} />{job.school.city}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
              <BookOpen size={14} />{getBoardLabel(job.board)}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
              <Users size={14} />Grade {job.gradeLevel}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
              <Briefcase size={14} />{jobTypeLabel}
            </span>
            {job.experience && (
              <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
                <Clock size={14} />{job.experience}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-500">
              <DollarSign size={14} />{formatSalary(job.salaryMin, job.salaryMax)}
            </span>
          </div>

          {/* Description */}
          <section className="mb-6">
            <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-2">About the role</h3>
            <div className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</div>
          </section>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <section className="mb-6">
              <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-2">Requirements</h3>
              <ul className="space-y-1.5">
                {job.requirements.map((req) => (
                  <li key={req.id} className="text-[13.5px] text-gray-600 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-[5px] before:h-[5px] before:bg-brand-500 before:rounded-full">
                    {req.text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Benefits */}
          {job.benefits.length > 0 && (
            <section className="mb-6">
              <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-2">Benefits</h3>
              <div className="flex gap-1.5 flex-wrap">
                {job.benefits.map((ben) => (
                  <span key={ben.id} className="text-[11.5px] bg-brand-50 text-brand-600 px-2.5 py-1 rounded-lg font-medium">
                    {ben.text}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Contact info */}
          <div className="bg-gray-50 rounded-xl p-4 flex gap-5 flex-wrap mb-6 text-[13px] text-gray-500">
            {job.school.website && (
              <a href={job.school.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors">
                {job.school.website.replace(/https?:\/\//, "")}
              </a>
            )}
            <span className="flex items-center gap-1.5"><Clock size={13} />Posted {timeAgo(job.postedAt)}</span>
            {job._count && (
              <span className="flex items-center gap-1.5">
                <Users size={13} />{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Actions — hide for school admins (they can't apply to their own jobs) */}
          {!isSchoolAdmin && (
            <div className="flex gap-3 flex-wrap">
              {job.isApplied ? (
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold bg-green-50 text-green-700 border border-green-100">
                  <CheckCircle2 size={16} /> Applied
                </div>
              ) : (
                <button
                  onClick={() => setApplyOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                >
                  Apply for this position
                  <ArrowRight size={16} />
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={savingJob}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-medium border transition-colors disabled:opacity-50 ${
                  job.isSaved
                    ? "border-brand-200 text-brand-600 bg-brand-50 hover:border-brand-300"
                    : "border-gray-200 text-gray-600 hover:border-brand-500 hover:text-brand-500"
                }`}
              >
                {job.isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {job.isSaved ? "Saved" : "Save job"}
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
