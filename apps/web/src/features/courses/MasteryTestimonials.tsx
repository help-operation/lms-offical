"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
}

export interface TestimonialsData {
  title?: string;
  items?: TestimonialItem[];
}

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    name: "?????? ?????",
    role: "BBA Student",
    quote: "Excel ?? INDEX-MATCH ?? XLOOKUP ??? ??? ???? ??? ??? ??? ??? ???? ???? ????? PowerPoint Slide Master ????? ?? ???? ???????????? ???? ????????? ??? ????? ??????? ???? Practical ????",
  },
  {
    name: "?????? ?????",
    role: "Business Owner",
    quote: "???? ???????? Sales Report ???? ????????? ???? ??? Excel ????? Sales Dashboard ???? ????? Power BI ????? ??????? ???????? ??? ????????? ???? ?????? ??????? ???????????? ???? ???? ???????",
  },
  {
    name: "????? ?????",
    role: "Office Executive",
    quote: "Conditional Formatting, IF + AND/OR ??? Pivot Chart ??? ???? ???? ????? ???? ???????? ??? ????? ??????? Professional ???? ???? ??????",
  },
];

export function MasteryTestimonials({ data }: { data?: TestimonialsData }) {
  const title = data?.title || "Students Testimonial";
  const items = data?.items && data.items.length > 0 ? data.items : DEFAULT_TESTIMONIALS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const cardWidth = 370;
  const itemsPerPage = 1;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const updatePage = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollPos = scrollRef.current.scrollLeft;
    const page = Math.round(scrollPos / cardWidth);
    const normalized = ((page % totalPages) + totalPages) % totalPages;
    if (normalized !== currentPage) setCurrentPage(normalized);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updatePage);
    return () => el.removeEventListener("scroll", updatePage);
  }, [updatePage]);

  const scrollToPage = useCallback((page: number) => {
    if (!scrollRef.current || totalPages === 0) return;
    const normalized = ((page % totalPages) + totalPages) % totalPages;
    scrollRef.current.scrollTo({ left: normalized * cardWidth, behavior: "smooth" });
    setCurrentPage(normalized);
  }, [totalPages]);

  useEffect(() => {
    if (totalPages <= 1 || isPaused || isDragging) return;
    const id = setInterval(() => scrollToPage(currentPage + 1), 4000);
    return () => clearInterval(id);
  }, [currentPage, totalPages, scrollToPage, isPaused, isDragging]);

  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current!.offsetLeft);
    setScrollLeft(scrollRef.current!.scrollLeft);
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current!.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current!.scrollLeft = scrollLeft - walk;
  }

  return (
    <div className="mx-auto max-w-[1160px] px-[10px] py-10">
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseDown={(e) => { setIsPaused(true); handleMouseDown(e); }}
        onMouseUp={() => { setIsPaused(false); handleMouseUp(); }}
        onMouseLeave={() => { setIsPaused(false); handleMouseUp(); }}
        onMouseEnter={() => setIsPaused(true)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
          onMouseMove={handleMouseMove}
        >
          {[...items, ...items.slice(0, 2)].map((item, index) => (
            <div
              key={index}
              className="shrink-0 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow snap-start"
              style={{ width: 352, height: 182 }}
            >
            <div className="w-full flex flex-col justify-center border-b border-gray-200" style={{ height: 61, padding: '0 16px', paddingTop: 16 }}>
              <h3
                className="text-gray-900"
                style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 14, fontStyle: 'normal' }}
              >
                &ndash; {item.name}
              </h3>
              <p style={{ color: '#697882', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 400 }}>{item.role}</p>
            </div>
            <p
              className="leading-relaxed"
              style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 15, fontWeight: 400, padding: '8px 16px 16px' }}
            >
              {item.quote}
            </p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToPage(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                currentPage === i ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}