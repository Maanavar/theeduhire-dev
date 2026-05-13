"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import JobListPanel from "./job-list-panel";
import JobDetailPanel from "./job-detail-panel";
import type { JobListItem } from "@/types";

export default function JobSplitView({ basePath = "/jobs" }: { basePath?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("selected"));

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    const keys = ["search", "subject", "location", "board", "gradeLevel", "experienceLevel", "page", "limit", "sort"];
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
          const exists = data.data.some((job: JobListItem) => job.id === currentSelected);
          if (data.data.length > 0 && (!currentSelected || !exists)) {
            setSelectedId(data.data[0].id);
          }
          if (data.data.length === 0) setSelectedId(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildQuery, searchParams]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("selected", id);
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    },
    [basePath, router, searchParams]
  );

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-[30px] border border-[var(--eh-border)] bg-white lg:grid-cols-[380px_1fr]"
      style={{
        boxShadow: "0 16px 40px rgba(15,23,42,0.05)",
        minHeight: "calc(100vh - 220px)",
      }}
    >
      <div className="border-r border-[var(--eh-border)] bg-[var(--surface-base)]">
        <JobListPanel
          jobs={jobs}
          selectedId={selectedId}
          onSelect={handleSelect}
          total={total}
          isLoading={isLoading}
        />
      </div>

      <div className="hidden bg-white lg:block">
        <JobDetailPanel jobId={selectedId} />
      </div>

      <div className="border-t border-[var(--eh-border)] lg:hidden">
        {selectedId && <JobDetailPanel jobId={selectedId} />}
      </div>
    </div>
  );
}
