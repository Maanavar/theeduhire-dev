"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "1.5rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              border: "1px solid #fee2e2",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h2>
          <p
            style={{
              marginTop: 8,
              maxWidth: 360,
              fontSize: 14,
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            A critical error occurred. Please refresh the page.
            {error.digest && (
              <span style={{ display: "block", marginTop: 4, fontSize: 11, fontFamily: "monospace" }}>
                Ref: {error.digest}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "#0f172a",
            }}
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      </body>
    </html>
  );
}
