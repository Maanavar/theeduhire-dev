"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageShell, Panel, StatusBadge } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/system/system-states";

type ManagedRequest = {
  id: string;
  jobTitle: string;
  subject: string;
  joinDate: string;
  salaryMin?: number;
  salaryMax?: number;
  status: "NEW_REQUEST" | "SOURCING" | "CANDIDATES_SHARED" | "INTERVIEWING" | "CLOSED";
  candidatesPresented: number;
  invoiceAmount?: number;
  paymentStatus?: "PAID" | "UNPAID" | null;
};

const statusConfig: Record<ManagedRequest["status"], { label: string; tone: "brand" | "warning" | "success" | "info" | "neutral" | "danger" }> = {
  NEW_REQUEST: { label: "New Request", tone: "brand" },
  SOURCING: { label: "Sourcing", tone: "warning" },
  CANDIDATES_SHARED: { label: "Candidates Shared", tone: "info" },
  INTERVIEWING: { label: "Interviewing", tone: "warning" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

const STATUS_OPTIONS = ["All Statuses", "NEW_REQUEST", "SOURCING", "CANDIDATES_SHARED", "INTERVIEWING", "CLOSED"] as const;
const SUBJECT_OPTIONS = ["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Tamil", "Social Science", "Computer Science", "Other"];
const SORT_OPTIONS = [
  { label: "Sort: Latest", value: "latest" },
  { label: "Sort: Oldest", value: "oldest" },
] as const;

const MOCK_REQUESTS: ManagedRequest[] = [
  { id: "1", jobTitle: "Math Teacher", subject: "Mathematics", joinDate: "2025-06-01", salaryMin: 30000, salaryMax: 40000, status: "NEW_REQUEST", candidatesPresented: 0 },
  { id: "2", jobTitle: "Physics Teacher", subject: "Physics", joinDate: "2025-06-15", salaryMin: 32000, salaryMax: 45000, status: "SOURCING", candidatesPresented: 7, invoiceAmount: 10000, paymentStatus: "UNPAID" },
  { id: "3", jobTitle: "English Teacher", subject: "English", joinDate: "2025-06-10", salaryMin: 28000, salaryMax: 38000, status: "CANDIDATES_SHARED", candidatesPresented: 5, invoiceAmount: 10000, paymentStatus: "PAID" },
  { id: "4", jobTitle: "Chemistry Teacher", subject: "Chemistry", joinDate: "2025-06-05", salaryMin: 30000, salaryMax: 42000, status: "INTERVIEWING", candidatesPresented: 3, invoiceAmount: 10000, paymentStatus: "PAID" },
];

export default function ManagedRecruitmentPage() {
  const [requests, setRequests] = useState<ManagedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [selectedRequest, setSelectedRequest] = useState<ManagedRequest | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setRequests(MOCK_REQUESTS);
      setSelectedRequest(MOCK_REQUESTS[1]);
      setLoading(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenuId(null); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openMenuId]);

  const filtered = requests
    .filter((r) => {
      const bySearch = !search || r.jobTitle.toLowerCase().includes(search.toLowerCase()) || r.subject.toLowerCase().includes(search.toLowerCase());
      const byStatus = statusFilter === "All Statuses" || r.status === statusFilter;
      const bySubject = subjectFilter === "All Subjects" || r.subject === subjectFilter;
      return bySearch && byStatus && bySubject;
    })
    .sort((a, b) => {
      const diff = new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      return sortOrder === "latest" ? diff : -diff;
    });

  const totalRequests = requests.length;
  const activeRoles = requests.filter((r) => r.status !== "CLOSED").length;
  const candidatesPresented = requests.reduce((s, r) => s + r.candidatesPresented, 0);
  const unpaidCount = requests.filter((r) => r.paymentStatus === "UNPAID").length;

  const formatSalary = (min?: number, max?: number) =>
    min && max ? `₹${(min / 1000).toFixed(0)}K – ₹${(max / 1000).toFixed(0)}K` : "—";

  const requestViaEmail = () => {
    window.location.href = "mailto:hello@theeduhire.in?subject=Managed Recruitment Request — EduHire&body=School Name:%0ARole Required:%0ASubject:%0ASalary Budget:%0AExpected Join Date:";
  };

  return (
    <PageShell>
      <PageHeader
        title="Managed Recruitment"
        subtitle="Let our expert recruiters find and deliver the right talent for your school."
        actions={
          <button onClick={requestViaEmail} className="eh-btn eh-btn-primary">
            <Plus size={14} /> Request Managed Recruitment
          </button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: "Total Requests", value: totalRequests, color: "bg-[var(--eh-primary-500)]", textColor: "text-[var(--eh-primary-700)]", hint: "2 this month" },
          { label: "Active Roles", value: activeRoles, color: "bg-emerald-500", textColor: "text-emerald-700", hint: "2 this month" },
          { label: "Candidates Presented", value: candidatesPresented, color: "bg-sky-500", textColor: "text-sky-700", hint: "18 this month" },
          { label: "Interviews Coordinated", value: 18, color: "bg-amber-400", textColor: "text-amber-700", hint: "9 this month" },
          { label: "Unpaid Invoices", value: unpaidCount > 0 ? `₹${(unpaidCount * 10000 / 1000).toFixed(0)}K` : "₹0", color: "bg-red-400", textColor: "text-red-700", hint: unpaidCount > 0 ? "Due" : "All paid" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[var(--eh-border)] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className={`mb-3 h-0.5 w-6 rounded-full ${m.color}`} />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">{m.label}</p>
            <p className={`mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em] ${m.textColor}`}>{m.value}</p>
            <p className="mt-2 text-[11px] text-[var(--eh-text-4)]">↑ {m.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        {/* Main table */}
        <Panel>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--eh-border)] px-4 py-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title..."
              className="input-base max-w-[260px] flex-1"
            />
            <div className="eh-select-wrap max-w-[160px]">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-full">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === "All Statuses" ? "All Statuses" : (statusConfig[s as ManagedRequest["status"]]?.label ?? s)}</option>
                ))}
              </select>
            </div>
            <div className="eh-select-wrap max-w-[160px]">
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input-base w-full">
                {SUBJECT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="eh-select-wrap max-w-[140px]">
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")} className="input-base w-full">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="animate-spin text-[var(--eh-text-4)]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No recruitment requests yet"
                message="Submit a requirement to let EduHire find the right talent for your school."
                actions={<button onClick={requestViaEmail} className="eh-btn eh-btn-primary eh-btn-sm"><Plus size={13} /> Request Managed Recruitment</button>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-[var(--eh-border)] bg-[var(--surface-base)]">
                    {["Job Title", "Subject", "Join Date", "Salary Budget", "Status", "Candidates Presented", "Invoice Amount", "Payment Status", "Actions"].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--eh-border)]">
                  {filtered.map((req) => {
                    const sc = statusConfig[req.status];
                    return (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={["group cursor-pointer transition-colors hover:bg-[var(--surface-base)]", selectedRequest?.id === req.id ? "bg-[var(--eh-primary-50)]" : ""].join(" ")}
                      >
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] font-semibold text-[var(--eh-text)]">{req.jobTitle}</p>
                          <p className="text-[11px] text-[var(--eh-text-3)]">Managed Search</p>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-[var(--eh-text-2)]">{req.subject}</td>
                        <td className="px-4 py-3.5 text-[12px] text-[var(--eh-text-2)]">
                          {new Date(req.joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] font-medium text-[var(--eh-text-2)]">{formatSalary(req.salaryMin, req.salaryMax)}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge tone={sc.tone}>{sc.label}</StatusBadge>
                        </td>
                        <td className="px-4 py-3.5">
                          {req.candidatesPresented > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex -space-x-1">
                                {Array.from({ length: Math.min(req.candidatesPresented, 3) }).map((_, i) => (
                                  <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--eh-primary-200)] border-2 border-white text-[9px] font-bold text-[var(--eh-primary-700)]">
                                    {i + 1}
                                  </div>
                                ))}
                              </div>
                              {req.candidatesPresented > 3 && (
                                <span className="text-[11px] text-[var(--eh-text-3)]">+{req.candidatesPresented - 3}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12px] text-[var(--eh-text-4)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] font-medium text-[var(--eh-text-2)]">
                          {req.invoiceAmount ? `₹${req.invoiceAmount.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {req.paymentStatus ? (
                            <StatusBadge tone={req.paymentStatus === "PAID" ? "success" : "danger"}>{req.paymentStatus === "PAID" ? "Paid" : "Unpaid"}</StatusBadge>
                          ) : (
                            <span className="text-[12px] text-[var(--eh-text-4)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="relative" ref={openMenuId === req.id ? menuRef : undefined}>
                            <button
                              onClick={() => setOpenMenuId((prev) => prev === req.id ? null : req.id)}
                              className="rounded-lg border border-[var(--eh-border)] p-1.5 text-[var(--eh-text-4)] hover:bg-white"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {openMenuId === req.id && (
                              <div className="eh-popover absolute right-0 z-20 mt-1 w-48">
                                <button
                                  onClick={() => { setSelectedRequest(req); setOpenMenuId(null); }}
                                  className="eh-popover-item"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    window.location.href = `mailto:hello@theeduhire.in?subject=Follow up on ${encodeURIComponent(req.jobTitle)} — EduHire`;
                                    setOpenMenuId(null);
                                  }}
                                  className="eh-popover-item"
                                >
                                  Contact EduHire
                                </button>
                                {req.paymentStatus === "UNPAID" && (
                                  <button
                                    onClick={() => { toast.info("Payment flow coming soon"); setOpenMenuId(null); }}
                                    className="eh-popover-item text-amber-700"
                                  >
                                    Pay Invoice
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-[var(--eh-border)] px-4 py-3">
                <p className="text-[12px] text-[var(--eh-text-3)]">Showing {filtered.length} of {requests.length} requests</p>
              </div>
            </div>
          )}
        </Panel>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Service explanation */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-1">Managed Recruitment Service</h3>
            <p className="text-[12px] text-[var(--eh-text-3)] mb-4">We handle the entire hiring process so you can focus on your students, not recruitment.</p>
            <div className="space-y-3">
              {[
                { step: "1.", label: "Sourcing", desc: "We find the best candidates from our network and trusted channels." },
                { step: "2.", label: "Screening", desc: "We conduct thorough screening and shortlisting to ensure quality." },
                { step: "3.", label: "Shortlisting", desc: "You receive only the most qualified candidates for your review." },
                { step: "4.", label: "Interview Coordination", desc: "We schedule and coordinate interviews at your convenience." },
                { step: "5.", label: "Onboarding Support", desc: "We assist with offer, documentation, and smooth onboarding." },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-100)] text-[11px] font-bold text-[var(--eh-primary-700)]">{item.step}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[var(--eh-text)]">{item.label}</p>
                    <p className="text-[11px] text-[var(--eh-text-3)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">Transparent Pricing</p>
              <p className="mt-1 text-[22px] font-bold text-[var(--eh-primary-700)]">₹10,000</p>
              <p className="text-[12px] text-[var(--eh-text-3)]">per confirmed hire</p>
              <p className="mt-1 text-[11px] text-emerald-600 font-medium">No upfront costs. Pay only when you hire.</p>
            </div>
            <Link href="/dashboard/billing" className="mt-3 inline-block text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">
              View Pricing Details →
            </Link>
          </Panel>

          {/* Selected request preview */}
          {selectedRequest && (
            <Panel className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Request Preview</h3>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={statusConfig[selectedRequest.status].tone}>{statusConfig[selectedRequest.status].label}</StatusBadge>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-md p-1 text-[var(--eh-text-4)] hover:bg-[var(--surface-base)]"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <p className="text-[14px] font-semibold text-[var(--eh-text)]">{selectedRequest.jobTitle}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[var(--eh-text-4)] font-medium">Join Date</p>
                  <p className="font-semibold text-[var(--eh-text-2)]">{new Date(selectedRequest.joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-[var(--eh-text-4)] font-medium">Salary Budget</p>
                  <p className="font-semibold text-[var(--eh-text-2)]">{formatSalary(selectedRequest.salaryMin, selectedRequest.salaryMax)}/month</p>
                </div>
                <div>
                  <p className="text-[var(--eh-text-4)] font-medium">Candidates</p>
                  <p className="font-semibold text-[var(--eh-text-2)]">{selectedRequest.candidatesPresented} presented</p>
                </div>
                {selectedRequest.invoiceAmount && (
                  <div>
                    <p className="text-[var(--eh-text-4)] font-medium">Invoice</p>
                    <p className={["font-semibold", selectedRequest.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"].join(" ")}>
                      ₹{selectedRequest.invoiceAmount.toLocaleString("en-IN")} · {selectedRequest.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)] mb-2">Timeline</p>
                <div className="space-y-2">
                  {[
                    { label: "Request Created", date: "Today" },
                    { label: "Sourcing Started", date: "Tomorrow" },
                    { label: "Candidates Expected", date: `By ${new Date(selectedRequest.joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[var(--eh-primary-500)]" />
                      <div className="flex flex-1 items-center justify-between text-[12px]">
                        <span className="text-[var(--eh-text-2)]">{item.label}</span>
                        <span className="text-[var(--eh-text-4)]">{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  window.location.href = `mailto:hello@theeduhire.in?subject=Follow up on ${encodeURIComponent(selectedRequest.jobTitle)} request — EduHire`;
                }}
                className="mt-4 w-full rounded-lg border border-[var(--eh-border)] py-2 text-[12px] font-semibold text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors"
              >
                Contact EduHire about this request <ChevronRight size={12} className="inline" />
              </button>
            </Panel>
          )}
        </div>
      </div>
    </PageShell>
  );
}
