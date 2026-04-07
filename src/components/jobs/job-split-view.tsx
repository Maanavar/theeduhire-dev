"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import JobListPanel from "./job-list-panel";
import JobDetailPanel from "./job-detail-panel";
import type { JobListItem } from "@/types";

export default function JobSplitView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobs, setJobs]         = useState<JobListItem[]>([]);
  const [total, setTotal]       = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("selected")
  );

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    const keys = ["search", "subject", "location", "board", "gradeLevel", "page", "limit"];
    keys.forEach((key) => {
      const val = searchParams.get(key);
      if (val) params.set(key, val);
    });
    return params.toString();
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/jobs?${buildQuery()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setJobs(data.data);
          setTotal(data.pagination.total);

          const currentSelected = searchParams.get("selected");
          const exists = data.data.some((j: JobListItem) => j.id === currentSelected);
          if (data.data.length > 0 && (!currentSelected || !exists)) {
            setSelectedId(data.data[0].id);
          }
          if (data.data.length === 0) setSelectedId(null);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [buildQuery, searchParams]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("selected", id);
      router.replace(`/jobs?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div
      className="rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[360px_1fr]"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        minHeight: "calc(100vh - 220px)",
      }}
    >
      {/* Left: Job List */}
      <div className="border-r border-black/[0.05]">
        <JobListPanel
          jobs={jobs}
          selectedId={selectedId}
          onSelect={handleSelect}
          total={total}
          isLoading={isLoading}
        />
      </div>

      {/* Right: Detail — desktop */}
      <div className="hidden lg:block bg-white">
        <JobDetailPanel jobId={selectedId} />
      </div>

      {/* Mobile: detail below list */}
      <div className="lg:hidden border-t border-black/[0.05]">
        {selectedId && <JobDetailPanel jobId={selectedId} />}
      </div>
    </div>
  );
}
