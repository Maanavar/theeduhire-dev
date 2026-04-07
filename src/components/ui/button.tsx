import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl",
    "transition-all duration-[120ms] ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-brand-500 text-white shadow-brand",
          "hover:bg-brand-600 hover:-translate-y-px hover:shadow-brand-lg",
          "active:translate-y-0 active:shadow-brand",
        ].join(" "),
        secondary: [
          "border border-black/[0.09] text-gray-700 bg-white shadow-xs",
          "hover:border-black/[0.15] hover:bg-gray-50 hover:-translate-y-px hover:shadow-sm",
          "active:translate-y-0",
        ].join(" "),
        accent: [
          "bg-accent-500 text-white shadow-md",
          "hover:bg-accent-600 hover:-translate-y-px",
          "active:translate-y-0",
        ].join(" "),
        ghost: [
          "text-gray-600",
          "hover:bg-black/[0.04] hover:text-gray-900",
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
        xs: "px-2.5 py-1.5 text-xs rounded-lg",
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-[15px]",
        lg: "px-7 py-3.5 text-[15px]",
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
