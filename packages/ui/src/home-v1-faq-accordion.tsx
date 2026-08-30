"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = { q?: string; a?: string };

export type FaqAccordionContent = {
  eyebrow?: string;
  title?: string;
  items?: FaqItem[];
  cta_label?: string;
  cta_link?: string;
};

type Props = { content?: FaqAccordionContent };

const DEFAULTS: Required<FaqAccordionContent> = {
  eyebrow: "FAQ",
  title: "Frequently Asked Questions",
  items: [
    { q: "Do you offer discounts for students?", a: "Yes, students get a special discount on select courses. Contact support with your student ID to redeem it." },
    { q: "Do you have a refund policy for the course?", a: "We offer a 30-day, no-questions-asked money-back guarantee on all paid courses." },
    { q: "Do you offer discounts for beginners?", a: "Yes! Beginner-friendly bundles are discounted regularly — check the courses page for active offers." },
    { q: "Do you offer classes for students?", a: "Yes, we run both live and recorded classes suited for students at every level." },
    { q: "What was the course included?", a: "Every course includes lifetime access, downloadable resources, and a certificate on completion." },
    { q: "What instructors are included in the course?", a: "Each course is led by a vetted, experienced instructor with real industry background." },
  ],
  cta_label: "View all FAQs",
  cta_link: "/faq",
};

function FaqCard({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white transition-colors dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100"
      >
        {item.q}
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"}`}
        />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="border-t border-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export function FaqAccordionV2({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<FaqAccordionContent>;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Two independently-stacking columns (rather than one 2-col grid) — a
  // shared grid row sizes to its tallest cell, which left a dead gap under
  // whichever card in the row stayed closed. Splitting even/odd indices into
  // separate flex columns keeps each column's own spacing self-contained.
  const indexed = d.items.map((item, i) => ({ item, i }));
  const leftItems = indexed.filter(({ i }) => i % 2 === 0);
  const rightItems = indexed.filter(({ i }) => i % 2 === 1);

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{d.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{d.title}</h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 items-start gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            {leftItems.map(({ item, i }) => (
              <FaqCard key={i} item={item} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {rightItems.map(({ item, i }) => (
              <FaqCard key={i} item={item} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <a
            href={d.cta_link}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {d.cta_label}
          </a>
        </div>
      </div>
    </section>
  );
}

export default FaqAccordionV2;
