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

export default function JobListPanel({
  jobs,
  selectedId,
  onSelect,
  total,
  isLoading,
}: Props) {
  return (
    <div className="border-r border-gray-100 overflow-y-auto max-h-[calc(100vh-220px)] lg:max-h-[calc(100vh-200px)] scrollbar-thin">
      {/* Count header */}
      <div className="px-4 py-2.5 text-[12px] text-gray-400 border-b border-gray-100 sticky top-0 bg-white z-[2]">
        {isLoading ? (
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        ) : (
          `${total} position${total !== 1 ? "s" : ""} found`
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 space-y-2.5 animate-pulse">
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
              <div className="flex gap-1.5">
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
                <div className="h-5 w-12 bg-gray-100 rounded-full" />
                <div className="h-5 w-14 bg-gray-100 rounded-full" />
              </div>
              <div className="flex justify-between">
                <div className="h-3.5 w-24 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job list */}
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

      {/* Empty state */}
      {!isLoading && jobs.length === 0 && (
        <div className="text-center py-12 px-4">
          <h3 className="font-display text-lg text-gray-500 italic">
            No jobs found
          </h3>
          <p className="text-[13px] text-gray-400 mt-1">
            Try adjusting your filters
          </p>
        </div>
      )}
    </div>
  );
}
