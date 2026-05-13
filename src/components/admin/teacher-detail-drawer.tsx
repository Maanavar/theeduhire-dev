"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, BadgeCheck, ShieldCheck, ShieldAlert, ShieldOff,
  ExternalLink, Mail, MapPin, Calendar, GraduationCap,
  FileText, Video, CheckCircle2, XCircle, Play, Download
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { AdminTeacher } from "@/lib/api/admin-client";

const VERIFICATION_COLORS: Record<AdminTeacher["verificationStatus"], string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  VERIFIED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  UNVERIFIED: "bg-gray-100 text-gray-500 border-gray-200",
};

const VERIFICATION_LABELS: Record<AdminTeacher["verificationStatus"], string> = {
  PENDING: "Pending review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  UNVERIFIED: "Unverified",
};

interface Props {
  teacher: AdminTeacher | null;
  onClose: () => void;
}

export default function TeacherDetailDrawer({ teacher, onClose }: Props) {
  const [videoOpen, setVideoOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!teacher) return;
    setVideoOpen(false);
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [teacher, onClose]);

  if (!teacher) return null;

  const isVideoStorageUrl = teacher.demoVideoUrl && (
    teacher.demoVideoUrl.includes("supabase") ||
    teacher.demoVideoUrl.includes("storage") ||
    teacher.demoVideoUrl.includes("blob") ||
    /\.(mp4|webm|mov|avi)(\?|$)/i.test(teacher.demoVideoUrl)
  );
  const isVideoYouTube = teacher.demoVideoUrl && (
    teacher.demoVideoUrl.includes("youtube.com") || teacher.demoVideoUrl.includes("youtu.be")
  );

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 z-[65] h-full w-full max-w-[520px] overflow-y-auto bg-white shadow-2xl animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[18px] font-bold tracking-[-0.02em] text-gray-900">
                {teacher.user.name}
              </h2>
              {teacher.verificationStatus === "VERIFIED" && <BadgeCheck size={16} className="shrink-0 text-brand-500" />}
              {teacher.safetyBadgeGranted && <ShieldCheck size={16} className="shrink-0 text-green-600" />}
              {teacher.user.isSuspended && <ShieldAlert size={16} className="shrink-0 text-red-500" />}
            </div>
            <span className={cn(
              "mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
              VERIFICATION_COLORS[teacher.verificationStatus]
            )}>
              {VERIFICATION_LABELS[teacher.verificationStatus]}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Basic info */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Profile</p>
            <div className="space-y-2.5">
              <DetailRow icon={<Mail size={14} />} label="Email" value={teacher.user.email} />
              {teacher.city && <DetailRow icon={<MapPin size={14} />} label="City" value={teacher.city} />}
              {teacher.qualification && <DetailRow icon={<GraduationCap size={14} />} label="Qualification" value={teacher.qualification} />}
              <DetailRow icon={<Calendar size={14} />} label="Joined" value={timeAgo(teacher.user.createdAt)} />
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-gray-400"><GraduationCap size={14} /></span>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-gray-400">Subjects: </span>
                  <span className="text-[13.5px] font-medium text-gray-800">
                    {teacher.subjects.length ? teacher.subjects.join(", ") : "None listed"}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-gray-400"><FileText size={14} /></span>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-gray-400">Records: </span>
                  <span className="text-[13.5px] font-medium text-gray-800">
                    {teacher._count.experiences} experience{teacher._count.experiences !== 1 ? "s" : ""}, {teacher._count.certifications} certification{teacher._count.certifications !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance checklist */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Compliance checklist</p>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
              <ChecklistRow label="POCSO acknowledged" done={teacher.pocsoAcknowledged} />
              <ChecklistRow label="Code of conduct signed" done={teacher.codeOfConductSigned} />
              <ChecklistRow label="Reference check done" done={teacher.referenceCheckDone} />
              <ChecklistRow label="Safety badge granted" done={teacher.safetyBadgeGranted} />
            </div>
          </section>

          {/* Demo video */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Demo video</p>
            {teacher.demoVideoUrl ? (
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                {videoOpen ? (
                  isVideoYouTube ? (
                    <iframe
                      src={getYouTubeEmbedUrl(teacher.demoVideoUrl)}
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Teacher demo video"
                    />
                  ) : (
                    <video
                      src={teacher.demoVideoUrl}
                      controls
                      className="aspect-video w-full bg-black"
                      title="Teacher demo video"
                    />
                  )
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
                        <Video size={16} className="text-brand-500" />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-gray-800">Demo video uploaded</p>
                        <p className="text-[12px] text-gray-400">{isVideoYouTube ? "YouTube link" : isVideoStorageUrl ? "Stored file" : "External link"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVideoOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-600 transition-colors"
                      >
                        <Play size={12} /> Play
                      </button>
                      <a
                        href={teacher.demoVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink size={12} /> Open
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 px-4 py-3">
                <XCircle size={15} className="text-gray-300" />
                <p className="text-[13px] text-gray-400">No demo video uploaded</p>
              </div>
            )}
          </section>

          {/* Lesson plan */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Lesson plan</p>
            {teacher.lessonPlanUrl ? (
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                    <FileText size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold text-gray-800">Lesson plan uploaded</p>
                    <p className="text-[12px] text-gray-400">Document on file</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={teacher.lessonPlanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={12} /> View
                  </a>
                  <a
                    href={teacher.lessonPlanUrl}
                    download
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Download size={12} /> Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 px-4 py-3">
                <XCircle size={15} className="text-gray-300" />
                <p className="text-[13px] text-gray-400">No lesson plan uploaded</p>
              </div>
            )}
          </section>

          {/* Verification timeline */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Verification history</p>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2.5">
              {teacher.verificationSubmittedAt ? (
                <TimelineItem label="Submitted for review" date={teacher.verificationSubmittedAt} />
              ) : (
                <p className="text-[13px] text-gray-400">No verification submission on record.</p>
              )}
              {teacher.verificationTimestamp && (
                <TimelineItem
                  label={teacher.verificationStatus === "REJECTED" ? "Rejected" : "Verified"}
                  date={teacher.verificationTimestamp}
                  highlight={teacher.verificationStatus === "REJECTED" ? "red" : "green"}
                />
              )}
            </div>
          </section>

          {/* Admin notes / rejection reason */}
          {(teacher.verificationRejectionReason || teacher.verificationNotes) && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Admin records</p>
              <div className="space-y-3">
                {teacher.verificationRejectionReason && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-red-400">Rejection reason</p>
                    <p className="text-[13.5px] text-red-700">{teacher.verificationRejectionReason}</p>
                  </div>
                )}
                {teacher.verificationNotes && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400">Admin notes</p>
                    <p className="text-[13.5px] text-gray-700">{teacher.verificationNotes}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Suspension */}
          {teacher.user.isSuspended && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Suspension</p>
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldOff size={13} className="text-red-500" />
                  <p className="text-[12px] font-semibold text-red-500">Account suspended</p>
                </div>
                {teacher.user.suspensionReason && (
                  <p className="text-[13.5px] text-red-700">{teacher.user.suspensionReason}</p>
                )}
                {teacher.user.suspendedAt && (
                  <p className="mt-1 text-[12px] text-red-400">Since {timeAgo(teacher.user.suspendedAt)}</p>
                )}
                {teacher.user.suspendedUntil && (
                  <p className="mt-0.5 text-[12px] text-red-400">Until {new Date(teacher.user.suspendedUntil).toLocaleDateString()}</p>
                )}
              </div>
            </section>
          )}

          {/* External link */}
          <a
            href={`/profile/${teacher.userId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] font-medium text-brand-500 hover:underline"
          >
            <ExternalLink size={13} />
            View public teacher profile
          </a>
        </div>
      </div>
    </>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="text-[12px] text-gray-400">{label}: </span>
        <span className="text-[13.5px] font-medium text-gray-800">{value}</span>
      </div>
    </div>
  );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[13.5px] text-gray-700">{label}</span>
      {done
        ? <CheckCircle2 size={16} className="text-green-500" />
        : <XCircle size={16} className="text-gray-300" />
      }
    </div>
  );
}

function TimelineItem({ label, date, highlight }: { label: string; date: string; highlight?: "red" | "green" }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        highlight === "red" ? "bg-red-400" : highlight === "green" ? "bg-green-500" : "bg-gray-300"
      )} />
      <span className="text-[13px] text-gray-600">{label}</span>
      <span className="ml-auto text-[12px] text-gray-400">{timeAgo(date)}</span>
    </div>
  );
}
