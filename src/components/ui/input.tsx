import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightElement, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-[13px] font-semibold text-[var(--eh-text-2)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input-base",
              leftIcon && "pl-10",
              rightElement && "pr-10",
              error && "!border-red-400 focus:!border-red-400 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500 font-medium">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
              <circle cx="6" cy="6" r="5.5" stroke="currentColor"/>
              <path d="M6 3.5V6.5M6 8.5H6.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-[var(--eh-text-4)]">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
