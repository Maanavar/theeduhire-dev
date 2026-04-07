import { Suspense } from "react";
import type { Metadata } from "next";
import JobFilters from "@/components/jobs/job-filters";
import JobSplitView from "@/components/jobs/job-split-view";

export const metadata: Metadata = {
  title: "Teaching Jobs in Tamil Nadu",
  description:
    "Browse teaching positions across 15+ cities in Tamil Nadu. Filter by subject, board, location, and grade level.",
};

export default function JobsPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-[28px] font-bold text-gray-900">
          Teaching Opportunities
        </h1>
        <p className="text-gray-500 text-[14px] mt-0.5">
          Discover your next teaching position across Tamil Nadu
        </p>
      </div>

      {/* Filters — wrapped in Suspense for useSearchParams */}
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        }
      >
        <JobFilters />
      </Suspense>

      {/* Split pane — also needs Suspense */}
      <Suspense
        fallback={
          <div className="bg-white border border-gray-200/80 rounded-2xl h-[500px] animate-pulse" />
        }
      >
        <JobSplitView />
      </Suspense>
    </div>
  );
}
