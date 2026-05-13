import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, Sparkles } from "lucide-react";
import JobFilters from "@/components/jobs/job-filters";
import JobSplitView from "@/components/jobs/job-split-view";
import { LoadingState } from "@/components/system/system-states";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Browse Teaching Jobs",
  description: "Explore teaching roles inside the EduHire teacher dashboard.",
};

export default async function DashboardJobsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role === "SCHOOL_ADMIN") {
    redirect("/dashboard/school");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#111827]">Browse jobs</h1>
          <p className="text-[14px] text-slate-500">
            Explore active teaching roles without leaving your teacher workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#dbe4ff] bg-[#eef2ff] px-3 py-1.5 text-[12px] font-semibold text-[#4338ca]">
          <Sparkles size={13} />
          Consistent teacher flow
        </div>
      </div>

      <div className="rounded-2xl border border-[#e7ebf2] bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
          <BriefcaseBusiness size={14} />
          Job search
        </div>
        <Suspense fallback={<LoadingState title="Loading filters" message="Preparing search filters for jobs." />}>
          <JobFilters basePath="/dashboard/jobs" />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingState title="Loading jobs" message="Fetching available teaching opportunities." />}>
        <JobSplitView basePath="/dashboard/jobs" />
      </Suspense>
    </div>
  );
}
