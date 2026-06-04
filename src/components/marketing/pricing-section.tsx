"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X, Sparkles, Building2, GraduationCap } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

// ── School plan data ──────────────────────────────────────────────────────────

const SCHOOL_PLANS = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    featured: false,
    badge: null,
    description: "Get started verifying your school and posting your first roles.",
    features: [
      "2 active job posts per month",
      "Basic applicant list",
      "School profile & trust badge",
      "WhatsApp interview reminders",
      "Child-safety hiring workflow",
    ],
    locked: [
      "AI match score shortlisting",
      "Teacher contact details reveal",
      "Analytics dashboard",
    ],
    cta: "Register for free",
    ctaHref: "/auth/signup?role=school",
    ctaVariant: "secondary" as const,
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 999,
    featured: true,
    badge: "Most popular",
    description: "The full hiring stack for schools actively recruiting teachers.",
    features: [
      "10 active job posts per month",
      "AI-sorted match score shortlist",
      "Teacher phone & WhatsApp reveal",
      "Qualification-matched candidates",
      "Demo video & lesson plan access",
      "Interview scheduling dashboard",
      "WhatsApp interview reminders",
      "Child-safety hiring workflow",
    ],
    locked: [
      "Analytics dashboard",
    ],
    cta: "Start Growth plan",
    ctaHref: "/auth/signup?role=school",
    ctaVariant: "primary" as const,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 1999,
    featured: false,
    badge: null,
    description: "Everything in Growth plus deep analytics for hiring teams.",
    features: [
      "Unlimited active job posts",
      "AI-sorted match score shortlist",
      "Teacher phone & WhatsApp reveal",
      "Qualification-matched candidates",
      "Demo video & lesson plan access",
      "Interview scheduling dashboard",
      "Analytics & hiring funnel dashboard",
      "WhatsApp interview reminders",
      "Child-safety hiring workflow",
    ],
    locked: [],
    cta: "Start Pro plan",
    ctaHref: "/auth/signup?role=school",
    ctaVariant: "primary" as const,
  },
] as const;

// ── Teacher plan data ─────────────────────────────────────────────────────────

const TEACHER_PLANS = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    featured: false,
    badge: null,
    description: "Build your Teacher Passport and apply to verified schools at no cost.",
    features: [
      "Full Teacher Passport profile",
      "Unlimited job applications",
      "Fit score before applying",
      "Demo class video & lesson plan",
      "Document privacy controls",
      "Job alerts by email",
    ],
    locked: [
      "Priority placement in school searches",
      "Featured badge on profile",
      "Profile views analytics",
      "Instant WhatsApp status alerts",
    ],
    cta: "Create free profile",
    ctaHref: "/auth/signup?role=teacher",
    ctaVariant: "secondary" as const,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 199,
    featured: true,
    badge: "Get hired faster",
    description: "Stand out in school searches and know exactly who is looking at you.",
    features: [
      "Full Teacher Passport profile",
      "Unlimited job applications",
      "Fit score before applying",
      "Demo class video & lesson plan",
      "Document privacy controls",
      "Priority placement in school searches",
      "Featured badge on profile",
      "Profile views analytics (who viewed you)",
      "Instant WhatsApp & in-app status alerts",
    ],
    locked: [],
    cta: "Start Pro — ₹199/mo",
    ctaHref: "/auth/signup?role=teacher",
    ctaVariant: "primary" as const,
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function PricingSection() {
  const [audience, setAudience] = useState<"school" | "teacher">("school");
  const [annual, setAnnual] = useState(false);

  function annualMonthly(monthly: number) {
    return Math.round((monthly * 12 * 0.75) / 12);
  }

  const displayPlans = audience === "school" ? SCHOOL_PLANS : TEACHER_PLANS;

  return (
    <section id="pricing" className="border-b border-eh bg-[var(--surface-base)] px-5 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1160px]">
        {/* Header */}
        <ScrollReveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,3.2vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-[var(--eh-text)]">
            Simple, transparent pricing.
          </h2>
          <p className="mt-4 mx-auto max-w-[520px] text-[15px] leading-[1.8] text-[var(--eh-text-2)]">
            Teachers are always free. Schools pay only for what they need.
          </p>
        </ScrollReveal>

        {/* Audience toggle */}
        <ScrollReveal delay={60} className="mt-8 flex flex-col items-center gap-4">
          <div className="inline-flex rounded-2xl border border-[var(--eh-border)] bg-white p-1">
            {(["school", "teacher"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setAudience(tab)}
                className={[
                  "flex items-center gap-2 rounded-xl px-5 py-2 text-[13.5px] font-semibold transition-all duration-150",
                  audience === tab
                    ? "bg-[var(--color-brand-600)] text-white shadow-sm"
                    : "text-[var(--eh-text-2)] hover:text-[var(--eh-text)]",
                ].join(" ")}
              >
                {tab === "school" ? <Building2 size={14} /> : <GraduationCap size={14} />}
                {tab === "school" ? "For schools" : "For teachers"}
              </button>
            ))}
          </div>

          {/* Annual toggle — school only */}
          {audience === "school" && (
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--eh-text-2)]">
              <div
                onClick={() => setAnnual((a) => !a)}
                className={[
                  "relative h-5 w-9 rounded-full transition-colors duration-200",
                  annual ? "bg-[var(--color-brand-600)]" : "bg-[var(--eh-border)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                    annual ? "translate-x-4" : "translate-x-0.5",
                  ].join(" ")}
                />
              </div>
              Annual billing
              {annual && (
                <span className="rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-brand-700)] ring-1 ring-[var(--color-brand-200)]">
                  Save 25%
                </span>
              )}
            </label>
          )}
        </ScrollReveal>

        {/* Plan cards */}
        <div
          className={[
            "mt-10 grid gap-4",
            audience === "school" ? "sm:grid-cols-3" : "sm:grid-cols-2 max-w-2xl mx-auto",
          ].join(" ")}
        >
          {displayPlans.map((plan, index) => {
            const price = annual && plan.monthly > 0 ? annualMonthly(plan.monthly) : plan.monthly;
            const isFeatured = plan.featured;

            return (
              <ScrollReveal key={plan.id} delay={index * 55}>
                <div
                  className={[
                    "relative flex h-full flex-col rounded-[28px] border p-6 transition-shadow duration-300",
                    isFeatured
                      ? "border-[var(--color-brand-200)] bg-white ring-2 ring-[var(--color-brand-200)] shadow-[0_8px_32px_rgba(10,102,194,0.12)]"
                      : "border-[var(--eh-border)] bg-white hover:shadow-md",
                  ].join(" ")}
                >
                  {isFeatured && plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-600)] px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                        <Sparkles size={10} />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-600)]">
                      {plan.name}
                    </p>
                    <div className="mt-3 flex items-end gap-1">
                      {plan.monthly === 0 ? (
                        <span className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--eh-text)]">
                          Free
                        </span>
                      ) : (
                        <>
                          <span className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--eh-text)]">
                            ₹{price.toLocaleString("en-IN")}
                          </span>
                          <span className="mb-1.5 text-[13px] text-[var(--eh-text-3)]">/mo</span>
                        </>
                      )}
                    </div>
                    {annual && plan.monthly > 0 && (
                      <p className="text-[12px] text-[var(--eh-text-3)]">
                        Billed ₹{(annualMonthly(plan.monthly) * 12).toLocaleString("en-IN")}/year
                      </p>
                    )}
                    <p className="mt-3 text-[13.5px] leading-[1.65] text-[var(--eh-text-2)]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-5 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5 text-[13px] text-[var(--eh-text-2)]">
                        <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-brand-600)]" />
                        {f}
                      </div>
                    ))}
                    {plan.locked.map((f) => (
                      <div key={f} className="flex items-start gap-2.5 text-[13px] text-[var(--eh-text-4)]">
                        <X size={14} className="mt-0.5 shrink-0 text-[var(--eh-text-4)]" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <Link
                    href={plan.ctaHref}
                    className={[
                      "eh-btn mt-6 w-full justify-center",
                      plan.ctaVariant === "primary"
                        ? "eh-btn-primary shadow-[0_4px_14px_rgba(10,102,194,0.22)]"
                        : "eh-btn-secondary",
                    ].join(" ")}
                  >
                    {plan.cta}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Managed Recruitment strip — school view only */}
        {audience === "school" && (
          <ScrollReveal delay={120} className="mt-5">
            <div className="overflow-hidden rounded-[28px] bg-[#0a1929] p-6 text-white md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-[580px]">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#93c5fd] ring-1 ring-white/15">
                      Managed hiring
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-[1.5rem] font-semibold tracking-[-0.03em]">
                    Don&apos;t have time to hire? We do it for you.
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-[1.75] text-white/60">
                    Submit your JD. Our team sources, screens, and shortlists qualified teachers from EduHire&apos;s verified pool. You interview and confirm. Pay ₹10,000 only on a successful hire.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {[
                      "3–5 shortlisted candidates",
                      "5-day turnaround",
                      "Pay only on confirmed hire",
                      "No retainer or upfront fee",
                    ].map((pt) => (
                      <span
                        key={pt}
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[12px] text-white/70"
                      >
                        <Check size={11} className="text-[#60a5fa]" />
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="mb-3 text-center">
                    <p className="text-[2.2rem] font-semibold tracking-[-0.04em]">₹10,000</p>
                    <p className="text-[13px] text-white/50">per confirmed hire</p>
                  </div>
                  <Link
                    href="/managed-recruitment"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-[14px] font-semibold text-[#0a1929] transition-all hover:bg-white/90"
                  >
                    Submit a requirement <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Bottom note */}
        <ScrollReveal delay={80} className="mt-8 text-center">
          <p className="text-[13px] text-[var(--eh-text-4)]">
            {audience === "school"
              ? "All school plans include verification workflow, child-safety hiring, and UDISE-linked school badge."
              : "Teachers are always free to search, apply, and build their Teacher Passport. No placement fee ever."}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
