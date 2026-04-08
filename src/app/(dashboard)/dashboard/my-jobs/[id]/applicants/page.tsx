"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, GraduationCap, Clock, FileText, ShieldAlert, Loader2, Search, ChevronDown } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { BulkActionToolbar } from "@/components/applications/bulk-action-toolbar";
import { ApplicantHoverCard } from "@/components/applications/applicant-hover-card";

interface Applicant {
  id: string;
  coverLetter: string | null;
  status: string;
  appliedAt: string;
  schoolNotes: string | null;
  applicant: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    teacherProfile: {
      qualification: string | null;
      experience: string | null;
      currentSchool: string | null;
      city: string | null;
      subjects: string[] | null;
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

const REJECTION_REASONS = [
  { value: "OVERQUALIFIED", label: "Overqualified" },
  { value: "UNDERQUALIFIED", label: "Underqualified" },
  { value: "POSITION_FILLED", label: "Position Filled" },
  { value: "EXPERIENCE_MISMATCH", label: "Experience Mismatch" },
  { value: "LOCATION_MISMATCH", label: "Location Mismatch" },
  { value: "SALARY_MISMATCH", label: "Salary Mismatch" },
  { value: "OTHER", label: "Other" },
];

export default function ApplicantsPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showRejectionDropdown, setShowRejectionDropdown] = useState<string | null>(null);

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

  const filteredApplicants = applicants.filter((app) => {
    const matchesSearch =
      app.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (
    appId: string,
    newStatus: string,
    prevStatus: string,
    rejectionReason?: string
  ) => {
    setLoadingId(appId);
    setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));

    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason,
        }),
      });
      const data = await res.json();

      if (!data.success) {
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
      setShowRejectionDropdown(null);
    }
  };

  const handleBulkStatusChange = async (status: string, rejectionReason?: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}/applicants/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationIds: ids,
          status,
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update applications");
        return;
      }

      // Refresh applicants
      const appRes = await fetch(`/api/jobs/${jobId}/applicants`);
      const appData = await appRes.json();
      if (appData.success) {
        setApplicants(appData.data);
        setSelectedIds(new Set());
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplicants.length && selectedIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplicants.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
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
            <div key={i} className="card p-6">
              <div className="skeleton h-5 w-1/3 mb-3 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="font-display text-[18px] text-gray-500 italic mb-2">No applications yet</h3>
          <p className="text-[14px] text-gray-400">Applications will appear here once teachers apply.</p>
        </div>
      ) : (
        <>
          {/* Filters and Search */}
          <div className="card p-4 flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2 input-base px-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base px-3"
            >
              <option value="ALL">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Applicants List */}
          <div className="space-y-3">
            {/* Header with Select All */}
            {filteredApplicants.length > 0 && (
              <div className="card p-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredApplicants.length && selectedIds.size > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                </span>
              </div>
            )}

            {filteredApplicants.map((app) => {
              const tp = app.applicant.teacherProfile;
              const isSelected = selectedIds.has(app.id);

              return (
                <div
                  key={app.id}
                  className={`card p-6 transition-all duration-[120ms] ${
                    isSelected ? "bg-brand-50 border-brand-200" : "hover:shadow-md hover:-translate-y-px"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(app.id)}
                      className="w-5 h-5 rounded mt-1"
                    />

                    {/* Applicant Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ApplicantHoverCard
                          applicant={app.applicant}
                          trigger={
                            <h3 className="text-[16px] font-semibold text-gray-900 cursor-pointer hover:text-brand-600">
                              {app.applicant.name}
                            </h3>
                          }
                        />
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[app.status]}`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="flex gap-4 flex-wrap text-[13px] text-gray-500">
                        <a href={`mailto:${app.applicant.email}`} className="flex items-center gap-1 hover:text-brand-600">
                          <Mail size={13} />
                          {app.applicant.email}
                        </a>
                        {app.applicant.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={13} />
                            {app.applicant.phone}
                          </span>
                        )}
                        {tp?.city && <span>📍 {tp.city}</span>}
                      </div>
                    </div>

                    {/* Applied time */}
                    <span className="text-[12px] text-gray-400 flex items-center gap-1 shrink-0">
                      <Clock size={12} />
                      {timeAgo(app.appliedAt)}
                    </span>
                  </div>

                  {/* Profile details */}
                  <div className="flex gap-4 flex-wrap text-[13px] text-gray-600 mb-3">
                    {tp?.qualification && (
                      <span className="flex items-center gap-1">
                        <GraduationCap size={13} />
                        {tp.qualification}
                      </span>
                    )}
                    {tp?.experience && <span>Experience: {tp.experience}</span>}
                    {tp?.currentSchool && <span>Current: {tp.currentSchool}</span>}
                  </div>

                  {/* Cover letter */}
                  {app.coverLetter && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <h4 className="text-[12px] font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
                        <FileText size={12} /> Cover letter
                      </h4>
                      <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-4">{app.coverLetter}</p>
                    </div>
                  )}

                  {/* Status controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-gray-400">Update status:</span>
                    {loadingId === app.id ? (
                      <Loader2 size={14} className="animate-spin text-gray-400" />
                    ) : (
                      <div className="flex gap-1.5 flex-wrap relative">
                        {STATUS_OPTIONS.filter((s) => s !== app.status).map((s) => (
                          s === "REJECTED" ? (
                            <div key={s} className="relative">
                              <button
                                onClick={() => setShowRejectionDropdown(showRejectionDropdown === app.id ? null : app.id)}
                                disabled={loadingId !== null}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors hover:opacity-80 disabled:opacity-40 flex items-center gap-1 ${
                                  statusColors[s]
                                } border-transparent`}
                              >
                                Reject
                                <ChevronDown size={10} />
                              </button>

                              {/* Rejection dropdown */}
                              {showRejectionDropdown === app.id && (
                                <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-max">
                                  {REJECTION_REASONS.map((reason) => (
                                    <button
                                      key={reason.value}
                                      onClick={() => updateStatus(app.id, "REJECTED", app.status, reason.value)}
                                      disabled={loadingId !== null}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 transition-colors"
                                    >
                                      {reason.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              key={s}
                              onClick={() => updateStatus(app.id, s, app.status)}
                              disabled={loadingId !== null}
                              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors hover:opacity-80 disabled:opacity-40 ${
                                statusColors[s]
                              } border-transparent`}
                            >
                              {s === "SHORTLISTED" ? "Shortlist" : s === "REVIEWED" ? "Mark Reviewed" : s === "HIRED" ? "Mark Hired" : s}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredApplicants.length === 0 && (
            <div className="card p-12 text-center">
              <h3 className="font-display text-[18px] text-gray-500 italic">No results found</h3>
            </div>
          )}
        </>
      )}

      {/* Bulk action toolbar */}
      <BulkActionToolbar
        selectedIds={Array.from(selectedIds)}
        onStatusChange={handleBulkStatusChange}
        onClear={() => setSelectedIds(new Set())}
        loading={loadingId !== null}
      />
    </div>
  );
}
