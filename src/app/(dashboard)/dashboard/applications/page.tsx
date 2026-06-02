"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { formatSalary, timeAgo } from "@/lib/utils";
import { MapPin, ArrowRight, RefreshCw, Download, ChevronDown, Filter, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar, PageHeader, PageShell, Panel, StatusBadge, Toolbar } from "@/components/layout/page-shell";
import { EmptyState, ErrorState } from "@/components/system/system-states";
import { CardListSkeleton } from "@/components/system/dashboard-skeletons";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  getApplications,
  type TeacherApplicationRecord as AppItem,
  withdrawApplication as withdrawTeacherApplication,
} from "@/lib/api/applications-client";

const StatsCards = dynamic(() => import("@/components/dashboard/stats-cards"), { ssr: false });
const JobDetailModal = dynamic(() => import("@/components/jobs/job-detail-modal"), { ssr: false });
const ApplicationTimeline = dynamic(() => import("@/components/applications/application-timeline").then((m) => m.ApplicationTimeline), { ssr: false });

const STATUS_CONFIG: Record<string, { label: string; tone: "neutral" | "info" | "warning" | "brand" | "danger" | "success" }> = {
  PENDING: { label: "Pending Review", tone: "neutral" },
  REVIEWED: { label: "Reviewed", tone: "info" },
  SHORTLISTED: { label: "Shortlisted", tone: "warning" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", tone: "brand" },
  INTERVIEW_COMPLETED: { label: "Interview Completed", tone: "brand" },
  REJECTED: { label: "Not Selected", tone: "danger" },
  HIRED: { label: "Hired", tone: "success" },
};

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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);

  const fetchApps = useCallback(async (status = "ALL", from = "", to = "") => {
    setLoading(true);
    setError("");

    try {
      const data = await getApplications({ status, from, to });
      setApps(data);
      setExpandedAppId((current) => current ?? data[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load applications"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: apps.length, PENDING: 0, REVIEWED: 0, SHORTLISTED: 0, REJECTED: 0, HIRED: 0 };
    for (const app of apps) {
      if (app.status in counts) counts[app.status as keyof typeof counts] += 1;
    }
    return counts;
  }, [apps]);

  const applyFilters = () => fetchApps(filterStatus, fromDate, toDate);

  const clearFilters = () => {
    setFilterStatus("ALL");
    setFromDate("");
    setToDate("");
    fetchApps("ALL", "", "");
  };

  const exportCsv = () => {
    if (apps.length === 0) {
      toast.error("No applications to export");
      return;
    }
    const headers = ["School", "Job Title", "Status", "Applied At", "Reviewed At"];
    const rows = apps.map((app) => [
      app.job.school.schoolName,
      app.job.title,
      app.status,
      new Date(app.appliedAt).toLocaleDateString("en-IN"),
      app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString("en-IN") : "",
    ]);
    const sanitize = (value: string) => (/^[=+\-@]/.test(value) ? `\t${value}` : value);
    const csv = [headers, ...rows].map((row) => row.map(sanitize).map((v) => `"${v}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${Date.now()}.csv`;
    a.click();
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

  return (
    <PageShell>
      <PageHeader title="My Applications" subtitle="Track status progress, school feedback, and timeline updates." />

      <JobDetailModal
        open={!!selectedJobId}
        jobId={selectedJobId}
        jobTitle={selectedJobTitle}
        onClose={() => {
          setSelectedJobId(null);
          setSelectedJobTitle("");
        }}
      />

      <StatsCards />

      <Panel>
        <Toolbar className="rounded-none border-0 border-b border-eh shadow-none">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.04em] text-eh-text3">
            <Filter size={14} /> Applications
          </div>
          <Button variant="secondary" size="sm" onClick={exportCsv} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </Toolbar>

        <FilterBar className="border-t-0 pt-4">
          {(["ALL", "PENDING", "REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"] as const).map((status) => {
            const active = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={[
                  "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-eh text-eh-text2 hover:border-brand-200 hover:text-brand-700",
                ].join(" ")}
              >
                {status === "ALL" ? "All" : STATUS_CONFIG[status].label} ({statusCounts[status]})
              </button>
            );
          })}
        </FilterBar>

        <FilterBar className="pt-0 md:grid md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-base" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-base" />
          <Button variant="secondary" size="sm" onClick={applyFilters}>Apply</Button>
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
        </FilterBar>
      </Panel>

      {loading ? (
        <CardListSkeleton cards={5} />
      ) : error ? (
        <ErrorState
          title="Failed to load applications"
          message={error}
          actions={
            <Button variant="primary" size="sm" onClick={applyFilters}>
              <RefreshCw size={13} /> Try again
            </Button>
          }
        />
      ) : apps.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message="Start browsing teaching positions and submit your first application."
          actions={
            <Link href="/dashboard/jobs" className="eh-btn eh-btn-primary eh-btn-sm">
              Browse Jobs <ArrowRight size={14} />
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Panel key={app.id} className="p-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
                <div>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedJobId(app.job.id);
                        setSelectedJobTitle(app.job.title);
                      }}
                      className="text-left text-[15px] font-semibold text-eh-text transition-colors hover:text-brand-700"
                    >
                      {app.job.title}
                    </button>
                    <div className="flex items-center gap-2">
                      <ApplicationStatusBadge status={app.status} />
                      {canWithdraw(app.status) ? (
                        confirmWithdrawId === app.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => {
                                setConfirmWithdrawId(null);
                                withdrawApplication(app.id);
                              }}
                              disabled={withdrawingAppId === app.id}
                              variant="danger"
                              size="xs"
                            >
                              {withdrawingAppId === app.id ? <Loader2 size={11} className="animate-spin" /> : null}
                              Confirm
                            </Button>
                            <Button variant="secondary" size="xs" onClick={() => setConfirmWithdrawId(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setConfirmWithdrawId(app.id)}
                            disabled={withdrawingAppId === app.id}
                            variant="danger-ghost"
                            size="xs"
                          >
                            <Trash2 size={11} />
                            Withdraw
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>
                  <p className="mb-2 text-sm font-medium text-eh-text2">{app.job.school.schoolName}</p>
                  <div className="mb-3 flex flex-wrap gap-3 text-xs font-medium text-eh-text3">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {app.job.school.city}</span>
                    <span>{app.job.subject}</span>
                    <span className="font-semibold text-brand-700">{formatSalary(app.job.salaryMin, app.job.salaryMax)}</span>
                  </div>
                  <div className="text-[12px] text-eh-text3">Applied {timeAgo(app.appliedAt)}</div>
                </div>

                <div className="rounded-xl border border-eh bg-eh-soft p-3">
                  <button
                    onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                    className="mb-2 flex w-full items-center justify-between text-[12px] font-semibold text-eh-text2"
                  >
                    <span>Application Timeline</span>
                    <ChevronDown size={14} className={expandedAppId === app.id ? "rotate-180" : ""} />
                  </button>
                  {expandedAppId === app.id ? (
                    <ApplicationTimeline applicationId={app.id} appliedAt={app.appliedAt} />
                  ) : (
                    <p className="text-[12px] text-eh-text3">Expand to view full status history and notes.</p>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </PageShell>
  );
}
