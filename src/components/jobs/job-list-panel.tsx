"use client";

import JobListItem from "./job-list-item";
import type { JobListItem as JobListItemType } from "@/types";

interface Props {
  jobs: JobListItemType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  total: number;
  isLoading: boolean;
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-black/[0.04]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-4 py-4 space-y-2.5">
          <div className="skeleton h-3.5 w-3/4 rounded-lg" />
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="flex gap-1.5">
            <div className="skeleton h-5 w-16 rounded-md" />
            <div className="skeleton h-5 w-12 rounded-md" />
            <div className="skeleton h-5 w-14 rounded-md" />
          </div>
          <div className="flex justify-between">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-3 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function JobListPanel({ jobs, selectedId, onSelect, total, isLoading }: Props) {
  return (
    <div className="overflow-y-auto max-h-[calc(100vh-220px)] lg:max-h-[calc(100vh-200px)] scrollbar-thin">
      {/* Sticky header */}
      <div className="sticky top-0 z-[2] px-4 py-2.5 border-b border-black/[0.05]"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)" }}>
        {isLoading ? (
          <div className="skeleton h-3 w-24 rounded" />
        ) : (
          <span className="text-xs font-semibold text-gray-400">
            {total} position{total !== 1 ? "s" : ""} found
          </span>
        )}
      </div>

      {isLoading && <ListSkeleton />}

      {!isLoading && jobs.length > 0 && (
        <div>
          {jobs.map((job) => (
            <JobListItem
              key={job.id}
              job={job}
              isSelected={selectedId === job.id}
              onClick={() => onSelect(job.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && jobs.length === 0 && (
        <div className="text-center py-16 px-6">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="font-display text-[16px] font-semibold text-gray-500 italic mb-1">
            No jobs found
          </h3>
          <p className="text-xs text-gray-400">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}
