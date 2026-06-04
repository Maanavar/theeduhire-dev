"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { formatSalary, timeAgo } from "@/lib/utils";
import { MapPin, ArrowRight, RefreshCw, Download, ChevronDown, Filter, Loader2, Trash2, FileText, TrendingUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell, Panel, PanelHeader, StatusBadge } from "@/components/layout/page-shell";
import { NoApplicationsState, SomethingWentWrongState } from "@/components/system/illustrated-states";
import { CardListSkeleton } from "@/components/system/dashboard-skeletons";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  getApplications,
  type TeacherApplicationRecord as AppItem,
  withdrawApplication as withdrawTeacherApplication,
} from "@/lib/api/applications-client";

const JobDetailModal = dynamic(() => import("@/components/jobs/job-detail-modal"), { ssr: false });
const ApplicationTimeline = dynamic(() => import("@/components/applications/application-timeline").then((m) => m.ApplicationTimeline), { ssr: false });

const STATUS_CONFIG: Record<string, { label: string; tone: "neutral" | "info" | "warning" | "brand" | "danger" | "success" }> = {
  PENDING: { label: "Applied", tone: "neutral" },
  REVIEWED: { label: "Reviewed", tone: "info" },
  SHORTLISTED: { label: "Shortlisted", tone: "warning" },
  INTERVIEW_SCHEDULED: { label: "Interview", tone: "brand" },
  INTERVIEW_COMPLETED: { label: "Interview Done", tone: "brand" },
  REJECTED: { label: "Not Selected", tone: "danger" },
  HIRED: { label: "Offered", tone: "success" },
};

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Applied" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "INTERVIEW_SCHEDULED", label: "Interviews" },
  { key: "HIRED", label: "Offered" },
  { key: "REJECTED", label: "Rejected" },
] as const;

function ApplicationStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <StatusBadge tone={cfg.tone} dot>
      {cfg.label}
    </StatusBadge>
  );
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("");
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [withdrawingAppId, setWithdrawingAppId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);

  const fetchApps = useCallback(async (status = "ALL") => {
    setLoading(true);
    setError("");
    try {
      const data = await getApplications({ status });
      setApps(data);
      setExpandedAppId((current) => current ?? data[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load applications"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0, PENDING: 0, REVIEWED: 0, SHORTLISTED: 0, INTERVIEW_SCHEDULED: 0, REJECTED: 0, HIRED: 0 };
    for (const app of apps) {
      counts.ALL += 1;
      if (app.status in counts) counts[app.status] += 1;
    }
    return counts;
  }, [apps]);

  const filteredApps = useMemo(() => {
    if (!searchTerm.trim()) return apps;
    const q = searchTerm.toLowerCase();
    return apps.filter(
      (a) =>
        a.job.title.toLowerCase().includes(q) ||
        a.job.school.schoolName.toLowerCase().includes(q)
    );
  }, [apps, searchTerm]);

  const exportCsv = () => {
    if (apps.length === 0) { toast.error("No applications to export"); return; }
    const headers = ["School", "Job Title", "Status", "Applied At"];
    const rows = apps.map((app) => [app.job.school.schoolName, app.job.title, app.status, new Date(app.appliedAt).toLocaleDateString("en-IN")]);
    const sanitize = (v: string) => (/^[=+\-@]/.test(v) ? `\t${v}` : v);
    const csv = [headers, ...rows].map((row) => row.map(sanitize).map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `applications-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${apps.length} application(s)`);
  };

  const canWithdraw = (status: string) => status !== "HIRED" && status !== "REJECTED";

  const withdrawApplication = async (applicationId: string) => {
    setWithdrawingAppId(applicationId);
    const snapshot = apps;
    setApps((current) => current.filter((item) => item.id !== applicationId));
    if (expandedAppId === applicationId) setExpandedAppId(null);
    try {
      await withdrawTeacherApplication(applicationId);
      toast.success("Application withdrawn");
    } catch (err) {
      setApps(snapshot);
      toast.error(getApiErrorMessage(err, "Failed to withdraw application"));
    } finally {
      setWithdrawingAppId(null);
    }
  };

  const donutTotal = apps.length || 1;
  const donutSlices = [
    { label: "Applied", count: statusCounts.PENDING, color: "#667085" },
    { label: "Shortlisted", count: statusCounts.SHORTLISTED, color: "#f59e0b" },
    { label: "Interview", count: statusCounts.INTERVIEW_SCHEDULED, color: "#0a66c2" },
    { label: "Offered", count: statusCounts.HIRED, color: "#10b981" },
  ];

  return (
    <PageShell>
      <PageHeader
        title="My Applications"
        subtitle="Track and manage all your job applications in one place."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportCsv} className="gap-1.5">
              <Download size={13} /> Export
            </Button>
            <Link href="/dashboard/jobs" className="eh-btn eh-btn-primary eh-btn-sm">
              New Application <ArrowRight size={13} />
            </Link>
          </div>
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
          {/* Status tabs */}
          <Panel>
            <div className="flex items-center gap-1 overflow-x-auto px-4 pt-4 pb-0 scrollbar-none">
              {STATUS_TABS.map(({ key, label }) => {
                const active = filterStatus === key;
                const count = statusCounts[key] ?? 0;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterStatus(key);
                      fetchApps(key);
                    }}
                    className={[
                      "flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 text-[13px] font-medium transition-colors",
                      active
                        ? "border-[var(--eh-primary-600)] text-[var(--eh-primary-700)]"
                        : "border-transparent text-[var(--eh-text-3)] hover:text-[var(--eh-text)]",
                    ].join(" ")}
                  >
                    {label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]" : "bg-[var(--surface-base)] text-[var(--eh-text-4)]"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search bar */}
            <div className="border-t border-[var(--eh-border)] px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-2">
                <Filter size={13} className="shrink-0 text-[var(--eh-text-4)]" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search applications…"
                  className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[var(--eh-text)] outline-none placeholder:text-[var(--eh-text-4)]"
                />
              </div>
            </div>
          </Panel>

          {/* List */}
          {loading ? (
            <CardListSkeleton cards={5} />
          ) : error ? (
            <SomethingWentWrongState
              title="Failed to load applications"
              message={error}
              onRetry={() => fetchApps(filterStatus)}
            />
          ) : filteredApps.length === 0 ? (
            <NoApplicationsState
              actions={
                <Link href="/dashboard/jobs" className="eh-btn eh-btn-primary eh-btn-sm">
                  Browse Jobs <ArrowRight size={14} />
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app) => (
                <Panel key={app.id} className="overflow-hidden">
                  {/* Status color bar */}
                  <div className={`h-0.5 w-full ${
                    app.status === "SHORTLISTED" ? "bg-amber-400"
                    : app.status === "HIRED" ? "bg-emerald-500"
                    : app.status === "REJECTED" ? "bg-red-400"
                    : app.status === "INTERVIEW_SCHEDULED" ? "bg-[var(--eh-primary-500)]"
                    : "bg-[var(--eh-border)]"
                  }`} />

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* School avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[14px] font-bold text-[var(--eh-primary-700)]">
                        {app.job.school.schoolName.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <button
                              onClick={() => { setSelectedJobId(app.job.id); setSelectedJobTitle(app.job.title); }}
                              className="text-left text-[15px] font-semibold text-[var(--eh-text)] transition-colors hover:text-[var(--eh-primary-700)]"
                            >
                              {app.job.title}
                            </button>
                            <p className="text-[13px] text-[var(--eh-text-3)]">{app.job.school.schoolName}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <ApplicationStatusBadge status={app.status} />
                            {canWithdraw(app.status) ? (
                              confirmWithdrawId === app.id ? (
                                <div className="flex items-center gap-1">
                                  <Button onClick={() => { setConfirmWithdrawId(null); withdrawApplication(app.id); }} disabled={withdrawingAppId === app.id} variant="danger" size="xs">
                                    {withdrawingAppId === app.id ? <Loader2 size={11} className="animate-spin" /> : null}
                                    Confirm
                                  </Button>
                                  <Button variant="secondary" size="xs" onClick={() => setConfirmWithdrawId(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <Button onClick={() => setConfirmWithdrawId(app.id)} disabled={withdrawingAppId === app.id} variant="danger-ghost" size="xs">
                                  <Trash2 size={11} /> Withdraw
                                </Button>
                              )
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-[var(--eh-text-4)]">
                          {app.job.school.city && (
                            <span className="flex items-center gap-1"><MapPin size={10} />{app.job.school.city}</span>
                          )}
                          {app.job.subject && <span>{app.job.subject}</span>}
                          {(app.job.salaryMin || app.job.salaryMax) && (
                            <span className="font-semibold text-[var(--eh-primary-700)]">{formatSalary(app.job.salaryMin, app.job.salaryMax)}</span>
                          )}
                          <span>Applied {timeAgo(app.appliedAt)}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <button
                            onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                            className="flex items-center gap-1 text-[12px] font-medium text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]"
                          >
                            Application Timeline
                            <ChevronDown size={13} className={`transition-transform ${expandedAppId === app.id ? "rotate-180" : ""}`} />
                          </button>
                          <button
                            onClick={() => { setSelectedJobId(app.job.id); setSelectedJobTitle(app.job.title); }}
                            className="text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline"
                          >
                            View Details →
                          </button>
                        </div>

                        {expandedAppId === app.id && (
                          <div className="mt-3 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-3">
                            <ApplicationTimeline applicationId={app.id} appliedAt={app.appliedAt} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden xl:flex xl:flex-col xl:gap-4">
          {/* Application Insights donut */}
          <Panel className="p-5">
            <PanelHeader title="Application Insights" compact />
            <div className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--eh-border)" strokeWidth="14" />
                {(() => {
                  const circumference = 2 * Math.PI * 38;
                  let offset = 0;
                  return donutSlices.map((s) => {
                    const pct = s.count / donutTotal;
                    const dash = pct * circumference;
                    const el = (
                      <circle
                        key={s.label}
                        cx="50" cy="50" r="38"
                        fill="none"
                        stroke={s.color}
                        strokeWidth="14"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <span className="text-[20px] font-bold text-[var(--eh-text)]">{apps.length}</span>
            </div>
            <div className="space-y-2">
              {donutSlices.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-[var(--eh-text-3)]">{s.label}</span>
                  </div>
                  <span className="font-semibold text-[var(--eh-text)]">{s.count}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Track Progress */}
          <Panel className="p-5">
            <PanelHeader title="Track Your Progress" compact />
            <p className="text-[12px] text-[var(--eh-text-3)]">
              {apps.length === 0
                ? "Submit applications to track your career progress."
                : `You've applied to ${apps.length} role${apps.length !== 1 ? "s" : ""}. Keep going!`}
            </p>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 rounded-lg bg-[var(--surface-base)] px-2 py-2 text-center">
                <p className="text-[18px] font-bold text-[var(--eh-text)]">{statusCounts.SHORTLISTED}</p>
                <p className="text-[10px] text-[var(--eh-text-4)]">Shortlisted</p>
              </div>
              <div className="flex-1 rounded-lg bg-[var(--surface-base)] px-2 py-2 text-center">
                <p className="text-[18px] font-bold text-[var(--eh-text)]">{statusCounts.INTERVIEW_SCHEDULED}</p>
                <p className="text-[10px] text-[var(--eh-text-4)]">Interviews</p>
              </div>
              <div className="flex-1 rounded-lg bg-[var(--surface-base)] px-2 py-2 text-center">
                <p className="text-[18px] font-bold text-[var(--eh-text)]">{statusCounts.HIRED}</p>
                <p className="text-[10px] text-[var(--eh-text-4)]">Offered</p>
              </div>
            </div>
          </Panel>

          {/* Resume Review */}
          <Panel className="p-5">
            <PanelHeader title="Resume Review" compact />
            <p className="text-[12px] text-[var(--eh-text-3)]">
              A strong resume increases your chances of getting shortlisted by schools.
            </p>
            <Link
              href="/dashboard/resumes"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--eh-border)] py-2 text-[12px] font-semibold text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)]"
            >
              <FileText size={13} /> Get Resume Review
            </Link>
          </Panel>

          {/* Need Help */}
          <Panel className="p-4">
            <div className="flex items-start gap-2">
              <HelpCircle size={14} className="mt-0.5 shrink-0 text-[var(--eh-primary-600)]" />
              <div>
                <p className="text-[13px] font-semibold text-[var(--eh-text)]">Need Help?</p>
                <p className="mt-0.5 text-[12px] text-[var(--eh-text-3)]">Having trouble with your applications?</p>
                <Link href="mailto:support@theeduhire.in" className="mt-1.5 inline-block text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                  Contact Support →
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
