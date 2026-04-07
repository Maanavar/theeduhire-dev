"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: "var(--font-body, sans-serif)",
          fontSize: "13.5px",
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,0.08)",
        },
      }}
    />
  );
}

export { toast } from "sonner";
