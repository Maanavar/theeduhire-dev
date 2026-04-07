import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "brand";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const variants = {
  default: "bg-gray-100 text-gray-600 border-gray-200/60",
  brand:   "bg-brand-50 text-brand-700 border-brand-100",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  danger:  "bg-red-50 text-red-600 border-red-100",
  info:    "bg-blue-50 text-blue-700 border-blue-100",
};

const dotColors = {
  default: "bg-gray-400",
  brand:   "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  info:    "bg-blue-500",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full border",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
