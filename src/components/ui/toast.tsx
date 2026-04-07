"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      gap={8}
      toastOptions={{
        style: {
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: "13.5px",
          fontWeight: "500",
          borderRadius: "14px",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)",
          padding: "12px 16px",
          color: "#1a1a1a",
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        },
        classNames: {
          success: "!border-emerald-100",
          error:   "!border-red-100",
          warning: "!border-amber-100",
          info:    "!border-blue-100",
        },
      }}
    />
  );
}

export { toast } from "sonner";
