"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { PageShell, PageHeader, Panel, PanelHeader } from "@/components/layout/page-shell";

type TeacherBillingInfo = {
  plan: "FREE" | "PRO";
  status: string;
};

const PLAN_FEATURES = {
  basic: [
    { label: "Browse & apply to jobs", included: true },
    { label: "Basic job alerts", included: true },
    { label: "Apply to 5 jobs/month", included: true },
    { label: "Basic profile & resume upload", included: true },
    { label: "Priority listing in school searches", included: false },
    { label: "Unlimited job applications", included: false },
    { label: "Profile view analytics", included: false },
    { label: "AI match explanations", included: false },
    { label: "Resume builder", included: false },
  ],
  pro: [
    { label: "Unlimited job applications", included: true },
    { label: "Resume builder", included: true },
    { label: "Profile boost", included: true },
    { label: "Priority listing in school searches", included: true },
    { label: "Daily job alerts", included: true },
    { label: "Resume bonus (per month)", included: true },
    { label: "Profile Analytics", included: true },
    { label: "AI match explanations", included: true },
    { label: "Dedicated Support", included: false },
  ],
  premium: [
    { label: "Everything in Pro", included: true },
    { label: "Dedicated Support", included: true },
    { label: "Managed Placement", included: true },
    { label: "Advanced Search Filters", included: true },
    { label: "Profile Priority Listing", included: true },
    { label: "Early access to new jobs", included: true },
    { label: "Profile video feature", included: true },
    { label: "AI-powered career counselling", included: true },
    { label: "Verified badge on profile", included: true },
  ],
};

const FAQS = [
  { q: "How does the free plan work?", a: "You can browse all jobs, apply to 5 per month, and get basic alerts at no cost." },
  { q: "Can I cancel anytime?", a: "Yes. You can cancel your subscription at any time. Access continues until the end of your billing period." },
  { q: "Is my payment information secure?", a: "Absolutely. We use industry-standard encryption for all payment processing." },
  { q: "What happens when I upgrade?", a: "Your account is upgraded immediately and you get access to all Pro features right away." },
];

export default function TeacherSubscriptionPage() {
  const [billing, setBilling] = useState<TeacherBillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [billing_cycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    fetch("/api/billing/teacher-plan")
      .then((r) => r.json())
      .then((d) => { if (d.success) setBilling(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="Subscription" subtitle="Choose the right plan to accelerate your teaching career." />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--surface-base)]" />)}
        </div>
      </PageShell>
    );
  }

  const plan = billing?.plan ?? "FREE";
  const isPro = plan === "PRO";

  const isYearly = billing_cycle === "yearly";
  const monthlyDisplay = (basePerMonth: number) =>
    isYearly ? Math.round(basePerMonth * 0.8) : basePerMonth;
  const annualTotal = (basePerMonth: number) => Math.round(basePerMonth * 12 * 0.8);
  const PRO_PER_MONTH = 199;
  const PREMIUM_PER_MONTH = 399;

  const upgradeHref = "mailto:hello@theeduhire.in?subject=Teacher Pro Plan — EduHire&body=Hi EduHire team,%0A%0AI'd like to upgrade my teacher account to the Pro plan. Please share the payment details.%0A%0AThanks";

  return (
    <PageShell>
      <PageHeader
        title="Subscription"
        subtitle="Choose the right plan to accelerate your teaching career."
      />

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`text-[13px] font-semibold transition-colors ${billing_cycle === "monthly" ? "text-[var(--eh-text)]" : "text-[var(--eh-text-3)]"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle(billing_cycle === "monthly" ? "yearly" : "monthly")}
          className={`relative h-6 w-11 rounded-full transition-colors ${billing_cycle === "yearly" ? "bg-[var(--eh-primary-600)]" : "bg-[var(--eh-border)]"}`}
        >
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${billing_cycle === "yearly" ? "translate-x-5.5" : "translate-x-1"}`} />
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`flex items-center gap-1.5 text-[13px] font-semibold transition-colors ${billing_cycle === "yearly" ? "text-[var(--eh-text)]" : "text-[var(--eh-text-3)]"}`}
        >
          Yearly
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Save 20%</span>
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        {/* Plan cards */}
        <div className="space-y-4">
          {/* 3-column plan grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Basic */}
            <div className={`rounded-xl border p-5 ${plan === "FREE" ? "border-[var(--eh-primary-300)] shadow-[0_0_0_2px_var(--eh-primary-100)]" : "border-[var(--eh-border)] bg-white"}`}>
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-3)]">Basic</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-[32px] font-bold leading-none text-[var(--eh-text)]">₹0</span>
                <span className="mb-1 text-[13px] text-[var(--eh-text-3)]">/month</span>
              </div>
              <p className="mt-1 text-[12px] text-[var(--eh-text-4)]">Free to get started</p>
              <button
                disabled
                className="mt-4 w-full rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-2 text-[13px] font-semibold text-[var(--eh-text-3)]"
              >
                {plan === "FREE" ? "Current Plan" : "Downgrade"}
              </button>
              <div className="mt-4 space-y-2">
                {PLAN_FEATURES.basic.map((f) => (
                  <div key={f.label} className="flex items-start gap-2">
                    {f.included ? (
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[var(--eh-primary-600)]" />
                    ) : (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--eh-border)]" />
                    )}
                    <p className={`text-[12px] ${f.included ? "text-[var(--eh-text-2)]" : "text-[var(--eh-text-4)]"}`}>{f.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro — highlighted */}
            <div className="relative rounded-xl border-2 border-[var(--eh-primary-400)] bg-white p-5 shadow-[0_4px_20px_rgba(10,102,194,0.12)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--eh-primary-600)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Most Popular
              </div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-primary-600)]">Pro</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-[32px] font-bold leading-none text-[var(--eh-text)]">₹{monthlyDisplay(PRO_PER_MONTH)}</span>
                <span className="mb-1 text-[13px] text-[var(--eh-text-3)]">/month</span>
              </div>
              {isYearly && (
                <p className="mt-0.5 text-[11px] text-emerald-600 font-semibold">Billed annually ₹{annualTotal(PRO_PER_MONTH).toLocaleString("en-IN")}</p>
              )}
              <p className="mt-1 text-[12px] text-[var(--eh-text-4)]">Essential tools to help you start</p>
              {isPro ? (
                <button disabled className="mt-4 w-full rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[13px] font-semibold text-emerald-700">
                  Current Plan
                </button>
              ) : (
                <a
                  href={upgradeHref}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--eh-primary-600)] px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--eh-primary-700)]"
                >
                  Upgrade to Pro <ArrowRight size={13} />
                </a>
              )}
              <div className="mt-4 space-y-2">
                {PLAN_FEATURES.pro.map((f) => (
                  <div key={f.label} className="flex items-start gap-2">
                    {f.included ? (
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[var(--eh-primary-600)]" />
                    ) : (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--eh-border)]" />
                    )}
                    <p className={`text-[12px] ${f.included ? "text-[var(--eh-text-2)]" : "text-[var(--eh-text-4)]"}`}>{f.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium */}
            <div className="rounded-xl border border-[var(--eh-border)] bg-white p-5">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-3)]">Premium</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-[32px] font-bold leading-none text-[var(--eh-text)]">₹{monthlyDisplay(PREMIUM_PER_MONTH)}</span>
                <span className="mb-1 text-[13px] text-[var(--eh-text-3)]">/month</span>
              </div>
              {isYearly && (
                <p className="mt-0.5 text-[11px] text-emerald-600 font-semibold">Billed annually ₹{annualTotal(PREMIUM_PER_MONTH).toLocaleString("en-IN")}</p>
              )}
              <p className="mt-1 text-[12px] text-[var(--eh-text-4)]">For serious job seekers</p>
              <a
                href={upgradeHref}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--eh-primary-300)] px-3 py-2 text-[13px] font-semibold text-[var(--eh-primary-700)] transition-colors hover:bg-[var(--eh-primary-50)]"
              >
                Upgrade to Premium <ArrowRight size={13} />
              </a>
              <div className="mt-4 space-y-2">
                {PLAN_FEATURES.premium.map((f) => (
                  <div key={f.label} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                    <p className="text-[12px] text-[var(--eh-text-2)]">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3">
            <Shield size={14} className="text-emerald-600" />
            <p className="text-[12px] font-semibold text-[var(--eh-text-2)]">Secure, Private, Trusted</p>
            <span className="text-[var(--eh-text-4)]">·</span>
            <p className="text-[12px] text-[var(--eh-text-3)]">Your payment information is safe and secure. You can cancel or change your plan anytime.</p>
          </div>

          {/* Save more CTA */}
          {billing_cycle === "monthly" && (
            <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-semibold text-emerald-900">Save more with yearly plans!</p>
                <p className="text-[12px] text-emerald-700">Get 20% off when you choose annual billing.</p>
              </div>
              <button
                onClick={() => setBillingCycle("yearly")}
                className="shrink-0 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-[12px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                Switch to Yearly &amp; Save
              </button>
            </div>
          )}

          {/* Feature highlights */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <TrendingUp size={16} />, title: "Priority placement", body: "Your profile appears higher in school searches for relevant subject and grade combinations.", proOnly: !isPro },
              { icon: <Zap size={16} />, title: "Instant alerts", body: "Get notified immediately when a school posts a job matching your subjects, board, and city.", proOnly: !isPro },
              { icon: <Sparkles size={16} />, title: "Profile analytics", body: "See how many schools viewed your profile and which jobs your profile appeared in.", proOnly: !isPro },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-[var(--eh-border)] bg-white p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--eh-primary-50)] text-[var(--eh-primary-600)]">
                  {item.icon}
                </div>
                <p className="mt-3 text-[13px] font-semibold text-[var(--eh-text)]">{item.title}</p>
                <p className="mt-1 text-[12px] leading-[1.5] text-[var(--eh-text-3)]">{item.body}</p>
                {item.proOnly && (
                  <span className="mt-2 inline-block rounded-full bg-[var(--eh-primary-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--eh-primary-700)]">Pro only</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="hidden xl:flex xl:flex-col xl:gap-4">
          {/* Current Plan card */}
          <Panel className="p-5">
            <PanelHeader title="Current Plan" compact />
            <div className="rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-3 text-center">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${isPro ? "bg-[#0a1929] text-white" : "border border-[var(--eh-border)] bg-white text-[var(--eh-text-2)]"}`}>
                <CreditCard size={12} />{isPro ? "Pro" : "Basic (Free)"}
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              {(isPro ? PLAN_FEATURES.pro : PLAN_FEATURES.basic).filter((f) => f.included).slice(0, 4).map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <CheckCircle2 size={11} className="shrink-0 text-[var(--eh-primary-600)]" />
                  <p className="text-[11px] text-[var(--eh-text-3)]">{f.label}</p>
                </div>
              ))}
            </div>
            {!isPro && (
              <a href={upgradeHref} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-[var(--eh-primary-600)] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--eh-primary-700)]">
                Upgrade to Pro <ArrowRight size={11} />
              </a>
            )}
            <Link href="/dashboard/subscription" className="mt-2 flex items-center justify-center text-[11px] font-semibold text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]">
              Compare Plans
            </Link>
          </Panel>

          {/* Billing history mini */}
          <Panel className="p-5">
            <PanelHeader title="Billing History" compact />
            <p className="text-[12px] text-[var(--eh-text-4)]">No billing history yet.</p>
          </Panel>

          {/* FAQs */}
          <Panel className="p-5">
            <PanelHeader title="Frequently Asked Questions" compact />
            <div className="space-y-3">
              {FAQS.map((faq) => (
                <div key={faq.q} className="border-b border-[var(--eh-border)] pb-3 last:border-0 last:pb-0">
                  <p className="text-[12px] font-semibold text-[var(--eh-text)]">{faq.q}</p>
                  <p className="mt-1 text-[11px] leading-[1.5] text-[var(--eh-text-3)]">{faq.a}</p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Account support */}
          <Panel className="p-4">
            <div className="flex items-start gap-2">
              <Star size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <p className="text-[12px] font-semibold text-[var(--eh-text)]">Need account support?</p>
                <Link href="mailto:hello@theeduhire.in" className="mt-0.5 inline-block text-[11px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                  Contact Support →
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
