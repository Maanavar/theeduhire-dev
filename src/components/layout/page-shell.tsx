import Link from "next/link";
import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn("space-y-6 lg:space-y-7", className)}>{children}</div>;
}

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.026em] text-eh-text sm:text-[30px]">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-3xl text-[14px] leading-6 text-eh-text3">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0 self-start">{actions}</div> : null}
    </div>
  );
}

type PanelProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

export function Panel({ children, className, ...props }: PanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-eh bg-eh-surface shadow-xs",
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
        compact ? "mb-3 flex items-start justify-between gap-3" : "mb-5 flex items-start justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold tracking-[-0.018em] text-eh-text">{title}</h2>
        {subtitle ? <p className="mt-1 text-[13px] leading-5 text-eh-text3">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader(props: PanelHeaderProps) {
  return <PanelHeader {...props} />;
}

type ToolbarProps = {
  children: ReactNode;
  className?: string;
};

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-eh bg-eh-surface px-4 py-3 shadow-xs sm:flex-row sm:items-center sm:justify-between",
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
        "flex flex-col gap-3 border-t border-eh px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      {children}
    </div>
  );
}

type MetricProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "info" | "success" | "warning" | "neutral";
  className?: string;
  href?: string;
};

const metricToneStyles = {
  brand: "border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]",
  info: "border border-sky-100 bg-sky-50 text-sky-700",
  success: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border border-amber-100 bg-amber-50 text-amber-700",
  neutral: "border border-slate-200 bg-slate-100 text-slate-700",
} as const;

export function Metric({ label, value, hint, icon, tone = "neutral", className, href }: MetricProps) {
  const inner = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-eh-text3">{label}</p>
        <div className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.035em] text-eh-text">{value}</div>
        {hint ? <p className="mt-2 text-[12px] leading-5 text-eh-text3">{hint}</p> : null}
      </div>
      {icon ? (
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", metricToneStyles[tone])}>{icon}</div>
      ) : null}
    </div>
  );
  const cls = cn("rounded-2xl border border-eh bg-eh-surface px-4 py-4 shadow-xs transition-shadow", href && "hover:shadow-md cursor-pointer", className);
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

type StatusTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

const statusToneStyles: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  brand: "border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]",
  info: "border-sky-100 bg-sky-50 text-sky-700",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  danger: "border-red-100 bg-red-50 text-red-700",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        statusToneStyles[tone],
        className
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" /> : null}
      {children}
    </span>
  );
}

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
