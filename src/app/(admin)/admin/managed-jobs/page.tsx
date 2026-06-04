"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Calendar, Check, ChevronRight, Loader2, Pencil, Plus, Search, Trash2, Users, X,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { cn, timeAgo } from "@/lib/utils";
import AdminActionModal from "@/components/admin/admin-action-modal";
import { ScheduleInterviewModal } from "@/components/interviews/schedule-interview-modal";

const PAGE_SIZE = 25;

const BOARD_OPTIONS = [
  { value: "CBSE", label: "CBSE" }, { value: "ICSE", label: "ICSE" },
  { value: "STATE_BOARD", label: "State Board" }, { value: "IB", label: "IB" },
  { value: "CAMBRIDGE", label: "Cambridge" }, { value: "OTHER", label: "Other" },
];
const JOB_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full-time" }, { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" }, { value: "VISITING_FACULTY", label: "Visiting faculty" },
];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  REVIEWED: "bg-blue-50 text-blue-700",
  SHORTLISTED: "bg-amber-50 text-amber-700",
  INTERVIEW_SCHEDULED: "bg-purple-50 text-purple-700",
  INTERVIEW_COMPLETED: "bg-indigo-50 text-indigo-700",
  HIRED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};
const JOB_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
  CLOSED: "bg-red-50 text-red-600",
  EXPIRED: "bg-amber-50 text-amber-600",
};

type ManagedJob = {
  id: string; title: string; subject: string; board: string; gradeLevel: string;
  jobType: string; status: string; salaryMin?: number | null; salaryMax?: number | null;
  postedAt: string;
  school: { id: string; schoolName: string; city: string; offlineContactName?: string | null; offlineContactPhone?: string | null };
  _count: { applications: number };
};

type Application = {
  id: string; status: string; createdAt: string;
  applicant: {
    id: string; name: string; email: string;
    teacherProfile?: {
      city?: string | null; subjects: string[]; qualification?: string | null;
      verificationStatus: string;
    } | null;
  };
};

type JobDetail = ManagedJob & { description: string; applications: Application[] };

type OfflineSchool = { id: string; schoolName: string; city: string };

type JobForm = {
  offlineSchoolId: string; title: string; subject: string; board: string; gradeLevel: string;
  jobType: string; description: string; salaryMin: string; salaryMax: string;
  experience: string; isUrgent: boolean; applicationDeadline: string; status: string;
};

const emptyJobForm = (): JobForm => ({
  offlineSchoolId: "", title: "", subject: "", board: "CBSE", gradeLevel: "",
  jobType: "FULL_TIME", description: "", salaryMin: "", salaryMax: "",
  experience: "", isUrgent: false, applicationDeadline: "", status: "ACTIVE",
});

function fromJob(job: JobDetail): JobForm {
  return {
    offlineSchoolId: job.school.id,
    title: job.title, subject: job.subject, board: job.board, gradeLevel: job.gradeLevel,
    jobType: job.jobType, description: job.description,
    salaryMin: job.salaryMin != null ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax != null ? String(job.salaryMax) : "",
    experience: "", isUrgent: false, applicationDeadline: "", status: job.status,
  };
}

export default function ManagedJobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const schoolIdFilter = searchParams.get("school") || "";
  const schoolNameFilter = searchParams.get("schoolName") || "";

  const [jobs, setJobs] = useState<ManagedJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Detail view
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JobDetail | null>(null);
  const [form, setForm] = useState<JobForm>(emptyJobForm());
  const [saving, setSaving] = useState(false);
  const [offlineSchools, setOfflineSchools] = useState<OfflineSchool[]>([]);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ManagedJob | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Applicant actions
  const [actionTarget, setActionTarget] = useState<{ app: Application; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [scheduleAppId, setScheduleAppId] = useState<string | null>(null);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (schoolIdFilter) params.set("schoolId", schoolIdFilter);
    fetch(`/api/admin/managed-jobs?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) { setJobs(res.data); setTotal(res.pagination.total); }
        else setError(res.error || "Failed to load");
      })
      .catch(() => setError("Failed to load managed jobs"))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, schoolIdFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const loadDetail = (job: ManagedJob) => {
    setDetailLoading(true);
    fetch(`/api/admin/managed-jobs?jobId=${job.id}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setSelectedJob(res.data); })
      .catch(() => toast.error("Failed to load job details"))
      .finally(() => setDetailLoading(false));
  };

  const loadOfflineSchools = () => {
    fetch("/api/admin/offline-schools?page=1")
      .then((r) => r.json())
      .then((res) => { if (res.success) setOfflineSchools(res.data.map((s: any) => ({ id: s.id, schoolName: s.schoolName, city: s.city }))); });
  };

  const openCreate = () => { setEditTarget(null); setForm(emptyJobForm()); loadOfflineSchools(); setDrawerOpen(true); };
  const openEdit = (job: JobDetail) => { setEditTarget(job); setForm(fromJob(job)); loadOfflineSchools(); setDrawerOpen(true); };
  const closeDrawer = () => { if (!saving) { setDrawerOpen(false); setEditTarget(null); } };

  const handleSave = async () => {
    if (!form.title.trim() || !form.subject.trim() || !form.gradeLevel.trim() || !form.description.trim()) {
      toast.error("Title, subject, grade level and description are required");
      return;
    }
    if (!editTarget && !form.offlineSchoolId) {
      toast.error("Select an offline school");
      return;
    }
    setSaving(true);
    try {
      const payload = editTarget
        ? { jobId: editTarget.id, ...form }
        : form;
      const method = editTarget ? "PUT" : "POST";
      const url = editTarget ? "/api/admin/managed-jobs" : "/api/admin/managed-jobs";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json());
      if (!res.success) throw new Error(res.error || "Save failed");
      toast.success(editTarget ? "Job updated" : "Managed job created");
      setDrawerOpen(false);
      if (selectedJob && editTarget) loadDetail(selectedJob);
      fetchJobs();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/managed-jobs?jobId=${deleteTarget.id}`, { method: "DELETE" }).then((r) => r.json());
      if (!res.success) throw new Error(res.error || "Delete failed");
      toast.success("Job deleted");
      setDeleteTarget(null);
      if (selectedJob?.id === deleteTarget.id) setSelectedJob(null);
      fetchJobs();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const patchApplicationStatus = async (
    applicationId: string,
    status: string,
    opts?: { rejectionReason?: string; schoolNotes?: string; note?: string }
  ) => {
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...opts }),
    }).then((r) => r.json());
    if (!res.success) throw new Error(res.error || "Update failed");
    setSelectedJob((prev) =>
      prev ? { ...prev, applications: prev.applications.map((a) => a.id === applicationId ? { ...a, status } : a) } : prev
    );
  };

  const handleApplicantAction = async ({ reason, notes }: { reason?: string; notes?: string }) => {
    if (!actionTarget) return;
    const { app, action } = actionTarget;
    setActionLoading(true);
    try {
      if (action === "SHORTLISTED") {
        await patchApplicationStatus(app.id, "SHORTLISTED", { note: notes });
        toast.success("Applicant shortlisted");
      } else if (action === "REVIEWED") {
        await patchApplicationStatus(app.id, "REVIEWED", { note: notes });
        toast.success("Marked as reviewed");
      } else if (action === "HIRED") {
        await patchApplicationStatus(app.id, "HIRED", { note: notes });
        toast.success("Applicant marked as hired");
      } else if (action === "INTERVIEW_COMPLETED") {
        await patchApplicationStatus(app.id, "INTERVIEW_COMPLETED", { note: notes });
        toast.success("Interview marked as completed");
      } else if (action === "REJECTED") {
        await patchApplicationStatus(app.id, "REJECTED", {
          rejectionReason: reason as any,
          note: notes,
        });
        toast.success("Applicant rejected");
      }
      setActionTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const setField = (key: keyof JobForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (detailLoading) {
    return <div className="p-8"><LoadingState title="Loading job details" message="Fetching applicants..." /></div>;
  }

  if (selectedJob) {
    return (
      <div>
        <button onClick={() => setSelectedJob(null)} className="mb-5 flex items-center gap-2 text-[13px] text-[var(--eh-text-3)] hover:text-[var(--eh-text)]">
          <ArrowLeft size={14} /> Back to managed jobs
        </button>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">{selectedJob.title}</h1>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", JOB_STATUS_COLORS[selectedJob.status] || "bg-gray-100 text-gray-600")}>
                {selectedJob.status}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">
              {selectedJob.school.schoolName} · {selectedJob.school.city} · {selectedJob.subject} · {selectedJob.gradeLevel}
            </p>
            {selectedJob.school.offlineContactName || selectedJob.school.offlineContactPhone ? (
              <p className="mt-1 text-[12px] text-[var(--eh-text-4)]">
                Contact: {[selectedJob.school.offlineContactName, selectedJob.school.offlineContactPhone].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2 mt-1 shrink-0">
            <button
              onClick={() => openEdit(selectedJob)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-3 py-2 text-[13px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"
            >
              <Pencil size={13} /> Edit job
            </button>
            <button
              onClick={() => setDeleteTarget(selectedJob)}
              className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-100"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>

        {/* Job description */}
        <div className="mb-6 rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)] mb-2">Job description</p>
          <p className="text-[13.5px] text-[var(--eh-text-2)] leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[var(--eh-text-3)]">
            <span>Type: {selectedJob.jobType.replace(/_/g, " ")}</span>
            {selectedJob.salaryMin && <span>Salary: ₹{selectedJob.salaryMin.toLocaleString()}–{selectedJob.salaryMax?.toLocaleString() ?? "+"}/mo</span>}
          </div>
        </div>

        {/* Applicants */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--eh-text)] flex items-center gap-2">
              <Users size={16} /> Applicants ({selectedJob.applications.length})
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)]">
            {selectedJob.applications.length === 0 ? (
              <div className="p-4"><EmptyState title="No applicants yet" message="Teachers who apply to this job will appear here." /></div>
            ) : (
              <div className="divide-y divide-[var(--eh-border)]">
                {selectedJob.applications.map((app) => {
                  const isInterviewStage = app.status === "INTERVIEW_SCHEDULED" || app.status === "INTERVIEW_COMPLETED";
                  const isTerminal = app.status === "HIRED" || app.status === "REJECTED";
                  return (
                    <div key={app.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[13.5px] text-[var(--eh-text)]">{app.applicant.name}</p>
                            {app.applicant.teacherProfile?.verificationStatus === "VERIFIED" && (
                              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Verified</span>
                            )}
                            <span className={cn("rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold", STATUS_COLORS[app.status] || "bg-gray-100 text-gray-600")}>
                              {app.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-[12px] text-[var(--eh-text-3)] mt-0.5">
                            {app.applicant.email} · {app.applicant.teacherProfile?.city || "City N/A"} · {(app.applicant.teacherProfile?.subjects ?? []).slice(0, 3).join(", ")}
                            {app.applicant.teacherProfile?.qualification ? ` · ${app.applicant.teacherProfile.qualification}` : ""}
                          </p>
                          <p className="text-[11.5px] text-[var(--eh-text-4)] mt-0.5">Applied {timeAgo(app.createdAt)}</p>
                        </div>
                      </div>

                      {!isTerminal && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {app.status === "PENDING" && (
                            <button
                              onClick={() => setActionTarget({ app, action: "REVIEWED" })}
                              className="flex items-center gap-1.5 rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-1.5 text-[12px] font-medium text-[var(--eh-text-2)] hover:bg-white"
                            >
                              <Check size={12} /> Mark reviewed
                            </button>
                          )}
                          {(app.status === "PENDING" || app.status === "REVIEWED") && (
                            <button
                              onClick={() => setActionTarget({ app, action: "SHORTLISTED" })}
                              className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Shortlist
                            </button>
                          )}
                          {(app.status === "SHORTLISTED" || app.status === "REVIEWED") && (
                            <button
                              onClick={() => setScheduleAppId(app.id)}
                              className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-[12px] font-semibold text-purple-700 hover:bg-purple-100"
                            >
                              <Calendar size={12} /> Schedule interview
                            </button>
                          )}
                          {isInterviewStage && app.status === "INTERVIEW_SCHEDULED" && (
                            <button
                              onClick={() => setActionTarget({ app, action: "INTERVIEW_COMPLETED" })}
                              className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-[12px] font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                              <Check size={12} /> Mark interview done
                            </button>
                          )}
                          {(app.status === "INTERVIEW_COMPLETED" || isInterviewStage) && (
                            <button
                              onClick={() => setActionTarget({ app, action: "HIRED" })}
                              className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-[12px] font-semibold text-green-700 hover:bg-green-100"
                            >
                              Mark hired
                            </button>
                          )}
                          <button
                            onClick={() => setActionTarget({ app, action: "REJECTED" })}
                            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Applicant action modal */}
        {actionTarget && (
          <AdminActionModal
            open={true}
            title={
              actionTarget.action === "REJECTED" ? `Reject ${actionTarget.app.applicant.name}` :
              actionTarget.action === "SHORTLISTED" ? `Shortlist ${actionTarget.app.applicant.name}` :
              actionTarget.action === "HIRED" ? `Hire ${actionTarget.app.applicant.name}` :
              actionTarget.action === "REVIEWED" ? `Mark ${actionTarget.app.applicant.name} as reviewed` :
              `Mark interview complete for ${actionTarget.app.applicant.name}`
            }
            variant={
              actionTarget.action === "REJECTED"
                ? {
                    kind: "select-notes",
                    reasons: [
                      { value: "UNDERQUALIFIED", label: "Underqualified" },
                      { value: "OVERQUALIFIED", label: "Overqualified" },
                      { value: "EXPERIENCE_MISMATCH", label: "Experience mismatch" },
                      { value: "POSITION_FILLED", label: "Position already filled" },
                      { value: "LOCATION_MISMATCH", label: "Location mismatch" },
                      { value: "SALARY_MISMATCH", label: "Salary mismatch" },
                      { value: "OTHER", label: "Other" },
                    ],
                    notesLabel: "Internal notes",
                    confirmLabel: "Reject applicant",
                    danger: true,
                  }
                : {
                    kind: "notes",
                    label: "Internal notes (optional)",
                    confirmLabel:
                      actionTarget.action === "SHORTLISTED" ? "Shortlist" :
                      actionTarget.action === "HIRED" ? "Confirm hire" :
                      actionTarget.action === "INTERVIEW_COMPLETED" ? "Mark done" : "Confirm",
                    danger: actionTarget.action === "HIRED",
                  }
            }
            loading={actionLoading}
            onConfirm={handleApplicantAction}
            onClose={() => { if (!actionLoading) setActionTarget(null); }}
          />
        )}

        {/* Schedule interview modal */}
        {scheduleAppId && (
          <ScheduleInterviewModal
            open={true}
            onOpenChange={(v) => { if (!v) setScheduleAppId(null); }}
            applicationId={scheduleAppId}
            onSuccess={() => {
              setSelectedJob((prev) =>
                prev ? { ...prev, applications: prev.applications.map((a) => a.id === scheduleAppId ? { ...a, status: "INTERVIEW_SCHEDULED" } : a) } : prev
              );
              setScheduleAppId(null);
              toast.success("Interview scheduled");
            }}
          />
        )}

        {/* Edit drawer shown on top of detail */}
        {drawerOpen && <JobFormDrawer form={form} setField={setField} saving={saving} editTarget={!!editTarget} offlineSchools={offlineSchools} onClose={closeDrawer} onSave={handleSave} setForm={setForm} />}

        {deleteTarget && (
          <AdminActionModal
            open={true}
            title={`Delete "${deleteTarget.title}"?`}
            description="This will permanently delete the job and all its applications."
            variant={{ kind: "confirm", message: `Delete "${deleteTarget.title}"? This cannot be undone.`, confirmLabel: "Delete job", danger: true }}
            loading={deleteLoading}
            onConfirm={handleDelete}
            onClose={() => { if (!deleteLoading) setDeleteTarget(null); }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {schoolIdFilter && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--eh-border)] bg-purple-50 px-4 py-3">
          <Building2 size={14} className="shrink-0 text-purple-600" />
          <p className="text-[13px] font-medium text-purple-800">
            Showing jobs for: <span className="font-semibold">{schoolNameFilter || "selected school"}</span>
          </p>
          <button
            onClick={() => router.push("/admin/managed-jobs")}
            className="ml-auto text-[12px] font-medium text-purple-600 hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">Managed jobs</h1>
          <p className="mt-0.5 text-[14px] text-[var(--eh-text-3)]">
            Jobs posted and managed by EduHire ops on behalf of offline schools.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-600 mt-2"
        >
          <Plus size={14} /> Post managed job
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
          <input
            className="w-full rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] py-2.5 pl-9 pr-3 text-[13.5px] focus:border-brand-500 focus:outline-none"
            placeholder="Search job title, subject, or school..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-3 py-2.5 text-[13.5px] focus:border-brand-500 focus:outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="DRAFT">Draft</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)]">
        {loading ? (
          <div className="p-4"><LoadingState title="Loading managed jobs" message="Fetching records." /></div>
        ) : error ? (
          <div className="p-4"><ErrorState title="Couldn't load" message={error} actions={<button onClick={fetchJobs} className="eh-btn eh-btn-secondary eh-btn-sm">Retry</button>} /></div>
        ) : jobs.length === 0 ? (
          <div className="p-4"><EmptyState title="No managed jobs" message={search || statusFilter ? "Try adjusting filters." : "Post a managed job to get started."} /></div>
        ) : (
          <div className="divide-y divide-[var(--eh-border)]">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => loadDetail(job)}
                      className="font-semibold text-[14px] text-[var(--eh-text)] hover:underline text-left"
                    >
                      {job.title}
                    </button>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", JOB_STATUS_COLORS[job.status] || "bg-gray-100 text-gray-600")}>
                      {job.status}
                    </span>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10.5px] font-semibold text-purple-700">Managed</span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-[var(--eh-text-3)]">
                    {job.school.schoolName} · {job.school.city} · {job.subject} · {job.gradeLevel} · {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--eh-text-4)]">Posted {timeAgo(job.postedAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => loadDetail(job)}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-3 py-1.5 text-[12px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"
                  >
                    <Users size={12} /> {job._count.applications} <ChevronRight size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(job)}
                    className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-500 hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-[var(--eh-text-3)]">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((v) => v - 1)} className="rounded-lg border border-[var(--eh-border)] px-3 py-1.5 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] disabled:opacity-40">Prev</button>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage((v) => v + 1)} className="rounded-lg border border-[var(--eh-border)] px-3 py-1.5 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {drawerOpen && <JobFormDrawer form={form} setField={setField} saving={saving} editTarget={!!editTarget} offlineSchools={offlineSchools} onClose={closeDrawer} onSave={handleSave} setForm={setForm} />}

      {deleteTarget && (
        <AdminActionModal
          open={true}
          title={`Delete "${deleteTarget.title}"?`}
          description="This will permanently delete the job and all its applications."
          variant={{ kind: "confirm", message: `Delete "${deleteTarget.title}"? This cannot be undone.`, confirmLabel: "Delete job", danger: true }}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => { if (!deleteLoading) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

function JobFormDrawer({ form, setField, saving, editTarget, offlineSchools, onClose, onSave, setForm }: {
  form: JobForm;
  setField: (key: keyof JobForm) => (e: React.ChangeEvent<any>) => void;
  saving: boolean;
  editTarget: boolean;
  offlineSchools: OfflineSchool[];
  onClose: () => void;
  onSave: () => void;
  setForm: React.Dispatch<React.SetStateAction<JobForm>>;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end animate-fade-in"
      style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-gray-900">{editTarget ? "Edit managed job" : "Post managed job"}</h2>
            <p className="text-[12.5px] text-gray-500 mt-0.5">Job posted by EduHire ops on school&apos;s behalf</p>
          </div>
          <button onClick={onClose} disabled={saving} className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 disabled:opacity-40">
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {!editTarget && (
            <F label="Offline school" required>
              <select className={iCls} value={form.offlineSchoolId} onChange={setField("offlineSchoolId")}>
                <option value="">Select offline school...</option>
                {offlineSchools.map((s) => <option key={s.id} value={s.id}>{s.schoolName} ({s.city})</option>)}
              </select>
            </F>
          )}
          <F label="Job title" required>
            <input className={iCls} value={form.title} onChange={setField("title")} placeholder="e.g. Maths Teacher – Secondary" />
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Subject" required>
              <input className={iCls} value={form.subject} onChange={setField("subject")} placeholder="e.g. Mathematics" />
            </F>
            <F label="Grade level" required>
              <input className={iCls} value={form.gradeLevel} onChange={setField("gradeLevel")} placeholder="e.g. 9–12" />
            </F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Board">
              <select className={iCls} value={form.board} onChange={setField("board")}>
                {BOARD_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </F>
            <F label="Job type">
              <select className={iCls} value={form.jobType} onChange={setField("jobType")}>
                {JOB_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Salary min (₹/mo)">
              <input className={iCls} type="number" value={form.salaryMin} onChange={setField("salaryMin")} placeholder="e.g. 25000" />
            </F>
            <F label="Salary max (₹/mo)">
              <input className={iCls} type="number" value={form.salaryMax} onChange={setField("salaryMax")} placeholder="e.g. 40000" />
            </F>
          </div>
          <F label="Experience required">
            <input className={iCls} value={form.experience} onChange={setField("experience")} placeholder="e.g. 2–5 years" />
          </F>
          <F label="Application deadline">
            <input className={iCls} type="date" value={form.applicationDeadline} onChange={setField("applicationDeadline")} />
          </F>
          {editTarget && (
            <F label="Job status">
              <select className={iCls} value={form.status} onChange={setField("status")}>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="DRAFT">Draft</option>
              </select>
            </F>
          )}
          <F label="Urgent hiring">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isUrgent}
                onChange={(e) => setForm((f) => ({ ...f, isUrgent: e.target.checked }))}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-400"
              />
              <span className="text-[13px] text-gray-700">Mark as urgent</span>
            </label>
          </F>
          <F label="Job description" required>
            <textarea
              className={cn(iCls, "resize-none")}
              rows={6}
              value={form.description}
              onChange={setField("description")}
              placeholder="Describe responsibilities, requirements, and what the school expects..."
            />
          </F>
        </div>
        <div className="shrink-0 border-t border-gray-100 flex justify-end gap-2 px-6 py-4">
          <button onClick={onClose} disabled={saving} className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">Cancel</button>
          <button onClick={onSave} disabled={saving} className="flex min-w-[110px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {editTarget ? "Save changes" : "Post job"}
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const iCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13.5px] text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-brand-500 focus:bg-white";
