import { apiRequest } from "@/lib/api/client";
import type { JobRecommendation } from "@/types";

export type SavedJobItem = {
  id: string;
  savedAt: string;
  job: {
    id: string;
    title: string;
    subject: string;
    board: string;
    gradeLevel: string;
    salaryMin: number | null;
    salaryMax: number | null;
    postedAt: string;
    status: string;
    school: { schoolName: string; city: string; verified: boolean };
    isApplied?: boolean;
  };
};

export type NotificationItem = {
  id: string;
  type: "GENERAL" | "APPLICATION" | "INTERVIEW" | "MESSAGE" | "SYSTEM";
  title: string;
  body: string;
  payload?: { conversationId?: string; jobId?: string; applicationId?: string } | null;
  readAt: string | null;
  createdAt: string;
};

export type ResumeItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  isGenerated: boolean;
  template?: string;
  uploadedAt: string;
};

export function getSavedJobs() {
  return apiRequest<SavedJobItem[]>("/api/saved-jobs", undefined, "Failed to load saved jobs");
}

export function toggleSavedJob(jobId: string) {
  return apiRequest<{ saved: boolean }>(
    "/api/saved-jobs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    },
    "Failed to update saved job"
  );
}

export function getNotifications() {
  return apiRequest<NotificationItem[]>(
    "/api/notifications?tab=all",
    undefined,
    "Failed to load notifications"
  );
}

export function markNotificationRead(id: string) {
  return apiRequest<void>(
    `/api/notifications/${id}/read`,
    { method: "PATCH" },
    "Failed to mark notification read"
  );
}

export function markAllNotificationsRead() {
  return apiRequest<void>(
    "/api/notifications/mark-all-read",
    { method: "PATCH" },
    "Failed to mark all notifications read"
  );
}

export function getRecommendations() {
  return apiRequest<JobRecommendation[]>(
    "/api/ai/recommendations",
    undefined,
    "Failed to fetch recommendations"
  );
}

export function deleteResume(id: string) {
  return apiRequest<void>(
    `/api/resumes/${id}`,
    { method: "DELETE", headers: { "Content-Type": "application/json" } },
    "Failed to delete resume"
  );
}
