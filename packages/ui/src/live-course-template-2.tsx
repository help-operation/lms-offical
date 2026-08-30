"use client";

import { useState, useEffect, useRef, Fragment, type ReactNode, type CSSProperties } from "react";
import {
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, X, Star, Play, MessageCircle, Phone,
} from "lucide-react";
import { LiveEnrollmentForm, type EnrollmentUser } from "./live-enrollment-form";
import { LiveCoursePromoBar } from "./live-course-promo-bar";
import { TemplateStyleScope, type StyleOverrides } from "./template-style-overrides";
import { LessonIcon } from "./lesson-icons";
import { resolveSectionOrder } from "./live-course-template";
import { LiveDot } from "./live-dot";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveCourseTemplate2Data {
  id?: number;
  styleOverrides?: StyleOverrides;
  /** Icon shown before each curriculum lesson row. */
  lessonIcon?: string;
  title: string;
  slug?: string;
  price: string;
  originalPrice?: string | null;
  batchId?: number | null;
  countdownEnd?: string | null;
  totalLiveClasses?: string | null;

  hero?: {
    badgeText?: string;
    // Split headline: line1 (black) + headlineHighlight (red) + headlineAfter (black)
    headline?: string;
    headlineHighlight?: string;
    headlineAfter?: string;
    subtitle?: string;
    videoUrl?: string;
    bannerImage?: string;
    ctaText?: string;
    secondaryCtaText?: string;
    promoText?: string;
    studentCountText?: string;
    rating?: number;
    ratingCount?: number;
  };

  stats?: {
    studentsCount?: string;
    ratingsCount?: string;
    completionRate?: string;
    extra?: string;
    labels?: [string, string, string, string];
  };

  batchInfo?: {
    startDate?: string;
    liveSchedule?: string;
    supportSchedule?: string;
    seatsLeft?: string;
  };

  comparisonTable?: {
    col1Label?: string;
    col2Label?: string;
    rows?: Array<{ feature: string; col1?: string; col2?: string; highlight?: boolean }>;
  };

  curriculum?: Array<{ title: string; lessons?: string[] }>;

  instructors?: Array<{
    name: string; title?: string; image?: string; bio?: string;
    role?: string;
  }>;

  whyDifferent?: Array<{ title: string; description?: string; icon?: string }>;

  ctaBanner?: {
    label?: string;
    title?: string;
    price?: string;
    originalPrice?: string;
    buttonText?: string;
    installment1?: string;
    installment2?: string;
  };

  certificate?: {
    title?: string;
    highlight?: string;
    description?: string;
    image?: string;
    founderName?: string;
    founderRole?: string;
  };

  videoTabs?: Array<{
    category: string;
    videos: Array<{ url: string; title?: string; thumbnail?: string }>;
  }>;

  pcRequirements?: {
    basic?: { ram?: string; processor?: string; storage?: string; graphics?: string; note?: string };
    pro?:   { ram?: string; processor?: string; storage?: string; graphics?: string; note?: string };
    internet?: string;
  };

  testimonials?: Array<{ name: string; role?: string; review: string; rating?: number; batch?: string }>;

  faq?: Array<{ question: string; answer: string }>;

  urgencyCta?: {
    batchLabel?: string;
    title?: string;
    highlight?: string;
    subtitle?: string;
    buttonText?: string;
    whatsapp?: string;
  };

  /** Custom heading text per page section, keyed by section id. */
  sectionHeadings?: Record<string, string>;
  /** Custom render order of page sections, by section id. Empty = template default. */
  sectionOrder?: string[];
  courseType?: 'live' | 'bundle';
  bundledCourses?: Array<{ id: number; title: string; price: string; thumbnail: string | null }>;
}

interface Props {
  course: LiveCourseTemplate2Data;
  baseUrl?: string;
  previewMode?: boolean;
  user?: EnrollmentUser | null;
  enrolled?: boolean;
  checkoutError?: string | null;
  logoUrl?: string;
  logoAlt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: string | number | null | undefined) {
  if (!v) return "0";
  return Number(v).toLocaleString("en-BD");
}

function youtubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]{11})/);
  return m?.[1] ?? null;
}

function youtubeThumbnail(url: string) {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ end }: { end: string }) {
  const calc = () => {
    const diff = Math.max(0, new Date(end).getTime() - Date.now());
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [end]);

  const Box = ({ v, label }: { v: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-red-600 text-white font-extrabold text-2xl sm:text-3xl w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center shadow">
        {String(v).padStart(2, "0")}
      </div>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 text-center space-y-3">
      <p className="text-sm font-semibold text-gray-600">অফার শেষ হতে আর বাকি মাত্র:</p>
      <div className="flex items-center justify-center gap-3">
        <Box v={t.d} label="দিন" />
        <Box v={t.h} label="ঘণ্টা" />
        <Box v={t.m} label="মিনিট" />
        <Box v={t.s} label="সেকেন্ড" />
      </div>
    </div>
  );
}

// ─── SECTION: Hero ────────────────────────────────────────────────────────────

function HeroSection({ course, enrollId }: { course: LiveCourseTemplate2Data; enrollId: string }) {
  const vid = youtubeId(course.hero?.videoUrl ?? "");
  const [playing, setPlaying] = useState(false);

  const scrollToEnroll = () => {
    document.getElementById(enrollId)?.scrollIntoView({ behavior: "smooth" });
  };

  const hasHighlight = !!(course.hero?.headline || course.hero?.headlineHighlight || course.hero?.headlineAfter);

  return (
    <section className="relative pt-14 pb-12 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Badge pills */}
        {course.hero?.badgeText && (
          <div className="flex flex-wrap justify-center gap-2">
            {course.hero.badgeText.split("|").map((b, i) => (
              <span key={i} className="badge-glow inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-red-400 text-red-600 text-xs font-semibold shadow-sm">
                <LiveDot className="h-1.5 w-1.5" />
                {b.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Title — split headline or plain course title */}
        {hasHighlight ? (
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            {course.hero?.headline && (
              <span className="block text-gray-900">{course.hero.headline}</span>
            )}
            {course.hero?.headlineHighlight && (
              <span className="block text-red-500">{course.hero.headlineHighlight}</span>
            )}
            {course.hero?.headlineAfter && (
              <span className="block text-gray-900">{course.hero.headlineAfter}</span>
            )}
          </h1>
        ) : (
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
            {course.title}
          </h1>
        )}

        {/* Subtitle */}
        {course.hero?.subtitle && (
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {course.hero.subtitle}
          </p>
        )}

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex flex-nowrap items-center gap-2 sm:gap-3">
            <button onClick={scrollToEnroll}
              className="cta-premium shrink-0 whitespace-nowrap px-4 py-2 text-xs sm:px-6 sm:py-2.5 sm:text-sm bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-colors shadow-lg"
              style={{ "--cta-rgb": "220 38 38" } as CSSProperties}>
              {course.hero?.ctaText ?? "ভর্তি হোন"}
            </button>
            <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
              <span className="text-sm sm:text-2xl font-extrabold text-gray-900">৳{fmt(course.price)}</span>
              {course.originalPrice && (
                <span className="text-xs sm:text-lg text-red-400 font-medium line-through">৳{fmt(course.originalPrice)}</span>
              )}
            </div>
          </div>
          {course.hero?.secondaryCtaText && (
            <button
              onClick={() => document.getElementById("curriculum")?.scrollIntoView({ behavior: "smooth" })}
              className="px-7 py-3 border-2 border-gray-300 hover:border-red-400 text-gray-700 font-semibold rounded-full text-sm transition-colors bg-white">
              {course.hero.secondaryCtaText}
            </button>
          )}
        </div>
        {course.hero?.promoText && (
          <p className="flex items-center justify-center gap-1 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4 shrink-0" /> {course.hero.promoText}
          </p>
        )}

        {/* Video */}
        {vid && (
          <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-video bg-black">
            {playing ? (
              <iframe
                src={`https://www.youtube.com/embed/${vid}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <>
                <img
                  src={`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`}
                  alt="video"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <button
                    onClick={() => setPlaying(true)}
                    className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-xl transition-colors"
                  >
                    <Play className="h-7 w-7 text-white ml-1" fill="white" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Countdown */}
        {course.countdownEnd && <Countdown end={course.countdownEnd} />}

        {/* Stats cards */}
        {course.stats && (
          <StatsCards stats={course.stats} totalLiveClasses={course.totalLiveClasses} batchInfo={course.batchInfo} />
        )}
      </div>
    </section>
  );
}

// ─── SECTION: Stats Cards ─────────────────────────────────────────────────────

function StatsCards({ stats, totalLiveClasses, batchInfo }: {
  stats: LiveCourseTemplate2Data["stats"];
  totalLiveClasses?: string | null;
  batchInfo?: LiveCourseTemplate2Data["batchInfo"];
}) {
  const labels = stats?.labels ?? ["মোট লাইভ ক্লাস", "ইন্ডাস্ট্রি এক্সপার্ট", "কোয়ালিফাইড সাপোর্ট মেন্টর", "অফার শেষের তারিখ"];
  const cards = [
    { icon: "📺", value: stats?.studentsCount ?? totalLiveClasses ?? "240+", label: labels[0], sub: "অনলাইন বাতচি" },
    { icon: "🏆", value: stats?.ratingsCount ?? "১ জন", label: labels[1], sub: "সিজন্ড ট্রেইনার" },
    { icon: "💛", value: stats?.completionRate ?? "১০+ জন", label: labels[2], sub: "অনলাইন সাপোর্ট টিম" },
    { icon: "📅", value: stats?.extra ?? batchInfo?.startDate ?? "শীঘ্রই", label: labels[3], sub: "প্রথম ২৫ জনের জন্য" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">{c.icon}</div>
          <p className="font-extrabold text-gray-900 text-sm leading-tight">{c.value}</p>
          <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{c.label}</p>
          <p className="text-[10px] text-gray-400">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── SECTION: Comparison Table ────────────────────────────────────────────────

function ComparisonSection({ data, course, enrollId }: {
  data: LiveCourseTemplate2Data["comparisonTable"];
  course: LiveCourseTemplate2Data;
  enrollId: string;
}) {
  if (!data?.rows?.length) return null;
  const col1 = data.col1Label ?? "আমাদের অনলাইন কোর্স";
  const col2 = data.col2Label ?? "আগামী লাইভ ডিপ্লোমা";

  const scrollToEnroll = () => {
    document.getElementById(enrollId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-4 font-semibold text-gray-700">ফিচার</th>
                  <th className="text-center px-4 py-4 font-semibold text-gray-500 text-xs">{col1}</th>
                  <th className="text-center px-4 py-4 font-bold text-red-600 text-xs">{col2}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${row.highlight ? "bg-red-50" : ""}`}>
                    <td className={`px-5 py-3.5 font-medium ${row.highlight ? "text-red-700" : "text-gray-700"}`}>
                      {row.feature}
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-500 text-xs">{row.col1 ?? "—"}</td>
                    <td className={`px-4 py-3.5 text-center text-xs font-semibold ${row.highlight ? "text-red-600 bg-red-100 rounded" : "text-red-600"}`}>
                      {row.col2 ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 text-xs text-green-700 font-medium border-t border-gray-100 bg-green-50">
              ✓ কোনো লিমিটেড কন্টেন্ট না — ১০০% অনলাইন লাইভ ডিপ্লো কোর্স
            </div>
          </div>

          {/* Price card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Live Online Batch Open</span>
            </div>
            <div className="mb-4">
              {course.originalPrice && (
                <span className="text-sm line-through text-gray-400 mr-2">৳{fmt(course.originalPrice)}</span>
              )}
              <span className="text-3xl font-extrabold text-gray-900">৳{fmt(course.price)}</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-600">
              {data.rows?.filter(r => r.highlight).slice(0, 4).map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{r.feature}</span>
                </li>
              ))}
            </ul>
            <button onClick={scrollToEnroll}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              অনলাইনে ভর্তি হতে ক্লিক করুন →
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-3">✓ ভর্তির পরে পেমেন্ট করার অপশন আছে</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Curriculum (Phase Timeline) ────────────────────────────────────

function PhaseTimelineSection({ curriculum, lessonIcon, heading }: { curriculum: LiveCourseTemplate2Data["curriculum"]; lessonIcon?: string; heading?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!curriculum?.length) return null;

  return (
    <section id="curriculum" className="py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full border border-orange-200 text-orange-600 text-xs font-semibold">THE MASTERPLAN</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {heading || <>এই কোর্সের মেইন <span className="bg-red-600 text-white px-3 py-0.5 rounded-lg">ফোকাস পয়েন্ট</span></>}
          </h2>
          <p className="text-sm text-gray-500">একনজরে দেখে নিন, বছরজুড়ে ঠিক ঠিক কি কি শিখবেন এবং কিভাবে প্ল্যান আপনাকে এক্সপার্ট বানানোর জন্য ডিজাইন করা।</p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {curriculum.map((phase, i) => (
              <div key={i} className="relative pl-14">
                {/* Circle */}
                <div className={`absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 -translate-x-1/2 ${i === 0 ? "bg-red-600 border-red-600" : "bg-white border-gray-300"}`} />

                <div className={`rounded-xl border transition-all ${open === i ? "border-orange-300 shadow-sm" : "border-gray-100"}`}>
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-0.5">PHASE {String(i + 1).padStart(2, "0")}</p>
                      <p className={`font-bold text-sm ${open === i ? "text-red-600" : "text-gray-800"}`}>{phase.title}</p>
                    </div>
                    <div className="text-gray-400 shrink-0 ml-4">
                      {open === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {open === i && phase.lessons && phase.lessons.length > 0 && (
                    <div className="px-5 pb-4 space-y-2 border-t border-gray-100">
                      {phase.lessons.map((lesson, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm text-gray-600 pt-2">
                          <LessonIcon name={lessonIcon} fallback="chevron-right" className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                          <span>{lesson}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Instructors Grid ────────────────────────────────────────────────

/** Grid column classes capped to the instructor count, so a short list never leaves empty
 *  reserved columns. A single instructor is centered; 2+ start from the left. */
function instructorGridClass(count: number): string {
  if (count === 1) return "grid-cols-1 max-w-[240px] mx-auto";
  if (count === 2) return "grid-cols-2 max-w-xl";
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3";
}

function InstructorsSection({ instructors, heading }: { instructors: LiveCourseTemplate2Data["instructors"]; heading?: string }) {
  if (!instructors?.length) return null;

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full border border-orange-200 text-orange-600 text-xs font-semibold">ELITE SQUAD</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {heading || <>ইন্ডাস্ট্রি <span className="bg-red-600 text-white px-3 py-0.5 rounded-lg">এক্সপার্ট</span> মেন্টর</>}
          </h2>
        </div>

        <div className={`grid gap-5 ${instructorGridClass(instructors.length)}`}>
          {instructors.map((ins, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm text-center">
              {ins.image ? (
                <img src={ins.image} alt={ins.name} className="w-full aspect-square object-cover grayscale" />
              ) : (
                <div className="w-full aspect-square bg-gray-200 flex items-center justify-center text-4xl">👤</div>
              )}
              <div className="p-4">
                {ins.title && (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{ins.title}</p>
                )}
                <p className="font-bold text-gray-900 text-sm">{ins.name}</p>
                {ins.bio && <p className="text-xs text-gray-500 mt-1">{ins.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Why Different (Features Grid) ───────────────────────────────────

function FeaturesSection({ items, heading }: { items: LiveCourseTemplate2Data["whyDifferent"]; heading?: string }) {
  if (!items?.length) return null;

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full border border-orange-200 text-orange-600 text-xs font-semibold">WHY CHOOSE US</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {heading || <>যে ফিচারগুলো এই ডিপ্লোমাকে{" "}
            <span className="text-red-600">বাংলাদেশের সেরা</span> করেছে</>}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <div key={i} className={`rounded-2xl border p-6 text-center space-y-3 ${i === 3 ? "border-orange-300 shadow-md" : "border-gray-100 shadow-sm"}`}>
              <div className="text-3xl">{item.icon ?? "✦"}</div>
              <p className={`font-bold text-sm ${i === 3 ? "text-orange-600" : "text-gray-800"}`}>{item.title}</p>
              {item.description && <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Red CTA Banner ──────────────────────────────────────────────────

function CtaBannerSection({ data, enrollId }: { data: LiveCourseTemplate2Data["ctaBanner"]; enrollId: string }) {
  if (!data?.title && !data?.price) return null;

  const scrollToEnroll = () => {
    document.getElementById(enrollId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-red-600 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white space-y-2">
            {data.label && (
              <span className="inline-block px-3 py-1 rounded-full border border-white/40 text-white text-xs font-semibold">
                {data.label}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-extrabold">{data.title}</h2>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center space-y-3 min-w-[260px]">
            {data.label && (
              <p className="text-xs text-amber-500 font-semibold">⚡ {data.label}</p>
            )}
            <div className="flex items-center justify-center gap-2">
              {data.originalPrice && (
                <span className="text-sm line-through text-gray-400">৳{fmt(data.originalPrice)}</span>
              )}
              <span className="text-3xl font-extrabold text-gray-900">৳{fmt(data.price)}</span>
              <span className="text-xs text-gray-500">/-</span>
            </div>
            <button onClick={scrollToEnroll}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {data.buttonText ?? "সিট বুকিং করুন"} →
            </button>
            {(data.installment1 || data.installment2) && (
              <div className="flex gap-2 text-xs">
                {data.installment1 && (
                  <div className="flex-1 bg-gray-100 rounded-lg px-2 py-1.5 text-gray-600 font-medium">
                    💰 {data.installment1}
                  </div>
                )}
                {data.installment2 && (
                  <div className="flex-1 bg-gray-800 rounded-lg px-2 py-1.5 text-white font-medium">
                    ✨ {data.installment2}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Certificate ─────────────────────────────────────────────────────

function CertificateSection({ data }: { data: LiveCourseTemplate2Data["certificate"] }) {
  if (!data?.title && !data?.image) return null;

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            {data.title && (
              <span className="inline-block px-3 py-1 rounded-full border border-orange-200 text-orange-600 text-xs font-semibold">
                THE TRANSFORMATION
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {data.title}
              {data.highlight && (
                <>
                  {" "}<span className="relative inline-block">
                    <span className="relative z-10 text-white px-2">{data.highlight}</span>
                    <span className="absolute inset-0 bg-red-500 rounded-lg -skew-x-2" />
                  </span>
                </>
              )}
            </h2>
            {data.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{data.description}</p>
            )}
            {data.founderName && (
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-0.5 bg-orange-400" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{data.founderName}</p>
                  {data.founderRole && <p className="text-xs text-gray-500">{data.founderRole}</p>}
                </div>
              </div>
            )}
          </div>
          {data.image && (
            <div className="relative">
              <img src={data.image} alt="Certificate" className="w-full rounded-2xl shadow-lg object-cover" />
              <div className="absolute bottom-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                CERTIFICATE EVENT 2026
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Video Tabs ──────────────────────────────────────────────────────

function VideoTabsSection({ videoTabs, heading }: { videoTabs: LiveCourseTemplate2Data["videoTabs"]; heading?: string }) {
  const [activeTab, setActiveTab] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  if (!videoTabs?.length) return null;

  const allVideos = videoTabs.flatMap(t => t.videos.map(v => ({ ...v, category: t.category })));
  const activeCategory = videoTabs[activeTab]?.category ?? "সব দেখো";
  const displayedVideos = activeTab === 0
    ? allVideos
    : videoTabs[activeTab]?.videos.map(v => ({ ...v, category: activeCategory })) ?? [];

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wide">
            ● LIVE CLASS PREVIEW
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {heading || <>ভিতর আগেই দেখুন <span className="text-red-600">প্রিমিয়াম ক্লাসের</span> ঝলক</>}
          </h2>
          <p className="text-sm text-gray-500">আমাদের কোয়ালিটির নিয়ে কোনো আপোষ নেই৷ নিচের ভিডিওগুলো দেখলেই বুঝবেন কেন আমরা সেরা৷</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {["সব দেখো", ...videoTabs.map(t => t.category)].map((label, i) => (
            <button key={i} onClick={() => { setActiveTab(i); setPlaying(null); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === i
                  ? "bg-red-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:border-red-300"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {displayedVideos.slice(0, 4).map((video, i) => {
            const vid = youtubeId(video.url);
            const thumb = video.thumbnail ?? (vid ? youtubeThumbnail(video.url) : null);
            const isPlaying = playing === video.url;
            return (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="relative aspect-video bg-gray-900">
                  {isPlaying && vid ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${vid}?autoplay=1`}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      {thumb && <img src={thumb} alt={video.title} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <button onClick={() => setPlaying(video.url)}
                          className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-colors">
                          <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {(video.title || video.category) && (
                  <div className="p-3 bg-white">
                    {video.category && (
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-0.5">{video.category}</p>
                    )}
                    {video.title && <p className="text-xs font-semibold text-gray-800">{video.title}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: PC Requirements ─────────────────────────────────────────────────

function PcRequirementsSection({ data, heading }: { data: LiveCourseTemplate2Data["pcRequirements"]; heading?: string }) {
  if (!data?.basic && !data?.pro) return null;

  const Spec = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <div className="flex items-center gap-3">
      <span className="text-xl w-8 text-center shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full border border-red-200 text-red-600 text-xs font-semibold">
            পিসি রিকোয়ারমেন্ট
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {heading || <>আপনার পিসি কি প্রস্তুত <span className="text-red-600">এই জার্নির জন্য?</span></>}
          </h2>
          <p className="text-sm text-gray-500">পিসি কনফিগারেশন নিয়ে চিন্তা করবেন না। নিচের তালিকাটি দেখে আপনার পিসির সাথে মিলিয়ে নিন।</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Basic */}
          {data.basic && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MINIMUM CONFIG</span>
                <h3 className="text-lg font-extrabold text-gray-900 mt-1">বেসিক সেটআপ</h3>
                <p className="text-xs text-gray-400">যারা নতুন শুরু করবেন</p>
              </div>
              <div className="space-y-3">
                {data.basic.ram       && <Spec icon="🖥️" label="MEMORY (RAM)" value={data.basic.ram} />}
                {data.basic.processor && <Spec icon="⚡" label="PROCESSOR"   value={data.basic.processor} />}
                {data.basic.storage   && <Spec icon="💾" label="STORAGE"     value={data.basic.storage} />}
                {data.basic.graphics  && <Spec icon="🎮" label="GRAPHICS"    value={data.basic.graphics} />}
              </div>
              {data.basic.note && (
                <p className="text-xs text-amber-600 font-medium">⚠ {data.basic.note}</p>
              )}
            </div>
          )}

          {/* Pro */}
          {data.pro && (
            <div className="bg-white rounded-2xl border-2 border-red-200 p-6 space-y-4 relative">
              <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">POPULAR</span>
              <div>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">RECOMMENDED BUILD</span>
                <h3 className="text-lg font-extrabold text-gray-900 mt-1">প্রো সেটআপ</h3>
                <p className="text-xs text-gray-400">ভিডিও এডিটিং ও ডিজাইনের জন্য</p>
              </div>
              <div className="space-y-3">
                {data.pro.ram       && <Spec icon="🔥" label="MEMORY (RAM)" value={data.pro.ram} />}
                {data.pro.processor && <Spec icon="⚡" label="PROCESSOR"   value={data.pro.processor} />}
                {data.pro.storage   && <Spec icon="💾" label="STORAGE"     value={data.pro.storage} />}
                {data.pro.graphics  && <Spec icon="🎮" label="GRAPHICS"    value={data.pro.graphics} />}
              </div>
              {data.pro.note && (
                <p className="text-xs text-green-600 font-medium">✓ {data.pro.note}</p>
              )}
            </div>
          )}
        </div>

        {/* Internet */}
        {data.internet && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-blue-700 mb-1">ইন্টারনেট কানেক্টিভিটি</p>
            <p className="text-xs text-blue-600 flex items-start gap-2">
              <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {data.internet}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SECTION: Testimonials Carousel ──────────────────────────────────────────

function TestimonialsCarousel({ testimonials, heading }: { testimonials: LiveCourseTemplate2Data["testimonials"]; heading?: string }) {
  const [idx, setIdx] = useState(0);
  if (!testimonials?.length) return null;

  const prev = () => setIdx((idx - 1 + testimonials.length) % testimonials.length);
  const next = () => setIdx((idx + 1) % testimonials.length);

  // Show 3 at a time (center one highlighted)
  const visible = [-1, 0, 1].map(offset => {
    const i = (idx + offset + testimonials.length) % testimonials.length;
    return { ...testimonials[i]!, offset };
  });

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full border border-orange-200 text-orange-600 text-xs font-semibold">STUDENT FEEDBACK</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {heading || <>আগের ব্যাচের <span className="text-red-600">রিয়েল স্টেরি</span></>}
          </h2>
          <p className="text-sm text-gray-500">শুনো তাদের থেকে যারা আজ সফল। তাদের অভিজ্ঞতায় জানো আমাদের কোয়ালিটি কতটা রিয়েল।</p>
        </div>

        <div className="relative flex items-stretch gap-4">
          {/* Prev */}
          <button onClick={prev} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow border border-gray-100 flex items-center justify-center hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>

          <div className="flex gap-4 w-full overflow-hidden">
            {visible.map(({ offset, ...t }, i) => (
              <div key={i} className={`flex-1 rounded-2xl border p-5 space-y-3 transition-all ${offset === 0 ? "border-orange-300 shadow-md bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}>
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating ?? 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">"{t.review}"</p>
                <div>
                  <p className="text-sm font-bold text-gray-800">{t.name}</p>
                  {t.role  && <p className="text-xs text-gray-400">{t.role}</p>}
                  {t.batch && <p className="text-xs text-orange-500 font-semibold">ব্যাচ: {t.batch}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Next */}
          <button onClick={next} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow border border-gray-100 flex items-center justify-center hover:bg-gray-50">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-orange-500" : "w-2 bg-gray-200"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: FAQ ─────────────────────────────────────────────────────────────

function FaqSection({ faq, heading }: { faq: LiveCourseTemplate2Data["faq"]; heading?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!faq?.length) return null;

  return (
    <section className="py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {heading || <>আমাদের নিয়ে <span className="text-red-600">আপনার জিজ্ঞাসা</span></>}
          </h2>
          <p className="text-sm text-gray-500">অনলিমিটেড কন্টেন্ট ও পাইলোনার, যেকোনো কন্ডিশন পুর করতে নিচের প্রশ্নোত্তরগুলো পড়ুন।</p>
        </div>
        <div className="space-y-3">
          {faq.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-gray-800 pr-4">
                  {i + 1}. {item.question}
                </span>
                <span className={`shrink-0 h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${open === i ? "bg-red-600 border-red-600 text-white" : "border-gray-300 text-gray-400"}`}>
                  {open === i ? <X className="h-3 w-3" /> : <span className="text-sm font-bold">+</span>}
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                  <p className="pt-3">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Urgency CTA ─────────────────────────────────────────────────────

function UrgencyCtaSection({ data, course, enrollId }: {
  data: LiveCourseTemplate2Data["urgencyCta"];
  course: LiveCourseTemplate2Data;
  enrollId: string;
}) {
  if (!data?.title && !data?.buttonText) return null;

  const scrollToEnroll = () => {
    document.getElementById(enrollId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left */}
            <div className="p-8 space-y-4">
              {data.batchLabel && (
                <span className="badge-glow inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                  <LiveDot className="h-1.5 w-1.5" />
                  {data.batchLabel}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                {data.title}
                {data.highlight && (
                  <> <span className="text-red-600">{data.highlight}</span></>
                )}
              </h2>
              {data.subtitle && (
                <p className="text-sm text-gray-500 leading-relaxed">{data.subtitle}</p>
              )}
            </div>

            {/* Right */}
            <div className="bg-gray-50 p-8 flex flex-col gap-3 justify-center">
              <button onClick={scrollToEnroll}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                {data.buttonText ?? "ভর্তি হতে এখানে ক্লিক করুন"} 🚀
              </button>
              {data.whatsapp && (
                <a href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  সরাসরি কথা বলুন: {data.whatsapp}
                </a>
              )}
            </div>
          </div>
          {/* Bottom bar */}
          <div className="h-1.5 bg-gradient-to-r from-orange-400 via-red-500 to-red-600" />
        </div>
      </div>
    </section>
  );
}

// ─── Sticky Bar ───────────────────────────────────────────────────────────────

function StickyBar({ course, enrollId }: { course: LiveCourseTemplate2Data; enrollId: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg py-3 px-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500 font-medium">{course.title}</p>
          <p className="font-extrabold text-gray-900">৳{fmt(course.price)}</p>
        </div>
        <button
          onClick={() => document.getElementById(enrollId)?.scrollIntoView({ behavior: "smooth" })}
          className="cta-premium px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors whitespace-nowrap"
          style={{ "--cta-rgb": "220 38 38" } as CSSProperties}>
          ভর্তি হোন
        </button>
      </div>
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────────────────────

/** Faint red graph-paper grid used as the whole-page background. */
const GRID_BACKGROUND = {
  backgroundImage:
    "linear-gradient(rgba(239,68,68,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.06) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
} as const;

/** Default top-to-bottom section order for Template 2 (Sales). */
export const TEMPLATE2_SECTION_ORDER = [
  "hero", "comparison", "curriculum", "instructors", "why", "ctaBanner",
  "certificate", "videoTabs", "pcReqs", "testimonials", "faq", "urgencyCta", "enrollment",
] as const;

export function LiveCourseTemplate2({ course, baseUrl = "", previewMode = false, user, enrolled = false, checkoutError, logoUrl, logoAlt }: Props) {
  const ENROLL_ID = "enroll-form";

  const hasComparison  = (course.comparisonTable?.rows?.length ?? 0) > 0;
  const hasCurriculum  = (course.curriculum?.length ?? 0) > 0;
  const hasInstructors = (course.instructors?.length ?? 0) > 0;
  const hasWhyDiff     = (course.whyDifferent?.length ?? 0) > 0;
  const hasCtaBanner   = !!(course.ctaBanner?.title || course.ctaBanner?.price);
  const hasCertificate = !!(course.certificate?.title || course.certificate?.image);
  const hasVideoTabs   = (course.videoTabs?.length ?? 0) > 0;
  const hasPcReqs      = !!(course.pcRequirements?.basic || course.pcRequirements?.pro);
  const hasTestimonials = (course.testimonials?.length ?? 0) > 0;
  const hasFaq         = (course.faq?.length ?? 0) > 0;
  const hasUrgencyCta  = !!(course.urgencyCta?.title || course.urgencyCta?.buttonText);

  const h = course.sectionHeadings ?? {};

  const blocks: Record<string, ReactNode> = {
    hero: <HeroSection course={course} enrollId={ENROLL_ID} />,
    comparison: hasComparison ? <ComparisonSection data={course.comparisonTable} course={course} enrollId={ENROLL_ID} /> : null,
    curriculum: hasCurriculum ? <PhaseTimelineSection curriculum={course.curriculum} lessonIcon={course.lessonIcon} heading={h.curriculum} /> : null,
    instructors: hasInstructors ? <InstructorsSection instructors={course.instructors} heading={h.instructors} /> : null,
    why: hasWhyDiff ? <FeaturesSection items={course.whyDifferent} heading={h.why} /> : null,
    ctaBanner: hasCtaBanner ? <CtaBannerSection data={course.ctaBanner} enrollId={ENROLL_ID} /> : null,
    certificate: hasCertificate ? <CertificateSection data={course.certificate} /> : null,
    videoTabs: hasVideoTabs ? <VideoTabsSection videoTabs={course.videoTabs} heading={h.videoTabs} /> : null,
    pcReqs: hasPcReqs ? <PcRequirementsSection data={course.pcRequirements} heading={h.pcReqs} /> : null,
    testimonials: hasTestimonials ? <TestimonialsCarousel testimonials={course.testimonials} heading={h.testimonials} /> : null,
    faq: hasFaq ? <FaqSection faq={course.faq} heading={h.faq} /> : null,
    urgencyCta: hasUrgencyCta ? <UrgencyCtaSection data={course.urgencyCta} course={course} enrollId={ENROLL_ID} /> : null,
    enrollment: <LiveEnrollmentForm course={course} baseUrl={baseUrl} previewMode={previewMode} user={user} enrolled={enrolled} checkoutError={checkoutError} sectionClassName="py-14 bg-red-50" />,
  };

  const order = resolveSectionOrder(course.sectionOrder, TEMPLATE2_SECTION_ORDER);

  return (
    <TemplateStyleScope overrides={course.styleOverrides} className="min-h-screen bg-white font-sans" style={GRID_BACKGROUND}>
      {logoUrl && (
        <LiveCoursePromoBar
          logoUrl={logoUrl}
          logoAlt={logoAlt ?? "Logo"}
          price={course.price}
          originalPrice={course.originalPrice}
          countdownEnd={course.countdownEnd}
          accentColor="#dc2626"
        />
      )}
      {order.map((id) => (blocks[id] ? <Fragment key={id}>{blocks[id]}</Fragment> : null))}
      {!previewMode && <StickyBar course={course} enrollId={ENROLL_ID} />}
    </TemplateStyleScope>
  );
}
