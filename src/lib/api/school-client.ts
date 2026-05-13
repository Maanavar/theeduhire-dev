import type { SchoolAnalytics } from "@/types";
import { apiRequest } from "@/lib/api/client";

export type SchoolProfileSummary = {
  schoolName?: string | null;
  city?: string | null;
  board?: string | null;
  about?: string | null;
  logoUrl?: string | null;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED";
  verified?: boolean;
};

export function getSchoolAnalytics() {
  return apiRequest<SchoolAnalytics>(
    "/api/dashboard/analytics",
    undefined,
    "Failed to load analytics"
  );
}

export function getSchoolProfile() {
  return apiRequest<SchoolProfileSummary>(
    "/api/profile",
    undefined,
    "Failed to load school profile"
  );
}
