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
  const boardLabel =
    job.board === "STATE_BOARD" ? "State Board" : job.board;

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-all ${
        isSelected
          ? "bg-brand-50/60 border-l-[3px] border-l-brand-500"
          : "hover:bg-gray-50/80 border-l-[3px] border-l-transparent"
      }`}
    >
      <div className="flex items-start gap-1.5">
        <h3 className="text-[14.5px] font-semibold text-gray-900 leading-snug">
          {job.title}
        </h3>
        {job.school.verified && (
          <BadgeCheck size={14} className="text-brand-500 mt-0.5 shrink-0" />
        )}
      </div>

      <p className="text-[13px] text-gray-500 mt-0.5">{job.school.schoolName}</p>

      <div className="flex gap-1.5 flex-wrap mt-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          <MapPin size={10} />
          {job.school.city}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          <BookOpen size={10} />
          {boardLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          <Users size={10} />
          Gr. {job.gradeLevel}
        </span>
        {job.jobType !== "FULL_TIME" && (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <Briefcase size={10} />
            {job.jobType === "PART_TIME"
              ? "Part-Time"
              : job.jobType === "CONTRACT"
              ? "Contract"
              : "Visiting"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[13px] font-bold text-brand-500">
          {formatSalary(job.salaryMin, job.salaryMax)}
        </span>
        <span className="text-[11px] text-gray-400">
          {timeAgo(job.postedAt)}
        </span>
      </div>
    </div>
  );
}
