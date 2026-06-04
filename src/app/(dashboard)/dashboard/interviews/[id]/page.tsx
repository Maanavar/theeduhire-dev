"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Send,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell, Panel, StatusBadge } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/system/system-states";
import { getApiErrorMessage } from "@/lib/api/client";
import { getInterviews, updateInterview, type InterviewRecord } from "@/lib/api/hiring-client";

const statusConfig: Record<string, { label: string; tone: "success" | "warning" | "neutral" | "danger" }> = {
  PENDING: { label: "Scheduled", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  COMPLETED: { label: "Completed", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  NO_SHOW: { label: "No Show", tone: "danger" },
};

const typeConfig = {
  VIDEO: { icon: Video, label: "Video Interview", color: "text-[var(--eh-primary-600)]", bg: "bg-[var(--eh-primary-50)]" },
  PHONE: { icon: Phone, label: "Phone Interview", color: "text-emerald-600", bg: "bg-emerald-50" },
  IN_PERSON: { icon: MapPin, label: "Face to Face", color: "text-amber-600", bg: "bg-amber-50" },
} as const;

export default function InterviewDetailPage() {
  const params = useParams();
  const interviewId = params?.id as string;

  const [interview, setInterview] = useState<InterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [schoolNotes, setSchoolNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const all = await getInterviews();
      const found = all.find((iv) => iv.id === interviewId);
      if (!found) {
        setError("Interview not found.");
      } else {
        setInterview(found);
        setSchoolNotes(found.schoolNotes || "");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load interview"));
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW") => {
    if (!interview) return;
    setUpdatingStatus(true);
    try {
      await updateInterview(interview.id, { status, schoolNotes: schoolNotes.trim() || undefined });
      toast.success(`Interview marked as ${status.toLowerCase()}`);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update interview"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[var(--eh-text-4)]" />
        </div>
      </PageShell>
    );
  }

  if (error || !interview) {
    return (
      <ErrorState
        title="Interview not found"
        message={error || "This interview may have been deleted."}
        actions={<Link href="/dashboard/interviews" className="eh-btn eh-btn-secondary eh-btn-sm">Back to Interviews</Link>}
      />
    );
  }

  const dateObj = new Date(interview.scheduledAt);
  const isPast = dateObj.getTime() < Date.now();
  const sc = statusConfig[interview.status] ?? statusConfig.PENDING;
  const tc = typeConfig[interview.type];
  const TypeIcon = tc.icon;
  const candidateName = interview.application.applicant?.name || "Candidate";
  const candidateEmail = interview.application.applicant?.email;

  const mockTimeline = [
    { label: "Interview Scheduled", detail: `${candidateName} was invited`, time: dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    { label: "Candidate Confirmed", detail: `${candidateName} accepted the interview invitation`, time: dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    { label: "Reminder Sent", detail: "Interview reminder sent to candidate", time: "1 day before" },
  ];

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[var(--eh-text-3)]">
        <Link href="/dashboard/interviews" className="hover:text-[var(--eh-text-2)] flex items-center gap-1">
          <ArrowLeft size={13} /> Interviews
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--eh-text-2)]">{interview.application.job.title}</span>
        <ChevronRight size={12} />
        <span className="text-[var(--eh-text)]">Interview Detail</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">Interview Detail</h1>
          <StatusBadge tone={sc.tone}>{sc.label}</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="eh-btn eh-btn-secondary"><Send size={13} /> Send Reminder</button>
          <button className="eh-btn eh-btn-secondary"><Calendar size={13} /> Reschedule</button>
          <button className="eh-btn eh-btn-secondary"><MoreHorizontal size={13} /> More</button>
        </div>
      </div>

      {/* Quick action buttons */}
      {!isPast && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => updateStatus("CONFIRMED")} disabled={updatingStatus || interview.status === "CONFIRMED"} className="eh-btn eh-btn-secondary border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">
            <CheckCircle2 size={14} /> Mark Completed
          </button>
          <button onClick={() => updateStatus("NO_SHOW")} disabled={updatingStatus} className="eh-btn eh-btn-secondary border-amber-300 text-amber-700 hover:bg-amber-50">
            Mark No-Show
          </button>
          <button onClick={() => updateStatus("CANCELLED")} disabled={updatingStatus} className="eh-btn eh-btn-secondary border-red-300 text-red-600 hover:bg-red-50">
            Cancel Interview
          </button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* Left: main details */}
        <div className="space-y-4">
          {/* Candidate + Job info */}
          <Panel className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--eh-primary-100)] text-[22px] font-bold text-[var(--eh-primary-700)]">
                {candidateName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[18px] font-semibold text-[var(--eh-text)]">{candidateName}</h2>
                  <StatusBadge tone="success" dot>Confirmed</StatusBadge>
                </div>
                {candidateEmail && (
                  <a href={`mailto:${candidateEmail}`} className="mt-1 flex items-center gap-1 text-[13px] text-[var(--eh-text-3)] hover:underline">
                    <Mail size={12} /> {candidateEmail}
                  </a>
                )}
                <p className="mt-0.5 flex items-center gap-1 text-[13px] text-[var(--eh-text-3)]">
                  <MapPin size={12} /> Tamil Nadu, India
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Applied For</p>
                <Link href={`/dashboard/my-jobs`} className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">
                  {interview.application.job.title} <ExternalLink size={11} />
                </Link>
                <p className="text-[11px] text-[var(--eh-text-3)]">Active</p>
              </div>
            </div>
          </Panel>

          {/* Interview details grid */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-4">Interview Details</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Interview Type", value: tc.label, icon: <TypeIcon size={16} className={tc.color} /> },
                {
                  label: "Date & Time",
                  value: dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
                  sub: dateObj.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
                  icon: <Calendar size={16} className="text-[var(--eh-primary-600)]" />,
                },
                { label: "Duration", value: `${interview.durationMins} Minutes`, icon: <Clock size={16} className="text-[var(--eh-text-3)]" /> },
                { label: "Timezone", value: "Asia/Kolkata", sub: "(GMT+5:30)", icon: <Globe size={16} className="text-[var(--eh-text-3)]" /> },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-[var(--surface-base)] px-4 py-3">
                  <div className="mb-2">{item.icon}</div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">{item.label}</p>
                  <p className="mt-1 text-[13px] font-semibold text-[var(--eh-text)]">{item.value}</p>
                  {(item as any).sub && <p className="text-[11px] text-[var(--eh-text-3)]">{(item as any).sub}</p>}
                </div>
              ))}
            </div>
          </Panel>

          {/* Meeting link */}
          {interview.type === "VIDEO" && (
            <Panel className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fe]">
                  <Video size={18} className="text-[#4285f4]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[var(--eh-text)]">Google Meet</p>
                  <p className="text-[12px] text-[var(--eh-text-3)]">Join the video interview using the secure link below.</p>
                  {interview.meetingLink && (
                    <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="mt-1 text-[12px] font-medium text-[var(--eh-primary-600)] hover:underline">
                      {interview.meetingLink}
                    </a>
                  )}
                </div>
                {interview.meetingLink && (
                  <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="eh-btn eh-btn-secondary eh-btn-sm shrink-0">
                    Open Meeting <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </Panel>
          )}

          {/* Notes */}
          <Panel className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-2">Notes for Interviewers</h3>
                <textarea
                  value={schoolNotes}
                  onChange={(e) => setSchoolNotes(e.target.value)}
                  placeholder="Add internal notes for interview panel..."
                  className="input-base min-h-[100px] resize-y"
                />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-2">Preparation Instructions for Candidate</h3>
                <p className="text-[13px] text-[var(--eh-text-3)] rounded-xl bg-[var(--surface-base)] px-4 py-3 min-h-[100px]">
                  {interview.teacherNotes || "Please join 5 minutes early. Ensure a stable internet connection and a quiet environment for the interview."}
                </p>
              </div>
            </div>
          </Panel>

          {/* Activity Timeline */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {mockTimeline.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-600)]">
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </div>
                    {i < mockTimeline.length - 1 && <div className="mt-1 flex-1 w-px bg-[var(--eh-border)]" />}
                  </div>
                  <div className="min-w-0 pb-4">
                    <div className="flex items-baseline gap-2">
                      <p className="text-[13px] font-semibold text-[var(--eh-text)]">{entry.label}</p>
                      <span className="text-[11px] text-[var(--eh-text-4)]">{entry.time}</span>
                    </div>
                    <p className="text-[12px] text-[var(--eh-text-3)]">{entry.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Interview Summary */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-4">Interview Summary</h3>
            <div className="space-y-3 text-[13px]">
              {[
                { label: "Status", value: <StatusBadge tone={sc.tone}>{sc.label}</StatusBadge> },
                { label: "Interview Type", value: tc.label },
                { label: "Date & Time", value: `${dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, ${dateObj.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` },
                { label: "Duration", value: `${interview.durationMins} minutes` },
                { label: "Timezone", value: "Asia/Kolkata (GMT+5:30)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-[var(--eh-text-3)]">{item.label}</span>
                  <span className="text-right font-medium text-[var(--eh-text-2)]">{item.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Interview Feedback */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-3">Interview Feedback</h3>
            {interview.status === "COMPLETED" ? (
              <div className="text-[13px] text-[var(--eh-text-3)]">No feedback added yet.</div>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-base)] mb-2">
                  <MessageSquare size={18} className="text-[var(--eh-text-4)]" />
                </div>
                <p className="text-[12px] text-[var(--eh-text-3)]">Feedback will be available after the interview is completed.</p>
              </div>
            )}
            <button className="mt-3 w-full rounded-lg border border-[var(--eh-border)] py-2 text-[13px] font-semibold text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors">
              Add Feedback
            </button>
          </Panel>

          {/* Candidate Contact */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-3">Candidate Contact</h3>
            <div className="space-y-2">
              {candidateEmail && (
                <a href={`mailto:${candidateEmail}`} className="flex items-center gap-2 text-[13px] text-[var(--eh-text-2)] hover:text-[var(--eh-primary-600)]">
                  <Mail size={14} className="shrink-0 text-[var(--eh-text-4)]" /> {candidateEmail}
                </a>
              )}
              <div className="flex items-center gap-2 text-[13px] text-[var(--eh-text-3)]">
                <Phone size={14} className="shrink-0 text-[var(--eh-text-4)]" /> Contact on file
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[var(--eh-text-3)]">
                <MapPin size={14} className="shrink-0 text-[var(--eh-text-4)]" /> Tamil Nadu, India
              </div>
            </div>
            <Link href={`/dashboard/applicants`} className="mt-4 block w-full text-center rounded-lg border border-[var(--eh-border)] py-2 text-[13px] font-semibold text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors">
              View Candidate Profile
            </Link>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
