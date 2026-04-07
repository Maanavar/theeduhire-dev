import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-gray-100 rounded animate-pulse", className)} />;
}
