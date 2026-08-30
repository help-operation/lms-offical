"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { ChevronDown, ChevronUp, Check, Play } from "lucide-react";
import { LiveEnrollmentForm, type EnrollmentUser } from "./live-enrollment-form";
import { LiveCoursePromoBar } from "./live-course-promo-bar";
import { TemplateStyleScope, type StyleOverrides } from "./template-style-overrides";
import { resolveSectionOrder } from "./live-course-template";
import { LiveDot } from "./live-dot";

// ─── Data Interface ───────────────────────────────────────────────────────────

export interface LiveCourseTemplate4Data {
  id?: number;
  styleOverrides?: StyleOverrides;
  title: string;
  slug: string;
  price: string;
  originalPrice?: string | null;
  batchId?: number | null;
  countdownEnd?: string | null;
  hero?: {
    badgeText?: string;
    subtitle?: string;
    videoUrl?: string;
    bannerImage?: string;
    ctaText?: string;
    questionText?: string;
    headline?: string;
    headlineHighlight?: string;
    headlineAfter?: string;
    promoText?: string;
    rating?: number;
    ratingCount?: number;
  };
  curriculum?: Array<{ title: string; lessons?: string[] }>;
  whatYouGet?: Array<{ title: string; description?: string; icon?: string }>;
  faq?: Array<{ question: string; answer: string }>;
  t4LiveSessionCard?: {
    batchLabel?: string;
    title?: string;
    description?: string;
    mentorLine1?: string;
    mentorLine2?: string;
    features?: string[];
    ctaText?: string;
  };
  t4StudentProgress?: {
    preText?: string;
    title?: string;
    images?: string[];
  };
  t4ForWhomSection?: {
    title?: string;
    titleHighlight?: string;
    cards?: Array<{ icon?: string; title: string; description?: string }>;
    closingText?: string;
  };
  t4InstructorStory?: {
    title?: string;
    titleHighlight?: string;
    bio?: string;
    videoUrl?: string;
  };
  t4ModuleGrid?: {
    title?: string;
    titleHighlight?: string;
    modules?: Array<{ icon?: string; title: string; bullets?: string[]; fullWidth?: boolean }>;
  };
  t4PricingSection?: {
    bonusLabel?: string;
    bonusText?: string;
    savingsText?: string;
    ctaText?: string;
    paymentBadge1?: string;
    paymentBadge2?: string;
    paymentBadge3?: string;
  };
  t4SupportSection?: {
    title?: string;
    content?: string;
    instructorImage?: string;
  };
  t4CountdownBanner?: {
    text?: string;
    ctaText?: string;
  };

  /** Custom heading text per page section, keyed by section id. */
  sectionHeadings?: Record<string, string>;
  /** Custom render order of page sections, by section id. Empty = template default. */
  sectionOrder?: string[];
  courseType?: 'live' | 'bundle';
  bundledCourses?: Array<{ id: number; title: string; price: string; thumbnail: string | null }>;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const PURPLE = "#7C3AED";

function SectionHeading({ children, highlight }: { children: React.ReactNode; highlight?: string }) {
  if (!children) return null;
  const text = String(children);
  if (!highlight) return <h2 className="text-2xl font-bold text-gray-900 text-center">{text}</h2>;
  const idx = text.indexOf(highlight);
  if (idx === -1) return <h2 className="text-2xl font-bold text-gray-900 text-center">{text}</h2>;
  return (
    <h2 className="text-2xl font-bold text-gray-900 text-center">
      {text.slice(0, idx)}
      <span style={{ background: PURPLE, color: "#fff", padding: "0 6px", borderRadius: 4 }}>{highlight}</span>
      {text.slice(idx + highlight.length)}
    </h2>
  );
}

function getYouTubeEmbed(url: string): string {
  if (!url) return "";
  if (url.includes("embed/")) return url;
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm">{question}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-purple-600" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-4 bg-purple-50 text-gray-700 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

function CountdownTimer({ end }: { end: string }) {
  const calc = () => {
    const diff = Math.max(0, new Date(end).getTime() - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [end]);
  const Box = ({ v, label }: { v: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
        style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)" }}>
        {String(v).padStart(2, "0")}
      </div>
      <span className="text-xs text-white/70 mt-1">{label}</span>
    </div>
  );
  return (
    <div className="flex items-end gap-3">
      <Box v={t.d} label="Days" />
      <span className="text-white text-2xl font-bold mb-5">:</span>
      <Box v={t.h} label="Hours" />
      <span className="text-white text-2xl font-bold mb-5">:</span>
      <Box v={t.m} label="Min" />
      <span className="text-white text-2xl font-bold mb-5">:</span>
      <Box v={t.s} label="Sec" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/** Default top-to-bottom section order for Template 4 (Nexemy). */
export const TEMPLATE4_SECTION_ORDER = [
  "hero", "curriculum", "studentProgress", "forWhom", "instructorStory", "moduleGrid",
  "whatYouGet", "pricing", "support", "countdown", "faq", "enrollment",
] as const;

export function LiveCourseTemplate4({
  course,
  baseUrl = "",
  previewMode = false,
  user,
  enrolled = false,
  checkoutError,
  logoUrl,
  logoAlt,
}: {
  course: LiveCourseTemplate4Data;
  baseUrl?: string;
  previewMode?: boolean;
  user?: EnrollmentUser | null;
  enrolled?: boolean;
  checkoutError?: string | null;
  logoUrl?: string;
  logoAlt?: string;
}) {
  const {
    title, price, originalPrice, countdownEnd,
    hero, curriculum, whatYouGet, faq,
    t4LiveSessionCard, t4StudentProgress, t4ForWhomSection,
    t4InstructorStory, t4ModuleGrid, t4PricingSection,
    t4SupportSection, t4CountdownBanner,
  } = course;

  const heroVideo   = hero?.videoUrl ? getYouTubeEmbed(hero.videoUrl) : "";
  const instrVideo  = t4InstructorStory?.videoUrl ? getYouTubeEmbed(t4InstructorStory.videoUrl) : "";
  const ctaText     = hero?.ctaText ?? "এখনই ভর্তি হন";
  const scrollToCta = previewMode ? undefined : () => document.getElementById("t4-pricing")?.scrollIntoView({ behavior: "smooth" });

  const numPrice = parseFloat(price) || 0;
  const numOrig  = parseFloat(originalPrice ?? "0") || 0;

  const h = course.sectionHeadings ?? {};
  // DOM order preserved (keeps style-override targeting intact); sections are
  // reordered visually via the CSS `order` property.
  const order = resolveSectionOrder(course.sectionOrder, TEMPLATE4_SECTION_ORDER);
  const ord = (id: string) => { const i = order.indexOf(id); return i === -1 ? 999 : i; };

  return (
    <TemplateStyleScope overrides={course.styleOverrides} className="font-sans bg-white text-gray-900 flex flex-col">
      {logoUrl && (
        <LiveCoursePromoBar
          logoUrl={logoUrl}
          logoAlt={logoAlt ?? "Logo"}
          price={price}
          originalPrice={originalPrice}
          countdownEnd={countdownEnd}
          accentColor={PURPLE}
        />
      )}

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ order: ord("hero") }} className="bg-white pt-10 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-10 items-start">

            {/* Left: text */}
            <div className="flex-1 min-w-0">
              {hero?.badgeText && (
                <div className="badge-glow inline-flex items-center gap-2 text-xs font-semibold text-white rounded-full px-3 py-1 mb-3"
                  style={{ background: PURPLE, "--glow-rgb": "124 58 237" } as CSSProperties}>
                  <LiveDot color="bg-white" />
                  {hero.badgeText}
                </div>
              )}
              {hero?.questionText && (
                <p className="text-gray-500 font-medium mb-3 text-sm">{hero.questionText}</p>
              )}
              {(hero?.headline || hero?.headlineHighlight || hero?.headlineAfter) ? (
                <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                  {hero.headline && <span className="text-gray-900 block">{hero.headline}</span>}
                  {hero.headlineHighlight && (
                    <span className="block" style={{ color: PURPLE }}>{hero.headlineHighlight}</span>
                  )}
                  {hero.headlineAfter && <span className="text-gray-900 block">{hero.headlineAfter}</span>}
                </h1>
              ) : (
                <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4"
                  style={{ color: PURPLE }}>{title}</h1>
              )}
              {hero?.subtitle && (
                <p className="text-base font-semibold mb-6"
                  style={{ background: "#FEF08A", display: "inline-block", padding: "2px 8px", borderRadius: 4, color: "#1a1a1a" }}>
                  {hero.subtitle}
                </p>
              )}
              <div className="mt-4 flex flex-nowrap items-center gap-2 sm:gap-3">
                <button onClick={scrollToCta}
                  className="cta-premium shrink-0 whitespace-nowrap text-white font-bold py-2 px-4 text-xs sm:py-2.5 sm:px-6 sm:text-base rounded-xl shadow-lg hover:opacity-90 transition-opacity"
                  style={{ background: PURPLE, "--cta-rgb": "124 58 237" } as CSSProperties}>
                  {ctaText}
                </button>
                <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                  <span className="text-sm sm:text-2xl font-extrabold text-gray-900">৳{numPrice.toLocaleString()}</span>
                  {numOrig > numPrice && (
                    <span className="text-xs sm:text-lg text-red-400 font-medium line-through">৳{numOrig.toLocaleString()}</span>
                  )}
                </div>
              </div>
              {hero?.promoText && (
                <p className="mt-2 flex items-center gap-1 text-sm text-green-600 font-medium">
                  <Check className="h-4 w-4 shrink-0" /> {hero.promoText}
                </p>
              )}
              {hero?.rating && (
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                  <span className="text-yellow-500 font-bold">{hero.rating}⭐</span>
                  {hero.ratingCount && <span>({hero.ratingCount.toLocaleString()} ratings)</span>}
                </div>
              )}
            </div>

            {/* Right: video + session card */}
            <div className="w-full lg:w-[480px] shrink-0 space-y-4">
              {heroVideo ? (
                <div className="relative w-full rounded-2xl overflow-hidden shadow-xl" style={{ paddingTop: "56.25%" }}>
                  <iframe src={heroVideo} className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title="Hero video" />
                </div>
              ) : (
                <div className="w-full rounded-2xl bg-gray-100 flex items-center justify-center"
                  style={{ paddingTop: "56.25%", position: "relative" }}>
                  <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Live Session Card */}
              {t4LiveSessionCard && Object.values(t4LiveSessionCard).some(Boolean) && (
                <div className="rounded-2xl p-5 shadow-lg border" style={{ background: "#faf5ff", borderColor: "#e9d5ff" }}>
                  {t4LiveSessionCard.batchLabel && (
                    <span className="text-xs font-bold uppercase tracking-wider text-white rounded-full px-3 py-1"
                      style={{ background: PURPLE }}>{t4LiveSessionCard.batchLabel}</span>
                  )}
                  {t4LiveSessionCard.title && (
                    <p className="font-bold text-gray-900 mt-2 text-sm">{t4LiveSessionCard.title}</p>
                  )}
                  {t4LiveSessionCard.description && (
                    <p className="text-gray-500 text-xs mt-1">{t4LiveSessionCard.description}</p>
                  )}
                  {t4LiveSessionCard.mentorLine1 && (
                    <p className="text-xs text-gray-700 mt-2 font-semibold">{t4LiveSessionCard.mentorLine1}</p>
                  )}
                  {t4LiveSessionCard.mentorLine2 && (
                    <p className="text-xs text-gray-500">{t4LiveSessionCard.mentorLine2}</p>
                  )}
                  {(t4LiveSessionCard.features ?? []).length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {t4LiveSessionCard.features!.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                          <Check className="h-3.5 w-3.5 shrink-0" style={{ color: PURPLE }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {t4LiveSessionCard.ctaText && (
                    <button onClick={scrollToCta}
                      className="mt-4 w-full text-white font-bold py-2.5 px-4 rounded-xl text-sm"
                      style={{ background: PURPLE }}>
                      {t4LiveSessionCard.ctaText}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CURRICULUM ──────────────────────────────────────────────────────── */}
      {(curriculum ?? []).length > 0 && (
        <section style={{ order: ord("curriculum") }} className="py-14 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest"
                style={{ background: "#FEF08A", padding: "2px 10px", borderRadius: 4, color: "#1a1a1a" }}>
                কোর্স কারিকুলাম
              </span>
              <h2 className="text-2xl font-bold mt-3">{h.curriculum || "আপনি কী কী শিখবেন"}</h2>
            </div>
            <div className="space-y-2">
              {curriculum!.map((mod, i) => (
                <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                  <span className="text-base">{mod.title.match(/^\p{Emoji}/u)?.[0] ?? "📌"}</span>
                  <span className="font-semibold text-sm text-gray-800 uppercase tracking-wide">
                    {mod.title.replace(/^\p{Emoji}\s*/u, "")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3. STUDENT PROGRESS GALLERY ────────────────────────────────────────── */}
      {t4StudentProgress && (t4StudentProgress.title || (t4StudentProgress.images ?? []).length > 0) && (
        <section style={{ order: ord("studentProgress") }} className="py-14 bg-white">
          <div className="max-w-5xl mx-auto px-4 text-center">
            {t4StudentProgress.preText && (
              <p className="text-gray-500 text-sm mb-2">{t4StudentProgress.preText}</p>
            )}
            {t4StudentProgress.title && (
              <h2 className="text-2xl font-bold mb-8">
                <span style={{ color: PURPLE }}>{t4StudentProgress.title}</span>
              </h2>
            )}
            {(t4StudentProgress.images ?? []).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {t4StudentProgress.images!.map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <img src={img} alt={`Student progress ${i + 1}`} className="w-full h-40 object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 4. FOR WHOM ─────────────────────────────────────────────────────────── */}
      {t4ForWhomSection && (t4ForWhomSection.title || (t4ForWhomSection.cards ?? []).length > 0) && (
        <section style={{ order: ord("forWhom") }} className="py-14 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4">
            {t4ForWhomSection.title && (
              <div className="text-center mb-10">
                <SectionHeading highlight={t4ForWhomSection.titleHighlight}>
                  {t4ForWhomSection.title}
                </SectionHeading>
              </div>
            )}
            {(t4ForWhomSection.cards ?? []).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {t4ForWhomSection.cards!.map((card, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
                    {card.icon && <span className="text-3xl">{card.icon}</span>}
                    <p className="font-bold text-gray-900">{card.title}</p>
                    {card.description && <p className="text-xs text-gray-500">{card.description}</p>}
                  </div>
                ))}
              </div>
            )}
            {t4ForWhomSection.closingText && (
              <p className="text-center text-gray-600 text-sm mt-8 max-w-xl mx-auto">
                {t4ForWhomSection.closingText}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── 5. INSTRUCTOR STORY ─────────────────────────────────────────────────── */}
      {t4InstructorStory && (t4InstructorStory.bio || t4InstructorStory.videoUrl) && (
        <section style={{ order: ord("instructorStory") }} className="py-14 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            {t4InstructorStory.title && (
              <div className="text-center mb-8">
                <SectionHeading highlight={t4InstructorStory.titleHighlight}>
                  {t4InstructorStory.title}
                </SectionHeading>
              </div>
            )}
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              {t4InstructorStory.bio && (
                <div className="flex-1 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {t4InstructorStory.bio}
                </div>
              )}
              {instrVideo && (
                <div className="w-full lg:w-96 shrink-0">
                  <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ paddingTop: "56.25%" }}>
                    <iframe src={instrVideo} className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen title="Instructor video" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. MODULE GRID ──────────────────────────────────────────────────────── */}
      {t4ModuleGrid && (t4ModuleGrid.title || (t4ModuleGrid.modules ?? []).length > 0) && (
        <section className="py-14" style={{ order: ord("moduleGrid"), background: "#1e1047" }}>
          <div className="max-w-5xl mx-auto px-4">
            {t4ModuleGrid.title && (
              <div className="text-center mb-10">
                {t4ModuleGrid.titleHighlight ? (
                  <h2 className="text-2xl font-bold text-white">
                    {(() => {
                      const t = t4ModuleGrid.title!;
                      const h = t4ModuleGrid.titleHighlight!;
                      const idx = t.indexOf(h);
                      if (idx === -1) return t;
                      return (
                        <>
                          {t.slice(0, idx)}
                          <span className="text-yellow-400">{h}</span>
                          {t.slice(idx + h.length)}
                        </>
                      );
                    })()}
                  </h2>
                ) : (
                  <h2 className="text-2xl font-bold text-white">{t4ModuleGrid.title}</h2>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(t4ModuleGrid.modules ?? []).map((mod, i) => (
                <div key={i}
                  className={`bg-white rounded-2xl p-5 shadow-sm ${mod.fullWidth ? "sm:col-span-2" : ""}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {mod.icon && <span className="text-2xl">{mod.icon}</span>}
                    <p className="font-bold text-gray-900">{mod.title}</p>
                  </div>
                  {(mod.bullets ?? []).length > 0 && (
                    <ul className="space-y-1.5">
                      {mod.bullets!.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: PURPLE }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. WHAT YOU GET ──────────────────────────────────────────────────────── */}
      {(whatYouGet ?? []).length > 0 && (
        <section style={{ order: ord("whatYouGet") }} className="py-14 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">{h.whatYouGet || "আপনি পাবেন"}</h2>
            <div className="space-y-3">
              {whatYouGet!.map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3.5 shadow-sm border border-gray-100">
                  <span className="text-xl shrink-0">{item.icon ?? "✅"}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
            {/* Exclusive bonus bar */}
            {t4PricingSection?.bonusLabel && (
              <div className="mt-4 rounded-xl text-white text-center font-bold py-3 px-4 text-sm"
                style={{ background: PURPLE }}>
                {t4PricingSection.bonusLabel}{t4PricingSection.bonusText ? ` — ${t4PricingSection.bonusText}` : ""}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 8. PRICING ───────────────────────────────────────────────────────────── */}
      <section id="t4-pricing" style={{ order: ord("pricing") }} className="py-16 bg-white">
        <div className="max-w-lg mx-auto px-4">
          <div className="rounded-2xl border-2 p-8 shadow-xl text-center" style={{ borderColor: PURPLE }}>
            {numOrig > numPrice && (
              <p className="text-gray-400 line-through text-lg mb-1">৳{numOrig.toLocaleString()}</p>
            )}
            <p className="text-5xl font-extrabold" style={{ color: PURPLE }}>
              ৳{numPrice.toLocaleString()}
            </p>
            {t4PricingSection?.savingsText && (
              <div className="mt-2 inline-block text-xs font-bold text-white rounded-full px-4 py-1"
                style={{ background: "#16a34a" }}>
                {t4PricingSection.savingsText}
              </div>
            )}
            <button onClick={scrollToCta}
              className="mt-6 w-full text-white font-bold py-3.5 px-6 rounded-xl text-base shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: PURPLE }}>
              {t4PricingSection?.ctaText ?? ctaText}
            </button>
            {(t4PricingSection?.paymentBadge1 || t4PricingSection?.paymentBadge2 || t4PricingSection?.paymentBadge3) && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[t4PricingSection?.paymentBadge1, t4PricingSection?.paymentBadge2, t4PricingSection?.paymentBadge3]
                  .filter(Boolean).map((badge, i) => (
                    <span key={i} className="text-xs border border-gray-200 rounded-lg px-3 py-1 text-gray-500">
                      {badge}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 9. SUPPORT SECTION ───────────────────────────────────────────────────── */}
      {t4SupportSection && (t4SupportSection.title || t4SupportSection.content) && (
        <section className="py-14" style={{ order: ord("support"), background: "#1e1047" }}>
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-10 items-center">
              <div className="flex-1">
                {t4SupportSection.title && (
                  <h2 className="text-2xl font-bold text-white mb-4">{t4SupportSection.title}</h2>
                )}
                {t4SupportSection.content && (
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                    {t4SupportSection.content}
                  </p>
                )}
              </div>
              {t4SupportSection.instructorImage && (
                <div className="shrink-0">
                  <img src={t4SupportSection.instructorImage} alt="Instructor"
                    className="w-52 h-52 rounded-2xl object-cover shadow-xl border-4 border-white/20" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 10. COUNTDOWN BANNER ─────────────────────────────────────────────────── */}
      {countdownEnd && (t4CountdownBanner?.text || t4CountdownBanner?.ctaText) && (
        <section className="py-12 text-center" style={{ order: ord("countdown"), background: "#0f0728" }}>
          <div className="max-w-3xl mx-auto px-4">
            {t4CountdownBanner?.text && (
              <p className="text-white/80 text-sm mb-6">{t4CountdownBanner.text}</p>
            )}
            <div className="flex justify-center mb-8">
              <CountdownTimer end={countdownEnd} />
            </div>
            {t4CountdownBanner?.ctaText && (
              <button onClick={scrollToCta}
                className="text-white font-bold py-3 px-10 rounded-xl text-base shadow-lg hover:opacity-90 transition-opacity"
                style={{ background: PURPLE }}>
                {t4CountdownBanner.ctaText}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────────────── */}
      {(faq ?? []).length > 0 && (
        <section style={{ order: ord("faq") }} className="py-14 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">{h.faq || "সাধারণ প্রশ্নোত্তর"}</h2>
            <div className="space-y-3">
              {faq!.map((item, i) => (
                <FaqItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ENROLLMENT FORM ──────────────────────────────────────────────────────── */}
      <div style={{ order: ord("enrollment") }}>
        <LiveEnrollmentForm
          course={course}
          baseUrl={baseUrl}
          previewMode={previewMode}
          user={user}
          enrolled={enrolled}
          checkoutError={checkoutError}
          sectionClassName="py-14 bg-gray-50"
        />
      </div>

    </TemplateStyleScope>
  );
}
