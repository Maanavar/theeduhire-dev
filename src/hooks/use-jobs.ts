// Client-side hook for job listings
// Handles search, filtering, and selected job state via URL params

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { JobListItem } from "@/types";

interface JobsState {
  jobs: JobListItem[];
  total: number;
  isLoading: boolean;
  error: string;
  selectedId: string | null;
}

export function useJobs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [state, setState] = useState<JobsState>({
    jobs: [],
    total: 0,
    isLoading: true,
    error: "",
    selectedId: searchParams.get("selected"),
  });

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
    setState((s) => ({ ...s, isLoading: true, error: "" }));

    fetch(`/api/jobs?${buildQuery()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          const jobs: JobListItem[] = data.data;
          const currentSelected = searchParams.get("selected");
          const exists = jobs.some((j) => j.id === currentSelected);
          const selectedId = jobs.length > 0 && (!currentSelected || !exists)
            ? jobs[0].id
            : currentSelected ?? null;

          setState({ jobs, total: data.pagination.total, isLoading: false, error: "", selectedId });
        } else {
          setState((s) => ({ ...s, isLoading: false, error: data.error || "Failed to load jobs" }));
        }
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, isLoading: false, error: "Network error. Please refresh." }));
      });

    return () => { cancelled = true; };
  }, [buildQuery, searchParams]);

  const selectJob = useCallback((id: string) => {
    setState((s) => ({ ...s, selectedId: id }));
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    router.replace(`/jobs?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return { ...state, selectJob };
}
