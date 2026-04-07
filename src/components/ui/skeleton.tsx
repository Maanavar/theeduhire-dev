import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  const radiusMap = {
    sm:   "rounded",
    md:   "rounded-lg",
    lg:   "rounded-xl",
    xl:   "rounded-2xl",
    full: "rounded-full",
  };
  return (
    <div
      className={cn(
        "skeleton",
        radiusMap[rounded],
        className
      )}
    />
  );
}

// Compound skeleton for common patterns
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card p-5 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 flex-shrink-0" rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}
