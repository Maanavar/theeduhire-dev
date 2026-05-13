import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-semibold rounded-full",
    "transition-all duration-[120ms] ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--eh-primary-500)] text-white shadow-none",
          "hover:bg-[var(--eh-primary-700)] hover:-translate-y-px",
          "active:translate-y-0",
        ].join(" "),
        secondary: [
          "border border-[var(--eh-border)] bg-white text-[var(--eh-primary-700)] shadow-none",
          "hover:border-[var(--eh-primary-200)] hover:bg-[var(--eh-primary-50)] hover:-translate-y-px",
          "active:translate-y-0",
        ].join(" "),
        accent: [
          "bg-accent-500 text-white shadow-md",
          "hover:bg-accent-600 hover:-translate-y-px",
          "active:translate-y-0",
        ].join(" "),
        ghost: [
          "text-[var(--eh-text-2)]",
          "hover:bg-[var(--eh-primary-50)] hover:text-[var(--eh-primary-700)]",
        ].join(" "),
        danger: [
          "bg-red-500 text-white shadow-sm",
          "hover:bg-red-600 hover:-translate-y-px",
          "active:translate-y-0",
        ].join(" "),
        "danger-ghost": [
          "text-red-500",
          "hover:bg-red-50 hover:text-red-600",
        ].join(" "),
      },
      size: {
        xs: "px-2.5 py-1.5 text-xs",
        sm: "px-3.5 py-2 text-sm",
        md: "px-5 py-2.5 text-[15px]",
        lg: "px-7 py-3 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = "Button";
