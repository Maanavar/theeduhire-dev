"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/page-shell";

type TeacherBillingInfo = {
  plan: "FREE" | "PRO";
  status: string;
};

const FREE_FEATURES = [
  { label: "Apply to unlimited teaching jobs", included: true },
  { label: "AI match score for job fit", included: true },
  { label: "Save and track applications", included: true },
  { label: "Interview scheduling", included: true },
  { label: "Basic profile & resume upload", included: true },
  { label: "Priority placement in school searches", included: false },
  { label: "Profile view analytics", included: false },
  { label: "Instant job alert notifications", included: false },
  { label: "Featured badge on profile", included: false },
];

const PRO_FEATURES = [
  { label: "Apply to unlimited teaching jobs", included: true },
  { label: "AI match score for job fit", included: true },
  { label: "Save and track applications", included: true },
  { label: "Interview scheduling", included: true },
  { label: "Basic profile & resume upload", included: true },
  { label: "Priority placement in school searches", included: true },
  { label: "Profile view analytics", included: true },
  { label: "Instant job alert notifications", included: true },
  { label: "Featured badge on profile", included: true },
];

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  FREE: {
    label: "Free",
    color: "bg-[var(--surface-base)] text-[var(--eh-text-2)] border border-[var(--eh-border)]",
  },
  PRO: { label: "Pro", color: "bg-[#0a1929] text-white border border-[#0a1929]" },
};

export default function TeacherSubscriptionPage() {
  const [billing, setBilling] = useState<TeacherBillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/billing/teacher-plan");
        if (res.ok) {
          const data = await res.json();
          if (data.success) setBilling(data.data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="My Plan" subtitle="Manage your subscription" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[20px] bg-[var(--surface-base)]" />
          ))}
        </div>
      </PageShell>
    );
  }

  const plan = billing?.plan ?? "FREE";
  const badge = PLAN_BADGE[plan];
  const features = plan === "PRO" ? PRO_FEATURES : FREE_FEATURES;
  const isPro = plan === "PRO";

  return (
    <PageShell>
      <PageHeader
        title="My Plan"
        subtitle="View your current plan and unlock premium features"
        eyebrow="Account"
      />

      {/* Current plan */}
      <div className="rounded-[24px] border border-[var(--eh-border)] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--eh-text-4)]">
              Current plan
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${badge.color}`}
              >
                <CreditCard size={13} />
                {badge.label}
              </span>
              {billing?.status && billing.status !== "ACTIVE" && (
                <span className="rounded-full bg-[var(--eh-warning-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--eh-warning)] ring-1 ring-[var(--eh-warning-border)]">
                  {billing.status.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="mt-2 text-[13px] text-[var(--eh-text-3)]">
              {isPro
                ? "You have full access to all premium features."
                : "Upgrade to Pro for ₹199/month to stand out to schools."}
            </p>
          </div>
          {!isPro && (
            <a
              href="mailto:hello@theeduhire.in?subject=Teacher Pro Plan — EduHire&body=Hi EduHire team,%0A%0AI'd like to upgrade my teacher account to the Pro plan (%E2%82%B9199/month). Please share the payment details.%0A%0AThanks"
              className="eh-btn eh-btn-primary shrink-0 shadow-[0_4px_14px_rgba(10,102,194,0.2)]"
              title="Opens your email app"
            >
              Email us to upgrade <ArrowRight size={13} />
            </a>
          )}
        </div>
      </div>

      {/* Pro features comparison */}
      <div className="rounded-[24px] border border-[var(--eh-border)] bg-white p-6">
        <p className="text-[13px] font-semibold text-[var(--eh-text)]">
          {isPro ? "Your Pro features" : "What's included in your plan"}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.label}
              className={[
                "flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px]",
                f.included
                  ? "bg-[var(--color-brand-50)] border border-[var(--color-brand-100)]"
                  : "bg-amber-50 border border-amber-100",
              ].join(" ")}
            >
              {f.included ? (
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--color-brand-600)]" />
              ) : (
                <Lock size={15} className="mt-0.5 shrink-0 text-amber-500" />
              )}
              <span className={f.included ? "text-[var(--color-brand-800)] font-medium" : "text-amber-800"}>
                {f.label}
                {!f.included && (
                  <span className="ml-1.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    Pro
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA for free users */}
      {!isPro && (
        <div className="rounded-[24px] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)] text-white">
              <Star size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[14.5px] font-semibold text-[var(--eh-text)]">
                Stand out with Teacher Pro
              </p>
              <p className="mt-1 text-[13.5px] leading-[1.7] text-[var(--eh-text-2)]">
                Priority placement in school searches, instant job alerts, and profile view analytics — all for ₹199/month.
              </p>
              <a
                href="mailto:hello@theeduhire.in?subject=Teacher Pro Plan — EduHire&body=Hi EduHire team,%0A%0AI'd like to upgrade my teacher account to the Pro plan (%E2%82%B9199/month). Please share the payment details.%0A%0AThanks"
                className="eh-btn eh-btn-primary mt-4 inline-flex shadow-[0_4px_14px_rgba(10,102,194,0.2)]"
                title="Opens your email app"
              >
                Email us to upgrade <ArrowRight size={13} />
              </a>
              <p className="mt-2 text-[12px] text-[var(--eh-text-4)]">
                We will activate your plan within 1 business day.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Priority placement explainer */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[20px] border border-[var(--eh-border)] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-50)]">
            <TrendingUp size={16} className="text-[var(--color-brand-600)]" />
          </div>
          <p className="mt-3 text-[13.5px] font-semibold text-[var(--eh-text)]">Priority placement</p>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-[var(--eh-text-3)]">
            Your profile appears higher in school searches for relevant subject and grade combinations.
          </p>
          {!isPro && (
            <span className="mt-2 inline-block rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--color-brand-700)]">
              Pro only
            </span>
          )}
        </div>

        <div className="rounded-[20px] border border-[var(--eh-border)] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-50)]">
            <Zap size={16} className="text-[var(--color-brand-600)]" />
          </div>
          <p className="mt-3 text-[13.5px] font-semibold text-[var(--eh-text)]">Instant alerts</p>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-[var(--eh-text-3)]">
            Get notified immediately when a school posts a job matching your subjects, board, and city.
          </p>
          {!isPro && (
            <span className="mt-2 inline-block rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--color-brand-700)]">
              Pro only
            </span>
          )}
        </div>

        <div className="rounded-[20px] border border-[var(--eh-border)] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-50)]">
            <Sparkles size={16} className="text-[var(--color-brand-600)]" />
          </div>
          <p className="mt-3 text-[13.5px] font-semibold text-[var(--eh-text)]">Profile analytics</p>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-[var(--eh-text-3)]">
            See how many schools viewed your profile and which jobs your profile appeared in.
          </p>
          {!isPro && (
            <span className="mt-2 inline-block rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--color-brand-700)]">
              Pro only
            </span>
          )}
        </div>
      </div>
    </PageShell>
  );
}
