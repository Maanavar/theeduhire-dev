"use client";

import { useEffect } from "react";

export function ProfileViewLogger({ teacherId }: { teacherId: string }) {
  useEffect(() => {
    fetch("/api/profile-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId }),
    }).catch(() => {});
  }, [teacherId]);

  return null;
}
