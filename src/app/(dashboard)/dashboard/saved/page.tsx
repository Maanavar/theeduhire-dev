"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSalary, timeAgo } from "@/lib/utils";
import { MapPin, BookmarkX, CheckCircle2, ArrowRight, Star, BellRing, Eye } from "lucide-react";
import JobDetailModal from "@/components/jobs/job-detail-modal";
import { PageHeader, PageShell, Panel, PanelHeader, StatusBadge } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/system/system-states";
import { NoSavedJobsState, NoApplicationsState, SomethingWentWrongState } from "@/components/system/illustrated-states";
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
  const [activeTab, setActiveTab] = useState<"saved" | "applied">("saved");

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

  const appliedJobs = saved.filter((s) => s.job.isApplied);
  const displayJobs = activeTab === "applied" ? appliedJobs : saved;

  return (
    <PageShell>
      <PageHeader
        title="Saved Jobs"
        subtitle="Jobs you've saved to review and apply later."
        actions={
          <Link href="/dashboard/alerts" className="eh-btn eh-btn-secondary">
            Manage Folders
          </Link>
        }
      />

      <JobDetailModal
        open={!!selectedJobId}
        jobId={selectedJobId}
        jobTitle={selectedJobTitle}
        onClose={() => { setSelectedJobId(null); setSelectedJobTitle(""); }}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="min-w-0 space-y-4">
          {/* Tabs */}
          <Panel>
            <div className="flex items-center gap-1 overflow-x-auto px-4 pt-4 pb-0 scrollbar-none">
              {([
                { key: "saved" as const, label: "Saved", count: saved.length },
                { key: "applied" as const, label: "Applied", count: appliedJobs.length },
              ]).map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={[
                    "flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 text-[13px] font-medium transition-colors",
                    activeTab === key
                      ? "border-[var(--eh-primary-600)] text-[var(--eh-primary-700)]"
                      : "border-transparent text-[var(--eh-text-3)] hover:text-[var(--eh-text)]",
                  ].join(" ")}
                >
                  {label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === key ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]" : "bg-[var(--surface-base)] text-[var(--eh-text-4)]"}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          {loading ? (
            <CardListSkeleton cards={4} />
          ) : error ? (
            <SomethingWentWrongState title="Failed to load saved jobs" message={error} />
          ) : displayJobs.length === 0 ? (
            activeTab === "applied" ? (
              <NoApplicationsState
                actions={
                  <Link href="/dashboard/jobs" className="eh-btn eh-btn-primary">
                    Browse Jobs <ArrowRight size={14} />
                  </Link>
                }
              />
            ) : (
              <NoSavedJobsState
                actions={
                  <Link href="/dashboard/jobs" className="eh-btn eh-btn-primary">
                    Browse Jobs <ArrowRight size={14} />
                  </Link>
                }
              />
            )
          ) : (
            <div className="space-y-3">
              {displayJobs.map((item) => (
                <Panel key={item.id} className="p-5">
                  <div className="flex items-start gap-3">
                    {/* School avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[15px] font-bold text-[var(--eh-primary-700)]">
                      {item.job.school.schoolName.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <button
                            onClick={() => { setSelectedJobId(item.job.id); setSelectedJobTitle(item.job.title); }}
                            className="text-left text-[15px] font-semibold text-[var(--eh-text)] transition-colors hover:text-[var(--eh-primary-700)]"
                          >
                            {item.job.title}
                          </button>
                          <p className="text-[13px] text-[var(--eh-text-3)]">{item.job.school.schoolName}</p>
                        </div>

                        {item.job.isApplied && (
                          <StatusBadge tone="success" dot>Applied</StatusBadge>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--eh-text-4)]">
                        {item.job.school.city && <span className="flex items-center gap-1"><MapPin size={10} />{item.job.school.city}</span>}
                        {item.job.subject && <span>{item.job.subject}</span>}
                        {(item.job.salaryMin || item.job.salaryMax) && (
                          <span className="font-semibold text-[var(--eh-primary-700)]">{formatSalary(item.job.salaryMin, item.job.salaryMax)}</span>
                        )}
                        <span>Posted {timeAgo(item.job.postedAt)}</span>
                      </div>

                      {item.savedAt && (
                        <p className="mt-1 text-[11px] text-[var(--eh-text-4)]">
                          Saved on {new Date(item.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => { setSelectedJobId(item.job.id); setSelectedJobTitle(item.job.title); }}
                          className="eh-btn eh-btn-secondary eh-btn-sm"
                        >
                          <Eye size={13} /> View Job
                        </button>
                        {!item.job.isApplied && (
                          <button
                            onClick={() => { setSelectedJobId(item.job.id); setSelectedJobTitle(item.job.title); }}
                            className="eh-btn eh-btn-primary eh-btn-sm"
                          >
                            Apply Now
                          </button>
                        )}
                        {item.job.isApplied && (
                          <div className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[12px] font-medium text-emerald-700">
                            <CheckCircle2 size={13} /> Applied
                          </div>
                        )}
                        <button
                          onClick={() => unsave(item.job.id)}
                          className="eh-btn eh-btn-sm border border-[var(--eh-border)] text-[var(--eh-text-3)] hover:border-red-200 hover:text-red-500"
                        >
                          <BookmarkX size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}

          {saved.length > 0 && (
            <p className="text-center text-[12px] text-[var(--eh-text-4)]">
              Can&apos;t find a job? Try{" "}
              <Link href="/dashboard/jobs" className="font-semibold text-[var(--eh-primary-600)] hover:underline">
                adjusting your filters
              </Link>
            </p>
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden xl:flex xl:flex-col xl:gap-4">
          {/* Save smarter with Pro */}
          <Panel className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Star size={14} className="text-amber-500" />
              <p className="text-[13px] font-semibold text-[var(--eh-text)]">Save smarter with Pro</p>
            </div>
            <div className="space-y-2 text-[12px] text-[var(--eh-text-3)]">
              {[
                "Get notified when saved jobs are about to close",
                "Priority access to saved jobs",
                "Organize saved jobs into folders",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/subscription"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--eh-primary-600)] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--eh-primary-700)]"
            >
              Upgrade to Pro <ArrowRight size={12} />
            </Link>
          </Panel>

          {/* Job Alerts mini */}
          <Panel className="p-5">
            <PanelHeader
              title="Job Alerts"
              compact
              actions={<Link href="/dashboard/alerts" className="text-[11px] text-[var(--eh-primary-600)] hover:underline">View All</Link>}
            />
            <div className="rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-3 text-center">
              <BellRing size={16} className="mx-auto mb-1.5 text-[var(--eh-primary-600)]" />
              <p className="text-[12px] text-[var(--eh-text-3)]">Set up alerts to get notified of matching new jobs.</p>
              <Link href="/dashboard/alerts" className="mt-2 inline-block text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                Create New Alert →
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
