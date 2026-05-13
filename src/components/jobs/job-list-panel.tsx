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
    <div className="divide-y divide-[var(--eh-border)]">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-2.5 px-4 py-4">
          <div className="skeleton h-3.5 w-3/4 rounded-lg" />
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="flex gap-1.5">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-12 rounded-full" />
            <div className="skeleton h-6 w-14 rounded-full" />
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
    <div className="scrollbar-thin max-h-[calc(100vh-220px)] overflow-y-auto lg:max-h-[calc(100vh-200px)]">
      <div
        className="sticky top-0 z-[2] border-b border-[var(--eh-border)] px-4 py-3"
        style={{ background: "rgba(246,247,249,0.92)", backdropFilter: "blur(10px)" }}
      >
        {isLoading ? (
          <div className="skeleton h-3 w-24 rounded" />
        ) : (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Results</p>
            <p className="mt-1 text-[13px] font-medium text-[var(--eh-text-2)]">
              {total} position{total !== 1 ? "s" : ""} found
            </p>
          </div>
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
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[var(--eh-text-4)]">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="font-display text-[22px] leading-[1] tracking-[-0.03em] text-[var(--eh-text)]">
            No jobs found
          </h3>
          <p className="mt-3 text-sm leading-[1.6] text-[var(--eh-text-3)]">
            Try broadening your filters or search terms.
          </p>
        </div>
      )}
    </div>
  );
}
