"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

// ─── Inline SVG Illustrations ────────────────────────────────────────────────

function IllustrationNoSaved() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#E8E9F6" />
      <rect x="28" y="24" width="84" height="72" rx="10" fill="#EEF0FB" />
      <rect x="28" y="24" width="84" height="72" rx="10" stroke="#C7CBF0" strokeWidth="1.5" />
      <rect x="40" y="36" width="60" height="8" rx="4" fill="#C7CBF0" />
      <rect x="40" y="52" width="44" height="6" rx="3" fill="#D9DCF4" />
      <rect x="40" y="64" width="36" height="6" rx="3" fill="#D9DCF4" />
      <circle cx="104" cy="30" r="14" fill="#6366F1" />
      <path d="M104 23v14M97 30h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M58 88l6-6 4 4 8-10" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="88" r="6" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.2" />
      <path d="M33 88l2 2 4-4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* decorative dots */}
      <circle cx="20" cy="50" r="3" fill="#C7CBF0" opacity="0.6" />
      <circle cx="122" cy="72" r="3" fill="#C7CBF0" opacity="0.6" />
      <circle cx="118" cy="46" r="2" fill="#E8E9F6" />
    </svg>
  );
}

function IllustrationNoApplications() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#E8E9F6" />
      {/* magnifier */}
      <circle cx="62" cy="55" r="28" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.5" />
      <circle cx="62" cy="55" r="20" fill="white" stroke="#D9DCF4" strokeWidth="1.2" />
      <rect x="54" y="48" width="16" height="3" rx="1.5" fill="#C7CBF0" />
      <rect x="54" y="54" width="12" height="3" rx="1.5" fill="#D9DCF4" />
      <rect x="54" y="60" width="10" height="3" rx="1.5" fill="#D9DCF4" />
      {/* handle */}
      <line x1="82" y1="75" x2="98" y2="92" stroke="#C7CBF0" strokeWidth="5" strokeLinecap="round" />
      {/* question mark */}
      <circle cx="108" cy="32" r="14" fill="#F3F4FF" stroke="#C7CBF0" strokeWidth="1.2" />
      <text x="108" y="37" textAnchor="middle" fill="#6366F1" fontSize="16" fontWeight="bold">?</text>
      {/* leaf decoration */}
      <ellipse cx="34" cy="85" rx="6" ry="10" fill="#D1FAE5" transform="rotate(-20 34 85)" />
      <ellipse cx="28" cy="90" rx="5" ry="9" fill="#A7F3D0" transform="rotate(10 28 90)" />
      <circle cx="22" cy="48" r="3" fill="#C7CBF0" opacity="0.5" />
      <circle cx="120" cy="60" r="2.5" fill="#C7CBF0" opacity="0.5" />
    </svg>
  );
}

function IllustrationNoInterviews() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#E8E9F6" />
      {/* calendar body */}
      <rect x="26" y="28" width="88" height="72" rx="10" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.5" />
      {/* calendar header */}
      <rect x="26" y="28" width="88" height="24" rx="10" fill="#6366F1" />
      <rect x="26" y="40" width="88" height="12" fill="#6366F1" />
      {/* rings */}
      <rect x="46" y="20" width="6" height="16" rx="3" fill="#4F46E5" />
      <rect x="88" y="20" width="6" height="16" rx="3" fill="#4F46E5" />
      {/* calendar text */}
      <rect x="38" y="36" width="24" height="4" rx="2" fill="white" opacity="0.6" />
      {/* grid dots */}
      {[0,1,2,3,4,5].map((i) => (
        <g key={i} transform={`translate(${38 + (i % 3) * 22}, ${60 + Math.floor(i / 3) * 18})`}>
          <circle cx="8" cy="8" r="8" fill="white" />
          <circle cx="8" cy="8" r="4" fill="#D9DCF4" />
        </g>
      ))}
      {/* clock overlay */}
      <circle cx="98" cy="84" r="16" fill="white" stroke="#C7CBF0" strokeWidth="1.5" />
      <circle cx="98" cy="84" r="13" fill="#EEF0FB" />
      <line x1="98" y1="84" x2="98" y2="76" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      <line x1="98" y1="84" x2="104" y2="88" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      <circle cx="98" cy="84" r="2" fill="#6366F1" />
      <circle cx="22" cy="56" r="3" fill="#C7CBF0" opacity="0.5" />
      <circle cx="122" cy="42" r="2.5" fill="#C7CBF0" opacity="0.5" />
    </svg>
  );
}

function IllustrationSuccess() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#D1FAE5" />
      <circle cx="70" cy="58" r="38" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="2" />
      <circle cx="70" cy="58" r="30" fill="#10B981" />
      <path d="M55 58l10 10 20-22" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* confetti */}
      <rect x="28" y="22" width="6" height="6" rx="1.5" fill="#FCD34D" transform="rotate(15 28 22)" />
      <rect x="108" y="18" width="5" height="5" rx="1.5" fill="#F87171" transform="rotate(-10 108 18)" />
      <rect x="116" y="58" width="6" height="6" rx="1.5" fill="#6366F1" transform="rotate(20 116 58)" />
      <rect x="20" y="70" width="5" height="5" rx="1.5" fill="#34D399" transform="rotate(-15 20 70)" />
      <circle cx="112" cy="38" r="4" fill="#FCD34D" />
      <circle cx="32" cy="46" r="3" fill="#F87171" />
      <circle cx="118" cy="80" r="3" fill="#34D399" />
      <circle cx="24" cy="90" r="3.5" fill="#6366F1" opacity="0.5" />
    </svg>
  );
}

function IllustrationProfileIncomplete() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#E8E9F6" />
      {/* clipboard */}
      <rect x="34" y="22" width="72" height="80" rx="10" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.5" />
      <rect x="52" y="14" width="36" height="16" rx="6" fill="#D9DCF4" stroke="#C7CBF0" strokeWidth="1.2" />
      <circle cx="70" cy="22" r="4" fill="white" />
      {/* person icon */}
      <circle cx="70" cy="46" r="10" fill="#C7CBF0" />
      <path d="M50 76c0-11 9-18 20-18s20 7 20 18" fill="#D9DCF4" />
      {/* warning badge */}
      <circle cx="102" cy="32" r="14" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="1.5" />
      <path d="M102 25v9" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="102" cy="38" r="1.5" fill="#F59E0B" />
      {/* lines */}
      <rect x="46" y="82" width="48" height="5" rx="2.5" fill="#D9DCF4" />
      <circle cx="22" cy="52" r="3" fill="#C7CBF0" opacity="0.5" />
      <circle cx="120" cy="68" r="2.5" fill="#C7CBF0" opacity="0.5" />
    </svg>
  );
}

function IllustrationLocked() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#E8E9F6" />
      {/* lock body */}
      <rect x="36" y="58" width="68" height="52" rx="12" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.5" />
      {/* shackle */}
      <path d="M50 58V44a20 20 0 0140 0v14" stroke="#C7CBF0" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* keyhole */}
      <circle cx="70" cy="80" r="9" fill="#D9DCF4" />
      <rect x="67" y="80" width="6" height="12" rx="3" fill="#D9DCF4" />
      {/* crown badge */}
      <circle cx="104" cy="36" r="14" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="1.2" />
      <path d="M96 42l4-8 4 5 4-5 4 8H96z" fill="#F59E0B" />
      <circle cx="96" cy="34" r="2" fill="#F59E0B" />
      <circle cx="104" cy="32" r="2" fill="#F59E0B" />
      <circle cx="112" cy="34" r="2" fill="#F59E0B" />
      <circle cx="20" cy="68" r="3" fill="#C7CBF0" opacity="0.5" />
      <circle cx="122" cy="52" r="2.5" fill="#C7CBF0" opacity="0.5" />
    </svg>
  );
}

function IllustrationExpired() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#FEE2E2" />
      {/* hourglass */}
      <rect x="42" y="16" width="56" height="8" rx="4" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.2" />
      <rect x="42" y="96" width="56" height="8" rx="4" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.2" />
      {/* top half */}
      <path d="M44 24l26 32H44V24z" fill="#D9DCF4" />
      <path d="M96 24L70 56H44V24h52z" fill="#C7CBF0" />
      {/* bottom half */}
      <path d="M44 96V64h52v32L70 64l-26 32z" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1" />
      {/* sand dot at neck */}
      <ellipse cx="70" cy="56" rx="4" ry="3" fill="#6366F1" />
      {/* sand pile bottom */}
      <ellipse cx="70" cy="88" rx="14" ry="5" fill="#D9DCF4" />
      {/* X badge */}
      <circle cx="104" cy="30" r="14" fill="#FEE2E2" stroke="#FECACA" strokeWidth="1.2" />
      <path d="M98 24l12 12M110 24L98 36" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="22" cy="60" r="3" fill="#C7CBF0" opacity="0.5" />
      <circle cx="120" cy="76" r="2.5" fill="#C7CBF0" opacity="0.5" />
    </svg>
  );
}

function IllustrationAlreadyApplied() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#E8E9F6" />
      {/* document */}
      <rect x="30" y="22" width="64" height="82" rx="10" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.5" />
      <rect x="42" y="38" width="40" height="4" rx="2" fill="#C7CBF0" />
      <rect x="42" y="48" width="32" height="4" rx="2" fill="#D9DCF4" />
      <rect x="42" y="58" width="36" height="4" rx="2" fill="#D9DCF4" />
      <rect x="42" y="68" width="28" height="4" rx="2" fill="#D9DCF4" />
      {/* person icon top-left of doc */}
      <circle cx="46" cy="32" r="6" fill="#D9DCF4" />
      {/* green check circle */}
      <circle cx="98" cy="82" r="18" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5" />
      <circle cx="98" cy="82" r="13" fill="#10B981" />
      <path d="M91 82l5 5 11-12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="50" r="3" fill="#C7CBF0" opacity="0.5" />
      <circle cx="118" cy="36" r="2.5" fill="#C7CBF0" opacity="0.5" />
    </svg>
  );
}

function IllustrationLimitReached() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#E8E9F6" />
      {/* file stack */}
      <rect x="22" y="44" width="64" height="54" rx="8" fill="#D9DCF4" stroke="#C7CBF0" strokeWidth="1.2" />
      <rect x="28" y="36" width="64" height="54" rx="8" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.2" />
      <rect x="34" y="28" width="64" height="54" rx="8" fill="white" stroke="#C7CBF0" strokeWidth="1.5" />
      <rect x="46" y="42" width="40" height="4" rx="2" fill="#C7CBF0" />
      <rect x="46" y="52" width="32" height="4" rx="2" fill="#D9DCF4" />
      <rect x="46" y="62" width="28" height="4" rx="2" fill="#D9DCF4" />
      {/* arrow up badge */}
      <circle cx="106" cy="38" r="16" fill="#6366F1" />
      <path d="M106 46V30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M99 37l7-7 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="72" r="3" fill="#C7CBF0" opacity="0.5" />
      <circle cx="122" cy="60" r="2.5" fill="#C7CBF0" opacity="0.5" />
    </svg>
  );
}

function IllustrationError() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="108" rx="48" ry="8" fill="#FEE2E2" />
      {/* laptop */}
      <rect x="28" y="32" width="84" height="56" rx="8" fill="#EEF0FB" stroke="#C7CBF0" strokeWidth="1.5" />
      <rect x="34" y="38" width="72" height="44" rx="5" fill="white" />
      <rect x="18" y="88" width="104" height="8" rx="4" fill="#D9DCF4" stroke="#C7CBF0" strokeWidth="1.2" />
      {/* sad face on screen */}
      <circle cx="70" cy="60" r="16" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1.2" />
      <circle cx="64" cy="57" r="2" fill="#EF4444" />
      <circle cx="76" cy="57" r="2" fill="#EF4444" />
      <path d="M64 68c1.5-3 6.5-3 8 0" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* squiggly lines representing error */}
      <path d="M22 44l4-4 4 4 4-4" stroke="#FECACA" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M110 44l4-4 4 4" stroke="#FECACA" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="22" cy="70" r="3" fill="#FCA5A5" opacity="0.6" />
      <circle cx="120" cy="58" r="2.5" fill="#FCA5A5" opacity="0.6" />
    </svg>
  );
}

// ─── Illustration registry ────────────────────────────────────────────────────

const ILLUSTRATIONS = {
  "no-saved": IllustrationNoSaved,
  "no-applications": IllustrationNoApplications,
  "no-interviews": IllustrationNoInterviews,
  "success": IllustrationSuccess,
  "profile-incomplete": IllustrationProfileIncomplete,
  "locked": IllustrationLocked,
  "expired": IllustrationExpired,
  "already-applied": IllustrationAlreadyApplied,
  "limit-reached": IllustrationLimitReached,
  "error": IllustrationError,
} as const;

export type IllustrationVariant = keyof typeof ILLUSTRATIONS;

// ─── Shared wrapper ───────────────────────────────────────────────────────────

type IllustratedStateProps = {
  illustration: IllustrationVariant;
  title: string;
  message?: string;
  actions?: ReactNode;
  className?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

function IllustratedStateShell({ illustration, title, message, actions, className, tone = "default" }: IllustratedStateProps) {
  const Illustration = ILLUSTRATIONS[illustration];
  const bg =
    tone === "success" ? "bg-emerald-50 border-emerald-100" :
    tone === "warning" ? "bg-amber-50 border-amber-100" :
    tone === "danger" ? "bg-red-50 border-red-100" :
    "bg-white border-[var(--eh-border)]";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border p-10 text-center shadow-[0_2px_12px_rgba(15,23,42,0.04)]",
        bg,
        className
      )}
    >
      <div className="mb-5">
        <Illustration />
      </div>
      <h3 className="text-[17px] font-semibold leading-snug text-[var(--eh-text)]">{title}</h3>
      {message && (
        <p className="mx-auto mt-2 max-w-xs text-[13px] leading-[1.7] text-[var(--eh-text-3)]">{message}</p>
      )}
      {actions && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      )}
    </div>
  );
}

// ─── Named exports for each state type ───────────────────────────────────────

export function NoSavedJobsState({ actions }: { actions?: ReactNode }) {
  return (
    <IllustratedStateShell
      illustration="no-saved"
      title="You haven't saved any jobs yet"
      message="Save jobs you like and come back to them anytime."
      actions={actions}
    />
  );
}

export function NoApplicationsState({ actions }: { actions?: ReactNode }) {
  return (
    <IllustratedStateShell
      illustration="no-applications"
      title="No applications yet"
      message="You haven't applied to any jobs yet. Find the right opportunity and apply."
      actions={actions}
    />
  );
}

export function NoInterviewsState({ actions }: { actions?: ReactNode }) {
  return (
    <IllustratedStateShell
      illustration="no-interviews"
      title="No interviews scheduled"
      message="You don't have any upcoming interviews. Keep applying and good luck!"
      actions={actions}
    />
  );
}

export function ApplicationSubmittedState({ actions }: { actions?: ReactNode }) {
  return (
    <IllustratedStateShell
      illustration="success"
      title="Application submitted!"
      message="Your application has been sent successfully. The school will review your profile and get back to you soon."
      tone="success"
      actions={actions}
    />
  );
}

export function ProfileIncompleteState({ actions }: { actions?: ReactNode }) {
  return (
    <IllustratedStateShell
      illustration="profile-incomplete"
      title="Complete your profile first"
      message="A complete profile improves your chances of getting noticed by schools."
      tone="warning"
      actions={actions}
    />
  );
}

type ProLockedStateProps = {
  title?: string;
  message?: string;
  features?: string[];
  actions?: ReactNode;
  className?: string;
};

export function ProLockedState({
  title = "This is a Pro feature",
  message = "Upgrade to EduHire Pro to unlock this feature and get more opportunities.",
  features,
  actions,
  className,
}: ProLockedStateProps) {
  const defaultFeatures = [
    "Featured profile badge",
    "Priority placement in school searches",
    "Profile view analytics",
    "Instant alert positioning",
  ];
  const list = features ?? defaultFeatures;

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-[var(--eh-border)] bg-white p-8 text-center shadow-[0_2px_12px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <IllustrationLocked />
      <h3 className="mt-4 text-[17px] font-semibold text-[var(--eh-text)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-[13px] leading-[1.7] text-[var(--eh-text-3)]">{message}</p>
      {list.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-left">
          {list.map((f) => (
            <li key={f} className="flex items-center gap-2 text-[12px] text-[var(--eh-text-2)]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="7" fill="#EEF0FB" />
                <path d="M4 7l2 2 4-4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      )}
      {actions && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function ExpiredJobState({ actions }: { actions?: ReactNode }) {
  return (
    <IllustratedStateShell
      illustration="expired"
      title="Job has expired"
      message="This job is no longer accepting applications."
      tone="danger"
      actions={actions}
    />
  );
}

export function AlreadyAppliedState({ appliedAt, actions }: { appliedAt?: string; actions?: ReactNode }) {
  const dateStr = appliedAt
    ? new Date(appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <IllustratedStateShell
      illustration="already-applied"
      title="You've already applied"
      message={dateStr ? `You have already applied for this job on ${dateStr}.` : "You have already applied for this job."}
      tone="success"
      actions={actions}
    />
  );
}

export function ApplicationLimitReachedState({ actions }: { actions?: ReactNode }) {
  return (
    <IllustratedStateShell
      illustration="limit-reached"
      title="Monthly highlight limit reached"
      message="You've reached your monthly limit for highlighting your profile in school search results."
      tone="warning"
      actions={actions}
    />
  );
}

export function SomethingWentWrongState({
  title = "Something went wrong",
  message = "We're having trouble loading this right now. Please try again in a few moments.",
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <IllustratedStateShell
      illustration="error"
      title={title}
      message={message}
      tone="danger"
      className={className}
      actions={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--eh-border)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--eh-text-2)] shadow-sm transition-colors hover:border-[var(--eh-primary-300)] hover:text-[var(--eh-primary-700)]"
          >
            <RefreshCw size={13} /> Try Again
          </button>
        ) : undefined
      }
    />
  );
}

// ─── Convenience: empty state for school-side "no candidates" ────────────────

export function NoApplicantsState({ actions }: { actions?: ReactNode }) {
  return (
    <IllustratedStateShell
      illustration="no-applications"
      title="No applicants yet"
      message="Teachers who apply to this job will appear here."
      actions={actions}
    />
  );
}

export function NoJobsPostedState({ actions }: { actions?: ReactNode }) {
  return (
    <IllustratedStateShell
      illustration="no-saved"
      title="You haven't posted any jobs yet"
      message="Post your first role to start receiving applications from teachers."
      actions={actions}
    />
  );
}
