"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Search, X, Plus, SlidersHorizontal } from "lucide-react";
import { SUBJECTS, BOARDS, LOCATIONS, GRADE_LEVELS, JOB_EXPERIENCE_LEVELS } from "@/config/constants";
import Link from "next/link";
import { useSession } from "next-auth/react";

const chevronSvg = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`;

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  active?: boolean;
}

function FilterSelect({ children, active, className, ...props }: FilterSelectProps) {
  return (
    <select
      {...props}
      className={[
        "appearance-none cursor-pointer rounded-full px-3 py-2 pl-3 pr-8 text-xs font-semibold",
        "bg-no-repeat bg-[length:9px_5px]",
        "outline-none transition-all duration-[120ms]",
        "border",
        active
          ? "border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
          : "border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-[var(--eh-border-strong)] hover:bg-[var(--surface-base)]",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        backgroundImage: chevronSvg,
        backgroundPosition: "right 10px center",
        ...props.style,
      }}
    >
      {children}
    </select>
  );
}

export default function JobFilters({ basePath = "/jobs" }: { basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const subject = searchParams.get("subject") || "";
  const location = searchParams.get("location") || "";
  const board = searchParams.get("board") || "";
  const grade = searchParams.get("gradeLevel") || "";
  const experienceLevel = searchParams.get("experienceLevel") || "";
  const urgent = searchParams.get("urgent") === "true";
  const sort = searchParams.get("sort") || "latest";

  const activeCount = [subject, location, board, grade, experienceLevel, urgent ? "urgent" : ""].filter(Boolean).length;
  const isSchoolAdmin = session?.user?.role === "SCHOOL_ADMIN";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${basePath}?${params.toString()}`, { scroll: false });
    },
    [basePath, router, searchParams]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    const selected = searchParams.get("selected");
    const sortValue = searchParams.get("sort");
    if (selected) params.set("selected", selected);
    if (sortValue) params.set("sort", sortValue);
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }, [basePath, router, searchParams]);

  const tags = useMemo(
    () => [
      subject && { key: "subject", label: subject, remove: () => updateParam("subject", "") },
      location && { key: "location", label: location, remove: () => updateParam("location", "") },
      board && { key: "board", label: BOARDS.find((b) => b.value === board)?.label || board, remove: () => updateParam("board", "") },
      grade && { key: "gradeLevel", label: `Grade ${grade}`, remove: () => updateParam("gradeLevel", "") },
      experienceLevel && {
        key: "experienceLevel",
        label: JOB_EXPERIENCE_LEVELS.find((level) => level.value === experienceLevel)?.label || experienceLevel,
        remove: () => updateParam("experienceLevel", ""),
      },
      urgent && { key: "urgent", label: "Urgent only", remove: () => updateParam("urgent", "") },
    ].filter(Boolean) as Array<{ key: string; label: string; remove: () => void }>,
    [subject, location, board, grade, experienceLevel, urgent, updateParam]
  );

  return (
    <div className="rounded-[28px] border border-[var(--eh-border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-5">
      {activeCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--eh-border)] pb-4">
          <div className="rounded-full bg-[var(--surface-base)] px-3 py-1 text-[11px] font-semibold text-[var(--eh-text-2)]">
            {activeCount} active filter{activeCount > 1 ? "s" : ""}
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
          <input
            type="text"
            placeholder="Search title, school, subject, city..."
            value={search}
            onChange={(e) => updateParam("search", e.target.value)}
            className="w-full rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] py-3 pl-10 pr-4 text-sm font-body outline-none transition-all duration-[120ms] focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <FilterSelect value={sort} onChange={(e) => updateParam("sort", e.target.value)}>
          <option value="latest">Latest</option>
          <option value="salary_high">Salary high to low</option>
          <option value="salary_low">Salary low to high</option>
        </FilterSelect>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--eh-border)] px-3 py-2 text-xs font-semibold text-[var(--eh-text-2)] md:hidden"
          aria-expanded={mobileOpen}
        >
          <SlidersHorizontal size={13} />
          Filters {activeCount > 0 ? `(${activeCount})` : ""}
        </button>

        {isSchoolAdmin && (
          <Link
            href="/dashboard/post-job"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-brand transition-all duration-[120ms] hover:-translate-y-px hover:bg-brand-600"
          >
            <Plus size={13} />
            Post Job
          </Link>
        )}
      </div>

      <div className={`${mobileOpen ? "flex" : "hidden"} items-center gap-2 flex-wrap md:flex`}>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--eh-text-4)]">
          <SlidersHorizontal size={13} />
          Filter:
        </div>

        <FilterSelect value={subject} onChange={(e) => updateParam("subject", e.target.value)} active={!!subject}>
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </FilterSelect>

        <FilterSelect value={location} onChange={(e) => updateParam("location", e.target.value)} active={!!location}>
          <option value="">All Locations</option>
          {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </FilterSelect>

        <FilterSelect value={board} onChange={(e) => updateParam("board", e.target.value)} active={!!board}>
          <option value="">All Boards</option>
          {BOARDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </FilterSelect>

        <FilterSelect value={grade} onChange={(e) => updateParam("gradeLevel", e.target.value)} active={!!grade}>
          <option value="">All Grades</option>
          {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
        </FilterSelect>

        <FilterSelect value={experienceLevel} onChange={(e) => updateParam("experienceLevel", e.target.value)} active={!!experienceLevel}>
          <option value="">All Experience</option>
          {JOB_EXPERIENCE_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </FilterSelect>

        <button
          type="button"
          onClick={() => updateParam("urgent", urgent ? "" : "true")}
          className={[
            "rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-[120ms]",
            urgent
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-[var(--eh-border-strong)] hover:bg-[var(--surface-base)]",
          ].join(" ")}
        >
          Urgent Only
        </button>

        {activeCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50">
            <X size={11} />
            Clear {activeCount > 1 ? `(${activeCount})` : ""}
          </button>
        )}
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-live="polite">
          {tags.map((tag) => (
            <span key={tag.key} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-2.5 py-1 text-[11px] font-semibold text-[var(--eh-primary-700)]">
              {tag.label}
              <button onClick={tag.remove} className="transition-colors hover:text-brand-900" aria-label={`Remove ${tag.label} filter`}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
