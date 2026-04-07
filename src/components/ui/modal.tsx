"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  footer,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    // Focus trap — focus first focusable element
    setTimeout(() => {
      const el = contentRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      el?.focus();
    }, 50);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        ref={contentRef}
        className={cn(
          "w-full bg-white rounded-3xl shadow-2xl flex flex-col animate-scale-in",
          "max-h-[90vh]",
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2
              id="modal-title"
              className="font-display text-[20px] font-bold text-gray-900 tracking-[-0.02em]"
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-[120ms] mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-black/[0.05] flex-shrink-0" />

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto scrollbar-thin flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <>
            <div className="h-px bg-black/[0.05] flex-shrink-0" />
            <div className="px-6 py-4 flex-shrink-0">
              {footer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
