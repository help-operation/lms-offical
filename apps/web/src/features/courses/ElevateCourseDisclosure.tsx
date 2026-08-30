"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Item = { title: string; body: string };

/** Same multi-open accordion behavior as CourseDisclosure, with a smooth
 * height animation and premium card styling instead of instant show/hide. */
export function ElevateCourseDisclosure({
  items,
  defaultOpen = 0,
}: {
  items: Item[];
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState<number[]>(
    defaultOpen >= 0 ? [defaultOpen] : [],
  );

  const toggle = (i: number) =>
    setOpen((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
      {items.map((it, i) => {
        const isOpen = open.includes(i);
        const last = i === items.length - 1;
        return (
          <div key={i} className={last ? "" : "border-b border-brand-50 dark:border-gray-800"}>
            <button
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-500/5"
            >
              <span className="text-base font-bold text-gray-900 dark:text-white">
                {it.title}
              </span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isOpen ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className="whitespace-pre-line px-6 pb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {it.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
