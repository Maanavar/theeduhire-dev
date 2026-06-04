import { apiRequest } from "@/lib/api/client";

export type BillingPlan = {
  plan: "FREE" | "GROWTH" | "PRO";
  status: string;
  postsUsed: number;
  postsLimit: number | null; // null = unlimited
  cycleResetAt: string | null;
};

export function getBillingPlan() {
  return apiRequest<BillingPlan>(
    "/api/billing/plan",
    undefined,
    "Failed to fetch billing info"
  );
}
