"use client";

import { BadgeCheck, BookOpen, Briefcase, MapPin, Users } from "lucide-react";
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
    job.jobType === "FULL_TIME"
      ? "Full-Time"
      : job.jobType === "PART_TIME"
        ? "Part-Time"
        : job.jobType === "CONTRACT"
          ? "Contract"
          : job.jobType === "VISITING_FACULTY"
            ? "Visiting Faculty"
            : null;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={[
        "relative cursor-pointer border-b border-[var(--eh-border)] px-4 py-4 outline-none transition-all duration-[120ms]",
        "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset",
        isSelected ? "bg-white" : "hover:bg-white/70",
      ].join(" ")}
    >
      <div
        className={[
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-[120ms]",
          isSelected ? "bg-brand-500 opacity-100" : "opacity-0",
        ].join(" ")}
      />

      <div className="mb-0.5 flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--eh-border)] bg-white">
          {job.school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.school.logoUrl} alt={`${job.school.schoolName} logo`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-semibold text-[var(--eh-text-3)]">
              {(job.school.schoolName || "S").slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <h3 className="text-[14px] font-semibold leading-snug text-[var(--eh-text)]">{job.title}</h3>
            {job.school.verified ? <BadgeCheck size={13} className="mt-0.5 shrink-0 text-eh-primary" /> : null}
          </div>
          <p className="mt-1 text-xs font-medium text-[var(--eh-text-3)]">{job.school.schoolName}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.isUrgent ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
            Urgent
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--eh-border)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--eh-text-2)]">
          <MapPin size={9} className="shrink-0 text-[var(--eh-text-4)]" />
          {job.school.city}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--eh-border)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--eh-text-2)]">
          <BookOpen size={9} className="shrink-0 text-[var(--eh-text-4)]" />
          {boardLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--eh-border)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--eh-text-2)]">
          <Users size={9} className="shrink-0 text-[var(--eh-text-4)]" />
          Gr. {job.gradeLevel}
        </span>
        {jobTypeLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-2.5 py-1 text-[11px] font-medium text-[var(--eh-primary-700)]">
            <Briefcase size={9} className="shrink-0" />
            {jobTypeLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-eh-primary">
          {formatSalary(job.salaryMin, job.salaryMax)}
        </span>
        <span className="text-[11px] font-medium text-[var(--eh-text-4)]">{timeAgo(job.postedAt)}</span>
      </div>
    </div>
  );
}
