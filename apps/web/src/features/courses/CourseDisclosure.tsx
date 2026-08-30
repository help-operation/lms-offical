"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Item = { title: string; body: string };

export function CourseDisclosure({
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
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {items.map((it, i) => {
        const isOpen = open.includes(i);
        const last = i === items.length - 1;
        return (
          <div key={i} className={last ? "" : "border-b border-gray-100 dark:border-gray-700"}>
            <button
              onClick={() => toggle(i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-base font-bold text-gray-900 dark:text-white">
                {it.title}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-300 dark:text-gray-400 ${
                  isOpen ? "rotate-180 text-brand-600 dark:text-brand-400" : ""
                }`}
              />
            </button>
            {isOpen && (
              <p className="whitespace-pre-line px-6 pb-6 text-sm leading-relaxed text-ink-soft dark:text-gray-400">
                {it.body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
