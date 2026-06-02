"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ClipboardList, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn, timeAgo } from "@/lib/utils";
import AdminActionModal from "@/components/admin/admin-action-modal";

const PAGE_SIZE = 25;

const BOARD_OPTIONS = [
  { value: "CBSE", label: "CBSE" },
  { value: "ICSE", label: "ICSE" },
  { value: "STATE_BOARD", label: "State Board" },
  { value: "IB", label: "IB" },
  { value: "CAMBRIDGE", label: "Cambridge" },
  { value: "OTHER", label: "Other" },
];

type OfflineSchool = {
  id: string;
  schoolName: string;
  city: string;
  board: string;
  address?: string | null;
  website?: string | null;
  about?: string | null;
  udiseCode?: string | null;
  offlineContactName?: string | null;
  offlineContactPhone?: string | null;
  offlineContactEmail?: string | null;
  createdAt: string;
  _count: { jobPostings: number };
};

type FormState = {
  schoolName: string; city: string; board: string;
  address: string; website: string; about: string; udiseCode: string;
  offlineContactName: string; offlineContactPhone: string; offlineContactEmail: string;
};

const emptyForm = (): FormState => ({
  schoolName: "", city: "", board: "CBSE",
  address: "", website: "", about: "", udiseCode: "",
  offlineContactName: "", offlineContactPhone: "", offlineContactEmail: "",
});

function fromSchool(s: OfflineSchool): FormState {
  return {
    schoolName: s.schoolName,
    city: s.city,
    board: s.board || "CBSE",
    address: s.address || "",
    website: s.website || "",
    about: s.about || "",
    udiseCode: s.udiseCode || "",
    offlineContactName: s.offlineContactName || "",
    offlineContactPhone: s.offlineContactPhone || "",
    offlineContactEmail: s.offlineContactEmail || "",
  };
}

export default function OfflineSchoolsPage() {
  const [schools, setSchools] = useState<OfflineSchool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OfflineSchool | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OfflineSchool | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSchools = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    fetch(`/api/admin/offline-schools?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSchools(res.data);
          setTotal(res.pagination.total);
        } else {
          setError(res.error || "Failed to load");
        }
      })
      .catch(() => setError("Failed to load offline schools"))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm()); setDrawerOpen(true); };
  const openEdit = (s: OfflineSchool) => { setEditTarget(s); setForm(fromSchool(s)); setDrawerOpen(true); };
  const closeDrawer = () => { if (!saving) { setDrawerOpen(false); setEditTarget(null); } };

  const handleSave = async () => {
    if (!form.schoolName.trim() || !form.city.trim()) {
      toast.error("School name and city are required");
      return;
    }
    setSaving(true);
    try {
      const url = "/api/admin/offline-schools";
      const body = editTarget
        ? JSON.stringify({ schoolId: editTarget.id, ...form })
        : JSON.stringify(form);
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body }).then((r) => r.json());
      if (!res.success) throw new Error(res.error || "Save failed");
      toast.success(editTarget ? "School updated" : "Offline school created");
      setDrawerOpen(false);
      fetchSchools();
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
      const res = await fetch(`/api/admin/offline-schools?schoolId=${deleteTarget.id}`, { method: "DELETE" }).then((r) => r.json());
      if (!res.success) throw new Error(res.error || "Delete failed");
      toast.success(`${deleteTarget.schoolName} deleted`);
      setDeleteTarget(null);
      fetchSchools();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">Offline schools</h1>
          <p className="mt-0.5 text-[14px] text-[var(--eh-text-3)]">
            Schools that don't have digital accounts — EduHire manages hiring on their behalf.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-600 mt-2"
        >
          <Plus size={14} /> Add offline school
        </button>
      </div>

      <div className="mb-5 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
          <input
            className="w-full rounded-xl border border-[var(--eh-border)] bg-[var(--surface-overlay)] py-2.5 pl-9 pr-3 text-[13.5px] focus:border-brand-500 focus:outline-none"
            placeholder="Search school name, city, or contact..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-overlay)]">
        {loading ? (
          <div className="p-4"><LoadingState title="Loading offline schools" message="Fetching records." /></div>
        ) : error ? (
          <div className="p-4"><ErrorState title="Couldn't load" message={error} actions={<button onClick={fetchSchools} className="eh-btn eh-btn-secondary eh-btn-sm">Retry</button>} /></div>
        ) : schools.length === 0 ? (
          <div className="p-4"><EmptyState title="No offline schools" message={search ? "Try a different search." : "Add your first offline school to start managing jobs for them."} /></div>
        ) : (
          <div className="divide-y divide-[var(--eh-border)]">
            {schools.map((school) => (
              <div key={school.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="shrink-0 text-[var(--eh-text-4)]" />
                    <p className="font-semibold text-[14px] text-[var(--eh-text)] truncate">{school.schoolName}</p>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10.5px] font-semibold text-purple-700">Offline managed</span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-[var(--eh-text-3)]">
                    {school.city} · {school.board} · {school._count.jobPostings} job{school._count.jobPostings !== 1 ? "s" : ""} · Added {timeAgo(school.createdAt)}
                  </p>
                  {school.offlineContactName || school.offlineContactPhone ? (
                    <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">
                      Contact: {[school.offlineContactName, school.offlineContactPhone, school.offlineContactEmail].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/managed-jobs?school=${school.id}&schoolName=${encodeURIComponent(school.schoolName)}`}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--eh-border)] bg-[var(--surface-overlay)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"
                    title="View managed jobs"
                  >
                    <ClipboardList size={13} />
                    {school._count.jobPostings > 0 ? `${school._count.jobPostings} job${school._count.jobPostings !== 1 ? "s" : ""}` : "Jobs"}
                  </Link>
                  <button
                    onClick={() => openEdit(school)}
                    className="rounded-lg bg-[var(--surface-base)] px-2.5 py-1.5 text-[var(--eh-text-2)] hover:bg-white"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(school)}
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

      {/* Create / Edit drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[70] flex justify-end animate-fade-in"
          style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if ((e.target as HTMLElement).dataset.overlay === "true") closeDrawer(); }}
          data-overlay="true"
        >
          <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-[17px] font-bold tracking-[-0.02em] text-gray-900">{editTarget ? "Edit offline school" : "Add offline school"}</h2>
                <p className="text-[12.5px] text-gray-500 mt-0.5">School participates offline — EduHire manages jobs</p>
              </div>
              <button onClick={closeDrawer} disabled={saving} className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 disabled:opacity-40">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* School info */}
              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">School details</p>
                <div className="space-y-3">
                  <F label="School name" required>
                    <input className={iCls} value={form.schoolName} onChange={setField("schoolName")} placeholder="School name" />
                  </F>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="City" required>
                      <input className={iCls} value={form.city} onChange={setField("city")} placeholder="City" />
                    </F>
                    <F label="Board">
                      <select className={iCls} value={form.board} onChange={setField("board")}>
                        {BOARD_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </F>
                  </div>
                  <F label="Address">
                    <textarea className={cn(iCls, "resize-none")} rows={2} value={form.address} onChange={setField("address")} placeholder="Full address (optional)" />
                  </F>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Website">
                      <input className={iCls} value={form.website} onChange={setField("website")} placeholder="https://..." />
                    </F>
                    <F label="UDISE Code">
                      <input className={iCls} value={form.udiseCode} onChange={setField("udiseCode")} placeholder="UDISE code" />
                    </F>
                  </div>
                  <F label="About">
                    <textarea className={cn(iCls, "resize-none")} rows={3} value={form.about} onChange={setField("about")} placeholder="About the school..." />
                  </F>
                </div>
              </section>
              {/* Contact */}
              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Offline contact (person who spoke to EduHire)</p>
                <div className="space-y-3">
                  <F label="Contact name">
                    <input className={iCls} value={form.offlineContactName} onChange={setField("offlineContactName")} placeholder="Principal / HR name" />
                  </F>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Contact phone">
                      <input className={iCls} value={form.offlineContactPhone} onChange={setField("offlineContactPhone")} placeholder="+91..." />
                    </F>
                    <F label="Contact email">
                      <input className={iCls} type="email" value={form.offlineContactEmail} onChange={setField("offlineContactEmail")} placeholder="contact@school.in" />
                    </F>
                  </div>
                </div>
              </section>
            </div>
            <div className="shrink-0 border-t border-gray-100 flex justify-end gap-2 px-6 py-4">
              <button onClick={closeDrawer} disabled={saving} className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex min-w-[100px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editTarget ? "Save changes" : "Add school"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <AdminActionModal
          open={true}
          title={`Delete "${deleteTarget.schoolName}"?`}
          description="This will permanently delete the offline school record and all managed jobs associated with it."
          variant={{ kind: "confirm", message: `Permanently delete "${deleteTarget.schoolName}"? This will also delete all ${deleteTarget._count.jobPostings} job posting(s).`, confirmLabel: "Delete school", danger: true }}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => { if (!deleteLoading) setDeleteTarget(null); }}
        />
      )}
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
