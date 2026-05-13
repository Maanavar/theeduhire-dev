import Skeleton from "@/components/ui/skeleton";

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

