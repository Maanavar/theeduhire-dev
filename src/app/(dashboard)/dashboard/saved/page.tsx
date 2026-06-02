"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSalary, timeAgo } from "@/lib/utils";
import { MapPin, BookmarkX, ExternalLink, CheckCircle2 } from "lucide-react";
import JobDetailModal from "@/components/jobs/job-detail-modal";
import { PageHeader } from "@/components/layout/page-shell";
import { EmptyState, ErrorState } from "@/components/system/system-states";
import { CardListSkeleton } from "@/components/system/dashboard-skeletons";
import { trackEvent } from "@/lib/analytics";
import { getApiErrorMessage } from "@/lib/api/client";
import { getSavedJobs, toggleSavedJob } from "@/lib/api/teacher-client";
import type { SavedJobItem } from "@/lib/api/teacher-client";


export default function SavedJobsPage() {
  const [saved, setSaved] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("");

  useEffect(() => {
    getSavedJobs()
      .then((items) => setSaved(items))
      .catch((err) => setError(getApiErrorMessage(err, "Network error. Please check your connection.")))
      .finally(() => setLoading(false));
  }, []);

  const unsave = async (jobId: string) => {
    const snapshot = saved;
    setSaved((prev) => prev.filter((s) => s.job.id !== jobId));
    try {
      await toggleSavedJob(jobId);
      trackEvent("job_saved", { jobId, saved: false, source: "saved_jobs_page" });
    } catch {
      setSaved(snapshot);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <PageHeader title="Saved Jobs" subtitle="Jobs you've bookmarked for later" />
      </div>

      <JobDetailModal
        open={!!selectedJobId}
        jobId={selectedJobId}
        jobTitle={selectedJobTitle}
        onClose={() => {
          setSelectedJobId(null);
          setSelectedJobTitle("");
        }}
      />

      {loading ? (
        <CardListSkeleton cards={4} />
      ) : error ? (
        <ErrorState title="Failed to load saved jobs" message={error} />
      ) : saved.length === 0 ? (
        <EmptyState
          title="No saved jobs"
          message="Save jobs you're interested in while browsing."
          actions={
            <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-600">
              Browse Jobs
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {saved.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-md transition-shadow duration-150">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    onClick={() => {
                      setSelectedJobId(item.job.id);
                      setSelectedJobTitle(item.job.title);
                    }}
                    className="text-[15px] font-semibold hover:text-brand-500 transition-colors truncate block text-left"
                  >
                    {item.job.title}
                  </button>
                  <p className="text-[13px] text-gray-500">{item.job.school.schoolName}</p>
                  <div className="flex gap-3 mt-2 text-[12.5px] text-gray-400">
                    <span className="flex items-center gap-1"><MapPin size={12} />{item.job.school.city}</span>
                    <span>{item.job.subject}</span>
                    <span>{formatSalary(item.job.salaryMin, item.job.salaryMax)}</span>
                    <span>Posted {timeAgo(item.job.postedAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {item.job.isApplied ? (
                    <div className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle2 size={13} /> Applied
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedJobId(item.job.id);
                        setSelectedJobTitle(item.job.title);
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12.5px] font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                    >
                      Apply <ExternalLink size={11} />
                    </button>
                  )}
                  <button
                    onClick={() => unsave(item.job.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12.5px] font-medium border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
                  >
                    <BookmarkX size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
