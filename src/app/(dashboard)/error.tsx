"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
        <AlertTriangle size={22} className="text-red-500" />
      </div>
      <h2 className="text-[18px] font-semibold text-[var(--eh-text)]">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[var(--eh-text-3)]">
        An unexpected error occurred. This has been logged — try refreshing or return to the
        dashboard.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-[var(--eh-text-4)]">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="eh-btn eh-btn-secondary"
        >
          <RefreshCw size={13} /> Try again
        </button>
        <Link href="/dashboard" className="eh-btn eh-btn-ghost">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
