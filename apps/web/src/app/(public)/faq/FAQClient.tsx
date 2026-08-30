"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FAQQuestion = { q: string; a: string };
export type FAQCategory = { id: string; title: string; questions: FAQQuestion[] };

type Props = { categories: FAQCategory[] };

export function FAQClient({ categories }: Props) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggle = (key: string) =>
    setOpenItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 lg:py-20">
      <div className="container mx-auto max-w-4xl px-4">
        {categories.map((cat) => (
          <div key={cat.id} className="mb-14 last:mb-0">
            <div className="mb-8 text-center">
              <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-brand-500 dark:bg-brand-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                {cat.title}
              </h2>
            </div>

            <div className="space-y-3">
              {cat.questions.map((item, qi) => {
                const key = `${cat.id}-${qi}`;
                const isOpen = openItems.includes(key);
                return (
                  <div
                    key={key}
                    className={`overflow-hidden rounded-2xl border bg-white transition-colors duration-300 dark:bg-gray-800/60 ${
                      isOpen
                        ? "border-brand-300 shadow-sm dark:border-brand-500/40"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <button
                      onClick={() => toggle(key)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 sm:px-6"
                    >
                      <span
                        className={`text-sm font-semibold transition-colors sm:text-base ${
                          isOpen
                            ? "text-brand-600 dark:text-brand-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {item.q}
                      </span>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                          isOpen
                            ? "rotate-180 bg-brand-500 text-white"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft dark:text-gray-400 sm:px-6">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
