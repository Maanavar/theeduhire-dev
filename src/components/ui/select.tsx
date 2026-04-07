import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const chevronSvg = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`;

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, error, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "input-base appearance-none cursor-pointer pr-9",
            "bg-no-repeat bg-[length:10px_6px]",
            error && "!border-red-400 focus:!border-red-400 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
            className
          )}
          style={{ backgroundImage: chevronSvg, backgroundPosition: "right 14px center" }}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500 font-medium">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
              <circle cx="6" cy="6" r="5.5" stroke="currentColor"/>
              <path d="M6 3.5V6.5M6 8.5H6.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
