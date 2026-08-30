"use client";

import { useState, useEffect, Fragment, type CSSProperties } from "react";
import type { ReactNode } from "react";
import { Star, ChevronDown, ChevronUp, PlayCircle, ArrowRight, CheckCircle, Calendar, Clock, MessageSquare, Users, PhoneCall, MousePointerClick } from "lucide-react";
import { LiveEnrollmentForm, type EnrollmentUser } from "./live-enrollment-form";
import { LiveCoursePromoBar } from "./live-course-promo-bar";
import { TemplateStyleScope, type StyleOverrides } from "./template-style-overrides";
import { LessonIcon } from "./lesson-icons";
import { LiveDot } from "./live-dot";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveCourseTemplateData {
  id?: number;
  styleOverrides?: StyleOverrides;
  /** Icon shown before each curriculum lesson row. */
  lessonIcon?: string;
  title: string;
  slug?: string;
  price: string;
  originalPrice?: string | null;
  /** Active/upcoming batch id — passed through to the enrollment form for batchId URL param */
  batchId?: number | null;
  totalValue?: string | null;
  totalLiveClasses?: string | null;
  /** Optional override for the curriculum module count. Blank = auto-count from curriculum. */
  totalModules?: string | null;
  countdownEnd?: string | null;
  hero?: {
    badgeText?: string;
    subtitle?: string;
    bannerImage?: string;
    rating?: number;
    ratingCount?: number;
    ctaText?: string;
    promoText?: string;
    studentCountText?: string;
  };
  paymentLogos?: Array<{ name: string; image?: string }>;
  batchInfo?: {
    startDate?: string;
    liveSchedule?: string;
    supportSchedule?: string;
    seatsLeft?: string;
  };
  curriculum?: Array<{ title: string; lessons?: string[] }>;
  tools?: Array<{ name: string; icon?: string; bgColor?: string }>;
  whyDifferent?: Array<{ title: string; description?: string; icon?: string }>;
  stats?: {
    studentsCount?: string;
    ratingsCount?: string;
    completionRate?: string;
    extra?: string;
    labels?: [string, string, string, string];
  };
  instructors?: Array<{
    name: string; title?: string; image?: string; bio?: string;
    students?: string; courses?: string; rating?: string;
    years?: string; clients?: string; projects?: string; profileUrl?: string;
  }>;
  whatYouGet?: Array<{ title: string; description?: string; icon?: string }>;
  videos?: Array<{ url: string; title?: string; description?: string }>;
  testimonials?: Array<{ name: string; role?: string; review: string }>;
  valueItems?: Array<{ title: string; description?: string; value: string }>;
  /** Editable copy for the Value Breakdown section. */
  valueSection?: {
    heading?: string;
    /** use {value} where the total amount goes */
    totalLabel?: string;
    /** use {price} where the discounted price goes */
    offerLine?: string;
    ctaText?: string;
  };
  /** Custom heading text per page section, keyed by section id. Falls back to the template default. */
  sectionHeadings?: Record<string, string>;
  /** Custom render order of page sections, by section id. Empty/missing = template default order. */
  sectionOrder?: string[];
  /** Sticky bar / floating call-to-action configuration. */
  urgencyCta?: {
    whatsapp?: string;
    title?: string;
    subtitle?: string;
  };
  /** Whether this is a live course or a recorded-course bundle. */
  courseType?: 'live' | 'bundle';
  /** Recorded courses included in this bundle. */
  bundledCourses?: Array<{ id: number; title: string; price: string; thumbnail: string | null }>;
}

interface Props {
  course: LiveCourseTemplateData;
  baseUrl?: string;
  previewMode?: boolean;
  user?: EnrollmentUser | null;
  enrolled?: boolean;
  checkoutError?: string | null;
  logoUrl?: string;
  logoAlt?: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmt(p: string | null | undefined) {
  if (!p) return null;
  return Number(p).toLocaleString("en-BD");
}

function getYtId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([^?&]+)/);
  return m?.[1] ?? null;
}

const WHY_COLORS = [
  "bg-pink-50 border-pink-100",
  "bg-green-50 border-green-100",
  "bg-blue-50 border-blue-100",
  "bg-yellow-50 border-yellow-100",
  "bg-purple-50 border-purple-100",
  "bg-orange-50 border-orange-100",
];

const STAT_COLORS = [
  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800"  },
  { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-800"   },
  { bg: "bg-pink-50",   border: "border-pink-200",   text: "text-pink-800"   },
  { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800" },
];

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ end }: { end: string }) {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    function tick() {
      const diff = Math.max(0, new Date(end).getTime() - Date.now());
      const s = Math.floor(diff / 1000);
      setT({ h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);

  const Box = ({ v, lbl }: { v: number; lbl: string }) => (
    <div className="flex flex-col items-center border-2 border-dashed border-orange-400 rounded-lg px-4 py-2 min-w-[56px]">
      <span className="text-2xl font-bold text-gray-800 tabular-nums">{String(v).padStart(2, "0")}</span>
      <span className="text-[10px] text-gray-500 mt-0.5">{lbl}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <Box v={t.h} lbl="ঘন্টা" />
      <span className="text-xl font-bold text-gray-400">:</span>
      <Box v={t.m} lbl="মিনিট" />
      <span className="text-xl font-bold text-gray-400">:</span>
      <Box v={t.s} lbl="সেকেন্ড" />
    </div>
  );
}

// ─── Curriculum Accordion ─────────────────────────────────────────────────────

function ModuleItem({ title, lessons, lessonIcon }: { title: string; lessons?: string[]; lessonIcon?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 text-left gap-4"
      >
        <span className="font-medium text-gray-800 text-sm">{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          {lessons && <span className="text-xs text-gray-400">{lessons.length} lessons</span>}
          {open
            ? <ChevronUp className="h-4 w-4 text-gray-400" />
            : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>
      {open && lessons && lessons.length > 0 && (
        <ul className="border-t border-gray-100 bg-gray-50 px-5 py-3 space-y-2">
          {lessons.map((l, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <LessonIcon name={lessonIcon} fallback="play-circle" className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              {l}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Sticky Bar ───────────────────────────────────────────────────────────────

function StickyBar({ course, enrollHref }: { course: LiveCourseTemplateData; enrollHref: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  if (!show) return null;

  const phone     = course.urgencyCta?.whatsapp ?? "";
  const callLabel = course.urgencyCta?.title    ?? "কল করুন";
  const tagline   = course.urgencyCta?.subtitle ?? "সিট সংখ্যা শেষ হওয়ার আগে";
  const tel = phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;

  return (
    <>
      {/* Floating call button — only shown when a phone is configured */}
      {tel && (
        <a
          href={tel}
          aria-label={`${callLabel} ${phone}`}
          className="fixed bottom-28 right-4 z-50 sm:bottom-20"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-green-500/40" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/40 ring-4 ring-green-500/15 transition-transform hover:scale-105">
            <PhoneCall className="h-6 w-6" />
          </span>
        </a>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2.5 px-4 py-3 sm:flex-row sm:justify-between sm:gap-4">
          {(phone || tagline) && (
            <div className="text-center sm:text-left">
              {phone && (
                <p className="text-sm font-bold text-gray-800">
                  📞 {callLabel} : <span className="text-gray-900">{phone}</span>
                </p>
              )}
              {tagline && <p className="text-xs font-medium text-gray-500">{tagline}</p>}
            </div>
          )}

          <a
            href={enrollHref}
            className="cta-premium flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition-colors hover:bg-red-700 sm:w-auto sm:min-w-[260px]"
            style={{ "--cta-rgb": "220 38 38" } as CSSProperties}
          >
            <span>{course.hero?.ctaText ?? "এনরোল করুন"}</span>
            <MousePointerClick className="h-4 w-4 shrink-0" />
          </a>
        </div>
      </div>
    </>
  );
}

// ─── SECTION: Hero ────────────────────────────────────────────────────────────

function HeroSection({ course, enrollHref }: { course: LiveCourseTemplateData; enrollHref: string }) {
  const price    = fmt(course.price);
  const origPrice = fmt(course.originalPrice);
  const discount = course.price && course.originalPrice
    ? Math.round((1 - Number(course.price) / Number(course.originalPrice)) * 100)
    : null;

  return (
    <section className="bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* Left */}
          <div className="space-y-5">
            {/* Badge */}
            {course.hero?.badgeText && (
              <span
                className="badge-glow inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full"
                style={{ "--glow-rgb": "107 114 128" } as CSSProperties}
              >
                <LiveDot />
                {course.hero.badgeText}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-snug">
              {course.title || "Course Title"}
            </h1>

            {/* Rating */}
            {course.hero?.rating && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">{course.hero.rating}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(course.hero!.rating!) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                {course.hero.ratingCount && (
                  <span className="text-sm text-gray-500">({course.hero.ratingCount.toLocaleString()} Ratings)</span>
                )}
              </div>
            )}

            {/* Subtitle */}
            {course.hero?.subtitle && (
              <p className="text-gray-600 leading-relaxed">{course.hero.subtitle}</p>
            )}

            {/* CTA + Price row */}
            <div className="flex flex-nowrap items-center gap-2 sm:gap-3">
              <a href={enrollHref}
                className="cta-premium inline-flex shrink-0 items-center gap-1 whitespace-nowrap bg-gray-900 hover:bg-gray-700 text-white font-semibold px-3 py-2 text-xs sm:gap-1.5 sm:px-5 sm:py-2.5 sm:text-sm rounded-lg transition-colors"
                style={{ "--cta-rgb": "17 24 39" } as CSSProperties}>
                {course.hero?.ctaText ?? "Enroll Now"} <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </a>
              <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-2xl font-extrabold text-gray-900">৳{price}</span>
                {origPrice && (
                  <span className="text-xs sm:text-lg text-red-400 font-medium line-through">৳{origPrice}</span>
                )}
              </div>
            </div>
            {course.hero?.promoText && (
              <p className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4 shrink-0" /> {course.hero.promoText}
              </p>
            )}

            {/* Divider + logos */}
            {(course.hero?.studentCountText || (course.paymentLogos && course.paymentLogos.length > 0)) && (
              <div className="pt-2 border-t border-gray-100 space-y-3">
                {course.hero?.studentCountText && (
                  <p className="text-sm text-gray-500">{course.hero.studentCountText}</p>
                )}
                {course.paymentLogos && course.paymentLogos.length > 0 && (
                  <div className="flex items-center gap-4 flex-wrap">
                    {course.paymentLogos.map((logo, i) =>
                      logo.image ? (
                        <img key={i} src={logo.image} alt={logo.name}
                          className="h-8 w-auto object-contain" />
                      ) : (
                        <span key={i} className="text-xs font-semibold text-gray-600 border border-gray-200 px-2 py-1 rounded">
                          {logo.name}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — banner image */}
          {course.hero?.bannerImage ? (
            <div className="rounded-2xl overflow-hidden shadow-lg aspect-video bg-gray-100">
              <img src={course.hero.bannerImage} alt={course.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 aspect-video flex items-center justify-center">
              <span className="text-white/30 text-lg font-medium">Banner Image</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Batch Info Cards ────────────────────────────────────────────────

function BatchInfoSection({ batchInfo }: { batchInfo: NonNullable<LiveCourseTemplateData["batchInfo"]> }) {
  const cards = [
    { icon: <Calendar className="h-5 w-5 text-indigo-500" />, label: "বাচে শুরু",    value: batchInfo.startDate },
    { icon: <Clock    className="h-5 w-5 text-green-500"  />, label: "লাইভ ক্লাস",  value: batchInfo.liveSchedule },
    { icon: <MessageSquare className="h-5 w-5 text-orange-500" />, label: "সাপোর্ট ক্লাস", value: batchInfo.supportSchedule },
    { icon: <Users    className="h-5 w-5 text-red-500"    />, label: "সিট বাকি",    value: batchInfo.seatsLeft },
  ].filter((c) => c.value);

  if (cards.length === 0) return null;

  return (
    <section className="bg-gray-50 border-y border-gray-100 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className="shrink-0 mt-0.5">{card.icon}</div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Curriculum ──────────────────────────────────────────────────────

function CurriculumSection({ curriculum, totalLiveClasses, totalModules, lessonIcon, heading }: {
  curriculum: NonNullable<LiveCourseTemplateData["curriculum"]>;
  totalLiveClasses?: string | null;
  totalModules?: string | null;
  lessonIcon?: string;
  heading?: string;
}) {
  return (
    <section className="py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{heading || "কোর্স কারিকুলাম"}</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              🎁 <strong>{totalModules || curriculum.length}</strong> মডিউল
            </span>
            {totalLiveClasses && (
              <span className="flex items-center gap-1">
                <LiveDot />
                <strong>{totalLiveClasses}</strong> লাইভ ক্লাস
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {curriculum.map((mod, i) => (
            <ModuleItem key={i} title={mod.title} lessons={mod.lessons} lessonIcon={lessonIcon} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Tools ───────────────────────────────────────────────────────────

const DEFAULT_TOOL_COLORS = ["#1a6b3c", "#8b2e2e", "#c97f10", "#1a3a6b", "#4a1a6b", "#1a4a4a"];

function ToolsSection({ tools, heading }: { tools: NonNullable<LiveCourseTemplateData["tools"]>; heading?: string }) {
  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">
          {heading || "যেসব টুলস ও টেকনোলাজি শিখবেন"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools.map((tool, i) => {
            const bg = tool.bgColor || DEFAULT_TOOL_COLORS[i % DEFAULT_TOOL_COLORS.length];
            const isImage = tool.icon && (tool.icon.startsWith("http") || tool.icon.startsWith("/"));
            return (
              <div
                key={i}
                style={{ backgroundColor: bg }}
                className="rounded-2xl flex flex-col items-center justify-center gap-0 shadow-sm overflow-hidden h-28"
              >
                {/* Icon area — fills most of the card */}
                <div className="flex-1 flex items-center justify-center w-full px-3 pt-2">
                  {tool.icon ? (
                    isImage ? (
                      <div className="bg-white/20 rounded-xl p-2 flex items-center justify-center">
                        <img
                          src={tool.icon}
                          alt={tool.name}
                          className="w-10 h-10 object-contain drop-shadow-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-4xl leading-none drop-shadow-sm">{tool.icon}</span>
                    )
                  ) : null}
                </div>
                {/* Name bar at bottom */}
                <div className="w-full bg-black/20 py-2.5 px-2 text-center">
                  <span className="font-bold text-white text-sm leading-tight">{tool.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Why Different ───────────────────────────────────────────────────

function WhyDifferentSection({ items, heading }: { items: NonNullable<LiveCourseTemplateData["whyDifferent"]>; heading?: string }) {
  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">
          {heading || "Why This Course is Different?"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <div key={i} className={`flex items-start gap-4 border rounded-xl p-5 ${WHY_COLORS[i % WHY_COLORS.length]}`}>
              {item.icon && (
                item.icon.startsWith("http")
                  ? <img src={item.icon} alt={item.title} className="w-12 h-12 object-contain shrink-0" />
                  : <span className="text-3xl shrink-0">{item.icon}</span>
              )}
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Stats ───────────────────────────────────────────────────────────

function StatsSection({ stats }: { stats: NonNullable<LiveCourseTemplateData["stats"]> }) {
  const boxes = [
    { value: stats.studentsCount,  label: stats.labels?.[0] ?? "Students"        },
    { value: stats.ratingsCount,   label: stats.labels?.[1] ?? "Ratings"         },
    { value: stats.completionRate, label: stats.labels?.[2] ?? "Completion Rate" },
    { value: stats.extra,          label: stats.labels?.[3] ?? "Support"         },
  ].filter((b) => b.value);

  if (boxes.length === 0) return null;

  return (
    <section className="py-10 bg-white border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {boxes.map((box, i) => {
            const c = STAT_COLORS[i % STAT_COLORS.length]!;
            return (
              <div key={i} className={`rounded-2xl border p-6 text-center ${c.bg} ${c.border}`}>
                <p className={`text-3xl font-extrabold ${c.text}`}>{box.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{box.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Instructors ─────────────────────────────────────────────────────

function InstructorsSection({ instructors, heading }: { instructors: NonNullable<LiveCourseTemplateData["instructors"]>; heading?: string }) {
  return (
    <section className="py-14 bg-emerald-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">
          {heading || "Our Professional Instructors"}
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {instructors.map((inst, i) => (
            <div key={i} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Photo */}
              <div className="aspect-square overflow-hidden bg-gray-100">
                {inst.image
                  ? <img src={inst.image} alt={inst.name} className="w-full h-full object-cover object-top" />
                  : <div className="w-full h-full flex items-center justify-center bg-emerald-100">
                      <span className="text-5xl font-bold text-emerald-400">{inst.name.charAt(0)}</span>
                    </div>
                }
              </div>
              {/* Info */}
              <div className="p-5 space-y-3">
                <div className="text-center">
                  <h3 className="font-bold text-gray-900">{inst.name}</h3>
                  {inst.title && <p className="text-sm text-red-500 font-medium mt-0.5">{inst.title}</p>}
                </div>
                {/* Stats row */}
                {(inst.years || inst.clients || inst.projects) && (
                  <div className="flex justify-center gap-6 py-2 border-t border-gray-100">
                    {[
                      { val: inst.years,    lbl: "Years"    },
                      { val: inst.clients,  lbl: "Clients"  },
                      { val: inst.projects, lbl: "Projects" },
                    ].filter((s) => s.val).map((s, j) => (
                      <div key={j} className="text-center">
                        <p className="text-base font-extrabold text-red-500">{s.val}</p>
                        <p className="text-[10px] text-gray-400">{s.lbl}</p>
                      </div>
                    ))}
                  </div>
                )}
                <a
                  href={inst.profileUrl ?? "#"}
                  className="block w-full bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold py-2.5 rounded-lg text-center tracking-widest transition-colors"
                >
                  VIEW PROFILE
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: What You Get ────────────────────────────────────────────────────

function WhatYouGetSection({ items, heading }: { items: NonNullable<LiveCourseTemplateData["whatYouGet"]>; heading?: string }) {
  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {heading || "কি কি পাচ্ছেন এই কোর্সে"}
          </h2>
          <p className="text-sm text-gray-400">দেখে নিন কি কি পাচ্ছেন কোর্সে জয়েন করলে</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              {item.icon && (
                item.icon.startsWith("http")
                  ? <img src={item.icon} alt={item.title} className="w-12 h-12 object-contain shrink-0" />
                  : <span className="text-3xl shrink-0">{item.icon}</span>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: Videos + Testimonials ──────────────────────────────────────────

function VideosSection({ videos, testimonials, sectionTitle }: {
  videos: NonNullable<LiveCourseTemplateData["videos"]>;
  testimonials?: LiveCourseTemplateData["testimonials"];
  sectionTitle?: string;
}) {
  const [vidPage, setVidPage] = useState(0);
  const [testPage, setTestPage] = useState(0);
  const VID_PER_PAGE  = 3;
  const TEST_PER_PAGE = 3;

  const vidPages  = Math.ceil(videos.length / VID_PER_PAGE);
  const testPages = testimonials ? Math.ceil(testimonials.length / TEST_PER_PAGE) : 0;

  const visibleVids = videos.slice(vidPage * VID_PER_PAGE, vidPage * VID_PER_PAGE + VID_PER_PAGE);
  const visibleTests = testimonials
    ? testimonials.slice(testPage * TEST_PER_PAGE, testPage * TEST_PER_PAGE + TEST_PER_PAGE)
    : [];

  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {sectionTitle && (
          <p className="text-center text-sm text-gray-500 font-medium">{sectionTitle}</p>
        )}

        {/* Videos */}
        <div className="flex flex-wrap justify-center gap-4">
          {visibleVids.map((vid, i) => {
            const ytId = getYtId(vid.url);
            return (
              <div key={i} className="w-full sm:w-[calc(33.333%-0.667rem)] space-y-2">
                {ytId ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title={vid.title ?? `Video ${i + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                ) : (
                  <a href={vid.url} target="_blank" rel="noreferrer"
                    className="flex aspect-video rounded-xl bg-gray-200 items-center justify-center hover:bg-gray-300 transition-colors">
                    <PlayCircle className="h-10 w-10 text-gray-400" />
                  </a>
                )}
                {vid.title && <p className="text-xs text-gray-500 text-center">{vid.title}</p>}
              </div>
            );
          })}
        </div>

        {/* Video pagination dots */}
        {vidPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: vidPages }).map((_, i) => (
              <button key={i} onClick={() => setVidPage(i)}
                className={`h-2 rounded-full transition-all ${i === vidPage ? "w-6 bg-indigo-500" : "w-2 bg-gray-300"}`} />
            ))}
          </div>
        )}

        {/* Text testimonials */}
        {visibleTests.length > 0 && (
          <>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {visibleTests.map((t, i) => (
                <div key={i} className="w-full sm:w-[calc(33.333%-0.667rem)] bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">– {t.name}</p>
                    {t.role && <p className="text-xs text-gray-400">{t.role}</p>}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{t.review}</p>
                </div>
              ))}
            </div>
            {testPages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: testPages }).map((_, i) => (
                  <button key={i} onClick={() => setTestPage(i)}
                    className={`h-2 rounded-full transition-all ${i === testPage ? "w-6 bg-indigo-500" : "w-2 bg-gray-300"}`} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─── SECTION: Value Breakdown ─────────────────────────────────────────────────

const DEFAULT_VALUE_HEADING = "চলুন দেখি এই টাকায় আপনি কি পরিমাণ ভ্যালু পাচ্ছেন";
const DEFAULT_VALUE_TOTAL   = "টোটাল {value} টাকার বেশি ভ্যালু পাচ্ছেন!";
const DEFAULT_VALUE_OFFER   = "বিশেষ ছাড়ে পাচ্ছেন ৳{price} টাকায়! এই অফার চলবে:";
const DEFAULT_VALUE_CTA     = "এখনই এনরোল করুন";

/** Renders `text` replacing every `token` with `node` (keeps surrounding copy editable). */
function renderWithToken(text: string, token: string, node: ReactNode): ReactNode {
  const parts = text.split(token);
  return parts.map((p, i) => (
    <Fragment key={i}>{p}{i < parts.length - 1 ? node : null}</Fragment>
  ));
}

function ValueBreakdownSection({ course, enrollHref }: {
  course: LiveCourseTemplateData;
  enrollHref: string;
}) {
  const price    = fmt(course.price);
  const vs = course.valueSection;

  return (
    <section className="py-14 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">
          {vs?.heading || DEFAULT_VALUE_HEADING}
        </h2>

        {course.valueItems && course.valueItems.length > 0 && (
          <div className="space-y-3">
            {course.valueItems.map((item, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="text-sm text-gray-700 font-medium shrink-0">
                  {i + 1}. {item.title}
                </span>
                <span className="flex-1 border-b border-dotted border-gray-300 mx-2" />
                <span className="text-sm font-bold text-red-500 shrink-0">৳{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {course.totalValue && (
          <div className="text-center space-y-1 py-3 border-t border-gray-200">
            <p className="text-lg font-extrabold text-gray-900">
              {renderWithToken(vs?.totalLabel || DEFAULT_VALUE_TOTAL, "{value}",
                <span className="text-red-500">৳{fmt(course.totalValue)}</span>)}
            </p>
          </div>
        )}

        {/* Countdown + CTA box */}
        {(course.countdownEnd || course.price) && (
          <div className="border-2 border-dashed border-orange-300 rounded-2xl p-6 space-y-4 text-center bg-orange-50">
            {course.countdownEnd && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">
                  {renderWithToken(vs?.offerLine || DEFAULT_VALUE_OFFER, "{price}", <>{price}</>)}
                </p>
                <div className="flex justify-center">
                  <Countdown end={course.countdownEnd} />
                </div>
              </div>
            )}
            <a href={enrollHref}
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors">
              {vs?.ctaText || DEFAULT_VALUE_CTA}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Section ordering ─────────────────────────────────────────────────────────

/** Default top-to-bottom section order for Template 1 (Mastery). */
export const TEMPLATE1_SECTION_ORDER = [
  "hero", "batch", "curriculum", "tools", "why", "stats",
  "instructors", "whatYouGet", "videos", "value", "enrollment",
] as const;

/**
 * Resolve the render order: honour the saved order (ignoring unknown/duplicate
 * ids), then append any default sections missing from it (e.g. sections added
 * after the course was last saved). Empty/missing saved order = default.
 */
export function resolveSectionOrder(saved: string[] | undefined, fallback: readonly string[]): string[] {
  if (!saved || saved.length === 0) return [...fallback];
  const known = new Set(fallback);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of saved) {
    if (known.has(id) && !seen.has(id)) { result.push(id); seen.add(id); }
  }
  for (const id of fallback) if (!seen.has(id)) result.push(id);
  return result;
}

// ─── Main Template ────────────────────────────────────────────────────────────

export function LiveCourseTemplate({ course, baseUrl = "", previewMode = false, user, enrolled = false, checkoutError, logoUrl, logoAlt }: Props) {
  const enrollHref = "#enroll";

  const hasVideos       = course.videos && course.videos.length > 0;
  const hasCurriculum   = course.curriculum && course.curriculum.length > 0;
  const hasTools        = course.tools && course.tools.length > 0;
  const hasWhyDiff      = course.whyDifferent && course.whyDifferent.length > 0;
  const hasStats        = course.stats && Object.values(course.stats).some(Boolean);
  const hasInstructors  = course.instructors && course.instructors.length > 0;
  const hasWhatYouGet   = course.whatYouGet && course.whatYouGet.length > 0;
  const hasValueItems   = course.valueItems && course.valueItems.length > 0;
  const hasBatchInfo    = course.batchInfo && Object.values(course.batchInfo).some(Boolean);

  const h = course.sectionHeadings ?? {};

  // Each section keyed by id; null when the section has no data to show.
  const blocks: Record<string, ReactNode> = {
    hero: <HeroSection course={course} enrollHref={enrollHref} />,
    batch: hasBatchInfo ? <BatchInfoSection batchInfo={course.batchInfo!} /> : null,
    curriculum: hasCurriculum
      ? <CurriculumSection curriculum={course.curriculum!} totalLiveClasses={course.totalLiveClasses} totalModules={course.totalModules} lessonIcon={course.lessonIcon} heading={h.curriculum} />
      : null,
    tools: hasTools ? <ToolsSection tools={course.tools!} heading={h.tools} /> : null,
    why: hasWhyDiff ? <WhyDifferentSection items={course.whyDifferent!} heading={h.why} /> : null,
    stats: hasStats ? <StatsSection stats={course.stats!} /> : null,
    instructors: hasInstructors ? <InstructorsSection instructors={course.instructors!} heading={h.instructors} /> : null,
    whatYouGet: hasWhatYouGet ? <WhatYouGetSection items={course.whatYouGet!} heading={h.whatYouGet} /> : null,
    videos: hasVideos
      ? <VideosSection
          videos={course.videos!}
          testimonials={course.testimonials}
          sectionTitle={h.videos || "যারা আমাদের উপর আস্থা রেখেছেন – তাদের কিছু কথা"}
        />
      : null,
    value: (hasValueItems || course.countdownEnd)
      ? <ValueBreakdownSection course={course} enrollHref={enrollHref} />
      : null,
    enrollment: <LiveEnrollmentForm course={course} baseUrl={baseUrl} previewMode={previewMode} user={user} enrolled={enrolled} checkoutError={checkoutError} sectionClassName="py-14 bg-emerald-50" />,
  };

  const order = resolveSectionOrder(course.sectionOrder, TEMPLATE1_SECTION_ORDER);

  return (
    <TemplateStyleScope overrides={course.styleOverrides} className="min-h-screen bg-white font-sans">
      {logoUrl && (
        <LiveCoursePromoBar
          logoUrl={logoUrl}
          logoAlt={logoAlt ?? "Logo"}
          price={course.price}
          originalPrice={course.originalPrice}
          countdownEnd={course.countdownEnd}
          accentColor="#a64dff"
        />
      )}
      {order.map((id) => (blocks[id] ? <Fragment key={id}>{blocks[id]}</Fragment> : null))}

      {/* Sticky bar — floating, always last regardless of section order */}
      {!previewMode && <StickyBar course={course} enrollHref={enrollHref} />}
    </TemplateStyleScope>
  );
}
