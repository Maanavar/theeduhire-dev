"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, GraduationCap, Clock, FileText, ShieldAlert, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface Applicant {
  id: string;
  coverLetter: string | null;
  status: string;
  appliedAt: string;
  schoolNotes: string | null;
  applicant: {
    name: string;
    email: string;
    phone: string | null;
    teacherProfile: {
      qualification: string | null;
      experience: string | null;
      currentSchool: string | null;
      city: string | null;
    } | null;
  };
}

const STATUS_OPTIONS = ["PENDING", "REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"];
const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  REVIEWED: "bg-blue-50 text-blue-700",
  SHORTLISTED: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-600",
  HIRED: "bg-green-50 text-green-700",
};

export default function ApplicantsPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/jobs/${jobId}/applicants`),
      fetch(`/api/jobs/${jobId}`),
    ]).then(async ([appRes, jobRes]) => {
      if (appRes.status === 403 || appRes.status === 401) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const appData = await appRes.json();
      const jobData = await jobRes.json();

      if (!appData.success) {
        setFetchError(appData.error || "Failed to load applicants");
      } else {
        setApplicants(appData.data);
      }

      if (jobData.success) setJobTitle(jobData.data.title);
    }).catch(() => {
      setFetchError("Network error. Please try again.");
    }).finally(() => setLoading(false));
  }, [jobId]);

  const updateStatus = async (appId: string, newStatus: string, prevStatus: string) => {
    // Optimistic update
    setLoadingId(appId);
    setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));

    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!data.success) {
        // Revert on failure
        setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status: prevStatus } : a)));
        toast.error(data.error || "Failed to update status");
      } else {
        toast.success(`Status updated to ${newStatus.toLowerCase()}`);
      }
    } catch {
      setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status: prevStatus } : a)));
      toast.error("Network error — status not saved");
    } finally {
      setLoadingId(null);
    }
  };

  // Access denied state
  if (accessDenied) {
    return (
      <div className="text-center py-16">
        <ShieldAlert size={40} className="mx-auto text-red-300 mb-4" />
        <h2 className="font-display text-xl font-bold text-gray-700 mb-2">Access denied</h2>
        <p className="text-[14px] text-gray-500 mb-5">You can only view applicants for your own job listings.</p>
        <Link
          href="/dashboard/my-jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600"
        >
          <ArrowLeft size={15} /> Back to My Listings
        </Link>
      </div>
    );
  }

  // Fetch error state
  if (fetchError && !loading) {
    return (
      <div className="text-center py-16">
        <p className="text-[14px] text-red-500 mb-4">{fetchError}</p>
        <Link href="/dashboard/my-jobs" className="text-[14px] text-brand-500 hover:underline">
          Back to My Listings
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/my-jobs"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-gray-500 hover:text-brand-500 transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Back to my listings
      </Link>

      <h1 className="font-display text-[26px] font-bold mb-1">Applicants</h1>
      <p className="text-[14px] text-gray-500 mb-6">
        {jobTitle && <>For <span className="font-medium text-gray-700">{jobTitle}</span></>}
        {!loading && <> · {applicants.length} application{applicants.length !== 1 ? "s" : ""}</>}
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
              <div className="h-5 w-1/3 bg-gray-100 rounded mb-3" />
              <div className="h-4 w-1/2 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
          <h3 className="font-display text-xl text-gray-500 italic mb-2">No applications yet</h3>
          <p className="text-[14px] text-gray-400">Applications will appear here once teachers apply.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((app) => {
            const tp = app.applicant.teacherProfile;
            return (
              <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[16px] font-semibold">{app.applicant.name}</h3>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex gap-4 flex-wrap text-[13px] text-gray-500">
                      <span className="flex items-center gap-1"><Mail size={13} />{app.applicant.email}</span>
                      {app.applicant.phone && <span className="flex items-center gap-1"><Phone size={13} />{app.applicant.phone}</span>}
                      {tp?.city && <span>📍 {tp.city}</span>}
                    </div>
                  </div>
                  <span className="text-[12px] text-gray-400 flex items-center gap-1 shrink-0">
                    <Clock size={12} /> {timeAgo(app.appliedAt)}
                  </span>
                </div>

                <div className="flex gap-4 flex-wrap text-[13px] text-gray-600 mb-3">
                  {tp?.qualification && (
                    <span className="flex items-center gap-1"><GraduationCap size={13} />{tp.qualification}</span>
                  )}
                  {tp?.experience && <span>Experience: {tp.experience}</span>}
                  {tp?.currentSchool && <span>Current: {tp.currentSchool}</span>}
                </div>

                {app.coverLetter && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h4 className="text-[12px] font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
                      <FileText size={12} /> Cover letter
                    </h4>
                    <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-4">{app.coverLetter}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-400">Update status:</span>
                  {loadingId === app.id ? (
                    <Loader2 size={14} className="animate-spin text-gray-400" />
                  ) : (
                    <div className="flex gap-1.5 flex-wrap">
                      {STATUS_OPTIONS.filter((s) => s !== app.status).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(app.id, s, app.status)}
                          disabled={loadingId !== null}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors hover:opacity-80 disabled:opacity-40 ${statusColors[s]} border-transparent`}
                        >
                          {s === "SHORTLISTED" ? "Shortlist" : s === "REVIEWED" ? "Mark Reviewed" : s === "HIRED" ? "Mark Hired" : s === "REJECTED" ? "Reject" : s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
