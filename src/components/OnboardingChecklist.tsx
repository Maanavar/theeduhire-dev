"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, Circle, ShieldAlert, ShieldCheck, Star, X } from "lucide-react";
import { getTeacherApplyReadiness } from "@/lib/profileCompletion";
import { useDashboardProfile } from "@/components/layout/dashboard-profile-context";
import { getDashboardSummary } from "@/lib/api/dashboard-client";

type Props = {
  role: "TEACHER" | "SCHOOL_ADMIN";
  teacherCompletion?: number;
  schoolPlan?: "FREE" | "GROWTH" | "PRO";
};

export default function OnboardingChecklist({ role, teacherCompletion = 0, schoolPlan }: Props) {
  const { data: session } = useSession();
  const profileData = useDashboardProfile();
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [jobCount, setJobCount] = useState(0);

  const key = useMemo(
    () => `onboarding-dismissed:${role}:${session?.user?.id || "anon"}`,
    [role, session?.user?.id]
  );

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(key) === "1");
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (role !== "SCHOOL_ADMIN") return;

    const load = async () => {
      try {
        const summary = await getDashboardSummary();
        if (summary.role === "SCHOOL_ADMIN") {
          setJobCount(summary.summary.totalJobs);
        }
      } catch {
        setJobCount(0);
      }
    };

    void load();
  }, [role]);

  const teacherSteps = useMemo(
    () => [
      { label: "Add your photo", done: !!profileData?.avatarUrl, href: "/dashboard/profile#basic-info" },
      {
        label: "Add your qualification & experience",
        done: !!profileData?.qualification && !!profileData?.experience,
        href: "/dashboard/profile#basic-info",
      },
      {
        label: "Add at least one subject specialization",
        done: Array.isArray(profileData?.subjects) && profileData.subjects.length > 0,
        href: "/dashboard/profile#specialisations",
      },
      {
        label: "Add one work experience entry",
        done: Array.isArray(profileData?.experiences) && profileData.experiences.length > 0,
        href: "/dashboard/profile#experience",
      },
      {
        label: "Upload your resume",
        done: Array.isArray(profileData?.resumes) && profileData.resumes.length > 0,
        href: "/dashboard/profile#resume",
      },
    ],
    [profileData]
  );

  const schoolSteps = useMemo(
    () => [
      { label: "Add your school name and city", done: !!profileData?.schoolName && !!profileData?.city, href: "/dashboard/profile" },
      { label: "Upload school logo", done: !!profileData?.logoUrl, href: "/dashboard/profile" },
      { label: "Add school description (About)", done: !!profileData?.about, href: "/dashboard/profile" },
      {
        label: "Request school verification",
        done: profileData?.verificationStatus === "PENDING" || profileData?.verificationStatus === "VERIFIED",
        href: "/dashboard/profile",
      },
      { label: "Post your first job", done: jobCount > 0, href: "/dashboard/post-job" },
      ...(schoolPlan === "FREE"
        ? [{ label: "Upgrade to Growth or Pro plan", done: false, href: "/dashboard/subscription", upsell: true }]
        : []),
    ],
    [profileData, jobCount, schoolPlan]
  );

  const steps = role === "TEACHER" ? teacherSteps : schoolSteps;
  const teacherReadiness = useMemo(
    () =>
      role === "TEACHER"
        ? getTeacherApplyReadiness({
            avatarUrl: profileData?.avatarUrl,
            bio: profileData?.bio,
            qualification: profileData?.qualification,
            experience: profileData?.experience,
            city: profileData?.city,
            subjects: profileData?.subjects || [],
            preferredBoards: profileData?.preferredBoards || [],
            preferredGrades: profileData?.preferredGrades || [],
            experiences: profileData?.experiences || [],
            certifications: profileData?.certifications || [],
            resumes: profileData?.resumes || [],
          })
        : null,
    [profileData, role]
  );
  const completionPct = role === "TEACHER"
    ? teacherCompletion
    : Math.round((steps.filter((item) => item.done).length / Math.max(steps.length, 1)) * 100);

  const schoolVerified = profileData?.verificationStatus === "VERIFIED";
  const hideTeacherChecklist = role === "TEACHER" && !!teacherReadiness?.ready;
  const hideSchoolChecklist = role === "SCHOOL_ADMIN" && schoolVerified && completionPct >= 100;

  if (!ready || dismissed || hideTeacherChecklist || hideSchoolChecklist) return null;

  const verificationStatus = profileData?.verificationStatus || (profileData?.verified ? "VERIFIED" : "UNVERIFIED");

  const doneCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((doneCount / Math.max(steps.length, 1)) * 100);

  return (
    <section className="rounded-2xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--eh-primary-700)]">
            Onboarding checklist
          </p>
          {role === "TEACHER" ? (
            <p className="mt-1 text-[13px] text-[var(--eh-primary-800)]">
              Application readiness: <strong>{teacherCompletion}%</strong>
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-[var(--eh-primary-800)]">
              Verification:{" "}
              <strong>
                {verificationStatus === "VERIFIED"
                  ? "Verified"
                  : verificationStatus === "PENDING"
                    ? "Pending review"
                    : "Action needed"}
              </strong>
            </p>
          )}
        </div>
        <button
          onClick={() => {
            try { localStorage.setItem(key, "1"); } catch { /* ignore */ }
            setDismissed(true);
          }}
          className="rounded-md p-1 text-[var(--eh-primary-700)] hover:bg-[var(--eh-primary-100)]"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--eh-primary-700)]">
            {doneCount} of {steps.length} complete
          </span>
          <span className="text-[11px] font-semibold text-[var(--eh-primary-700)]">{progressPct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--eh-primary-100)]">
          <div
            className="h-full rounded-full bg-[var(--eh-primary-500)] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Status note */}
      {role === "SCHOOL_ADMIN" && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--eh-primary-100)] bg-white px-3 py-2.5">
          {verificationStatus === "VERIFIED"
            ? <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-600" />
            : <ShieldAlert size={13} className="mt-0.5 shrink-0 text-[var(--eh-primary-700)]" />}
          <p className="text-[12px] leading-5 text-[var(--eh-text-2)]">
            {verificationStatus === "PENDING"
              ? "Verification request is in review. Keep your school details current."
              : verificationStatus === "VERIFIED"
                ? "Your school is verified. Complete the remaining steps to start hiring."
                : "Add your school profile and request verification to unlock the full hiring workflow."}
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(steps as (typeof steps[number] & { upsell?: boolean })[]).map((step) => (
          <Link
            key={step.label}
            href={step.href}
            className={[
              "group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] transition-colors",
              step.done
                ? "border-emerald-100 bg-white"
                : step.upsell
                  ? "border-amber-200 bg-amber-50 hover:border-amber-300"
                  : "border-[var(--eh-primary-100)] bg-white hover:border-[var(--eh-primary-200)] hover:bg-[var(--eh-primary-50)]",
            ].join(" ")}
          >
            {step.done ? (
              <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
            ) : step.upsell ? (
              <Star size={14} className="shrink-0 text-amber-500" />
            ) : (
              <Circle size={14} className="shrink-0 text-[var(--eh-primary-300)]" />
            )}
            <span
              className={
                step.done
                  ? "text-slate-400 line-through"
                  : step.upsell
                    ? "font-semibold text-amber-800"
                    : "text-slate-700"
              }
            >
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
