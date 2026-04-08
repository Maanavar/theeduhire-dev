"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const REJECTION_REASONS = [
  { value: "OVERQUALIFIED", label: "Overqualified" },
  { value: "UNDERQUALIFIED", label: "Underqualified" },
  { value: "POSITION_FILLED", label: "Position Filled" },
  { value: "EXPERIENCE_MISMATCH", label: "Experience Mismatch" },
  { value: "LOCATION_MISMATCH", label: "Location Mismatch" },
  { value: "SALARY_MISMATCH", label: "Salary Mismatch" },
  { value: "OTHER", label: "Other" },
];

interface BulkActionToolbarProps {
  selectedIds: string[];
  onStatusChange: (status: string, rejectionReason?: string) => Promise<void>;
  onClear: () => void;
  loading?: boolean;
}

export function BulkActionToolbar({
  selectedIds,
  onStatusChange,
  onClear,
  loading = false,
}: BulkActionToolbarProps) {
  const [showRejectionDropdown, setShowRejectionDropdown] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (selectedIds.length === 0) {
    return null;
  }

  const handleStatusChange = async (status: string, rejectionReason?: string) => {
    setActionLoading(true);
    try {
      await onStatusChange(status, rejectionReason);
      onClear();
      toast.success(`Updated ${selectedIds.length} application(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setActionLoading(false);
      setShowRejectionDropdown(false);
    }
  };

  return (
    <>
      {/* Overlay background for focus */}
      {showRejectionDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowRejectionDropdown(false)}
        />
      )}

      {/* Floating toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
        <div className="card px-4 py-3 flex items-center gap-3 shadow-xl border-black/[0.09] flex-wrap justify-center">
          {/* Count display */}
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.length} selected
          </span>

          <div className="w-px h-6 bg-gray-200" />

          {/* Clear button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={actionLoading}
            className="text-gray-600"
          >
            Clear
          </Button>

          <div className="w-px h-6 bg-gray-200" />

          {/* Shortlist button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleStatusChange("SHORTLISTED")}
            disabled={actionLoading || loading}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Shortlist
          </Button>

          {/* Reviewed button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleStatusChange("REVIEWED")}
            disabled={actionLoading || loading}
          >
            Mark Reviewed
          </Button>

          {/* Reject dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRejectionDropdown(!showRejectionDropdown)}
              disabled={actionLoading || loading}
              className="gap-2"
            >
              Reject
              <ChevronDown className="w-4 h-4" />
            </Button>

            {/* Rejection reason dropdown menu */}
            {showRejectionDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-max">
                {REJECTION_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => handleStatusChange("REJECTED", reason.value)}
                    disabled={actionLoading || loading}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
