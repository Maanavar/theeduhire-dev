"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/page-shell";
import { getBillingPlan, type BillingPlan as BillingInfo } from "@/lib/api/billing-client";

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  FREE: { label: "Free", color: "bg-[var(--surface-base)] text-[var(--eh-text-2)] border border-[var(--eh-border)]" },
  GROWTH: { label: "Growth", color: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]" },
  PRO: { label: "Pro", color: "bg-[#0a1929] text-white border border-[#0a1929]" },
};

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBillingPlan()
      .then(setBilling)
      .catch(() => {})
      .finally(() => setLoading(false));
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
  const upgradeTarget = plan === "FREE" ? "Growth" : plan === "GROWTH" ? "Pro" : null;

  const PLANS = [
    {
      key: "FREE",
      label: "FREE",
      price: "₹0",
      period: "/month",
      tagline: "Ideal for getting started",
      posts: "Up to 2 active job posts",
      cta: plan === "FREE" ? "Current Plan" : "Get Started",
      isCurrent: plan === "FREE",
      isUpgrade: plan !== "FREE",
      isPro: false,
    },
    {
      key: "GROWTH",
      label: "GROWTH",
      price: "₹4,999",
      period: "/month",
      tagline: "For growing schools",
      posts: "Up to 10 active job posts",
      cta: plan === "GROWTH" ? "Current Plan" : "Upgrade to Growth",
      isCurrent: plan === "GROWTH",
      isUpgrade: plan === "FREE",
      isPro: false,
    },
    {
      key: "PRO",
      label: "PRO",
      price: "₹9,999",
      period: "/month",
      tagline: "For high-volume hiring",
      posts: "Unlimited active job posts",
      cta: plan === "PRO" ? "Current Plan" : "Upgrade to Pro",
      isCurrent: plan === "PRO",
      isUpgrade: plan !== "PRO",
      isPro: true,
    },
  ];

  const ALL_FEATURES = [
    { label: "Active Job Posts", free: "Up to 2", growth: "Up to 10", pro: "Unlimited" },
    { label: "AI Shortlist", free: "Limited (10/month)", growth: "Unlimited", pro: "Unlimited" },
    { label: "Teacher Contact Reveal", free: "10 reveals/month", growth: "100 reveals/month", pro: "250 reveals/month" },
    { label: "Analytics", free: "Basic", growth: "Full Access", pro: "Advanced" },
    { label: "Priority Support", free: "—", growth: "✓", pro: "✓" },
    { label: "Managed Recruitment Discounts", free: "—", growth: "10% off", pro: "20% off" },
    { label: "Team Seats", free: "1 Admin", growth: "Up to 5 Admins", pro: "Up to 15 Admins" },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Billing & Plan"
        subtitle="Manage your subscription, billing, and unlock more hiring power for your school."
      />

      {/* Usage KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-xl border border-[var(--eh-border)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)] mb-2">Active Job Posts</p>
          <p className="text-[22px] font-semibold text-[var(--eh-primary-700)]">{postsUsed} / {isUnlimited ? "∞" : postsLimit}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-base)]">
            <div className={["h-full rounded-full", usagePercent >= 90 ? "bg-red-500" : usagePercent >= 60 ? "bg-amber-400" : "bg-[var(--eh-primary-600)]"].join(" ")} style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--eh-text-4)]">{usagePercent}% used</p>
        </div>
        {[
          { label: "AI Shortlist Access", value: plan !== "FREE" ? "Unlimited" : "Limited", sub: plan !== "FREE" ? "Included" : "Upgrade" },
          { label: "Contact Reveal Access", value: plan === "FREE" ? "10" : plan === "GROWTH" ? "50 / 100" : "Unlimited", sub: "reveals/month" },
          { label: "Analytics", value: plan === "PRO" ? "Advanced" : plan === "GROWTH" ? "Full Access" : "Basic", sub: plan !== "FREE" ? "Included" : "Upgrade" },
          { label: "Billing Status", value: billing?.status === "ACTIVE" ? "Current" : billing?.status?.replace("_", " ") || "Active", sub: "Up to date" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[var(--eh-border)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)] mb-2">{m.label}</p>
            <p className="text-[16px] font-semibold text-[var(--eh-text)]">{m.value}</p>
            <p className="mt-1 text-[11px] text-emerald-600 font-medium">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* Plan cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.key}
                className={[
                  "relative rounded-xl border p-5 transition-all",
                  p.isCurrent
                    ? "border-[var(--eh-primary-300)] bg-[var(--eh-primary-50)] shadow-[0_0_0_2px_var(--eh-primary-200)]"
                    : "border-[var(--eh-border)] bg-white hover:border-[var(--eh-border-strong)]",
                ].join(" ")}
              >
                {p.isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--eh-primary-600)] px-3 py-0.5 text-[10px] font-bold text-white">
                    Current Plan
                  </span>
                )}
                <p className={`text-[13px] font-bold tracking-[0.06em] ${p.isCurrent ? "text-[var(--eh-primary-700)]" : "text-[var(--eh-text-2)]"}`}>{p.label}</p>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className={`text-[26px] font-bold tracking-[-0.02em] ${p.isCurrent ? "text-[var(--eh-primary-700)]" : "text-[var(--eh-text)]"}`}>{p.price}</span>
                  <span className="text-[12px] text-[var(--eh-text-3)]">{p.period}</span>
                </div>
                <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">{p.tagline}</p>
                <p className="mt-3 text-[12px] font-semibold text-[var(--eh-primary-700)]">{p.posts}</p>
                {p.isCurrent ? (
                  <button disabled className="mt-4 w-full rounded-lg bg-[var(--eh-primary-600)] py-2 text-[13px] font-semibold text-white opacity-90">Current Plan</button>
                ) : p.isUpgrade ? (
                  <a
                    href={`mailto:hello@theeduhire.in?subject=Upgrade to ${p.label} plan — EduHire`}
                    className="mt-4 block w-full rounded-lg border border-[var(--eh-border)] py-2 text-center text-[13px] font-semibold text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors"
                  >
                    {p.cta}
                  </a>
                ) : null}
              </div>
            ))}
          </div>

          {/* Feature comparison table */}
          <div className="rounded-xl border border-[var(--eh-border)] bg-white overflow-hidden">
            <div className="border-b border-[var(--eh-border)] px-5 py-4">
              <h3 className="text-[14px] font-semibold text-[var(--eh-text)]">Features</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--eh-border)] bg-[var(--surface-base)]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Feature</th>
                  {["FREE", "GROWTH", "PRO"].map((p) => (
                    <th key={p} className={["px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.08em]", plan === p ? "text-[var(--eh-primary-700)]" : "text-[var(--eh-text-4)]"].join(" ")}>
                      {p} {plan === p && <span className="ml-1 text-[9px] font-bold rounded-full bg-[var(--eh-primary-100)] px-1.5 py-0.5">Current</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--eh-border)]">
                {ALL_FEATURES.map((feat) => (
                  <tr key={feat.label} className="hover:bg-[var(--surface-base)] transition-colors">
                    <td className="px-5 py-3 text-[13px] font-medium text-[var(--eh-text-2)]">{feat.label}</td>
                    {[feat.free, feat.growth, feat.pro].map((val, i) => (
                      <td key={i} className={["px-4 py-3 text-center text-[12px]", val === "—" ? "text-[var(--eh-text-4)]" : val === "✓" ? "text-emerald-600 font-bold" : "text-[var(--eh-text-2)] font-medium", i === (plan === "FREE" ? 0 : plan === "GROWTH" ? 1 : 2) ? "text-[var(--eh-primary-700)] font-semibold" : ""].join(" ")}>
                        {val === "✓" ? <CheckCircle2 size={14} className="mx-auto text-emerald-500" /> : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Current plan card */}
          <div className="rounded-xl border border-[var(--eh-border)] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Current Plan</h3>
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${badge.color}`}>{badge.label} Plan</span>
            </div>
            <p className="text-[28px] font-bold tracking-[-0.02em] text-[var(--eh-primary-700)]">{postsUsed} / {isUnlimited ? "∞" : postsLimit}</p>
            <p className="text-[12px] text-[var(--eh-text-3)]">Active job posts used</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-base)]">
              <div className="h-full rounded-full bg-[var(--eh-primary-600)] transition-all" style={{ width: `${usagePercent}%` }} />
            </div>
            {billing?.cycleResetAt && (
              <p className="mt-2 text-[11px] text-[var(--eh-text-4)]">Renews on {new Date(billing.cycleResetAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            )}
            {upgradeTarget && (
              <a
                href={`mailto:hello@theeduhire.in?subject=Upgrade to ${upgradeTarget} plan — EduHire`}
                className="mt-4 block w-full text-center rounded-lg bg-[var(--eh-primary-600)] py-2 text-[13px] font-semibold text-white hover:bg-[var(--eh-primary-700)] transition-colors"
              >
                Upgrade Plan
              </a>
            )}
            <a
              href="mailto:hello@theeduhire.in?subject=Manage subscription — EduHire"
              className="mt-2 block w-full text-center rounded-lg border border-[var(--eh-border)] py-2 text-[13px] font-semibold text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors"
            >
              Manage Subscription
            </a>
          </div>

          {/* Upgrade nudge */}
          {upgradeTarget && (
            <div className="rounded-xl border border-[var(--eh-border)] bg-white p-5">
              <p className="text-[13px] font-semibold text-[var(--eh-text)] mb-1">Need more hiring power?</p>
              <p className="text-[12px] text-[var(--eh-text-3)] leading-[1.6] mb-3">Upgrade your plan to post more jobs, access advanced features, and hire better, faster.</p>
              <ul className="space-y-1.5 mb-4">
                {["Post more active jobs", "Unlock managed recruitment discounts", "Priority support & faster response"].map((feat) => (
                  <li key={feat} className="flex items-center gap-1.5 text-[12px] text-[var(--eh-text-3)]">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:hello@theeduhire.in?subject=Upgrade to ${upgradeTarget} plan — EduHire`}
                className="eh-btn eh-btn-primary w-full justify-center"
              >
                Upgrade Now <ArrowRight size={13} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Billing History */}
      <div className="rounded-xl border border-[var(--eh-border)] bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--eh-border)] px-5 py-4">
          <h3 className="text-[14px] font-semibold text-[var(--eh-text)]">Billing History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--eh-border)] bg-[var(--surface-base)]">
              {["Invoice #", "Billing Cycle", "Amount", "Payment Status", "Date", "Action"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--eh-border)]">
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-[var(--eh-text-3)]">
                {plan === "FREE"
                  ? "No billing history available on the Free plan."
                  : "No invoices yet. Your invoices will appear here after your first billing cycle."}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
