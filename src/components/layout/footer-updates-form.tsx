"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export default function FooterUpdatesForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Footer updates signup",
          email,
          subject: "Marketing footer updates signup",
          message: `Please add ${email} to EduHire marketing updates for new schools and platform announcements.`,
        }),
      });

      if (!response.ok) throw new Error("Request failed");
      setEmail("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const helperText =
    status === "success"
      ? "Thanks. We'll keep you posted."
      : status === "error"
        ? "Could not submit right now. Please try again in a moment."
        : "A light-touch mailing list for launch notes and hiring-market updates.";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-[var(--eh-border)] bg-[var(--surface-base)] px-5 py-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[420px]">
          <label
            htmlFor="footer-updates-email"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--eh-text-4)]"
          >
            Get updates when new schools join
          </label>
          <p className="mt-1.5 text-[13px] text-[var(--eh-text-3)]">{helperText}</p>
        </div>
        <div className="flex w-full max-w-[420px] flex-col gap-2 sm:flex-row">
          <input
            id="footer-updates-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="eh-input h-[44px] flex-1 bg-white"
            aria-label="Email address"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="eh-btn eh-btn-primary h-[44px] shrink-0 px-5"
          >
            {status === "loading" ? "Joining..." : <>Get updates <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </form>
  );
}
