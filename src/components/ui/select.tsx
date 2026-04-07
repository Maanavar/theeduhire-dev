import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("px-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] bg-white focus:outline-none focus:border-brand-500 transition-colors w-full", className)}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
