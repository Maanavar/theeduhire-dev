import { apiRequest } from "@/lib/api/client";

export type JobAlert = {
  id: string;
  name: string;
  subject?: string;
  city?: string;
  board?: string;
  gradeLevel?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  frequency: string;
  isActive: boolean;
};

export type AlertUpsertPayload = {
  name: string;
  frequency: string;
  subject?: string;
  city?: string;
  board?: string;
  gradeLevel?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
};

export function getAlerts() {
  return apiRequest<JobAlert[]>("/api/alerts", undefined, "Failed to fetch alerts");
}

export function createAlert(payload: AlertUpsertPayload) {
  return apiRequest<JobAlert>(
    "/api/alerts",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    "Failed to create alert"
  );
}

export function updateAlert(id: string, payload: Partial<AlertUpsertPayload> & { isActive?: boolean }) {
  return apiRequest<JobAlert>(
    `/api/alerts/${id}`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    "Failed to update alert"
  );
}

export function deleteAlert(id: string) {
  return apiRequest<void>(
    `/api/alerts/${id}`,
    { method: "DELETE" },
    "Failed to delete alert"
  );
}
