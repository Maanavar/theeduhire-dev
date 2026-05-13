"use client";

import { cn } from "@/lib/utils";

type ChipOption = string | { value: string; label: string };

export function ChipGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly ChipOption[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          const active = selected.includes(val);
          return (
            <button
              key={val}
              type="button"
              onClick={() => toggle(val)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-[120ms]",
                active
                  ? "border-brand-500 bg-brand-500 text-white shadow-brand"
                  : "border-black/[0.09] bg-white text-gray-500 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
              )}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}
