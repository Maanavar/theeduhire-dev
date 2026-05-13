"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, Loader2, MapPin, Phone, Video } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
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

const eventColors = ["#4f46e5", "#b45309", "#15803d", "#1d4ed8"];
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

function startOfWeekMonday(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toDateInputValue(date: Date) {
  return date.toISOString().split("T")[0];
}

function toTimeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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

  const [applicationId, setApplicationId] = useState("");
  const [mode, setMode] = useState<"VIDEO" | "PHONE" | "IN_PERSON">("VIDEO");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [time, setTime] = useState("16:30");
  const [durationMins, setDurationMins] = useState(30);
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [schoolNotes, setSchoolNotes] = useState("");
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
            const candidates = await getAllRankedCandidates(job.id);
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

  const weekStart = startOfWeekMonday(new Date());
  const days = useMemo(
    () =>
      Array.from({ length: 6 }, (_, idx) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + idx);
        return d;
      }),
    [weekStart]
  );
  const hours = useMemo(() => Array.from({ length: 9 }, (_, idx) => 9 + idx), []);
  const eventsByDay = useMemo(() => {
    const map: Record<string, InterviewItem[]> = {};
    for (const day of days) map[day.toDateString()] = [];
    for (const interview of interviews) {
      const key = new Date(interview.scheduledAt).toDateString();
      if (map[key]) map[key].push(interview);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [days, interviews]);

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
    return <LoadingState title="Loading interviews" message="Fetching your upcoming and past interview schedule." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load interviews"
        message={error}
        actions={
          <button onClick={loadPage} className="eh-btn eh-btn-secondary eh-btn-sm">
            Retry
          </button>
        }
      />
    );
  }

  if (!isSchool) {
    const now = Date.now();
    const upcoming = interviews.filter(
      (iv) => new Date(iv.scheduledAt).getTime() > now && iv.status !== "CANCELLED" && iv.status !== "COMPLETED" && iv.status !== "NO_SHOW"
    );
    const past = interviews.filter(
      (iv) => new Date(iv.scheduledAt).getTime() <= now || iv.status === "CANCELLED" || iv.status === "COMPLETED" || iv.status === "NO_SHOW"
    );

    return (
      <PageShell>
        <PageHeader title="Interviews" subtitle="Track your scheduled and past interviews." />

        {interviews.length === 0 ? (
          <EmptyState
            title="No interviews scheduled yet"
            message="Apply to open roles and schools will send interview invites here."
          />
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em] mb-3">
                  Upcoming - {upcoming.length}
                </p>
                <div className="space-y-3">
                  {upcoming.map((iv) => <TeacherInterviewCard key={iv.id} iv={iv} nowMs={now} onRsvp={rsvpInterview} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em] mb-3">
                  Past - {past.length}
                </p>
                <div className="space-y-3">
                  {past.map((iv) => <TeacherInterviewCard key={iv.id} iv={iv} nowMs={now} onRsvp={rsvpInterview} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Interviews"
        subtitle={`Week of ${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - Asia/Kolkata`}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel className="overflow-hidden">
          <div className="grid grid-cols-[58px_repeat(6,minmax(0,1fr))] border-b border-[#e8edf4]">
            <div />
            {days.map((day) => (
              <div key={day.toISOString()} className="border-l border-[#edf1f6] px-2 py-2 text-center">
                <p className="text-[11px] text-slate-500">{day.toLocaleDateString("en-IN", { weekday: "short" })}</p>
                <p className="text-[22px] font-semibold tracking-[-0.01em] text-slate-800">{day.getDate()}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[58px_repeat(6,minmax(0,1fr))]">
            <div className="border-r border-[#edf1f6]">
              {hours.map((hour) => (
                <div key={hour} className="h-[62px] pr-2 pt-1 text-right text-[11px] text-slate-400">
                  {hour > 12 ? hour - 12 : hour} {hour >= 12 ? "PM" : "AM"}
                </div>
              ))}
            </div>
            {days.map((day, dayIndex) => (
              <div key={day.toISOString()} className="relative h-[558px] border-l border-[#edf1f6]">
                {hours.map((hourIdx) => (
                  <div key={hourIdx} className="absolute left-0 right-0 border-t border-[#f1f4f9]" style={{ top: `${hourIdx * 62}px` }} />
                ))}
                {(eventsByDay[day.toDateString()] || []).map((event, idx) => {
                  const dateObj = new Date(event.scheduledAt);
                  const top = (dateObj.getHours() - 9) * 62 + (dateObj.getMinutes() / 60) * 62;
                  const height = Math.max((event.durationMins / 60) * 62, 42);
                  const isActive = selectedId === event.id;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedId(event.id)}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left text-white shadow-sm"
                      style={{
                        top,
                        height,
                        background: eventColors[(dayIndex + idx) % eventColors.length],
                        outline: isActive ? "2px solid #111827" : "none",
                      }}
                    >
                      <p className="truncate text-[11px] font-semibold">{event.application.applicant?.name || "Candidate"}</p>
                      <p className="truncate text-[10px] opacity-90">
                        {event.application.job.title} - {dateObj.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <p className="text-[12px] text-slate-500">Interview scheduler</p>
          <h2 className="mt-1 text-[26px] font-semibold tracking-[-0.01em] text-slate-900">
            {selected?.application.applicant?.name ? selected.application.applicant.name : "Schedule interview"}
          </h2>

          <label className="eh-label mt-3">Candidate</label>
          <select className="input-base" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
            <option value="">Select applicant</option>
            {candidateOptions.map((entry) => (
              <option key={entry.applicationId} value={entry.applicationId}>
                {entry.applicantName} - {entry.jobTitle} ({entry.status})
              </option>
            ))}
          </select>

          <label className="eh-label mt-3">Mode</label>
          <div className="flex gap-1.5">
            <button onClick={() => setMode("VIDEO")} className={`eh-chip ${mode === "VIDEO" ? "eh-chip-active" : "eh-chip-outline"}`}>
              <Video size={11} /> Online
            </button>
            <button onClick={() => setMode("PHONE")} className={`eh-chip ${mode === "PHONE" ? "eh-chip-active" : "eh-chip-outline"}`}>
              <Phone size={11} /> Phone
            </button>
            <button onClick={() => setMode("IN_PERSON")} className={`eh-chip ${mode === "IN_PERSON" ? "eh-chip-active" : "eh-chip-outline"}`}>
              <MapPin size={11} /> In-person
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="eh-label">Date</label>
              <input type="date" className="input-base" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="eh-label">Time</label>
              <input type="time" className="input-base" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <label className="eh-label mt-3">Duration</label>
          <select className="input-base" value={durationMins} onChange={(e) => setDurationMins(Number(e.target.value))}>
            {[15, 30, 45, 60, 90].map((mins) => (
              <option key={mins} value={mins}>
                {mins} mins
              </option>
            ))}
          </select>

          {mode === "VIDEO" ? (
            <>
              <label className="eh-label mt-3">Meeting link</label>
              <input className="input-base" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
            </>
          ) : null}

          {mode === "IN_PERSON" ? (
            <>
              <label className="eh-label mt-3">Location</label>
              <input className="input-base" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Campus address / room" />
            </>
          ) : null}

          <label className="eh-label mt-3">Notes (optional)</label>
          <textarea className="input-base min-h-[76px]" value={schoolNotes} onChange={(e) => setSchoolNotes(e.target.value)} placeholder="Panel notes / instructions" />

          <button onClick={upsertInterview} disabled={saving} className="eh-btn eh-btn-primary mt-4 w-full">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            Send invite
          </button>

          {selected ? (
            <div className="mt-3 space-y-2 rounded-xl border border-[#e8edf4] bg-[#f8fafd] p-3">
              <p className="text-[12px] font-semibold text-slate-600">Current status: {selected.status}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateInterviewStatus("CONFIRMED")} disabled={updatingStatus} className="eh-btn eh-btn-secondary eh-btn-sm">
                  Confirm
                </button>
                <button onClick={() => updateInterviewStatus("COMPLETED")} disabled={updatingStatus} className="eh-btn eh-btn-secondary eh-btn-sm">
                  Complete
                </button>
                <button onClick={() => updateInterviewStatus("CANCELLED")} disabled={updatingStatus} className="eh-btn eh-btn-ghost eh-btn-sm">
                  Cancel
                </button>
                <button onClick={() => updateInterviewStatus("NO_SHOW")} disabled={updatingStatus} className="eh-btn eh-btn-ghost eh-btn-sm">
                  No show
                </button>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    </PageShell>
  );
}
