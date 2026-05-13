"use client";

import { useEffect, useRef, useState } from "react";
import { featureFlags } from "@/config/feature-flags";

type LiveMode = "sse" | "polling";

export function useSchoolLiveUpdates({
  jobId,
  paused = false,
  onUpdate,
}: {
  jobId: string;
  paused?: boolean;
  onUpdate: () => void | Promise<void>;
}) {
  const [mode, setMode] = useState<LiveMode>(
    featureFlags.schoolLiveUpdates ? "sse" : "polling"
  );
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!jobId || paused || !featureFlags.schoolLiveUpdates) {
      setMode("polling");
      return;
    }

    setMode("sse");
    const eventSource = new EventSource(
      `/api/dashboard/live?jobId=${encodeURIComponent(jobId)}`
    );

    const handleUpdate = () => {
      void onUpdateRef.current();
    };

    const handleReady = () => {
      setMode("sse");
    };

    const handleError = () => {
      setMode("polling");
      eventSource.close();
    };

    eventSource.addEventListener("ready", handleReady);
    eventSource.addEventListener("update", handleUpdate);
    eventSource.onerror = handleError;

    return () => {
      eventSource.removeEventListener("ready", handleReady);
      eventSource.removeEventListener("update", handleUpdate);
      eventSource.close();
    };
  }, [jobId, paused]);

  return { mode };
}
