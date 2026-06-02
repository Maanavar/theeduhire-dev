import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import JobFilters from "@/components/jobs/job-filters";
import JobSplitView from "@/components/jobs/job-split-view";
import { LoadingState } from "@/components/system/system-states";
import { getSession } from "@/lib/session";
import { JobsPageHeader } from "@/components/marketing/jobs-page-header";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://theeduhire.in";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const query = await searchParams;
  const params = new URLSearchParams();
  const keys = ["subject", "location", "board", "gradeLevel", "experienceLevel", "search", "sort"];
  for (const key of keys) {
    const value = query[key];
    if (typeof value === "string" && value.trim().length > 0) {
      params.set(key, value);
    }
  }

  const subject = typeof query.subject === "string" ? query.subject : null;
  const location = typeof query.location === "string" ? query.location : null;
  const board = typeof query.board === "string" ? query.board : null;
  const search = typeof query.search === "string" ? query.search : null;

  let title = "Teaching Jobs in Tamil Nadu";
  let description = "Browse verified teaching positions across 15+ cities in Tamil Nadu. Filter by subject, board, location, and grade level. Salary declared upfront. Free to apply.";

  if (subject && location) {
    title = `${subject} Teacher Jobs in ${location}`;
    description = `Find ${subject} teacher jobs in ${location}, Tamil Nadu. Verified schools, transparent salaries, direct applications. Free for teachers.`;
  } else if (subject) {
    title = `${subject} Teacher Jobs in Tamil Nadu`;
    description = `Browse ${subject} teaching positions across Tamil Nadu. CBSE, ICSE, State Board and Matriculation schools hiring now. Salary declared upfront.`;
  } else if (location) {
    title = `Teaching Jobs in ${location}, Tamil Nadu`;
    description = `Find teaching jobs in ${location}. Verified schools hiring teachers for all subjects and grade levels. Transparent salaries, free to apply.`;
  } else if (board) {
    title = `${board} Teaching Jobs in Tamil Nadu`;
    description = `Browse ${board} school teacher vacancies in Tamil Nadu. Verified schools, salary transparency, smart eligibility matching.`;
  } else if (search) {
    title = `"${search}" Teaching Jobs in Tamil Nadu`;
    description = `Teaching job results for "${search}" in Tamil Nadu. Verified schools, transparent salaries, free for teachers.`;
  }

  const canonical = params.toString() ? `${BASE_URL}/jobs?${params.toString()}` : `${BASE_URL}/jobs`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | EduHire`,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} | EduHire`,
      description,
    },
  };
}

export default async function JobsPage() {
  const session = await getSession();
  if (session?.user?.role === "TEACHER") {
    redirect("/dashboard/jobs");
  }
  if (session?.user?.role === "SCHOOL_ADMIN") {
    redirect("/dashboard/school");
  }

  return (
    <div className="bg-white">
      {/* Page header */}
      <section className="border-b border-[var(--eh-border)] bg-white px-5 pb-8 pt-10 md:px-8 md:pt-12">
        <div className="mx-auto max-w-[1320px]">
          <JobsPageHeader />
        </div>
      </section>

      {/* Filters + job list */}
      <section className="mx-auto max-w-[1320px] space-y-5 px-5 py-6 md:px-8 md:py-8">
        <Suspense
          fallback={<LoadingState title="Loading filters" message="Preparing search filters for jobs." />}
        >
          <JobFilters />
        </Suspense>

        <Suspense
          fallback={<LoadingState title="Loading jobs" message="Fetching available teaching opportunities." />}
        >
          <JobSplitView />
        </Suspense>
      </section>
    </div>
  );
}
