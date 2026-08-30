"use client";

import { useEffect, useRef, useState } from "react";
import {
  Star, CheckCircle2, ChevronRight, ChevronLeft, Users, Clock, PlayCircle,
  BookOpen, Calendar, FileText, GraduationCap, Award, Video, Code,
  Play, Sparkle,
} from "lucide-react";
import type { CourseFacility, CourseFaqItem, DetailPageSection } from "@/features/courses/api";
import { ElevateHero } from "./ElevateHero";

const FACILITY_ICON_MAP: Record<string, React.ElementType> = {
  "play-circle": PlayCircle, "file-text": FileText, "check-circle": CheckCircle2,
  "book-open": BookOpen, "graduation-cap": GraduationCap, "award": Award,
  "video": Video, "code": Code, "clock": Clock, "users": Users,
};

function getFacilityIcon(iconKey: string): React.ElementType {
  return FACILITY_ICON_MAP[iconKey] ?? PlayCircle;
}

function mergeDetailPageSections(saved: DetailPageSection[] | null | undefined, _template?: string): DetailPageSection[] {
  const all = [
    { id: "instructor" }, { id: "structure" }, { id: "learn" }, { id: "details" },
    { id: "content" }, { id: "certificate" }, { id: "reviews" }, { id: "requirements" },
    { id: "payment" }, { id: "faq" }, { id: "more-questions" },
  ];
  if (!saved || saved.length === 0) return all.map((s) => ({ id: s.id, enabled: true }));
  const ids = new Set(all.map((s) => s.id));
  const kept = saved.filter((s) => ids.has(s.id));
  const missing = all.filter((s) => !kept.find((k) => k.id === s.id)).map((s) => ({ id: s.id, enabled: true }));
  return [...kept, ...missing];
}

const SECTION_NAV: Record<string, string> = {
  instructor: "Course Instructor",
  structure: "How it's organized",
  learn: "What you'll learn",
  details: "Course details",
  content: "Content preview",
  certificate: "Certificate",
  reviews: "Reviews",
  requirements: "Requirements",
  faq: "FAQ",
  payment: "How to pay",
};

export function ElevateCoursePreview({ course }: { course: any }) {
  const facilities: CourseFacility[] = course.facilities?.length > 0 ? course.facilities : [
    { icon: "play-circle", title: "Video lectures", desc: "Recorded lessons you can watch anytime, at your own pace." },
    { icon: "file-text", title: "Lecture sheets", desc: "Chapter-wise notes and sheets after every lesson." },
    { icon: "check-circle", title: "Quiz sets", desc: "Self-assessment quizzes." },
    { icon: "book-open", title: "Practice exercises", desc: "Hands-on exercises to build skill." },
  ];
  const certificatePerks: string[] = course.certificatePerks?.length > 0 ? course.certificatePerks : ["Add to CV", "Share on LinkedIn"];
  const faqItems: CourseFaqItem[] = course.faq?.length > 0 ? course.faq : [
    { question: "How do I buy?", answer: "Click Enroll and follow the steps." },
    { question: "Can I get a refund?", answer: "Yes, within the refund window." },
  ];
  const supportPhone = course.supportPhone || "16910";
  const paymentInstructions = course.paymentInstructions || "Pay securely with bKash, Nagad, Rocket or card.";
  const sections = mergeDetailPageSections(course.detailPageSections, course.template);
  const navItems = sections.filter((s) => s.enabled && SECTION_NAV[s.id]).map((s) => ({ id: s.id, label: SECTION_NAV[s.id]! }));
  const hours = Math.max(1, Math.round((course.totalDuration ?? 0) / 3600));
  const rating = course.rating ? Number(course.rating) : 4.8;
  const discountPct = course.discountPrice && course.price > 0 ? Math.round(100 - (course.discountPrice / course.price) * 100) : 0;

  const [activeNav, setActiveNav] = useState(navItems[0]?.id ?? "");
  const navRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", measure); ro.disconnect(); };
  }, [navItems]);

  useEffect(() => {
    const els = navItems
      .map((i) => ({ id: i.id, el: document.getElementById(i.id) }))
      .filter((x): x is { id: string; el: HTMLElement } => !!x.el);
    if (els.length === 0) return;
    const measure = () => {
      const topGap = (navRef.current?.offsetHeight ?? 48) + 8;
      let current = els[0]!.id;
      for (const { id, el } of els) {
        if (el.getBoundingClientRect().top - topGap <= 0) current = id;
        else break;
      }
      setActiveNav(current);
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [navItems]);

  const scrollTabs = (dir: 1 | -1) => scrollRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  const goToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = (navRef.current?.offsetHeight ?? 48) + 8;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <>
      {/* ── Hero ── */}
      <ElevateHero
        course={{
          title: course.title,
          categoryName: course.categoryName,
          description: course.description,
          rating,
        }}
      />

      {/* ── Body: sidebar overlapping into hero + content ── */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── Main content (left 2/3) ── */}
          <div className="order-last lg:order-first lg:col-span-2 lg:pt-10 space-y-6">
            {/* Section nav pills — matching student-facing design */}
            {navItems.length > 0 && (
              <div ref={navRef} className="relative border-b border-brand-100 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90">
                <div className="relative">
                  <div
                    ref={scrollRef}
                    className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {navItems.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => goToSection(n.id)}
                        className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                          activeNav === n.id
                            ? "bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/25"
                            : "text-gray-500 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                        }`}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                  {canScrollLeft && (
                    <>
                      <div className="pointer-events-none absolute bottom-0 left-4 top-0 w-10 bg-gradient-to-r from-white to-transparent dark:from-gray-900" />
                      <button
                        type="button"
                        onClick={() => scrollTabs(-1)}
                        aria-label="Scroll tabs left"
                        className="absolute left-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-600 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-brand-400"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {canScrollRight && (
                    <>
                      <div className="pointer-events-none absolute bottom-0 right-4 top-0 w-10 bg-gradient-to-l from-white to-transparent dark:from-gray-900" />
                      <button
                        type="button"
                        onClick={() => scrollTabs(1)}
                        aria-label="Scroll tabs right"
                        className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-600 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-brand-400"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* What you'll learn */}
            {sections.find((s) => s.id === "learn" && s.enabled) && (
              <section id="learn">
                <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-white">What you'll learn</h2>
                <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 dark:border-brand-900/30 dark:bg-brand-500/5">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(course.learningOutcomes || "Master fundamentals\nBuild real projects").split("\n").filter(Boolean).map((o: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                        {o.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* How the course is organized */}
            {sections.find((s) => s.id === "structure" && s.enabled) && (
              <section id="structure">
                <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-white">How the course is organized</h2>
                <div className="grid grid-cols-2 gap-3">
                  {facilities.map((f, i) => {
                    const Icon = getFacilityIcon(f.icon);
                    return (
                      <div key={i} className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-3 dark:border-brand-900/30 dark:from-brand-900/20 dark:to-gray-900">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400">
                          <Icon className="h-4 w-4" />
                        </span>
                        <h3 className="mt-2 text-xs font-bold text-gray-900 dark:text-white">{f.title}</h3>
                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{f.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Requirements */}
            {sections.find((s) => s.id === "requirements" && s.enabled) && (
              <section id="requirements">
                <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-white">Requirements</h2>
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                  {course.requirements || "No specific requirements — just enthusiasm to learn!"}
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] dark:bg-gray-800">{course.level || "Beginner"}</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] dark:bg-gray-800">{course.language || "English"}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Certificate */}
            {sections.find((s) => s.id === "certificate" && s.enabled) && (
              <section id="certificate">
                <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-white">Course certificate</h2>
                <div className="rounded-xl border border-brand-100 overflow-hidden dark:border-brand-900/30">
                  <div className="h-1 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />
                  <div className="p-4">
                    <ul className="space-y-1.5">
                      {certificatePerks.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 rounded-lg border-2 border-dashed border-brand-200 bg-brand-50/40 p-4 text-center dark:border-brand-800 dark:bg-brand-500/5">
                      <p className="font-serif text-sm font-bold text-brand-700 dark:text-brand-300">Certificate of Completion</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* FAQ */}
            {sections.find((s) => s.id === "faq" && s.enabled) && (
              <section id="faq">
                <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-white">FAQ</h2>
                <div className="space-y-1.5">
                  {faqItems.map((q, i) => (
                    <details key={i} className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white">{q.question}</summary>
                      <div className="px-3 pb-2 text-xs text-gray-600 dark:text-gray-400">{q.answer}</div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Payment */}
            {sections.find((s) => s.id === "payment" && s.enabled) && (
              <section id="payment">
                <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-white">How to pay</h2>
                <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-3 text-xs text-gray-600 dark:border-brand-900/30 dark:bg-brand-500/5 dark:text-gray-400">
                  {paymentInstructions}
                </div>
              </section>
            )}

            {/* More questions */}
            {sections.find((s) => s.id === "more-questions" && s.enabled) && (
              <section id="more-questions">
                <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-white">Have more questions?</h2>
                <a href={`tel:${supportPhone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-gray-900 dark:text-brand-400">
                  Call {supportPhone}
                </a>
              </section>
            )}
          </div>

          {/* ── Sidebar (right 1/3, overlapping into hero) ── */}
          <div className="order-first lg:order-last lg:col-span-1">
            <div className="mx-auto w-full max-w-[400px] lg:sticky lg:top-24 lg:ml-auto lg:-mt-36">
              <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-xl shadow-brand-900/10 transition-colors duration-300 dark:border-brand-900/40 dark:bg-gray-900 dark:shadow-black/30">
                {/* Top accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />

                <div className="p-3">
                  {/* Preview / Thumbnail */}
                  <div className="relative overflow-hidden rounded-2xl">
                    {course.isFeatured && (
                      <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg">
                        <Sparkle className="h-3 w-3 fill-current" /> POPULAR
                      </span>
                    )}
                    <div className="relative aspect-video bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/50 dark:to-brand-950">
                      {course.thumbnail ? (
                        <>
                          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg dark:bg-gray-900/90">
                            <Play className="h-5 w-5 fill-brand-600 text-brand-600 dark:fill-brand-400 dark:text-brand-400" />
                          </span>
                        </>
                      ) : (
                        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg dark:bg-gray-900/90">
                          <Play className="h-5 w-5 fill-brand-600 text-brand-600 dark:fill-brand-400 dark:text-brand-400" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail strip placeholder */}
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="relative aspect-video overflow-hidden rounded-md border border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                        {course.thumbnail && (
                          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-3 w-3 fill-white text-white drop-shadow" />
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="px-1 pb-1 pt-5">
                    {/* Price */}
                    <div className="flex items-center gap-3">
                      {course.discountPrice ? (
                        <>
                          <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            ৳{Number(course.discountPrice).toLocaleString()}
                          </span>
                          <span className="text-base text-gray-400 line-through dark:text-gray-500">
                            ৳{Number(course.price).toLocaleString()}
                          </span>
                          {discountPct > 0 && (
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                              -{discountPct}%
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                          {course.price == 0 || course.price === "0" ? "Free" : `৳${Number(course.price).toLocaleString()}`}
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="mt-4">
                      <button className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 px-6 py-3 text-sm font-bold text-white border-0 transition-colors dark:bg-brand-500 dark:hover:bg-brand-600">
                        {course.price == 0 || course.price === "0" ? "Free For Enroll" : "Enroll Now"}
                      </button>
                    </div>

                    {/* What's in this course */}
                    <div className="mt-6 rounded-2xl bg-brand-50/60 p-4 dark:bg-brand-500/10">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">What&rsquo;s in this course</h3>
                      <ul className="mt-3 space-y-3">
                        {[
                          { icon: Users, label: `${(course.totalStudents ?? 0).toLocaleString()} students enrolled` },
                          { icon: Clock, label: `${hours} hours total` },
                          { icon: PlayCircle, label: `${course.totalLessons ?? 0} videos` },
                          { icon: BookOpen, label: `${course.totalLessons ?? 0} notes` },
                          ...(course.hasLifetimeAccess !== false
                            ? [{ icon: Calendar, label: "Lifetime course access" }]
                            : []),
                        ].map(({ icon: Icon, label }) => (
                          <li key={label} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
