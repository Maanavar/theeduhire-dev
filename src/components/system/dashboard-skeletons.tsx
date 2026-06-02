import Skeleton from "@/components/ui/skeleton";
import { Panel } from "@/components/layout/page-shell";

export function StatsGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="rounded-2xl border border-[#e7ebf2] bg-white p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-10 w-16" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="rounded-xl border border-[#e7ebf2] bg-white p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-2 h-3 w-64" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-6 items-center gap-3 rounded-lg border border-[#eef2f7] bg-white px-3 py-3">
          <Skeleton className="col-span-2 h-4 w-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-12 justify-self-end" />
        </div>
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="rounded-xl border border-[#e7ebf2] bg-white p-4">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="mt-3 h-8 w-12" />
            <Skeleton className="mt-2 h-2.5 w-24" />
          </div>
        ))}
      </div>
      {/* Chart panels */}
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <Panel key={idx} className="p-5">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </Panel>
        ))}
      </div>
      <Panel className="p-5">
        <Skeleton className="mb-4 h-4 w-40" />
        <Skeleton className="h-[180px] w-full rounded-lg" />
      </Panel>
    </div>
  );
}

export function CardListSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="rounded-xl border border-[#e7ebf2] bg-white p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InterviewSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="rounded-xl border border-[#e7ebf2] bg-white p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="border-b border-[var(--eh-border)] pb-5">
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-2 h-4 w-80" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <StatsGridSkeleton cards={6} />
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Panel className="p-5">
          <Skeleton className="mb-4 h-4 w-36" />
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-4 rounded-lg border border-[#e7ebf2] p-3.5">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-7 w-12 rounded-md" />
            </div>
          ))}
        </Panel>
        <Panel className="p-5">
          <Skeleton className="mb-4 h-4 w-36" />
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="mb-2 flex gap-3 rounded-lg border border-[#e7ebf2] p-3.5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

