import Link from "next/link";
import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

// ── Page scaffold ──────────────────────────────────────────────────────────

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn("space-y-5 lg:space-y-6", className)}>{children}</div>;
}

// ── Page header ───────────────────────────────────────────────────────────

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
};

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--eh-border)]">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)] sm:text-[26px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[var(--eh-text-3)]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0 self-start">{actions}</div> : null}
    </div>
  );
}

// ── Panels ────────────────────────────────────────────────────────────────

type PanelProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

export function Panel({ children, className, ...props }: PanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--eh-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className }: SectionCardProps) {
  return <Panel className={cn("p-5 md:p-6", className)}>{children}</Panel>;
}

// ── Panel header ──────────────────────────────────────────────────────────

type PanelHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function PanelHeader({ title, subtitle, actions, className, compact = false }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        compact ? "mb-3" : "mb-5",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-[-0.014em] text-[var(--eh-text)]">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] leading-5 text-[var(--eh-text-3)]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader(props: PanelHeaderProps) {
  return <PanelHeader {...props} />;
}

// ── Toolbar / filter bar ──────────────────────────────────────────────────

type ToolbarProps = {
  children: ReactNode;
  className?: string;
};

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-[var(--eh-border)] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FilterBar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-[var(--eh-border)] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────

type MetricProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "info" | "success" | "warning" | "neutral";
  className?: string;
  href?: string;
};

const metricAccentBar: Record<NonNullable<MetricProps["tone"]>, string> = {
  brand: "bg-[var(--eh-primary-500)]",
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  neutral: "bg-slate-400",
};

const metricValueColor: Record<NonNullable<MetricProps["tone"]>, string> = {
  brand: "text-[var(--eh-primary-700)]",
  info: "text-sky-700",
  success: "text-emerald-700",
  warning: "text-amber-700",
  neutral: "text-[var(--eh-text)]",
};

export function Metric({ label, value, hint, tone = "neutral", className, href }: MetricProps) {
  const inner = (
    <>
      <div className={cn("mb-3 h-0.5 w-8 rounded-full", metricAccentBar[tone])} />
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">{label}</p>
      <div className={cn("mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em]", metricValueColor[tone])}>
        {value}
      </div>
      {hint ? <p className="mt-2 text-[12px] leading-[1.4] text-[var(--eh-text-3)]">{hint}</p> : null}
    </>
  );
  const cls = cn(
    "rounded-xl border border-[var(--eh-border)] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200",
    href && "hover:border-[var(--eh-border-strong)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)] cursor-pointer",
    className
  );
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

// ── Status badge ──────────────────────────────────────────────────────────

type StatusTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

const statusToneStyles: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  brand: "border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]",
  info: "border-sky-100 bg-sky-50 text-sky-700",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  danger: "border-red-100 bg-red-50 text-red-600",
};

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusTone;
  dot?: boolean;
  className?: string;
} & HTMLAttributes<HTMLSpanElement>;

export function StatusBadge({ children, tone = "neutral", dot = false, className, ...props }: StatusBadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        statusToneStyles[tone],
        className
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  );
}

// ── Data table ────────────────────────────────────────────────────────────

type DataTableProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DataTable({ children, className, contentClassName }: DataTableProps) {
  return (
    <Panel className={className}>
      <div className={cn("overflow-x-auto", contentClassName)}>{children}</div>
    </Panel>
  );
}
