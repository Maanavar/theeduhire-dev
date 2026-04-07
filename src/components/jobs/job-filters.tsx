"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X, Plus } from "lucide-react";
import { SUBJECTS, BOARDS, LOCATIONS, GRADE_LEVELS } from "@/config/constants";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const search = searchParams.get("search") || "";
  const subject = searchParams.get("subject") || "";
  const location = searchParams.get("location") || "";
  const board = searchParams.get("board") || "";
  const grade = searchParams.get("gradeLevel") || "";

  const activeCount = [subject, location, board, grade].filter(Boolean).length;
  const isSchoolAdmin = session?.user?.role === "SCHOOL_ADMIN";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on filter change
      params.delete("page");
      // Preserve selected job
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
      {/* Search + post CTA */}
      <div className="flex gap-2.5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search title, school, subject, city..."
            value={search}
            onChange={(e) => updateParam("search", e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] font-body bg-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        {isSchoolAdmin && (
          <Link
            href="/dashboard/post-job"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors whitespace-nowrap"
          >
            <Plus size={14} />
            Post Job
          </Link>
        )}
      </div>

      {/* Filter selects */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={subject}
          onChange={(e) => updateParam("subject", e.target.value)}
          className={`px-3 py-2.5 border rounded-lg text-[12.5px] font-body bg-white cursor-pointer transition-colors appearance-none pr-8 bg-no-repeat bg-[length:10px_6px] bg-[right_10px_center] ${
            subject
              ? "border-brand-500 bg-brand-50 text-brand-600"
              : "border-gray-200 text-gray-600"
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239C9C97' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
          }}
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => updateParam("location", e.target.value)}
          className={`px-3 py-2.5 border rounded-lg text-[12.5px] font-body bg-white cursor-pointer transition-colors appearance-none pr-8 bg-no-repeat bg-[length:10px_6px] bg-[right_10px_center] ${
            location
              ? "border-brand-500 bg-brand-50 text-brand-600"
              : "border-gray-200 text-gray-600"
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239C9C97' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
          }}
        >
          <option value="">All Locations</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <select
          value={board}
          onChange={(e) => updateParam("board", e.target.value)}
          className={`px-3 py-2.5 border rounded-lg text-[12.5px] font-body bg-white cursor-pointer transition-colors appearance-none pr-8 bg-no-repeat bg-[length:10px_6px] bg-[right_10px_center] ${
            board
              ? "border-brand-500 bg-brand-50 text-brand-600"
              : "border-gray-200 text-gray-600"
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239C9C97' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
          }}
        >
          <option value="">All Boards</option>
          {BOARDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <select
          value={grade}
          onChange={(e) => updateParam("gradeLevel", e.target.value)}
          className={`px-3 py-2.5 border rounded-lg text-[12.5px] font-body bg-white cursor-pointer transition-colors appearance-none pr-8 bg-no-repeat bg-[length:10px_6px] bg-[right_10px_center] ${
            grade
              ? "border-brand-500 bg-brand-50 text-brand-600"
              : "border-gray-200 text-gray-600"
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239C9C97' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
          }}
        >
          <option value="">All Grades</option>
          {GRADE_LEVELS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-2 text-[12px] text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Active filter tags */}
      {activeCount > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {subject && (
            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium">
              {subject}
              <button onClick={() => updateParam("subject", "")} className="hover:text-brand-800">
                <X size={11} />
              </button>
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium">
              {location}
              <button onClick={() => updateParam("location", "")} className="hover:text-brand-800">
                <X size={11} />
              </button>
            </span>
          )}
          {board && (
            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium">
              {BOARDS.find((b) => b.value === board)?.label || board}
              <button onClick={() => updateParam("board", "")} className="hover:text-brand-800">
                <X size={11} />
              </button>
            </span>
          )}
          {grade && (
            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium">
              Grade {grade}
              <button onClick={() => updateParam("gradeLevel", "")} className="hover:text-brand-800">
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
