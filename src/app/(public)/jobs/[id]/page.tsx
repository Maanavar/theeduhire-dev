import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatSalary, timeAgo } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, MapPin, BookOpen, Users, Briefcase,
  Clock, DollarSign, ArrowRight, Bookmark, BadgeCheck,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

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
    openGraph: {
      title: `${job.title} — ${job.school.schoolName}, ${job.school.city}`,
      description: job.description.slice(0, 160),
    },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;

  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      school: true,
      requirements: { orderBy: { sortOrder: "asc" } },
      benefits: { orderBy: { sortOrder: "asc" } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  const boardLabel = job.board === "STATE_BOARD" ? "State Board" : job.board;
  const jobTypeLabel =
    job.jobType === "FULL_TIME" ? "Full-Time" :
    job.jobType === "PART_TIME" ? "Part-Time" :
    job.jobType === "CONTRACT" ? "Contract" : "Visiting Faculty";

  return (
    <div className="max-w-[800px] mx-auto px-5 py-8">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-gray-500 hover:text-brand-500 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to listings
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-[30px] lg:text-[34px] font-bold text-gray-900 leading-tight italic">
          {job.title}
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-[16px] text-gray-500">{job.school.schoolName}</p>
          {job.school.verified && <BadgeCheck size={16} className="text-brand-500" />}
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-4 flex-wrap mb-7">
        <span className="flex items-center gap-1.5 text-[14px] text-gray-500"><MapPin size={15} />{job.school.city}</span>
        <span className="flex items-center gap-1.5 text-[14px] text-gray-500"><BookOpen size={15} />{boardLabel}</span>
        <span className="flex items-center gap-1.5 text-[14px] text-gray-500"><Users size={15} />Grade {job.gradeLevel}</span>
        <span className="flex items-center gap-1.5 text-[14px] text-gray-500"><Briefcase size={15} />{jobTypeLabel}</span>
        {job.experience && <span className="flex items-center gap-1.5 text-[14px] text-gray-500"><Clock size={15} />{job.experience}</span>}
        <span className="flex items-center gap-1.5 text-[14px] font-semibold text-brand-500"><DollarSign size={15} />{formatSalary(job.salaryMin, job.salaryMax)}</span>
      </div>

      {/* Body */}
      <div className="bg-white border border-gray-100 rounded-2xl p-7 mb-5">
        <h3 className="text-[15px] font-semibold mb-3">About the Role</h3>
        <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
          {job.description}
        </p>

        {job.requirements.length > 0 && (
          <>
            <h3 className="text-[15px] font-semibold mt-6 mb-3">Requirements</h3>
            <ul className="space-y-1.5">
              {job.requirements.map((req) => (
                <li
                  key={req.id}
                  className="text-[14px] text-gray-600 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-[5px] before:h-[5px] before:bg-brand-500 before:rounded-full leading-relaxed"
                >
                  {req.text}
                </li>
              ))}
            </ul>
          </>
        )}

        {job.benefits.length > 0 && (
          <>
            <h3 className="text-[15px] font-semibold mt-6 mb-3">Benefits</h3>
            <div className="flex gap-2 flex-wrap">
              {job.benefits.map((ben) => (
                <span key={ben.id} className="text-[12px] bg-brand-50 text-brand-600 px-3 py-1.5 rounded-lg font-medium">
                  {ben.text}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Contact */}
      <div className="bg-gray-50 rounded-2xl p-5 flex gap-5 flex-wrap mb-6 text-[14px] text-gray-500">
        {job.school.website && (
          <a href={job.school.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors">
            {job.school.website.replace(/https?:\/\//, "")}
          </a>
        )}
        <span className="flex items-center gap-1.5"><Clock size={14} />Posted {timeAgo(job.postedAt)}</span>
        <span className="flex items-center gap-1.5"><Users size={14} />{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors">
          Apply for this position <ArrowRight size={16} />
        </button>
        <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-medium border border-gray-200 text-gray-600 hover:border-brand-500 hover:text-brand-500 transition-colors">
          <Bookmark size={16} /> Save job
        </button>
        <Link
          href="/jobs"
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-medium border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors"
        >
          Browse Other Jobs
        </Link>
      </div>
    </div>
  );
}
