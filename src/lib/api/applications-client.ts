import { apiRequest } from "@/lib/api/client";

export type TeacherApplicationRecord = {
  id: string;
  status: string;
  appliedAt: string;
  reviewedAt: string | null;
  coverLetter: string | null;
  job: {
    id: string;
    title: string;
    subject: string;
    board: string;
    gradeLevel: string;
    salaryMin: number | null;
    salaryMax: number | null;
    status: string;
    school: {
      schoolName: string;
      city: string;
      verified: boolean;
    };
  };
};

export type ApplicationListFilters = {
  status?: string;
  from?: string;
  to?: string;
};

export function getApplications(filters: ApplicationListFilters = {}) {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  return apiRequest<TeacherApplicationRecord[]>(
    `/api/applications${params.toString() ? `?${params.toString()}` : ""}`,
    undefined,
    "Failed to load applications"
  );
}

export function withdrawApplication(applicationId: string) {
  return apiRequest<null>(
    `/api/applications/${applicationId}`,
    { method: "DELETE" },
    "Failed to withdraw application"
  );
}
