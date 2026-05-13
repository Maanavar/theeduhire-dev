"use client";

import { useEffect, useRef } from "react";
import { X, BadgeCheck, ShieldOff, ExternalLink, Building2, Mail, MapPin, Calendar, Briefcase } from "lucide-react";
import { cn, getBoardLabel, timeAgo } from "@/lib/utils";
import type { AdminSchool } from "@/lib/api/admin-client";

const VERIFICATION_COLORS: Record<AdminSchool["verificationStatus"], string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  VERIFIED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  UNVERIFIED: "bg-gray-100 text-gray-500 border-gray-200",
};

const VERIFICATION_LABELS: Record<AdminSchool["verificationStatus"], string> = {
  PENDING: "Pending review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  UNVERIFIED: "Unverified",
};

interface Props {
  school: AdminSchool | null;
  onClose: () => void;
}

export default function SchoolDetailDrawer({ school, onClose }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!school) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [school, onClose]);

  if (!school) return null;

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
        className="fixed right-0 top-0 z-[65] h-full w-full max-w-[480px] overflow-y-auto bg-white shadow-2xl animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[18px] font-bold tracking-[-0.02em] text-gray-900">
                {school.schoolName || "Unnamed school"}
              </h2>
              {school.verified && <BadgeCheck size={16} className="shrink-0 text-brand-500" />}
              {school.user.isSuspended && <ShieldOff size={16} className="shrink-0 text-red-500" />}
            </div>
            <span className={cn(
              "mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
              VERIFICATION_COLORS[school.verificationStatus]
            )}>
              {VERIFICATION_LABELS[school.verificationStatus]}
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
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Institution details</p>
            <div className="space-y-2.5">
              <DetailRow icon={<Building2 size={14} />} label="Board type" value={getBoardLabel(school.board)} />
              <DetailRow icon={<MapPin size={14} />} label="City" value={school.city || "Not provided"} />
              <DetailRow icon={<Mail size={14} />} label="Email" value={school.user.email} />
              <DetailRow icon={<Calendar size={14} />} label="Joined" value={timeAgo(school.user.createdAt)} />
              <DetailRow icon={<Briefcase size={14} />} label="Job postings" value={`${school._count.jobPostings} posting${school._count.jobPostings !== 1 ? "s" : ""}`} />
            </div>
          </section>

          {/* Verification timeline */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Verification history</p>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2.5">
              {school.verificationSubmittedAt ? (
                <TimelineItem label="Submitted for review" date={school.verificationSubmittedAt} />
              ) : (
                <p className="text-[13px] text-gray-400">No verification submission on record.</p>
              )}
              {school.verificationTimestamp && (
                <TimelineItem
                  label={school.verificationStatus === "REJECTED" ? "Rejected" : "Verified"}
                  date={school.verificationTimestamp}
                  highlight={school.verificationStatus === "REJECTED" ? "red" : "green"}
                />
              )}
            </div>
          </section>

          {/* Admin notes / rejection reason */}
          {(school.verificationRejectionReason || school.verificationNotes) && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Admin records</p>
              <div className="space-y-3">
                {school.verificationRejectionReason && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-red-400">Rejection reason</p>
                    <p className="text-[13.5px] text-red-700">{school.verificationRejectionReason}</p>
                  </div>
                )}
                {school.verificationNotes && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400">Admin notes</p>
                    <p className="text-[13.5px] text-gray-700">{school.verificationNotes}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Suspension */}
          {school.user.isSuspended && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Suspension</p>
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldOff size={13} className="text-red-500" />
                  <p className="text-[12px] font-semibold text-red-500">Account suspended</p>
                </div>
                {school.user.suspensionReason && (
                  <p className="text-[13.5px] text-red-700">{school.user.suspensionReason}</p>
                )}
                {school.user.suspendedAt && (
                  <p className="mt-1 text-[12px] text-red-400">Since {timeAgo(school.user.suspendedAt)}</p>
                )}
                {school.user.suspendedUntil && (
                  <p className="mt-0.5 text-[12px] text-red-400">Until {new Date(school.user.suspendedUntil).toLocaleDateString()}</p>
                )}
              </div>
            </section>
          )}

          {/* View public profile link */}
          <a
            href={`/profile/${school.user.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] font-medium text-brand-500 hover:underline"
          >
            <ExternalLink size={13} />
            View public school profile
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
