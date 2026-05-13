"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, BadgeCheck, ShieldOff, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { getBoardLabel, timeAgo } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { getApiErrorMessage } from "@/lib/api/client";
import { getAdminSchools, updateSchoolVerification } from "@/lib/api/admin-client";
import type { AdminSchool } from "@/lib/api/admin-client";
import AdminActionModal from "@/components/admin/admin-action-modal";
import type { AdminActionVariant } from "@/components/admin/admin-action-modal";
import SchoolDetailDrawer from "@/components/admin/school-detail-drawer";

const PAGE_SIZE = 25;

const VERIFICATION_BADGES: Record<AdminSchool["verificationStatus"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
  UNVERIFIED: "bg-[var(--surface-base)] text-[var(--eh-text-3)]",
};

type PendingAction = {
  school: AdminSchool;
  action: Parameters<typeof updateSchoolVerification>[1];
  title: string;
  description?: string;
  variant: AdminActionVariant;
};

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailSchool, setDetailSchool] = useState<AdminSchool | null>(null);

  const fetchSchools = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (verifiedFilter) params.set("verified", verifiedFilter);
    if (verificationStatusFilter) params.set("verificationStatus", verificationStatusFilter);

    getAdminSchools(params)
      .then((result) => {
        setSchools(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => {
        const msg = getApiErrorMessage(err, "Failed to load schools");
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [page, search, verifiedFilter, verificationStatusFilter]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const openAction = (school: AdminSchool, action: Parameters<typeof updateSchoolVerification>[1]) => {
    const name = school.schoolName || "this school";

    if (action === "approve" || action === "verify") {
      setPendingAction({
        school, action,
        title: action === "approve" ? `Approve "${name}"` : `Verify "${name}"`,
        description: "This marks the school as verified and allows it to post jobs.",
        variant: { kind: "notes", label: "Admin notes", confirmLabel: "Approve", danger: false },
      });
    } else if (action === "unverify") {
      setPendingAction({
        school, action,
        title: `Remove verification from "${name}"`,
        description: "The school will lose its verified badge and cannot post new jobs until re-verified.",
        variant: { kind: "notes", label: "Admin notes", confirmLabel: "Remove verification", danger: true },
      });
    } else if (action === "reject") {
      setPendingAction({
        school, action,
        title: `Reject "${name}"`,
        description: "The rejection reason will be recorded and shown to the school admin.",
        variant: {
          kind: "reason-notes",
          reasonLabel: "Rejection reason",
          placeholder: "Explain why this school is being rejected...",
          notesLabel: "Admin notes",
          confirmLabel: "Reject",
          danger: true,
        },
      });
    } else if (action === "suspend") {
      setPendingAction({
        school, action,
        title: `Suspend "${name}"`,
        description: "The school admin will immediately lose authenticated access. This can be reversed at any time.",
        variant: {
          kind: "reason",
          label: "Suspension reason",
          placeholder: "Explain why this account is being suspended...",
          confirmLabel: "Suspend account",
          danger: true,
        },
      });
    } else if (action === "unsuspend") {
      setPendingAction({
        school, action,
        title: `Unsuspend "${name}"`,
        variant: { kind: "confirm", message: `Restore full platform access to "${name}"? The school admin will be able to log in immediately.`, confirmLabel: "Unsuspend", danger: false },
      });
    }
  };

  const handleModalConfirm = async ({ reason, notes }: { reason?: string; notes?: string }) => {
    if (!pendingAction) return;
    const { school, action } = pendingAction;
    setModalLoading(true);
    try {
      await updateSchoolVerification(school.id, action, { notes, reason });
      toast.success(
        action === "approve" || action === "verify" ? `${school.schoolName} approved` :
        action === "unverify" ? "Verification removed" :
        action === "reject" ? `${school.schoolName} rejected` :
        action === "suspend" ? "School suspended" :
        "School unsuspended"
      );
      setPendingAction(null);
      if (action === "approve" || action === "verify" || action === "unverify") {
        setSchools((prev) =>
          prev.map((item) =>
            item.id === school.id
              ? {
                  ...item,
                  verified: action !== "unverify",
                  verificationStatus: action === "unverify" ? "UNVERIFIED" : "VERIFIED",
                  verificationNotes: notes ?? item.verificationNotes,
                }
              : item
          )
        );
      } else {
        fetchSchools();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setModalLoading(false);
    }
  };

  const verifiedCount = schools.filter((school) => school.verified).length;
  const pendingCount = schools.filter((school) => school.verificationStatus === "PENDING").length;
  const activeSchools = schools.filter((school) => school._count.jobPostings > 0).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">School management</h1>
        <p className="mt-0.5 text-[14px] text-[var(--eh-text-3)]">
          Verify institutions, inspect activity, and resolve trust signals from one queue.
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Registered</p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">{total}</p>
          <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Schools currently visible to admin operations.</p>
        </div>
        <div className="rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Verified on page</p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">{verifiedCount}</p>
          <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Approved institutions in the current result set.</p>
        </div>
        <div className="rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Needs action</p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">{pendingCount}</p>
          <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">{activeSchools} schools on this page have active job postings.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
          <input
            className="w-full rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] py-2.5 pl-9 pr-3 text-[13.5px] focus:border-brand-500 focus:outline-none"
            placeholder="Search school or city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-3 py-2.5 text-[13.5px] focus:border-brand-500 focus:outline-none"
          value={verifiedFilter}
          onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
        >
          <option value="">All schools</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
        <select
          className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-3 py-2.5 text-[13.5px] focus:border-brand-500 focus:outline-none"
          value={verificationStatusFilter}
          onChange={(e) => { setVerificationStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All verification statuses</option>
          <option value="PENDING">Pending review</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
          <option value="UNVERIFIED">Unverified</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)]">
        {loading ? (
          <div className="p-4">
            <LoadingState title="Loading schools" message="Fetching verification queue." />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load schools"
              message={error}
              actions={<button onClick={fetchSchools} className="eh-btn eh-btn-secondary eh-btn-sm">Retry</button>}
            />
          </div>
        ) : schools.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No schools found" message="Try broadening your filters." />
          </div>
        ) : (
          <div>
            <div className="hidden grid-cols-[minmax(0,1.6fr)_160px_150px_220px] gap-4 border-b border-[var(--eh-border)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)] md:grid">
              <span>School</span>
              <span>Board</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-[var(--eh-border)]">
              {schools.map((school) => (
                <div key={school.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.6fr)_160px_150px_220px] md:items-center md:gap-4">
                  <div className="min-w-0">
                    <button
                      onClick={() => setDetailSchool(school)}
                      className="flex items-center gap-2 text-left hover:underline"
                    >
                      <p className="truncate text-[14px] font-semibold text-[var(--eh-text)]">
                        {school.schoolName || <span className="italic text-[var(--eh-text-4)]">Unnamed school</span>}
                      </p>
                      {school.verified ? <BadgeCheck size={14} className="shrink-0 text-brand-500" /> : null}
                      {school.user.isSuspended ? <ShieldOff size={14} className="shrink-0 text-red-500" /> : null}
                    </button>
                    <p className="mt-1 text-[12.5px] text-[var(--eh-text-3)]">
                      {school.city || "City pending"} | {school._count.jobPostings} job{school._count.jobPostings !== 1 ? "s" : ""} | Joined {timeAgo(school.user.createdAt)}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-[var(--eh-text-3)]">{school.user.email}</p>
                    {school.verificationRejectionReason ? (
                      <p className="mt-1 text-[12px] text-red-600">Rejected: {school.verificationRejectionReason}</p>
                    ) : null}
                    {school.verificationNotes ? (
                      <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Admin notes: {school.verificationNotes}</p>
                    ) : null}
                    {school.user.suspensionReason ? (
                      <p className="mt-1 text-[12px] text-red-600">Suspended: {school.user.suspensionReason}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--eh-text-2)]">{getBoardLabel(school.board)}</p>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${VERIFICATION_BADGES[school.verificationStatus]}`}>
                      {school.verificationStatus === "PENDING" ? "Pending review"
                        : school.verificationStatus === "VERIFIED" ? "Verified"
                        : school.verificationStatus === "REJECTED" ? "Rejected"
                        : "Unverified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 md:justify-end">
                    {actionId === school.id ? (
                      <Loader2 size={16} className="mx-2 animate-spin text-[var(--eh-text-4)]" />
                    ) : (
                      <>
                        <button
                          onClick={() => openAction(school,
                            school.verificationStatus === "PENDING" ? "approve"
                              : school.verificationStatus === "VERIFIED" ? "unverify"
                              : "verify"
                          )}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                            school.verificationStatus === "PENDING"
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : school.verificationStatus === "VERIFIED"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {school.verificationStatus === "PENDING" ? (
                            <><BadgeCheck size={13} /> Approve</>
                          ) : school.verificationStatus === "VERIFIED" ? (
                            <><ShieldOff size={13} /> Remove verification</>
                          ) : (
                            <><BadgeCheck size={13} /> Verify</>
                          )}
                        </button>
                        <button
                          onClick={() => openAction(school, "reject")}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-100"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => openAction(school, school.user.isSuspended ? "unsuspend" : "suspend")}
                          className="rounded-lg bg-[var(--surface-base)] px-3 py-1.5 text-[12px] font-medium text-[var(--eh-text-2)] hover:bg-white"
                        >
                          {school.user.isSuspended ? "Unsuspend" : "Suspend"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-[var(--eh-text-3)]">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}-{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[var(--eh-border)] px-3 py-1.5 text-[13px] text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)] disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[var(--eh-border)] px-3 py-1.5 text-[13px] text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

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

      {/* School detail drawer */}
      <SchoolDetailDrawer
        school={detailSchool}
        onClose={() => setDetailSchool(null)}
      />
    </div>
  );
}
