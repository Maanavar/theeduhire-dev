import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatSalary, timeAgo } from "@/lib/utils";
import { getSession } from "@/lib/session";
import Link from "next/link";
import JobDetailApplyRail from "@/components/jobs/job-detail-apply-rail";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  FRESHER: "Fresher",
  ONE_TO_TWO_YEARS: "1-2 years",
  TWO_TO_FIVE_YEARS: "2-5 years",
  FIVE_TO_TEN_YEARS: "5-10 years",
  TEN_PLUS_YEARS: "10+ years",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: { school: { select: { schoolName: true, city: true } } },
  });

  if (!job) return { title: "Job Not Found" };

  return {
    title: `${job.title} at ${job.school.schoolName}`,
    description: job.description.slice(0, 160),
    alternates: {
      canonical: `/jobs/${id}`,
    },
    openGraph: {
      title: `${job.title} - ${job.school.schoolName}, ${job.school.city}`,
      description: job.description.slice(0, 160),
    },
  };
}

export default async function JobDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const session = await getSession();
  const preview = query.preview === "1";

  if (session?.user?.role === "TEACHER" && !preview) {
    redirect(`/dashboard/jobs?selected=${id}`);
  }

  if (session?.user?.role === "SCHOOL_ADMIN" && !preview) {
    redirect(`/dashboard/applicants?jobId=${id}`);
  }

  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      school: true,
      requirements: { orderBy: { sortOrder: "asc" } },
      benefits: { orderBy: { sortOrder: "asc" } },
      screeningQuestions: { orderBy: { sortOrder: "asc" } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  if (job.status === "ACTIVE" && job.expiresAt && job.expiresAt.getTime() <= Date.now()) {
    await prisma.jobPosting.updateMany({
      where: { id: job.id, status: "ACTIVE" as any },
      data: { status: "EXPIRED" as any },
    });
    (job as any).status = "EXPIRED";
  } else if (job.status === "ACTIVE" && job.applicationDeadline && job.applicationDeadline.getTime() <= Date.now()) {
    await prisma.jobPosting.updateMany({
      where: { id: job.id, status: "ACTIVE" as any },
      data: { status: "CLOSED" as any },
    });
    (job as any).status = "CLOSED";
  }

  let isApplied = false;
  let isSaved = false;
  if (session?.user) {
    const [application, saved] = await Promise.all([
      prisma.application.findUnique({
        where: { jobId_applicantId: { jobId: job.id, applicantId: session.user.id } },
        select: { id: true },
      }),
      prisma.savedJob.findUnique({
        where: { userId_jobId: { userId: session.user.id, jobId: job.id } },
        select: { id: true },
      }),
    ]);
    isApplied = !!application;
    isSaved = !!saved;
  }

  const boardLabel = job.board === "STATE_BOARD" ? "State Board" : job.board;
  const jobTypeLabel =
    job.jobType === "FULL_TIME"
      ? "Full-Time"
      : job.jobType === "PART_TIME"
        ? "Part-Time"
        : job.jobType === "CONTRACT"
          ? "Contract"
          : "Visiting Faculty";
  const applicationDeadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
  const daysToDeadline = applicationDeadline
    ? Math.ceil((applicationDeadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;
  const deadlineIsUrgent = typeof daysToDeadline === "number" && daysToDeadline >= 0 && daysToDeadline < 7;
  const employmentType =
    job.jobType === "FULL_TIME"
      ? "FULL_TIME"
      : job.jobType === "PART_TIME"
        ? "PART_TIME"
        : job.jobType === "CONTRACT"
          ? "CONTRACTOR"
          : "OTHER";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://theeduhire.in";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.postedAt.toISOString(),
    validThrough: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString() : undefined,
    employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.school.schoolName,
      sameAs: job.school.website || undefined,
      logo: job.school.logoUrl || undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.school.city,
        addressCountry: "IN",
      },
    },
    baseSalary:
      typeof job.salaryMin === "number" || typeof job.salaryMax === "number"
        ? {
            "@type": "MonetaryAmount",
            currency: "INR",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salaryMin || undefined,
              maxValue: job.salaryMax || undefined,
              unitText: "MONTH",
            },
          }
        : undefined,
    directApply: true,
    url: `${baseUrl}/jobs/${job.id}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Jobs",
        "item": `${baseUrl}/jobs`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": job.title,
        "item": `${baseUrl}/jobs/${job.id}`
      }
    ]
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Page header */}
      <section className="border-b border-[var(--eh-border)] px-5 pb-8 pt-10 md:px-8 md:pt-12">
        <div className="mx-auto max-w-[1320px]">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--eh-text-3)] transition-colors hover:text-eh-primary"
          >
            <ArrowLeft size={13} />
            All jobs
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-eh-primary">Job detail</p>
              <h1 className="mt-2 max-w-[640px] text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-[var(--eh-text)]">
                {job.title}
              </h1>
              {job.isUrgent ? (
                <span className="mt-3 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[12px] font-semibold text-red-700">
                  Urgent
                </span>
              ) : null}
            </div>

            {/* School identity */}
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--eh-border)] bg-white">
                {job.school.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.school.logoUrl} alt={`${job.school.schoolName} logo`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[13px] font-semibold text-[var(--eh-text-3)]">
                    {(job.school.schoolName || "S").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[14px] font-semibold text-[var(--eh-text)]">{job.school.schoolName}</p>
                  {job.school.verified ? <BadgeCheck size={14} className="text-eh-primary" /> : null}
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--eh-text-3)]">{job.school.city}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-8 md:px-8 md:py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-6 md:p-7">
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: MapPin, label: job.school.city },
                  { icon: BookOpen, label: boardLabel },
                  { icon: Users, label: `Grade ${job.gradeLevel}` },
                  { icon: Briefcase, label: jobTypeLabel },
                  ...(job.experienceLevel || job.experience
                    ? [{
                        icon: Clock,
                        label: job.experienceLevel ? EXPERIENCE_LEVEL_LABELS[job.experienceLevel] : job.experience!,
                      }]
                    : []),
                ].map((item) => (
                  <span
                    key={`${item.label}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-1.5 text-[12px] font-medium text-[var(--eh-text-2)]"
                  >
                    <item.icon size={13} className="text-[var(--eh-text-4)]" />
                    {item.label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-3 py-1.5 text-[12px] font-semibold text-[var(--eh-primary-700)]">
                  <DollarSign size={13} />
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </span>
                {applicationDeadline ? (
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
                      deadlineIsUrgent
                        ? "border border-amber-200 bg-amber-50 text-amber-700"
                        : "border border-[var(--eh-border)] bg-white text-[var(--eh-text-2)]",
                    ].join(" ")}
                  >
                    <CalendarDays size={13} />
                    {deadlineIsUrgent ? "Apply soon: " : "Apply by "}
                    {applicationDeadline.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                ) : null}
                {job.requiresTet ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--eh-border)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--eh-text-2)]">
                    TET/CTET required
                  </span>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 border-t border-[var(--eh-border)] pt-5 md:grid-cols-3">
                <div className="rounded-xl bg-[var(--surface-base)] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Posted</p>
                  <p className="mt-2 text-[16px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">{timeAgo(job.postedAt)}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-base)] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Applicants</p>
                  <p className="mt-2 text-[16px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">
                    {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--surface-base)] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Trust signal</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[16px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">
                    <ShieldCheck size={16} className="text-[var(--eh-success)]" />
                    {job.school.verified ? "Verified school" : "Profile available"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-6 md:p-7">
              <div className="border-b border-[var(--eh-border)] pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">About the role</p>
                <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">What this school is hiring for</h2>
              </div>
              <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.8] text-[var(--eh-text-2)]">{job.description}</p>
            </section>

            {job.requirements.length > 0 ? (
              <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-6 md:p-7">
                <div className="border-b border-[var(--eh-border)] pb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Requirements</p>
                  <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">What the school expects</h2>
                </div>
                <ul className="mt-5 space-y-3">
                  {job.requirements.map((req: any) => (
                    <li key={req.id} className="flex items-start gap-3 text-[15px] leading-[1.75] text-[var(--eh-text-2)]">
                      <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--eh-primary-600)]" />
                      {req.text}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {job.benefits.length > 0 ? (
              <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-6 md:p-7">
                <div className="border-b border-[var(--eh-border)] pb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Benefits</p>
                  <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">What comes with the role</h2>
                </div>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {job.benefits.map((ben: any) => (
                    <span
                      key={ben.id}
                      className="rounded-full border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-4 py-2 text-[13px] font-semibold text-[var(--eh-primary-700)]"
                    >
                      {ben.text}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-6 md:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">School profile</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-[14px] text-[var(--eh-text-2)]">
                {job.school.website ? (
                  <a
                    href={job.school.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-eh-primary"
                  >
                    <ExternalLink size={14} />
                    {job.school.website.replace(/https?:\/\//, "")}
                  </a>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} />
                  {job.school.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={14} />
                  {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
                </span>
                {job.school.hasPfEsi ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--eh-primary-700)]">
                    PF/ESI provided
                  </span>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {job.school.paymentTrackRecord ? (
                  <div>
                    <p className="text-[11px] text-[var(--eh-text-4)]">Payment history</p>
                    <p className="mt-0.5 text-[13px] font-semibold">
                      {job.school.paymentTrackRecord === "ON_TIME"
                        ? "Pays on time"
                        : job.school.paymentTrackRecord === "DELAYED"
                          ? "Sometimes delayed"
                          : "Mixed record"}
                    </p>
                  </div>
                ) : null}
                {job.school.workingHours ? (
                  <div>
                    <p className="text-[11px] text-[var(--eh-text-4)]">Working hours</p>
                    <p className="mt-0.5 text-[13px]">{job.school.workingHours}</p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <JobDetailApplyRail
            jobId={job.id}
            jobTitle={job.title}
            schoolName={job.school.schoolName}
            screeningQuestions={job.screeningQuestions}
            initialApplied={isApplied}
            initialSaved={isSaved}
          />
        </div>
      </section>
    </div>
  );
}
