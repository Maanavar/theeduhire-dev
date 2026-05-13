"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

type FAQItem = {
  q: string;
  a: string;
};

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = useState<Record<number, number>>({});

  const recalculateHeights = useMemo(
    () => () => {
      const next: Record<number, number> = {};
      contentRefs.current.forEach((node, index) => {
        if (node) next[index] = node.scrollHeight;
      });
      setHeights(next);
    },
    []
  );

  useEffect(() => {
    recalculateHeights();
    window.addEventListener("resize", recalculateHeights);
    return () => window.removeEventListener("resize", recalculateHeights);
  }, [recalculateHeights]);

  useEffect(() => {
    recalculateHeights();
  }, [openIndex, recalculateHeights]);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const open = index === openIndex;

        return (
          <article
            key={item.q}
            className={clsx(
              "overflow-hidden rounded-[24px] border bg-white transition-[border-color,box-shadow] duration-300",
              open
                ? "border-[var(--color-brand-200)] shadow-[0_14px_36px_rgba(31,155,99,0.10)]"
                : "border-[var(--eh-border)]"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIndex((current) => (current === index ? -1 : index))}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={open}
            >
              <span className="text-[15px] font-semibold text-[var(--eh-text)]">{item.q}</span>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-base)] text-[var(--eh-text-4)]">
                <ChevronDown
                  size={18}
                  className={clsx("transition-transform duration-300", open && "rotate-180")}
                />
              </span>
            </button>

            <div
              className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
              style={{ maxHeight: open ? `${heights[index] ?? 0}px` : "0px", opacity: open ? 1 : 0 }}
            >
              <div
                ref={(node) => {
                  contentRefs.current[index] = node;
                }}
                className="px-5 pb-5"
              >
                <div className="mb-4 h-px bg-[var(--eh-border)]" />
                <p className="max-w-[760px] text-[14px] leading-[1.7] text-[var(--eh-text-3)]">{item.a}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
