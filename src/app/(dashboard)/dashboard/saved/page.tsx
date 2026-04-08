"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSalary, timeAgo } from "@/lib/utils";
import { MapPin, Bookmark, BookmarkX, ExternalLink, CheckCircle2 } from "lucide-react";
import JobDetailModal from "@/components/jobs/job-detail-modal";

interface SavedItem {
  id: string;
  savedAt: string;
  job: {
    id: string;
    title: string;
    subject: string;
    board: string;
    gradeLevel: string;
    salaryMin: number | null;
    salaryMax: number | null;
    postedAt: string;
    status: string;
    school: { schoolName: string; city: string; verified: boolean };
    isApplied?: boolean;
  };
}

export default function SavedJobsPage() {
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("");

  useEffect(() => {
    fetch("/api/saved-jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          // Fetch application status for each job
          Promise.all(
            data.data.map(async (item: SavedItem) => {
              try {
                const res = await fetch(`/api/jobs/${item.job.id}`);
                const jobData = await res.json();
                if (jobData.success) {
                  return { ...item, job: { ...item.job, isApplied: jobData.data.isApplied } };
                }
              } catch {}
              return item;
            })
          ).then(setSaved);
        } else {
          setError(data.error || "Failed to load saved jobs");
        }
      })
      .catch(() => setError("Network error. Please check your connection."))
      .finally(() => setLoading(false));
  }, []);

  const unsave = async (jobId: string) => {
    const res = await fetch("/api/saved-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    const data = await res.json();
    if (data.success && !data.data.saved) {
      setSaved((prev) => prev.filter((s) => s.job.id !== jobId));
    }
  };

  return (
    <div>
      <h1 className="font-display text-[26px] font-bold mb-1">Saved Jobs</h1>
      <p className="text-[14px] text-gray-500 mb-6">Jobs you&apos;ve bookmarked for later</p>

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
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-2/5 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-1/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
          <Bookmark size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-display text-xl text-gray-500 italic mb-2">No saved jobs</h3>
          <p className="text-[14px] text-gray-400 mb-5">Save jobs you&apos;re interested in while browsing</p>
          <Link href="/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
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
