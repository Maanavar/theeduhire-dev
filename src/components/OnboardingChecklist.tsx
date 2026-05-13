"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CircleCheckBig, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { getTeacherApplyReadiness } from "@/lib/profileCompletion";
import { useDashboardProfile } from "@/components/layout/dashboard-profile-context";
import { getDashboardSummary } from "@/lib/api/dashboard-client";

type Props = {
  role: "TEACHER" | "SCHOOL_ADMIN";
  teacherCompletion?: number;
};

function doneClass(done: boolean) {
  return done ? "text-slate-400 line-through" : "text-slate-700";
}

export default function OnboardingChecklist({ role, teacherCompletion = 0 }: Props) {
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
    ],
    [profileData, jobCount]
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

  const teacherBlockers = teacherReadiness?.blockers || [];
  const verificationStatus = profileData?.verificationStatus || (profileData?.verified ? "VERIFIED" : "UNVERIFIED");

  return (
    <section className="rounded-2xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--eh-primary-700)]">Onboarding checklist</p>
          {role === "TEACHER" ? (
            <>
              <p className="mt-1 text-[13px] font-semibold text-[var(--eh-primary-800)]">Application readiness: {teacherCompletion}%</p>
              <p className="mt-1 text-[13px] text-[var(--eh-primary-700)]">
                Finish the remaining hiring signals so you can apply without blockers.
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-[13px] font-semibold text-[var(--eh-primary-800)]">
                Verification status: {verificationStatus === "VERIFIED" ? "Verified" : verificationStatus === "PENDING" ? "Pending review" : "Action needed"}
              </p>
              <p className="mt-1 text-[13px] text-[var(--eh-primary-700)]">
                Complete the trust setup schools need before posting and reviewing at full speed.
              </p>
            </>
          )}
        </div>
        <button
          onClick={() => {
            try {
              localStorage.setItem(key, "1");
            } catch {
              // ignore localStorage issues
            }
            setDismissed(true);
          }}
          className="rounded-md p-1 text-[var(--eh-primary-700)] hover:bg-[var(--eh-primary-100)]"
          aria-label="Dismiss onboarding checklist"
        >
          <X size={14} />
        </button>
      </div>

      {role === "TEACHER" && teacherBlockers.length > 0 ? (
        <div className="mt-3 rounded-xl border border-[var(--eh-primary-100)] bg-white px-3 py-3">
          <div className="flex items-start gap-2">
            <ShieldAlert size={14} className="mt-0.5 text-[var(--eh-primary-700)]" />
            <div className="space-y-1">
              {teacherBlockers.slice(0, 3).map((blocker) => (
                <p key={blocker} className="text-[12.5px] text-[var(--eh-text-2)]">{blocker}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {role === "SCHOOL_ADMIN" ? (
        <div className="mt-3 rounded-xl border border-[var(--eh-primary-100)] bg-white px-3 py-3">
          <div className="flex items-start gap-2">
            {verificationStatus === "VERIFIED" ? <ShieldCheck size={14} className="mt-0.5 text-emerald-600" /> : <CircleCheckBig size={14} className="mt-0.5 text-[var(--eh-primary-700)]" />}
            <p className="text-[12.5px] text-[var(--eh-text-2)]">
              {verificationStatus === "PENDING"
                ? "Your verification request is in review. Keep your school details current while the platform team checks the submission."
                : verificationStatus === "VERIFIED"
                ? "Your school is verified. Finish the remaining workflow setup so your hiring pipeline is ready."
                : "Add your school profile, request verification, and post your first job to unlock the full hiring workflow."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            className="rounded-xl border border-[var(--eh-primary-100)] bg-white px-3 py-2 text-[13px] transition-colors hover:border-[var(--eh-primary-200)] hover:bg-[var(--eh-primary-50)]"
          >
            <span className={doneClass(step.done)}>{step.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
