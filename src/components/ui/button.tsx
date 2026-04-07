import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-brand-500 text-white hover:bg-brand-600 active:scale-[0.98]",
        secondary: "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300",
        accent: "bg-accent-500 text-white hover:bg-accent-600 active:scale-[0.98]",
        ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
        danger: "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]",
        "danger-ghost": "text-red-500 hover:bg-red-50 hover:text-red-600",
      },
      size: {
        sm: "px-3 py-1.5 text-[12.5px]",
        md: "px-5 py-2.5 text-[14px]",
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
      {loading ? <Loader2 size={15} className="animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = "Button";
