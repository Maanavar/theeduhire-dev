"use client";

import Link from "next/link";
import { ArrowRight, Building2, LockKeyhole, Users2 } from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

const HIGHLIGHT_PHRASES = [
  "right teacher",
  "right school",
  "சரியான ஆசிரியரை",
  "சரியான பள்ளியில்",
];

function highlightHero(text: string) {
  const pattern = new RegExp(`(${HIGHLIGHT_PHRASES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    HIGHLIGHT_PHRASES.includes(part) ? (
      <span key={i} className="text-[var(--color-brand-600)]">{part}</span>
    ) : part
  );
}

export function HomeHeroText({
  jobCount,
  schoolCount,
}: {
  jobCount: number;
  schoolCount: number;
}) {
  const { t } = useLang();

  return (
    <>
      <ScrollReveal delay={0}>
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,99,64,0.14)] bg-white/90 px-4 py-1.5 text-[12px] font-semibold text-[var(--color-brand-700)] shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-brand-500)]" />
          {t.home.badge}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <h1 className="mt-5 font-display text-[clamp(2.8rem,5.8vw,5rem)] font-semibold leading-[0.97] tracking-[-0.055em] text-[var(--eh-text)] whitespace-pre-line">
          {highlightHero(t.home.hero)}
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={160}>
        <p className="mt-5 max-w-[580px] text-[17px] leading-[1.75] text-[var(--eh-text-2)] md:text-[18px]">
          {t.home.heroSub}
        </p>
      </ScrollReveal>

      <ScrollReveal delay={220}>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/auth/signup?role=school"
            className="eh-btn eh-btn-primary eh-btn-lg shadow-[0_8px_24px_rgba(21,125,78,0.28)] transition-shadow hover:shadow-[0_12px_32px_rgba(21,125,78,0.36)]"
          >
            {t.home.heroCta2} <ArrowRight size={15} />
          </Link>
          <Link href="/auth/signup?role=teacher" className="eh-btn eh-btn-secondary eh-btn-lg border-[rgba(15,23,42,0.1)] bg-white/85">
            {t.home.heroCta1}
          </Link>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={280}>
        <div className="mt-6 flex flex-wrap items-center gap-2.5 text-[12.5px] text-[var(--eh-text-3)]">
          {jobCount > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-[rgba(15,23,42,0.07)]">
              <Users2 size={13} className="text-[var(--color-brand-600)]" />
              {jobCount} {t.home.statsJobs}
            </span>
          ) : null}
          {schoolCount > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-[rgba(15,23,42,0.07)]">
              <Building2 size={13} className="text-[var(--color-brand-600)]" />
              {schoolCount} {t.home.statsSchools}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-[rgba(15,23,42,0.07)]">
              <Building2 size={13} className="text-[var(--color-brand-600)]" />
              Accepting school registrations
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-[rgba(15,23,42,0.07)]">
            <LockKeyhole size={13} className="text-[var(--color-brand-600)]" />
            Free for teachers
          </span>
        </div>
      </ScrollReveal>
    </>
  );
}
