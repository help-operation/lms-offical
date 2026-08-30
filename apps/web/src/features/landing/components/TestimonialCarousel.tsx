"use client";

import { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useAutoplay } from "@/shared/hooks/useAutoplay";

type Item = {
  name: string;
  role: string;
  image: string;
  rating: number;
  text: string;
};

type Props = {
  title: string;
  subtitle: string;
  items: Item[];
};

export default function TestimonialCarousel({ title, subtitle, items }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;
  const prev = () => setCurrent((c) => (c - 1 + n) % n);
  const next = () => setCurrent((c) => (c + 1) % n);
  const t = items[current] ?? items[0];

  useAutoplay(next, 5000, !paused && n > 1);

  if (!t) return null;

  const words = title.split(" ");
  const hi = Math.floor(words.length / 2);

  return (
    <section
      className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-[40px] font-bold text-gray-900 dark:text-white">
          {words.map((w, i) => (
            <span key={i} className={i === hi ? "text-brand-600" : ""}>
              {w}{" "}
            </span>
          ))}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-base text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>

        <div className="mx-auto mt-14 max-w-3xl">
          {/* Avatar strip */}
          <div className="flex items-center gap-4 sm:justify-center sm:gap-6">
            <button
              onClick={prev}
              aria-label="Previous"
              className="hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-brand-200 text-brand-600 transition-colors hover:bg-brand-600 hover:text-white sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-3 overflow-x-auto scroll-smooth px-1 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:gap-5 sm:overflow-visible sm:px-0 sm:py-0">
              {items.map((item, i) => {
                const active = i === current;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    aria-label={item.name}
                    className={`relative shrink-0 cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 ${
                      active
                        ? "h-16 w-16 sm:h-24 sm:w-24 ring-4 ring-brand-500 ring-offset-2"
                        : "h-12 w-12 sm:h-16 sm:w-16 opacity-50 hover:opacity-80"
                    }`}
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-200 text-xl font-bold">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={next}
              aria-label="Next"
              className="hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-brand-200 text-brand-600 transition-colors hover:bg-brand-600 hover:text-white sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Active testimonial */}
          <div className="mt-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.name}</h3>
            <p className="mt-1 text-sm font-semibold text-brand-600 dark:text-brand-400">{t.role}</p>
            <div className="mt-3 flex items-center justify-center gap-1">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              &ldquo;{t.text}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
