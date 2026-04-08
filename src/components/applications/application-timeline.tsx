"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import type { StatusHistoryEntry } from "@/types";

const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  PENDING: { dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-600" },
  REVIEWED: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  SHORTLISTED: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  REJECTED: { dot: "bg-red-400", bg: "bg-red-50", text: "text-red-600" },
  HIRED: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
};

interface ApplicationTimelineProps {
  applicationId: string;
  appliedAt?: string; // ISO date string for synthesizing PENDING entry
}

export function ApplicationTimeline({ applicationId, appliedAt }: ApplicationTimelineProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/applications/${applicationId}/history`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || "Failed to fetch history");
          return;
        }

        setHistory(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  // Build timeline entries
  const entries = [
    // Synthesize PENDING entry from appliedAt
    {
      status: "PENDING" as const,
      date: appliedAt ? new Date(appliedAt) : new Date(),
      label: "Applied",
      changedByName: null,
      note: null,
      rejectionReason: null,
    },
    // Add history entries
    ...history.map((h) => ({
      status: h.toStatus,
      date: new Date(h.changedAt),
      label: h.toStatus.charAt(0) + h.toStatus.slice(1).toLowerCase(),
      changedByName: h.changedByUser.name,
      note: h.note,
      rejectionReason: h.rejectionReason,
    })),
  ];

  return (
    <div className="space-y-0">
      {entries.map((entry, idx) => {
        const colors = STATUS_COLORS[entry.status];
        const isLast = idx === entries.length - 1;

        return (
          <div key={idx} className="flex gap-4 pb-6 relative">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div className={`w-3 h-3 rounded-full ${colors.dot} border-2 border-white shadow-sm`} />
              {/* Line (skip for last entry) */}
              {!isLast && <div className="w-px h-12 bg-gray-200 mt-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-baseline gap-2">
                <span className={`text-sm font-semibold ${colors.text}`}>{entry.label}</span>
                <span className="text-xs text-gray-500">
                  {format(entry.date, "dd MMM yyyy, h:mm a")}
                </span>
              </div>

              {entry.changedByName && (
                <p className="text-xs text-gray-500 mt-1">by {entry.changedByName}</p>
              )}

              {(entry.note || entry.rejectionReason) && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded px-2.5 py-1.5 border border-gray-100">
                  {entry.rejectionReason && (
                    <p className="font-medium">
                      Reason: {entry.rejectionReason.replace(/_/g, " ")}
                    </p>
                  )}
                  {entry.note && <p className="mt-1">{entry.note}</p>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
