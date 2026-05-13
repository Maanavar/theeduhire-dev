import { apiRequest } from "@/lib/api/client";
import type { JobWithDetails } from "@/types";

export type JobUpsertPayload = {
  title: string;
  subject: string;
  board: string;
  gradeLevel: string;
  jobType: string;
  experience?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  isUrgent?: boolean;
  requiredWithin48h?: boolean;
  requiresTet?: boolean;
  applicationDeadline?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  screeningQuestions: Array<{ question: string; required: boolean; sortOrder: number }>;
  status?: "DRAFT" | "ACTIVE";
};

export function getJob(jobId: string) {
  return apiRequest<JobWithDetails>(
    `/api/jobs/${jobId}`,
    undefined,
    "Failed to load job"
  );
}

export function createJob(payload: JobUpsertPayload) {
  return apiRequest<{ id: string }>(
    "/api/jobs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to create job"
  );
}

export function updateJob(jobId: string, payload: Omit<JobUpsertPayload, "status">) {
  return apiRequest<{ id: string }>(
    `/api/jobs/${jobId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to update job"
  );
}

export function improveJobWithAi(payload: {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
}) {
  return apiRequest<{
    title?: string;
    description?: string;
    requirements?: string;
    benefits?: string;
  }>(
    "/api/ai/improve-job",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "AI improvement failed"
  );
}
