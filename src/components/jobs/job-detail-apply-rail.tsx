"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bookmark, BookmarkCheck, ShieldCheck } from "lucide-react";
import ApplyForm from "@/components/forms/apply-form";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics";
import {
  AlreadyAppliedState,
  ApplicationSubmittedState,
  ExpiredJobState,
  ProfileIncompleteState,
} from "@/components/system/illustrated-states";
import Link from "next/link";

interface Props {
  jobId: string;
  jobTitle: string;
  schoolName: string;
  screeningQuestions: Array<{ id: string; question: string; required: boolean; sortOrder: number }>;
  initialApplied: boolean;
  initialSaved: boolean;
  jobStatus?: string;
  appliedAt?: string;
  hasProfile?: boolean;
}

export default function JobDetailApplyRail({
  jobId,
  jobTitle,
  schoolName,
  screeningQuestions,
  initialApplied,
  initialSaved,
  jobStatus = "ACTIVE",
  appliedAt,
  hasProfile = true,
}: Props) {
  const { data: session } = useSession();
  const [isApplied, setIsApplied] = useState(initialApplied);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [showSubmittedState, setShowSubmittedState] = useState(false);

  const isSchoolAdmin = session?.user?.role === "SCHOOL_ADMIN";
  const isExpired = jobStatus === "EXPIRED" || jobStatus === "CLOSED";

  useEffect(() => {
    trackEvent("job_viewed", {
      jobId,
      source: "public_job_detail",
    });
  }, [jobId]);

  const toggleSave = async () => {
    if (!session?.user) {
      toast.error("Sign in to save jobs");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(data.data.saved);
        toast.success(data.data.saved ? "Job saved" : "Job removed from saved");
        trackEvent("job_saved", { jobId, saved: data.data.saved });
      } else {
        toast.error(data.error || "Failed to update save");
      }
    } catch {
      toast.error("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  if (isSchoolAdmin) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
        School admins cannot apply for teaching positions from this view.
      </div>
    );
  }

  // ── Expired job ──────────────────────────────────────────────────────────
  if (isExpired) {
    return (
      <aside className="space-y-4 lg:sticky lg:top-24">
        <ExpiredJobState
          actions={
            <Link href="/jobs" className="eh-btn eh-btn-secondary">
              Browse Other Jobs
            </Link>
          }
        />
      </aside>
    );
  }

  // ── Already applied (and no pending "just submitted" animation) ──────────
  if (isApplied && !showSubmittedState) {
    return (
      <aside className="space-y-4 lg:sticky lg:top-24">
        <AlreadyAppliedState
          appliedAt={appliedAt}
          actions={
            <Link href="/dashboard/applications" className="eh-btn eh-btn-secondary">
              View Application
            </Link>
          }
        />
        <SaveButton isSaved={isSaved} saving={saving} onToggle={toggleSave} />
      </aside>
    );
  }

  // ── Just submitted (success moment) ─────────────────────────────────────
  if (showSubmittedState) {
    return (
      <aside className="space-y-4 lg:sticky lg:top-24">
        <ApplicationSubmittedState
          actions={
            <Link href="/dashboard/applications" className="eh-btn eh-btn-primary">
              View My Applications
            </Link>
          }
        />
      </aside>
    );
  }

  // ── Not signed in / no profile ───────────────────────────────────────────
  if (!session?.user || !hasProfile) {
    return (
      <aside className="space-y-4 lg:sticky lg:top-24">
        <ProfileIncompleteState
          actions={
            <>
              <Link href={`/auth/signin?callbackUrl=/jobs/${jobId}`} className="eh-btn eh-btn-primary">
                Sign in to Apply
              </Link>
              <Link href="/auth/signup" className="eh-btn eh-btn-secondary">
                Create Account
              </Link>
            </>
          }
        />
        <SaveButton isSaved={isSaved} saving={saving} onToggle={toggleSave} />
      </aside>
    );
  }

  // ── Default: can apply ───────────────────────────────────────────────────
  return (
    <>
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-[30px] border border-[var(--eh-border)] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Apply</p>
          <h2 className="mt-2 text-[24px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--eh-text)]">
            Move while the role is active.
          </h2>
          <p className="mt-3 text-[14px] leading-[1.7] text-[var(--eh-text-2)]">
            Keep your profile, resume, and screening responses ready before you submit.
          </p>

          <div className="mt-5 space-y-3">
            <button
              onClick={() => setApplyOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Apply now
            </button>

            <SaveButton isSaved={isSaved} saving={saving} onToggle={toggleSave} asInline />
          </div>
        </div>

        <div className="rounded-[30px] border border-[var(--eh-border)] bg-[var(--surface-base)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Before you apply</p>
          <div className="mt-4 space-y-3 text-[13px] leading-[1.6] text-[var(--eh-text-2)]">
            <div className="rounded-[22px] bg-white px-4 py-3">
              Make sure your resume and profile show the right subjects, boards, and experience level.
            </div>
            <div className="rounded-[22px] bg-white px-4 py-3">
              Review any screening questions so you can answer them clearly in one pass.
            </div>
            <div className="rounded-[22px] bg-white px-4 py-3">
              <p className="inline-flex items-center gap-1.5 font-semibold text-[var(--eh-text)]">
                <ShieldCheck size={15} className="text-[var(--eh-success)]" />
                Public application flow
              </p>
              <p className="mt-2 text-[13px] text-[var(--eh-text-2)]">
                You&apos;ll sign in if needed, then continue the application without losing the job context.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <ApplyForm
        jobId={jobId}
        jobTitle={jobTitle}
        schoolName={schoolName}
        screeningQuestions={screeningQuestions}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSuccess={() => {
          setIsApplied(true);
          setShowSubmittedState(true);
        }}
      />
    </>
  );
}

function SaveButton({
  isSaved,
  saving,
  onToggle,
  asInline = false,
}: {
  isSaved: boolean;
  saving: boolean;
  onToggle: () => void;
  asInline?: boolean;
}) {
  const base = asInline
    ? "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--eh-border)] px-4 py-3 text-sm font-medium text-[var(--eh-text-2)] transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-60"
    : "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--eh-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--eh-text-2)] shadow-sm transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-60";

  return (
    <button onClick={onToggle} disabled={saving} className={base}>
      {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
      {isSaved ? "Saved" : "Save job"}
    </button>
  );
}
