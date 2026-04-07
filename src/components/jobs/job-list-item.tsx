"use client";

import { MapPin, BookOpen, Users, Briefcase, BadgeCheck } from "lucide-react";
import { formatSalary, timeAgo } from "@/lib/utils";
import type { JobListItem as JobListItemType } from "@/types";

interface Props {
  job: JobListItemType;
  isSelected: boolean;
  onClick: () => void;
}

export default function JobListItem({ job, isSelected, onClick }: Props) {
  const boardLabel = job.board === "STATE_BOARD" ? "State Board" : job.board;

  const jobTypeLabel =
    job.jobType === "PART_TIME"  ? "Part-Time"  :
    job.jobType === "CONTRACT"   ? "Contract"   :
    job.jobType === "VISITING"   ? "Visiting"   : null;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={[
        "px-4 py-4 border-b border-black/[0.05] cursor-pointer relative",
        "transition-all duration-[120ms] outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset",
        isSelected
          ? "bg-brand-50/70"
          : "hover:bg-black/[0.018]",
      ].join(" ")}
    >
      {/* Left accent bar */}
      <div
        className={[
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-[120ms]",
          isSelected ? "bg-brand-500 opacity-100" : "opacity-0",
        ].join(" ")}
      />

      {/* Title row */}
      <div className="flex items-start gap-1.5 mb-0.5">
        <h3 className="text-[14px] font-semibold text-gray-900 leading-snug">
          {job.title}
        </h3>
        {job.school.verified && (
          <BadgeCheck size={13} className="text-brand-500 mt-0.5 shrink-0" />
        )}
      </div>

      {/* School name */}
      <p className="text-xs text-gray-500 font-medium mb-2.5">{job.school.schoolName}</p>

      {/* Tags */}
      <div className="flex gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-md font-medium">
          <MapPin size={9} className="flex-shrink-0" />
          {job.school.city}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-md font-medium">
          <BookOpen size={9} className="flex-shrink-0" />
          {boardLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-md font-medium">
          <Users size={9} className="flex-shrink-0" />
          Gr.&nbsp;{job.gradeLevel}
        </span>
        {jobTypeLabel && (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-100">
            <Briefcase size={9} className="flex-shrink-0" />
            {jobTypeLabel}
          </span>
        )}
      </div>

      {/* Salary + time */}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[13px] font-bold text-brand-600">
          {formatSalary(job.salaryMin, job.salaryMax)}
        </span>
        <span className="text-[11px] text-gray-400 font-medium">
          {timeAgo(job.postedAt)}
        </span>
      </div>
    </div>
  );
}
