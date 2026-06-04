"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Calendar, Download, Filter, Loader2, MapPin, MoreHorizontal, Phone, Video } from "lucide-react";
import { toast } from "sonner";
import { NoInterviewsState, SomethingWentWrongState } from "@/components/system/illustrated-states";
import { InterviewSkeleton } from "@/components/system/dashboard-skeletons";
import { PageHeader, PageShell, Panel, StatusBadge } from "@/components/layout/page-shell";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  getAllRankedCandidates,
  getInterviews,
  getMyJobs,
  scheduleInterview,
  updateInterview,
  type InterviewRecord as InterviewItem,
} from "@/lib/api/hiring-client";
type CandidateOption = {
  applicationId: string;
  applicantName: string;
  jobTitle: string;
  status: string;
};

const teacherStatusCfg: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENDING: { label: "Awaiting confirmation", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
  CONFIRMED: { label: "Confirmed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  COMPLETED: { label: "Completed", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  NO_SHOW: { label: "No show", bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
};
const teacherTypeCfg = {
  VIDEO: { Icon: Video, label: "Video interview" },
  PHONE: { Icon: Phone, label: "Phone interview" },
  IN_PERSON: { Icon: MapPin, label: "In-person interview" },
} as const;

function TeacherInterviewCard({ iv, nowMs, onRsvp }: { iv: InterviewItem; nowMs: number; onRsvp: (id: string, status: "CONFIRMED" | "CANCELLED") => Promise<void> }) {
  const sc = teacherStatusCfg[iv.status] ?? teacherStatusCfg.PENDING;
  const tc = teacherTypeCfg[iv.type];
  const TypeIcon = tc.Icon;
  const date = new Date(iv.scheduledAt);
  const isPast = date.getTime() < nowMs || iv.status === "CANCELLED" || iv.status === "COMPLETED" || iv.status === "NO_SHOW";
  const canRsvp = !isPast && iv.status === "PENDING";
  const [rsvpLoading, setRsvpLoading] = useState<"CONFIRMED" | "CANCELLED" | null>(null);

  const handleRsvp = async (status: "CONFIRMED" | "CANCELLED") => {
    setRsvpLoading(status);
    try {
      await onRsvp(iv.id, status);
    } finally {
      setRsvpLoading(null);
    }
  };

  return (
    <Panel className={`p-5 ${isPast ? "border-[#edf1f8] opacity-70" : "border-[#e1e6f4] shadow-[0_1px_6px_rgba(0,0,0,0.05)]"}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-slate-900 truncate">{iv.application.job.title}</p>
          <p className="text-[13px] text-slate-500 mt-0.5">{iv.application.job.school.schoolName}</p>
        </div>
        <StatusBadge tone={iv.status === "CONFIRMED" ? "success" : iv.status === "PENDING" ? "warning" : iv.status === "COMPLETED" ? "neutral" : "danger"} role="status" aria-label={`Interview status: ${sc.label}`}>
          {sc.label}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-[#f6f8fc] px-3 py-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.08em] mb-1">Date &amp; Time</p>
          <p className="text-[13px] font-semibold text-slate-800">
            {date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} · {iv.durationMins} min
          </p>
        </div>

        <div className="rounded-xl bg-[#f6f8fc] px-3 py-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.08em] mb-1">Format</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TypeIcon size={13} className="text-slate-600 shrink-0" />
            <p className="text-[13px] font-semibold text-slate-800">{tc.label}</p>
          </div>
          {iv.type === "IN_PERSON" && iv.location && (
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{iv.location}</p>
          )}
        </div>
      </div>

      {canRsvp && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => handleRsvp("CONFIRMED")}
            disabled={rsvpLoading !== null}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] py-2 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition-colors"
          >
            {rsvpLoading === "CONFIRMED" ? <Loader2 size={13} className="animate-spin" /> : null}
            Accept
          </button>
          <button
            onClick={() => handleRsvp("CANCELLED")}
            disabled={rsvpLoading !== null}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] py-2 text-[13px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 transition-colors"
          >
            {rsvpLoading === "CANCELLED" ? <Loader2 size={13} className="animate-spin" /> : null}
            Decline
          </button>
        </div>
      )}

      {iv.type === "VIDEO" && !isPast && (
        iv.meetingLink ? (
          <a
            href={iv.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#4f46e5] text-white text-[14px] font-semibold hover:bg-[#4338ca] transition-colors"
          >
            <Video size={15} /> Join Meeting
          </a>
        ) : (
          <p className="text-center text-[12px] text-slate-400 py-1">Meeting link will be shared by the school</p>
        )
      )}

      {iv.type === "PHONE" && !isPast && (
        <p className="text-center text-[12px] text-slate-500 py-1">The school will call you at the scheduled time</p>
      )}
    </Panel>
  );
}


function toDateInputValue(date: Date) {
  return date.toISOString().split("T")[0];
}

function toTimeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildIcs(events: InterviewItem[]) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EduHire//Interviews//EN"];
  for (const iv of events) {
    const start = new Date(iv.scheduledAt);
    const end = new Date(start.getTime() + iv.durationMins * 60 * 1000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${iv.id}@theeduhire.in`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:Interview — ${iv.application.job.title}`,
      `DESCRIPTION:${iv.application.job.school?.schoolName || ""} (${iv.type})`,
      ...(iv.meetingLink ? [`URL:${iv.meetingLink}`] : []),
      ...(iv.location ? [`LOCATION:${iv.location}`] : []),
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export default function InterviewsPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [candidateOptions, setCandidateOptions] = useState<CandidateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [teacherTab, setTeacherTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [mode, setMode] = useState<"VIDEO" | "PHONE" | "IN_PERSON">("VIDEO");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [time, setTime] = useState("16:30");
  const [durationMins, setDurationMins] = useState(30);
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const schoolNotes = "";
  const preselectedApplicationId = searchParams.get("applicationId") || "";

  const isSchool = session?.user?.role === "SCHOOL_ADMIN";

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const fetchedInterviews = await getInterviews();
      setInterviews(fetchedInterviews);
      setSelectedId((current) => current ?? fetchedInterviews[0]?.id ?? null);

      if (isSchool) {
        const activeJobs = (await getMyJobs()).filter((job) => job.status === "ACTIVE");

        const responses = await Promise.all(
          activeJobs.map(async (job) => {
            const { candidates } = await getAllRankedCandidates(job.id);
            return candidates
              .filter((entry) => !["HIRED", "REJECTED"].includes(entry.status))
              .map((entry) => ({
                applicationId: entry.id,
                applicantName: entry.applicant.name,
                jobTitle: job.title,
                status: entry.status,
              }));
          })
        );

        const dedup = new Map<string, CandidateOption>();
        responses.flat().forEach((entry) => dedup.set(entry.applicationId, entry));
        const options = Array.from(dedup.values());
        setCandidateOptions(options);
        setApplicationId((current) => current || preselectedApplicationId || options[0]?.applicationId || "");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load interviews"));
    } finally {
      setLoading(false);
    }
  }, [isSchool, preselectedApplicationId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!preselectedApplicationId) return;
    setApplicationId(preselectedApplicationId);
    const existingInterview = interviews.find((entry) => entry.applicationId === preselectedApplicationId);
    if (existingInterview) setSelectedId(existingInterview.id);
    else setSelectedId(null);
  }, [interviews, preselectedApplicationId]);

  const selected = useMemo(
    () => interviews.find((interview) => interview.id === selectedId) || null,
    [interviews, selectedId]
  );

  useEffect(() => {
    if (!selected) return;
    const dateObj = new Date(selected.scheduledAt);
    setApplicationId(selected.applicationId);
    setMode(selected.type);
    setDate(toDateInputValue(dateObj));
    setTime(toTimeInputValue(dateObj));
    setDurationMins(selected.durationMins);
    setMeetingLink(selected.meetingLink || "");
    setLocation(selected.location || "");
  }, [selected]);

  const upsertInterview = async () => {
    if (!applicationId) {
      toast.error("Select a candidate to schedule interview");
      return;
    }
    const scheduledAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error("Choose valid date and time");
      return;
    }

    setSaving(true);
    try {
      const interview = await scheduleInterview({
        applicationId,
        scheduledAt: scheduledAt.toISOString(),
        durationMins,
        type: mode,
        meetingLink: mode === "VIDEO" ? meetingLink : "",
        location: mode === "IN_PERSON" ? location : "",
      });
      toast.success("Interview scheduled");
      await loadPage();
      if (interview.id) setSelectedId(interview.id);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to schedule interview"));
    } finally {
      setSaving(false);
    }
  };

  const rsvpInterview = async (interviewId: string, status: "CONFIRMED" | "CANCELLED") => {
    try {
      await updateInterview(interviewId, { status });
      toast.success(status === "CONFIRMED" ? "Interview accepted" : "Interview declined");
      await loadPage();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update interview"));
    }
  };

  const updateInterviewStatus = async (status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW") => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      await updateInterview(selected.id, {
        status,
        schoolNotes: schoolNotes.trim() || undefined,
      });
      toast.success(`Interview marked as ${status.toLowerCase()}`);
      await loadPage();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update interview"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <InterviewSkeleton rows={4} />;
  }

  if (error) {
    return (
      <SomethingWentWrongState
        title="Couldn't load interviews"
        message={error}
        onRetry={loadPage}
      />
    );
  }

  const now = Date.now();

  if (!isSchool) {
    const upcoming = interviews.filter(
      (iv) => new Date(iv.scheduledAt).getTime() > now && iv.status !== "CANCELLED" && iv.status !== "COMPLETED" && iv.status !== "NO_SHOW"
    );
    const completed = interviews.filter((iv) => iv.status === "COMPLETED");
    const cancelled = interviews.filter((iv) => iv.status === "CANCELLED" || iv.status === "NO_SHOW");
    const past = interviews.filter(
      (iv) => new Date(iv.scheduledAt).getTime() <= now || iv.status === "CANCELLED" || iv.status === "COMPLETED" || iv.status === "NO_SHOW"
    );

    const teacherTabs = [
      { key: "upcoming" as const, label: "Upcoming", count: upcoming.length },
      { key: "completed" as const, label: "Completed", count: completed.length },
      { key: "cancelled" as const, label: "Cancelled", count: cancelled.length },
    ];
    const teacherTabJobs = teacherTab === "upcoming" ? upcoming : teacherTab === "completed" ? completed : cancelled;

    const donutTotal = interviews.length || 1;
    const completedPct = Math.round((completed.length / donutTotal) * 100);
    const cancelledPct = Math.round((cancelled.length / donutTotal) * 100);

    const daysUntil = (date: Date) => Math.ceil((date.getTime() - now) / (1000 * 60 * 60 * 24));

    return (
      <PageShell>
        <PageHeader
          title="Interviews"
          subtitle="Manage your upcoming and past interview history."
          actions={
            <button
              onClick={() => {
                if (upcoming.length === 0) {
                  toast.error("No upcoming interviews to add");
                  return;
                }
                downloadBlob(buildIcs(upcoming), "eduhire-interviews.ics", "text/calendar;charset=utf-8");
              }}
              className="eh-btn eh-btn-secondary"
            >
              <Calendar size={14} /> Add to Calendar
            </button>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
          {/* Main content */}
          <div className="min-w-0 space-y-4">
            {/* Tabs */}
            <Panel>
              <div className="flex items-center gap-1 overflow-x-auto px-4 pt-4 pb-0 scrollbar-none">
                {teacherTabs.map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setTeacherTab(key)}
                    className={[
                      "flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 text-[13px] font-medium transition-colors",
                      teacherTab === key
                        ? "border-[var(--eh-primary-600)] text-[var(--eh-primary-700)]"
                        : "border-transparent text-[var(--eh-text-3)] hover:text-[var(--eh-text)]",
                    ].join(" ")}
                  >
                    {label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${teacherTab === key ? "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]" : "bg-[var(--surface-base)] text-[var(--eh-text-4)]"}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            {interviews.length === 0 ? (
              <NoInterviewsState
                actions={
                  <Link href="/dashboard/jobs" className="eh-btn eh-btn-primary eh-btn-sm">
                    Browse Jobs
                  </Link>
                }
              />
            ) : teacherTabJobs.length === 0 ? (
              <NoInterviewsState
                actions={undefined}
              />
            ) : (
              <div className="space-y-3">
                {teacherTabJobs.map((iv) => {
                  const date = new Date(iv.scheduledAt);
                  const days = daysUntil(date);
                  return (
                    <div key={iv.id}>
                      <TeacherInterviewCard iv={iv} nowMs={now} onRsvp={rsvpInterview} />
                      {teacherTab === "upcoming" && days > 0 && days <= 30 && (
                        <div className={`-mt-2 ml-4 mb-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${days <= 3 ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          In {days} day{days !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden xl:flex xl:flex-col xl:gap-4">
            {/* Interview Prep Center */}
            <Panel className="p-5">
              <p className="mb-1 text-[13px] font-semibold text-[var(--eh-text)]">Interview Prep Center</p>
              <p className="mb-3 text-[12px] text-[var(--eh-text-3)]">Prepare well and increase your chances of success with these resources.</p>
              <div className="flex flex-wrap gap-2">
                {["Common Questions", "Tech Prep", "Behavioral"].map((topic) => (
                  <span key={topic} className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2.5 py-1 text-[11px] font-medium text-[var(--eh-text-2)]">
                    {topic}
                  </span>
                ))}
              </div>
            </Panel>

            {/* Your Progress donut */}
            <Panel className="p-5 text-center">
              <p className="mb-3 text-[13px] font-semibold text-[var(--eh-text)]">Your Progress</p>
              <div className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="var(--eh-border)" strokeWidth="14" />
                  {interviews.length > 0 && (
                    <>
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="14"
                        strokeDasharray={`${(completed.length / donutTotal) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                      />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#f87171" strokeWidth="14"
                        strokeDasharray={`${(cancelled.length / donutTotal) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                        strokeDashoffset={-(completed.length / donutTotal) * 2 * Math.PI * 38}
                      />
                    </>
                  )}
                </svg>
                <span className="text-[18px] font-bold text-[var(--eh-text)]">{completedPct}%</span>
              </div>
              <div className="flex justify-center gap-4 text-[12px]">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-[var(--eh-text-3)]">Completed {completedPct}%</span></div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /><span className="text-[var(--eh-text-3)]">Cancelled {cancelledPct}%</span></div>
              </div>
            </Panel>

            {/* Upcoming Reminders */}
            {upcoming.length > 0 && (
              <Panel className="p-4">
                <p className="mb-3 text-[13px] font-semibold text-[var(--eh-text)]">Upcoming Reminders</p>
                <div className="space-y-3">
                  {upcoming.slice(0, 3).map((iv) => {
                    const d = new Date(iv.scheduledAt);
                    return (
                      <div key={iv.id} className="flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--eh-primary-50)] text-center">
                          <p className="text-[9px] font-bold uppercase text-[var(--eh-primary-600)]">{d.toLocaleDateString("en-IN", { month: "short" })}</p>
                          <p className="text-[13px] font-bold leading-none text-[var(--eh-primary-700)]">{d.getDate()}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-[var(--eh-text)]">{iv.application.job.title}</p>
                          <p className="truncate text-[11px] text-[var(--eh-text-3)]">{iv.application.job.school.schoolName}</p>
                          <p className="text-[10px] text-[var(--eh-text-4)]">{d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {upcoming.length > 3 && (
                  <p className="mt-2 text-center text-[11px] text-[var(--eh-text-4)]">+{upcoming.length - 3} more in Upcoming</p>
                )}
              </Panel>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  // ── School admin view ────────────────────────────────────────────────────
  const todayInterviews = interviews.filter((iv) => {
    const d = new Date(iv.scheduledAt);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });
  const upcomingInterviews = interviews.filter((iv) => new Date(iv.scheduledAt).getTime() > now && iv.status !== "CANCELLED");
  const completedInterviews = interviews.filter((iv) => iv.status === "COMPLETED");
  const cancelledInterviews = interviews.filter((iv) => iv.status === "CANCELLED");

  const jobOptions = Array.from(new Set(interviews.map((iv) => iv.application.job.title))).sort();

  const filteredInterviews = interviews.filter((iv) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const haystack = `${iv.application.applicant?.name || ""} ${iv.application.job.title}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (jobFilter && iv.application.job.title !== jobFilter) return false;
    if (typeFilter && iv.type !== typeFilter) return false;
    if (statusFilter && iv.status !== statusFilter) return false;
    if (dateFilter) {
      const d = new Date(iv.scheduledAt);
      if (toDateInputValue(d) !== dateFilter) return false;
    }
    return true;
  });

  const hasActiveFilters = Boolean(search || jobFilter || typeFilter || statusFilter || dateFilter);
  const clearFilters = () => {
    setSearch("");
    setJobFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setDateFilter("");
  };

  const exportInterviewsCsv = () => {
    if (filteredInterviews.length === 0) {
      toast.error("No interviews to export");
      return;
    }
    const header = ["Candidate", "Job", "Type", "Date", "Time", "Duration (min)", "Status"];
    const rows = filteredInterviews.map((iv) => {
      const d = new Date(iv.scheduledAt);
      return [
        iv.application.applicant?.name || "Candidate",
        iv.application.job.title,
        iv.type,
        d.toLocaleDateString("en-IN"),
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        String(iv.durationMins),
        iv.status,
      ];
    });
    const csv = [header, ...rows]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadBlob(csv, "interviews.csv", "text/csv;charset=utf-8");
  };

  const setRowStatus = async (interviewId: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW") => {
    setOpenMenuId(null);
    try {
      await updateInterview(interviewId, { status });
      toast.success(`Interview marked as ${status.toLowerCase().replace("_", " ")}`);
      await loadPage();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update interview"));
    }
  };

  const statusConfig: Record<string, { label: string; tone: "success" | "warning" | "neutral" | "danger" }> = {
    PENDING: { label: "Scheduled", tone: "warning" },
    CONFIRMED: { label: "Confirmed", tone: "success" },
    COMPLETED: { label: "Completed", tone: "neutral" },
    CANCELLED: { label: "Cancelled", tone: "danger" },
    NO_SHOW: { label: "No Show", tone: "danger" },
  };

  const typeIcon = {
    VIDEO: <Video size={13} className="text-[var(--eh-primary-600)]" />,
    PHONE: <Phone size={13} className="text-emerald-600" />,
    IN_PERSON: <MapPin size={13} className="text-amber-600" />,
  };
  const typeLabel = { VIDEO: "Video Interview", PHONE: "Phone Interview", IN_PERSON: "Face to Face" };

  return (
    <PageShell>
      <PageHeader
        title="Interviews"
        subtitle="Schedule, track, and manage candidate interviews."
        actions={
          <div className="flex gap-2">
            <button onClick={exportInterviewsCsv} className="eh-btn eh-btn-secondary"><Download size={14} /> Export</button>
            <button onClick={() => setSelectedId(null)} className="eh-btn eh-btn-primary">
              <Calendar size={14} /> + Schedule Interview
            </button>
          </div>
        }
      />

      {/* KPI Row — matches Figma */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "All Interviews", sub: "All time", value: interviews.length, icon: <Calendar size={18} className="text-[var(--eh-primary-600)]" />, bg: "bg-[var(--eh-primary-50)]" },
          { label: "Today", sub: "Interviews today", value: todayInterviews.length, icon: <Calendar size={18} className="text-emerald-600" />, bg: "bg-emerald-50" },
          { label: "Upcoming", sub: "Next 7 days", value: upcomingInterviews.filter((iv) => new Date(iv.scheduledAt).getTime() - now < 7 * 86400 * 1000).length, icon: <Calendar size={18} className="text-amber-600" />, bg: "bg-amber-50" },
          { label: "Completed", sub: "This month", value: completedInterviews.length, icon: <Calendar size={18} className="text-slate-500" />, bg: "bg-slate-50" },
          { label: "Cancelled", sub: "This month", value: cancelledInterviews.length, icon: <Calendar size={18} className="text-red-500" />, bg: "bg-red-50" },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-[var(--eh-border)] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.bg}`}>{m.icon}</div>
            <div>
              <p className="text-[24px] font-bold leading-none text-[var(--eh-text)]">{m.value}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[var(--eh-text-3)]">{m.label}</p>
              <p className="text-[10px] text-[var(--eh-text-4)]">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        {/* Main table */}
        <Panel>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--eh-border)] px-4 py-3">
            <input
              placeholder="Search by candidate or job..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base max-w-[260px] flex-1"
            />
            <div className="eh-select-wrap max-w-[160px] w-full">
              <select className="input-base w-full" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}>
                <option value="">All Jobs</option>
                {jobOptions.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>
            <div className="eh-select-wrap max-w-[180px] w-full">
              <select className="input-base w-full" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Interview Types</option>
                <option value="VIDEO">Video Interview</option>
                <option value="PHONE">Phone Interview</option>
                <option value="IN_PERSON">Face to Face</option>
              </select>
            </div>
            <div className="eh-select-wrap max-w-[140px] w-full">
              <select className="input-base w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PENDING">Scheduled</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
            <input type="date" className="input-base max-w-[160px]" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--eh-border)] px-3 py-2 text-[13px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"
              >
                <Filter size={13} /> Clear
              </button>
            )}
          </div>

          {interviews.length === 0 ? (
            <div className="p-6">
              <NoInterviewsState
                actions={<Link href="/dashboard/applicants" className="eh-btn eh-btn-secondary eh-btn-sm">Open applicants</Link>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-[var(--eh-border)] bg-[var(--surface-base)]">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Candidate</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Job</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Interview Type</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Date & Time ↓</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Interviewer</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--eh-border)]">
                  {filteredInterviews.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[var(--eh-text-3)]">
                        No interviews match your filters.{" "}
                        <button onClick={clearFilters} className="font-semibold text-[var(--eh-primary-600)] hover:underline">Clear filters</button>
                      </td>
                    </tr>
                  )}
                  {filteredInterviews.map((iv) => {
                    const dateObj = new Date(iv.scheduledAt);
                    const sc = statusConfig[iv.status] ?? statusConfig.PENDING;
                    const isPast = dateObj.getTime() < now;
                    return (
                      <tr key={iv.id} className={["group transition-colors hover:bg-[var(--surface-base)]", isPast ? "opacity-60" : ""].join(" ")}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-100)] text-[13px] font-bold text-[var(--eh-primary-700)]">
                              {(iv.application.applicant?.name || "?").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[var(--eh-text)]">{iv.application.applicant?.name || "Candidate"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] font-medium text-[var(--eh-text)]">{iv.application.job.title}</p>
                          <p className="text-[11px] text-[var(--eh-text-3)]">{iv.application.job.school?.schoolName || ""}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {typeIcon[iv.type]}
                            <span className="text-[13px] text-[var(--eh-text-2)]">{typeLabel[iv.type]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] font-medium text-[var(--eh-text)]">
                            {dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-[11px] text-[var(--eh-text-3)]">
                            {dateObj.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} · {iv.durationMins} min
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-100)] text-[11px] font-bold text-[var(--eh-primary-700)]">
                              {(iv.application.job.school?.schoolName || "S").charAt(0)}
                            </div>
                            <span className="text-[12px] text-[var(--eh-text-2)]">School Admin</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge tone={sc.tone}>{sc.label}</StatusBadge>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {!isPast && iv.meetingLink && (
                              <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className="eh-btn eh-btn-primary eh-btn-sm">
                                Join
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(iv.id);
                                setApplicationId(iv.applicationId);
                              }}
                              className="eh-btn eh-btn-secondary eh-btn-sm"
                            >
                              {isPast ? "View" : "Reschedule"}
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenMenuId((prev) => prev === iv.id ? null : iv.id)}
                                className="rounded-lg border border-[var(--eh-border)] p-1.5 text-[var(--eh-text-4)] hover:bg-[var(--surface-base)]"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                              {openMenuId === iv.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                  <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-[var(--eh-border)] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
                                    <button onClick={() => setRowStatus(iv.id, "CONFIRMED")} className="block w-full px-3 py-1.5 text-left text-[12px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">Confirm</button>
                                    <button onClick={() => setRowStatus(iv.id, "COMPLETED")} className="block w-full px-3 py-1.5 text-left text-[12px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">Mark completed</button>
                                    <button onClick={() => setRowStatus(iv.id, "NO_SHOW")} className="block w-full px-3 py-1.5 text-left text-[12px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">Mark no-show</button>
                                    <button onClick={() => setRowStatus(iv.id, "CANCELLED")} className="block w-full px-3 py-1.5 text-left text-[12px] text-red-600 hover:bg-red-50">Cancel interview</button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Right sidebar: Today + Upcoming + Schedule form */}
        <div className="flex flex-col gap-4">
          {/* Today's interviews */}
          <Panel className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Today&apos;s Interviews</h3>
              <span className="rounded-full bg-[var(--eh-primary-50)] px-2 py-0.5 text-[11px] font-bold text-[var(--eh-primary-700)]">{todayInterviews.length}</span>
            </div>
            {todayInterviews.length === 0 ? (
              <p className="text-[12px] text-[var(--eh-text-3)]">No interviews today.</p>
            ) : (
              <div className="space-y-2">
                {todayInterviews.slice(0, 4).map((iv) => {
                  const sc = statusConfig[iv.status] ?? statusConfig.PENDING;
                  return (
                    <div key={iv.id} className="flex items-center gap-2.5 border-b border-[var(--eh-border)] pb-2 last:border-0 last:pb-0">
                      <div className="shrink-0 w-[52px]">
                        <p className="text-[11px] font-bold text-[var(--eh-primary-700)]">
                          {new Date(iv.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-[var(--eh-text)]">{iv.application.applicant?.name || "Candidate"}</p>
                        <p className="truncate text-[11px] text-[var(--eh-text-3)]">{iv.application.job.title}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {typeIcon[iv.type]}
                        <StatusBadge tone={sc.tone}>{sc.label}</StatusBadge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {todayInterviews.length > 4 && (
              <p className="mt-2 text-center text-[11px] font-semibold text-[var(--eh-primary-600)]">View all today&apos;s interviews →</p>
            )}
          </Panel>

          {/* Upcoming interviews */}
          {upcomingInterviews.length > 0 && (
            <Panel className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Upcoming Interviews</h3>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">{upcomingInterviews.length}</span>
              </div>
              <div className="space-y-2">
                {upcomingInterviews.slice(0, 4).map((iv) => {
                  const d = new Date(iv.scheduledAt);
                  return (
                    <div key={iv.id} className="flex items-center gap-2.5 border-b border-[var(--eh-border)] pb-2 last:border-0 last:pb-0">
                      <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--eh-primary-50)] text-center">
                        <p className="text-[10px] font-bold uppercase text-[var(--eh-primary-600)]">{d.toLocaleDateString("en-IN", { month: "short" })}</p>
                        <p className="text-[14px] font-bold leading-none text-[var(--eh-primary-700)]">{d.getDate()}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-[var(--eh-text)]">{iv.application.applicant?.name || "Candidate"}</p>
                        <p className="truncate text-[11px] text-[var(--eh-text-3)]">{iv.application.job.title}</p>
                        <p className="text-[10px] text-[var(--eh-text-4)]">{d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {upcomingInterviews.length > 4 && (
                <p className="mt-2 text-center text-[11px] font-semibold text-[var(--eh-primary-600)]">View all upcoming →</p>
              )}
            </Panel>
          )}

          {/* Quick schedule form */}
          <Panel className="p-4">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-4">
              {selected ? "Update Interview" : "Quick Schedule"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="eh-label">Candidate</label>
                <div className="eh-select-wrap w-full">
                  <select className="input-base w-full" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
                    <option value="">Select applicant</option>
                    {candidateOptions.map((entry) => (
                      <option key={entry.applicationId} value={entry.applicationId}>
                        {entry.applicantName} — {entry.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="eh-label">Interview Type</label>
                <div className="flex gap-1.5">
                  <button onClick={() => setMode("VIDEO")} className={`eh-chip ${mode === "VIDEO" ? "eh-chip-active" : "eh-chip-outline"}`}>
                    <Video size={11} /> Video
                  </button>
                  <button onClick={() => setMode("PHONE")} className={`eh-chip ${mode === "PHONE" ? "eh-chip-active" : "eh-chip-outline"}`}>
                    <Phone size={11} /> Phone
                  </button>
                  <button onClick={() => setMode("IN_PERSON")} className={`eh-chip ${mode === "IN_PERSON" ? "eh-chip-active" : "eh-chip-outline"}`}>
                    <MapPin size={11} /> In-person
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="eh-label">Date</label>
                  <input type="date" className="input-base" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="eh-label">Time</label>
                  <input type="time" className="input-base" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="eh-label">Duration</label>
                <div className="eh-select-wrap w-full">
                  <select className="input-base w-full" value={durationMins} onChange={(e) => setDurationMins(Number(e.target.value))}>
                    {[15, 30, 45, 60, 90].map((mins) => <option key={mins} value={mins}>{mins} mins</option>)}
                  </select>
                </div>
              </div>

              {mode === "VIDEO" && (
                <div>
                  <label className="eh-label">Meeting link</label>
                  <input className="input-base" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
                </div>
              )}
              {mode === "IN_PERSON" && (
                <div>
                  <label className="eh-label">Location</label>
                  <input className="input-base" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Campus address / room" />
                </div>
              )}
            </div>

            <button onClick={upsertInterview} disabled={saving} className="eh-btn eh-btn-primary mt-4 w-full">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
              {selected ? "Update Interview" : "Schedule Interview"}
            </button>

            {selected && (
              <div className="mt-3 space-y-2 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">Update status</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updateInterviewStatus("CONFIRMED")} disabled={updatingStatus} className="eh-btn eh-btn-secondary eh-btn-sm">Confirm</button>
                  <button onClick={() => updateInterviewStatus("COMPLETED")} disabled={updatingStatus} className="eh-btn eh-btn-secondary eh-btn-sm">Complete</button>
                  <button onClick={() => updateInterviewStatus("CANCELLED")} disabled={updatingStatus} className="eh-btn eh-btn-ghost eh-btn-sm text-red-600">Cancel</button>
                  <button onClick={() => updateInterviewStatus("NO_SHOW")} disabled={updatingStatus} className="eh-btn eh-btn-ghost eh-btn-sm">No show</button>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
