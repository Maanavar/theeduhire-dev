"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Pencil, Plus, Search, ShieldAlert, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { getApiErrorMessage } from "@/lib/api/client";
import { getAdminTeachers, updateTeacherVerification, adminDeleteTeacher } from "@/lib/api/admin-client";
import type { AdminTeacher } from "@/lib/api/admin-client";
import { timeAgo } from "@/lib/utils";
import AdminActionModal from "@/components/admin/admin-action-modal";
import type { AdminActionVariant } from "@/components/admin/admin-action-modal";
import TeacherDetailDrawer from "@/components/admin/teacher-detail-drawer";
import EditTeacherDrawer from "@/components/admin/edit-teacher-drawer";
import CreateUserModal from "@/components/admin/create-user-modal";

const PAGE_SIZE = 25;

const VERIFICATION_BADGES: Record<AdminTeacher["verificationStatus"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
  UNVERIFIED: "bg-[var(--surface-base)] text-[var(--eh-text-3)]",
};

type TeacherAction = Parameters<typeof updateTeacherVerification>[1];

type PendingAction = {
  teacher: AdminTeacher;
  action: TeacherAction;
  title: string;
  description?: string;
  variant: AdminActionVariant;
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailTeacher, setDetailTeacher] = useState<AdminTeacher | null>(null);
  const [editTeacher, setEditTeacher] = useState<AdminTeacher | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTeacher | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTeachers = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (verificationStatusFilter) params.set("verificationStatus", verificationStatusFilter);

    getAdminTeachers(params)
      .then((result) => {
        setTeachers(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => {
        const msg = getApiErrorMessage(err, "Failed to load teachers");
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [page, search, verificationStatusFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const openAction = (teacher: AdminTeacher, action: TeacherAction) => {
    const name = teacher.user.name;

    const configs: Record<TeacherAction, PendingAction> = {
      approve: {
        teacher, action,
        title: `Verify ${name}`,
        description: "Grants the teacher a verified badge visible on their profile and applications.",
        variant: { kind: "notes", label: "Admin notes", confirmLabel: "Verify teacher", danger: false },
      },
      reject: {
        teacher, action,
        title: `Reject ${name}'s application`,
        description: "The reason will be recorded and shown to the teacher.",
        variant: {
          kind: "reason-notes",
          reasonLabel: "Rejection reason",
          placeholder: "Explain why this application is being rejected...",
          notesLabel: "Admin notes",
          confirmLabel: "Reject",
          danger: true,
        },
      },
      "revoke-badge": {
        teacher, action,
        title: `Revoke ${name}'s safety badge`,
        description: "The teacher will lose their verified safety badge.",
        variant: { kind: "notes", label: "Admin notes", confirmLabel: "Revoke badge", danger: true },
      },
      "mark-pending": {
        teacher, action,
        title: `Move ${name} back to pending`,
        variant: { kind: "confirm", message: `Reset ${name}'s verification status to pending review?`, confirmLabel: "Move to pending", danger: false },
      },
      suspend: {
        teacher, action,
        title: `Suspend ${name}`,
        description: "They will immediately lose authenticated access. This can be reversed at any time.",
        variant: {
          kind: "reason",
          label: "Suspension reason",
          placeholder: "Explain why this account is being suspended...",
          confirmLabel: "Suspend account",
          danger: true,
        },
      },
      unsuspend: {
        teacher, action,
        title: `Unsuspend ${name}`,
        variant: { kind: "confirm", message: `Restore full platform access to ${name}?`, confirmLabel: "Unsuspend", danger: false },
      },
    };

    setPendingAction(configs[action]);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminDeleteTeacher(deleteTarget.userId);
      toast.success(`${deleteTarget.user.name} deleted`);
      setDeleteTarget(null);
      fetchTeachers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalConfirm = async ({ reason, notes }: { reason?: string; notes?: string }) => {
    if (!pendingAction) return;
    const { teacher, action } = pendingAction;
    setModalLoading(true);
    try {
      await updateTeacherVerification(teacher.userId, action, { reason, notes });
      toast.success(
        action === "approve" ? "Teacher verified" :
        action === "reject" ? "Verification rejected" :
        action === "revoke-badge" ? "Safety badge removed" :
        action === "mark-pending" ? "Moved back to pending" :
        action === "suspend" ? "Teacher suspended" :
        "Teacher unsuspended"
      );
      setPendingAction(null);
      fetchTeachers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">Teacher management</h1>
          <p className="mt-0.5 text-[14px] text-[var(--eh-text-3)]">
            Review teacher passports, grant trust badges, and manage accounts.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-600 mt-2"
        >
          <Plus size={14} /> Add teacher
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
          <input
            className="w-full rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] py-2.5 pl-9 pr-3 text-[13.5px] focus:border-brand-500 focus:outline-none"
            placeholder="Search teacher, email, or city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-3 py-2.5 text-[13.5px] focus:border-brand-500 focus:outline-none"
          value={verificationStatusFilter}
          onChange={(e) => { setVerificationStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All verification states</option>
          <option value="PENDING">Pending review</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
          <option value="UNVERIFIED">Unverified</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)]">
        {loading ? (
          <div className="p-4">
            <LoadingState title="Loading teachers" message="Fetching teacher verification queue." />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load teachers"
              message={error}
              actions={<button onClick={fetchTeachers} className="eh-btn eh-btn-secondary eh-btn-sm">Retry</button>}
            />
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No teachers found" message="Try broadening the filters." />
          </div>
        ) : (
          <div className="divide-y divide-[var(--eh-border)]">
            {teachers.map((teacher) => (
              <div key={teacher.userId} className="px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setDetailTeacher(teacher)}
                        className="truncate text-[15px] font-semibold text-[var(--eh-text)] hover:underline text-left"
                      >
                        {teacher.user.name}
                      </button>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${VERIFICATION_BADGES[teacher.verificationStatus]}`}>
                        {teacher.verificationStatus === "PENDING" ? "Pending review" : teacher.verificationStatus.toLowerCase()}
                      </span>
                      {teacher.safetyBadgeGranted ? <ShieldCheck size={15} className="text-green-600" /> : null}
                      {teacher.user.isSuspended ? <ShieldAlert size={15} className="text-red-600" /> : null}
                    </div>
                    <p className="mt-1 text-[12.5px] text-[var(--eh-text-3)]">
                      {teacher.user.email} | {teacher.city || "City pending"} | Joined {timeAgo(teacher.user.createdAt)}
                    </p>
                    <p className="mt-1 text-[12.5px] text-[var(--eh-text-3)]">
                      Subjects: {teacher.subjects.length ? teacher.subjects.join(", ") : "None yet"} | Experience records: {teacher._count.experiences} | Certifications: {teacher._count.certifications}
                    </p>
                    <p className="mt-2 text-[12px] text-[var(--eh-text-3)]">
                      Demo video: {teacher.demoVideoUrl ? "Uploaded" : "Missing"} | Lesson plan: {teacher.lessonPlanUrl ? "Uploaded" : "Missing"} | POCSO: {teacher.pocsoAcknowledged ? "Yes" : "No"} | Code of conduct: {teacher.codeOfConductSigned ? "Yes" : "No"}
                    </p>
                    {teacher.verificationRejectionReason ? (
                      <p className="mt-2 text-[12px] text-red-600">Rejection reason: {teacher.verificationRejectionReason}</p>
                    ) : null}
                    {teacher.verificationNotes ? (
                      <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Admin notes: {teacher.verificationNotes}</p>
                    ) : null}
                    {teacher.user.suspensionReason ? (
                      <p className="mt-1 text-[12px] text-red-600">Suspension: {teacher.user.suspensionReason}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {teacher.verificationStatus !== "VERIFIED" ? (
                      <button onClick={() => openAction(teacher, "approve")} className="rounded-lg bg-green-50 px-3 py-1.5 text-[12px] font-medium text-green-700 hover:bg-green-100">
                        <BadgeCheck size={13} className="mr-1 inline" /> Verify
                      </button>
                    ) : (
                      <button onClick={() => openAction(teacher, "revoke-badge")} className="rounded-lg bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-700 hover:bg-amber-100">
                        <ShieldOff size={13} className="mr-1 inline" /> Revoke badge
                      </button>
                    )}
                    <button onClick={() => openAction(teacher, "reject")} className="rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-100">
                      Reject
                    </button>
                    {teacher.user.isSuspended ? (
                      <button onClick={() => openAction(teacher, "unsuspend")} className="rounded-lg bg-[var(--surface-base)] px-3 py-1.5 text-[12px] font-medium text-[var(--eh-text-2)] hover:bg-white">
                        Unsuspend
                      </button>
                    ) : (
                      <button onClick={() => openAction(teacher, "suspend")} className="rounded-lg bg-[var(--surface-base)] px-3 py-1.5 text-[12px] font-medium text-[var(--eh-text-2)] hover:bg-white">
                        Suspend
                      </button>
                    )}
                    <button
                      onClick={() => setEditTeacher(teacher)}
                      className="rounded-lg bg-[var(--surface-base)] px-2.5 py-1.5 text-[var(--eh-text-2)] hover:bg-white"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(teacher)}
                      className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-500 hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {total > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-[var(--eh-text-3)]">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}-{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((v) => v - 1)} className="rounded-lg border border-[var(--eh-border)] px-3 py-1.5 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] disabled:opacity-40">
              Prev
            </button>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage((v) => v + 1)} className="rounded-lg border border-[var(--eh-border)] px-3 py-1.5 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      ) : null}

      {/* Action confirmation modal */}
      {pendingAction && (
        <AdminActionModal
          open={true}
          title={pendingAction.title}
          description={pendingAction.description}
          variant={pendingAction.variant}
          loading={modalLoading}
          onConfirm={handleModalConfirm}
          onClose={() => { if (!modalLoading) setPendingAction(null); }}
        />
      )}

      {/* Teacher detail drawer */}
      <TeacherDetailDrawer
        teacher={detailTeacher}
        onClose={() => setDetailTeacher(null)}
      />

      {/* Edit teacher drawer */}
      <EditTeacherDrawer
        teacher={editTeacher}
        onClose={() => setEditTeacher(null)}
        onSaved={fetchTeachers}
      />

      {/* Create teacher modal */}
      <CreateUserModal
        open={createOpen}
        defaultRole="TEACHER"
        onClose={() => setCreateOpen(false)}
        onCreated={fetchTeachers}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <AdminActionModal
          open={true}
          title={`Delete ${deleteTarget.user.name}?`}
          description="This will permanently delete the teacher account and all associated applications, alerts, and data. This cannot be undone."
          variant={{ kind: "confirm", message: `Permanently delete "${deleteTarget.user.name}" (${deleteTarget.user.email})?`, confirmLabel: "Delete account", danger: true }}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => { if (!deleteLoading) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
