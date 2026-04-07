import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("px-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] bg-white focus:outline-none focus:border-brand-500 transition-colors w-full", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";
