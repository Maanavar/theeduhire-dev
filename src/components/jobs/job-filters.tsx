"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X, Plus, SlidersHorizontal } from "lucide-react";
import { SUBJECTS, BOARDS, LOCATIONS, GRADE_LEVELS } from "@/config/constants";
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
        "appearance-none cursor-pointer pl-3 pr-8 py-2 rounded-xl text-xs font-semibold",
        "bg-no-repeat bg-[length:9px_5px]",
        "outline-none transition-all duration-[120ms]",
        "border",
        active
          ? "border-brand-400 bg-brand-50 text-brand-700"
          : "border-black/[0.09] bg-white text-gray-600 hover:border-black/[0.15] hover:bg-gray-50",
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

export default function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const search   = searchParams.get("search")     || "";
  const subject  = searchParams.get("subject")    || "";
  const location = searchParams.get("location")   || "";
  const board    = searchParams.get("board")       || "";
  const grade    = searchParams.get("gradeLevel") || "";

  const activeCount = [subject, location, board, grade].filter(Boolean).length;
  const isSchoolAdmin = session?.user?.role === "SCHOOL_ADMIN";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      value ? params.set(key, value) : params.delete(key);
      params.delete("page");
      router.push(`/jobs?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    const selected = searchParams.get("selected");
    if (selected) params.set("selected", selected);
    router.push(`/jobs?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <div className="space-y-3">
      {/* Search + Post CTA row */}
      <div className="flex gap-2.5 flex-wrap items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search title, school, subject, city…"
            value={search}
            onChange={(e) => updateParam("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-body outline-none transition-all duration-[120ms]"
            style={{
              background: "white",
              border: "1.5px solid rgba(0,0,0,0.09)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#1f9b63";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(31,155,99,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.09)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {isSchoolAdmin && (
          <Link
            href="/dashboard/post-job"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-[120ms] shadow-brand hover:-translate-y-px whitespace-nowrap"
          >
            <Plus size={13} />
            Post Job
          </Link>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
          <SlidersHorizontal size={13} />
          Filter:
        </div>

        <FilterSelect
          value={subject}
          onChange={(e) => updateParam("subject", e.target.value)}
          active={!!subject}
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </FilterSelect>

        <FilterSelect
          value={location}
          onChange={(e) => updateParam("location", e.target.value)}
          active={!!location}
        >
          <option value="">All Locations</option>
          {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </FilterSelect>

        <FilterSelect
          value={board}
          onChange={(e) => updateParam("board", e.target.value)}
          active={!!board}
        >
          <option value="">All Boards</option>
          {BOARDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </FilterSelect>

        <FilterSelect
          value={grade}
          onChange={(e) => updateParam("gradeLevel", e.target.value)}
          active={!!grade}
        >
          <option value="">All Grades</option>
          {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
        </FilterSelect>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <X size={11} />
            Clear {activeCount > 1 ? `(${activeCount})` : ""}
          </button>
        )}
      </div>

      {/* Active filter tags */}
      {activeCount > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {[
            subject  && { key: "subject",    label: subject,                              remove: () => updateParam("subject", "") },
            location && { key: "location",   label: location,                             remove: () => updateParam("location", "") },
            board    && { key: "board",      label: BOARDS.find((b) => b.value === board)?.label || board, remove: () => updateParam("board", "") },
            grade    && { key: "gradeLevel", label: `Grade ${grade}`,                     remove: () => updateParam("gradeLevel", "") },
          ].filter(Boolean).map((tag: any) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            >
              {tag.label}
              <button
                onClick={tag.remove}
                className="hover:text-brand-900 transition-colors"
                aria-label={`Remove ${tag.label} filter`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
