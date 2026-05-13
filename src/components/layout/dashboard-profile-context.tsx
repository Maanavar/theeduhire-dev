"use client";

import { createContext, useContext, type ReactNode } from "react";

export type DashboardProfileData = {
  qualification?: string | null;
  experience?: string | null;
  city?: string | null;
  bio?: string | null;
  currentSchool?: string | null;
  subjects?: string[] | null;
  preferredBoards?: string[] | null;
  preferredGrades?: string[] | null;
  availabilityStatus?: string | null;
  avatarUrl?: string | null;
  experiences?: Array<{ id: string }> | null;
  certifications?: Array<{ id: string }> | null;
  resumes?: Array<{ id: string }> | null;
  schoolName?: string | null;
  board?: string | null;
  about?: string | null;
  logoUrl?: string | null;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED";
  verified?: boolean;
};

const DashboardProfileContext = createContext<DashboardProfileData | null>(null);

export function DashboardProfileProvider({
  value,
  children,
}: {
  value: DashboardProfileData | null;
  children: ReactNode;
}) {
  return (
    <DashboardProfileContext.Provider value={value}>
      {children}
    </DashboardProfileContext.Provider>
  );
}

export function useDashboardProfile() {
  return useContext(DashboardProfileContext);
}
