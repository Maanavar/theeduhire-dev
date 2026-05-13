"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminActionVariant =
  | { kind: "confirm"; message: string; confirmLabel?: string; danger?: boolean }
  | { kind: "notes"; label: string; confirmLabel?: string; danger?: boolean }
  | { kind: "reason"; label: string; placeholder?: string; confirmLabel?: string; danger?: boolean }
  | { kind: "reason-notes"; reasonLabel: string; notesLabel?: string; placeholder?: string; confirmLabel?: string; danger?: boolean };

interface Props {
  open: boolean;
  title: string;
  description?: string;
  variant: AdminActionVariant;
  loading?: boolean;
  onConfirm: (data: { reason?: string; notes?: string }) => void;
  onClose: () => void;
}

export default function AdminActionModal({ open, title, description, variant, loading, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [reasonError, setReasonError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setNotes("");
    setReasonError("");
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => firstInputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const isDanger = "danger" in variant ? variant.danger : false;
  const confirmLabel = "confirmLabel" in variant ? variant.confirmLabel : undefined;

  const handleSubmit = () => {
    if (variant.kind === "reason" || variant.kind === "reason-notes") {
      if (!reason.trim()) {
        setReasonError("A reason is required.");
        return;
      }
    }
    onConfirm({
      reason: (variant.kind === "reason" || variant.kind === "reason-notes") ? reason.trim() : undefined,
      notes: (variant.kind === "notes" || variant.kind === "reason-notes") ? (notes.trim() || undefined) : undefined,
    });
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aam-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl animate-scale-in flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            {isDanger && (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <AlertTriangle size={15} className="text-red-500" />
              </div>
            )}
            <div>
              <h2 id="aam-title" className="text-[17px] font-bold tracking-[-0.02em] text-gray-900">{title}</h2>
              {description && <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{description}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            disabled={loading}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        <div className="h-px bg-black/[0.05]" />

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {variant.kind === "confirm" && (
            <p className="text-[14px] leading-relaxed text-gray-600">{variant.message}</p>
          )}

          {(variant.kind === "reason" || variant.kind === "reason-notes") && (
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">
                {"reasonLabel" in variant ? variant.reasonLabel : variant.label}
                <span className="ml-1 text-red-500">*</span>
              </label>
              <textarea
                ref={firstInputRef}
                rows={3}
                value={reason}
                onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
                placeholder={"placeholder" in variant ? variant.placeholder : "Enter reason..."}
                className={cn(
                  "w-full resize-none rounded-xl border bg-gray-50 px-3.5 py-2.5 text-[13.5px] text-gray-800 placeholder-gray-400 outline-none transition-colors",
                  "focus:border-brand-500 focus:bg-white",
                  reasonError ? "border-red-300" : "border-gray-200"
                )}
              />
              {reasonError && <p className="mt-1 text-[12px] text-red-500">{reasonError}</p>}
            </div>
          )}

          {(variant.kind === "notes" || variant.kind === "reason-notes") && (
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">
                {variant.kind === "reason-notes" ? (variant.notesLabel ?? "Admin notes") : variant.label}
                <span className="ml-1 text-gray-400">(optional)</span>
              </label>
              <textarea
                ref={variant.kind === "notes" ? firstInputRef : undefined}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal note visible only to admins..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13.5px] text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-brand-500 focus:bg-white"
              />
            </div>
          )}
        </div>

        <div className="h-px bg-black/[0.05]" />

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "flex min-w-[90px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors disabled:opacity-60",
              isDanger
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-brand-500 text-white hover:bg-brand-600"
            )}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {confirmLabel ?? (isDanger ? "Confirm" : "Proceed")}
          </button>
        </div>
      </div>
    </div>
  );
}
