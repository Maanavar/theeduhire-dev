"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n/context";

export function JobsPageHeader() {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-eh-primary">
          {t.jobs.title}
        </p>
        <h1 className="mt-2 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-[var(--eh-text)]">
          {t.jobs.subtitle}
        </h1>
        <p className="mt-2 max-w-[480px] text-[14px] leading-[1.65] text-[var(--eh-text-2)]">
          Browse verified roles by subject, board, city, and grade — then apply without starting from scratch.
        </p>
      </div>
      <div className="shrink-0 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-5 py-4 sm:text-right">
        <p className="text-[12px] text-[var(--eh-text-3)]">Teacher? Your profile travels with you.</p>
        <Link
          href="/auth/signup?role=teacher"
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-eh-primary hover:underline"
        >
          Create a free profile <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
