"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/page-shell";

type BillingInfo = {
  plan: "FREE" | "GROWTH" | "PRO";
  status: string;
  postsUsed: number;
  postsLimit: number | null; // null = unlimited
  cycleResetAt: string | null;
};

const PLAN_FEATURES: Record<string, { label: string; plans: string[] }[]> = {
  FREE: [
    { label: "2 active job posts per month", plans: ["FREE", "GROWTH", "PRO"] },
    { label: "Basic applicant list", plans: ["FREE", "GROWTH", "PRO"] },
    { label: "School profile & trust badge", plans: ["FREE", "GROWTH", "PRO"] },
    { label: "WhatsApp interview reminders", plans: ["FREE", "GROWTH", "PRO"] },
    { label: "AI match score shortlisting", plans: ["GROWTH", "PRO"] },
    { label: "Teacher phone & WhatsApp reveal", plans: ["GROWTH", "PRO"] },
    { label: "Analytics dashboard", plans: ["PRO"] },
  ],
  GROWTH: [
    { label: "10 active job posts per month", plans: ["GROWTH", "PRO"] },
    { label: "AI match score shortlisting", plans: ["GROWTH", "PRO"] },
    { label: "Teacher phone & WhatsApp reveal", plans: ["GROWTH", "PRO"] },
    { label: "Demo video & lesson plan access", plans: ["GROWTH", "PRO"] },
    { label: "Interview scheduling dashboard", plans: ["GROWTH", "PRO"] },
    { label: "WhatsApp interview reminders", plans: ["FREE", "GROWTH", "PRO"] },
    { label: "Analytics dashboard", plans: ["PRO"] },
  ],
  PRO: [
    { label: "Unlimited active job posts", plans: ["PRO"] },
    { label: "AI match score shortlisting", plans: ["GROWTH", "PRO"] },
    { label: "Teacher phone & WhatsApp reveal", plans: ["GROWTH", "PRO"] },
    { label: "Demo video & lesson plan access", plans: ["GROWTH", "PRO"] },
    { label: "Interview scheduling dashboard", plans: ["GROWTH", "PRO"] },
    { label: "Analytics & hiring funnel dashboard", plans: ["PRO"] },
    { label: "WhatsApp interview reminders", plans: ["FREE", "GROWTH", "PRO"] },
  ],
};

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  FREE: { label: "Free", color: "bg-[var(--surface-base)] text-[var(--eh-text-2)] border border-[var(--eh-border)]" },
  GROWTH: { label: "Growth", color: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]" },
  PRO: { label: "Pro", color: "bg-[#0a1929] text-white border border-[#0a1929]" },
};

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/billing/plan");
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
        <PageHeader title="Billing & Plan" subtitle="Manage your subscription and view usage" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[20px] bg-[var(--surface-base)]" />
          ))}
        </div>
      </PageShell>
    );
  }

  const plan = billing?.plan ?? "FREE";
  const postsUsed = billing?.postsUsed ?? 0;
  const postsLimit = billing?.postsLimit ?? 2; // null from API = unlimited
  const isUnlimited = billing?.postsLimit === null;
  const usagePercent = isUnlimited ? 0 : Math.min(100, Math.round((postsUsed / postsLimit) * 100));
  const badge = PLAN_BADGE[plan];
  const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.FREE;
  const upgradeTarget = plan === "FREE" ? "Growth" : plan === "GROWTH" ? "Pro" : null;

  return (
    <PageShell>
      <PageHeader
        title="Billing & Plan"
        subtitle="Manage your subscription and view usage"
        eyebrow="Account"
      />

      {/* Current plan */}
      <div className="rounded-[24px] border border-[var(--eh-border)] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--eh-text-4)]">Current plan</p>
            <div className="mt-2 flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${badge.color}`}>
                <CreditCard size={13} />
                {badge.label}
              </span>
              {billing?.status && billing.status !== "ACTIVE" && (
                <span className="rounded-full bg-[var(--eh-warning-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--eh-warning)] ring-1 ring-[var(--eh-warning-border)]">
                  {billing.status.replace("_", " ")}
                </span>
              )}
            </div>
          </div>
          {upgradeTarget && (
            <a
              href={`mailto:hello@theeduhire.in?subject=Upgrade to ${upgradeTarget} plan — EduHire&body=Hi EduHire team,%0A%0AI'd like to upgrade my school account to the ${upgradeTarget} plan. Please share the invoice and next steps.%0A%0AThanks`}
              className="eh-btn eh-btn-primary shrink-0 shadow-[0_4px_14px_rgba(10,102,194,0.2)]"
              title="Opens your email app"
            >
              Email us to upgrade <ArrowRight size={13} />
            </a>
          )}
        </div>
      </div>

      {/* Post usage meter */}
      <div className="rounded-[24px] border border-[var(--eh-border)] bg-white p-6">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-[var(--eh-text)]">
          <TrendingUp size={16} className="text-[var(--color-brand-600)]" />
          Job posts this cycle
        </div>
        <div className="mt-4 flex items-end justify-between">
          <p className="text-[2rem] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">
            {postsUsed}
            <span className="ml-1 text-[1.1rem] font-normal text-[var(--eh-text-3)]">
              / {isUnlimited ? "∞" : postsLimit}
            </span>
          </p>
          <p className="text-[13px] text-[var(--eh-text-4)]">
            {isUnlimited ? "Unlimited posts" : `${postsLimit - postsUsed} posts remaining`}
          </p>
        </div>
        {!isUnlimited && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-base)]">
            <div
              className={[
                "h-full rounded-full transition-all",
                usagePercent >= 90 ? "bg-[var(--eh-danger)]" : usagePercent >= 60 ? "bg-[var(--eh-warning)]" : "bg-[var(--color-brand-600)]",
              ].join(" ")}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        )}
        {billing?.cycleResetAt && (
          <p className="mt-2 text-[12px] text-[var(--eh-text-4)]">
            Resets on {new Date(billing.cycleResetAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
          </p>
        )}
      </div>

      {/* Feature list */}
      <div className="rounded-[24px] border border-[var(--eh-border)] bg-white p-6">
        <p className="text-[13px] font-semibold text-[var(--eh-text)]">What's included in your plan</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {features.map((f) => {
            const included = f.plans.includes(plan);
            return (
              <div
                key={f.label}
                className={[
                  "flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px]",
                  included
                    ? "bg-[var(--color-brand-50)] border border-[var(--color-brand-100)]"
                    : "bg-amber-50 border border-amber-100",
                ].join(" ")}
              >
                {included ? (
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--color-brand-600)]" />
                ) : (
                  <Lock size={15} className="mt-0.5 shrink-0 text-amber-500" />
                )}
                <span className={included ? "font-medium text-[var(--color-brand-800)]" : "text-amber-800"}>
                  {f.label}
                  {!included && (
                    <span className="ml-1.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {f.plans[0]}+
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade CTA */}
      {upgradeTarget && (
        <div className="rounded-[24px] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)] text-white">
              <Sparkles size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[14.5px] font-semibold text-[var(--eh-text)]">
                Unlock {upgradeTarget} features
              </p>
              <p className="mt-1 text-[13.5px] leading-[1.7] text-[var(--eh-text-2)]">
                {upgradeTarget === "Growth"
                  ? "Get AI match score shortlisting, teacher contact details reveal, and 10 active posts per month."
                  : "Get unlimited posts and the full analytics dashboard to track your hiring funnel."}
              </p>
              <a
                href={`mailto:hello@theeduhire.in?subject=Upgrade to ${upgradeTarget} plan — EduHire&body=Hi EduHire team,%0A%0AI'd like to upgrade my school account to the ${upgradeTarget} plan. Please share the invoice and next steps.%0A%0AThanks`}
                className="eh-btn eh-btn-primary mt-4 inline-flex shadow-[0_4px_14px_rgba(10,102,194,0.2)]"
              >
                Email us to upgrade <ArrowRight size={13} />
              </a>
              <p className="mt-2 text-[12px] text-[var(--eh-text-4)]">
                Opens your email app — we reply within 1 business day with invoice and activation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Managed Recruitment callout */}
      <div className="rounded-[24px] bg-[#0a1929] p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#60a5fa]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#93c5fd]">Managed recruitment</p>
            </div>
            <p className="mt-2 text-[15px] font-semibold">Don't have time to hire? We do it for you.</p>
            <p className="mt-1 text-[13px] leading-[1.7] text-white/55">
              Submit a JD, we source and shortlist teachers. Pay ₹10,000 only on a confirmed hire.
            </p>
          </div>
          <Link
            href="/managed-recruitment"
            className="eh-btn shrink-0 rounded-xl bg-white px-5 py-2.5 text-[13.5px] font-semibold text-[#0a1929] hover:bg-white/90"
          >
            Submit a requirement <Zap size={13} />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
