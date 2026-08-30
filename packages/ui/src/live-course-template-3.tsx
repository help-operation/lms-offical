"use client";

import { useState, type CSSProperties } from "react";
import {
  ChevronLeft, ChevronRight, Check, Play,
  MessageCircle, Phone, ChevronDown, ChevronUp,
} from "lucide-react";
import { LiveEnrollmentForm, type EnrollmentUser } from "./live-enrollment-form";
import { LiveCoursePromoBar } from "./live-course-promo-bar";
import { TemplateStyleScope, type StyleOverrides } from "./template-style-overrides";
import { resolveSectionOrder } from "./live-course-template";
import { LiveDot } from "./live-dot";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveCourseTemplate3Data {
  id?: number;
  styleOverrides?: StyleOverrides;
  title: string;
  slug?: string;
  price: string;
  originalPrice?: string | null;
  batchId?: number | null;
  countdownEnd?: string | null;

  hero?: {
    badgeText?: string;
    subtitle?: string;
    bannerImage?: string;
    ctaText?: string;
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

  marqueeText?: string | null;
  announcementBar?: { text?: string; ctaText?: string; ctaAnchor?: string };
  blueprintSection?: { title?: string; subtitle?: string; image?: string };
  whyJoinItems?: string[];
  featuresGrid?: {
    title?: string;
    subtitle?: string;
    items?: Array<{ icon?: string; text: string }>;
  };
  bonusChecklist?: { title?: string; items?: string[] };
  challengeSection?: {
    title?: string;
    monthCount?: string;
    description?: string;
    linkText?: string;
  };
  supportLevels?: {
    title?: string;
    subtitle?: string;
    levels?: Array<{ label: string; description: string; color?: string }>;
  };
  salesUpdateSlider?: { title?: string; subtitle?: string; images?: string[] };
  communitySection?: {
    title?: string;
    subtitle?: string;
    caption?: string;
    images?: string[];
  };
  textReviewsSlider?: {
    title?: string;
    reviews?: Array<{ name: string; role?: string; avatar?: string; text: string }>;
  };
  successStories?: {
    title?: string;
    stories?: Array<{ name: string; badge?: string; description?: string; image?: string }>;
  };
  videoGrid?: {
    title?: string;
    videos?: Array<{ url: string; thumbnail?: string }>;
  };
  faq?: Array<{ question: string; answer: string }>;
  faqContactButtons?: { messengerUrl?: string; phone?: string };
  footerBranding?: { brandName?: string; tagline?: string; copyright?: string };

  /** Custom heading text per page section, keyed by section id. */
  sectionHeadings?: Record<string, string>;
  /** Custom render order of page sections, by section id. Empty = template default. */
  sectionOrder?: string[];
  courseType?: 'live' | 'bundle';
  bundledCourses?: Array<{ id: number; title: string; price: string; thumbnail: string | null }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ytThumb(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : "";
}

function SectionHeading({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={`text-center mb-10 ${className ?? ""}`}>
      <h2 className="text-2xl md:text-3xl font-black text-white mb-3">{title}</h2>
      {subtitle && <p className="text-slate-300 text-base max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Marquee ticker
function MarqueeTicker({ text }: { text: string }) {
  const items = text.split("|").map((s) => s.trim()).filter(Boolean);
  if (!items.length) return null;
  const all = [...items, ...items, ...items, ...items];
  return (
    <div className="bg-amber-500 py-2 overflow-hidden">
      <style>{`@keyframes t3marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ animation: "t3marquee 28s linear infinite", display: "flex", width: "max-content" }}>
        {all.map((item, i) => (
          <span key={i} className="text-slate-900 text-sm font-bold mx-8 shrink-0">
            {item} &nbsp;⬥
          </span>
        ))}
      </div>
    </div>
  );
}

// Simple image carousel
function ImageSlider({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="overflow-hidden rounded-2xl border border-slate-700">
        <img
          src={images[idx]}
          alt={`Slide ${idx + 1}`}
          className="w-full object-cover aspect-video bg-slate-800"
        />
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-2 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-2 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="flex justify-center gap-1.5 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all ${i === idx ? "bg-amber-400 w-6" : "bg-slate-600 w-2"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Review card slider
function ReviewSlider({ reviews }: { reviews: NonNullable<LiveCourseTemplate3Data["textReviewsSlider"]>["reviews"] }) {
  const [idx, setIdx] = useState(0);
  if (!reviews?.length) return null;
  const prev = () => setIdx((i) => (i - 1 + reviews.length) % reviews.length);
  const next = () => setIdx((i) => (i + 1) % reviews.length);
  const r = reviews[idx]!;
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 min-h-[180px]">
        <p className="text-slate-200 text-base leading-relaxed mb-5">"{r.text}"</p>
        <div className="flex items-center gap-3">
          {r.avatar
            ? <img src={r.avatar} alt={r.name} className="h-10 w-10 rounded-full object-cover" />
            : <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-sm">{r.name[0]}</div>
          }
          <div>
            <p className="text-white font-semibold text-sm">{r.name}</p>
            {r.role && <p className="text-slate-400 text-xs">{r.role}</p>}
          </div>
        </div>
      </div>
      {reviews.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={prev} className="bg-slate-700 hover:bg-slate-600 text-white rounded-full p-2 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-slate-400 text-sm">{idx + 1} / {reviews.length}</span>
          <button onClick={next} className="bg-slate-700 hover:bg-slate-600 text-white rounded-full p-2 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// FAQ item (collapsible)
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-white font-semibold text-sm leading-snug">{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-slate-300 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/** Default top-to-bottom section order for Template 3 (Membership). */
export const TEMPLATE3_SECTION_ORDER = [
  "marquee", "hero", "stats", "blueprint", "whyJoin", "featuresGrid", "bonusChecklist",
  "challenge", "supportLevels", "salesUpdate", "community", "textReviews",
  "successStories", "videoGrid", "faq", "enrollment", "footer",
] as const;

export function LiveCourseTemplate3({
  course,
  baseUrl = "",
  previewMode,
  user,
  enrolled = false,
  checkoutError,
  logoUrl,
  logoAlt,
}: {
  course: LiveCourseTemplate3Data;
  baseUrl?: string;
  previewMode?: boolean;
  user?: EnrollmentUser | null;
  enrolled?: boolean;
  checkoutError?: string | null;
  logoUrl?: string;
  logoAlt?: string;
}) {
  const ctaHref = previewMode ? "#" : `#pricing`;
  const h = course.sectionHeadings ?? {};
  // DOM order is preserved (so per-element style overrides keep targeting the
  // right nodes); sections are reordered visually via the CSS `order` property.
  const order = resolveSectionOrder(course.sectionOrder, TEMPLATE3_SECTION_ORDER);
  const ord = (id: string) => { const i = order.indexOf(id); return i === -1 ? 999 : i; };

  return (
    <TemplateStyleScope overrides={course.styleOverrides} className="bg-slate-900 min-h-screen font-sans flex flex-col">
      {logoUrl && (
        <LiveCoursePromoBar
          logoUrl={logoUrl}
          logoAlt={logoAlt ?? "Logo"}
          price={course.price}
          originalPrice={course.originalPrice}
          countdownEnd={course.countdownEnd}
          accentColor="#f59e0b"
          accentTextColor="#0f172a"
        />
      )}

      {/* 1. MARQUEE TICKER */}
      {course.marqueeText && <div style={{ order: ord("marquee") }}><MarqueeTicker text={course.marqueeText} /></div>}

      {/* 2. HERO */}
      <section style={{ order: ord("hero") }} className="bg-slate-900 pt-10 pb-16 px-4">
        {/* Announcement Bar */}
        {course.announcementBar?.text && (
          <div className="max-w-5xl mx-auto mb-8">
            <div className="border border-slate-600 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-800/60">
              <p className="text-slate-300 text-sm">{course.announcementBar.text}</p>
              {course.announcementBar.ctaText && (
                <a
                  href={course.announcementBar.ctaAnchor ?? "#"}
                  className="text-amber-400 text-sm font-bold hover:underline shrink-0"
                >
                  {course.announcementBar.ctaText} →
                </a>
              )}
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Text */}
          <div>
            {course.hero?.badgeText && (
              <span
                className="badge-glow inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-5"
                style={{ "--glow-rgb": "251 191 36" } as CSSProperties}
              >
                <LiveDot color="bg-amber-400" />
                {course.hero.badgeText}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              {course.title}
            </h1>
            {course.hero?.subtitle && (
              <p className="text-amber-400 text-lg font-semibold mb-6">
                {course.hero.subtitle}
              </p>
            )}

            <div className="flex flex-nowrap items-center gap-2 sm:gap-3 mb-6">
              <a
                href={ctaHref}
                id="pricing"
                className="cta-premium shrink-0 whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-xl text-center transition-colors shadow-lg shadow-amber-500/20"
                style={{ "--cta-rgb": "245 158 11" } as CSSProperties}
              >
                {course.hero?.ctaText ?? "এখনই যোগ দিন"}
              </a>
              <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                <span className="text-base sm:text-3xl font-black text-white">৳{course.price}</span>
                {course.originalPrice && (
                  <span className="text-xs sm:text-lg text-slate-400 line-through">৳{course.originalPrice}</span>
                )}
              </div>
            </div>
            {course.hero?.promoText && (
              <p className="-mt-4 mb-6 flex items-center gap-1 text-sm text-amber-400 font-medium">
                <Check className="h-4 w-4 shrink-0" /> {course.hero.promoText}
              </p>
            )}

            {course.hero?.studentCountText && (
              <p className="text-slate-400 text-sm">{course.hero.studentCountText}</p>
            )}
          </div>

          {/* Right: Hero Image */}
          {course.hero?.bannerImage && (
            <div className="flex justify-center lg:justify-end">
              <img
                src={course.hero.bannerImage}
                alt={course.title}
                className="max-w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          )}
        </div>
      </section>

      {/* 3. STATS BAR */}
      {course.stats && (
        <section style={{ order: ord("stats") }} className="bg-slate-800 py-8 border-y border-slate-700">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { val: course.stats.studentsCount,  lbl: course.stats.labels?.[0] ?? "শিক্ষার্থী" },
                { val: course.stats.ratingsCount,   lbl: course.stats.labels?.[1] ?? "রেটিং" },
                { val: course.stats.completionRate, lbl: course.stats.labels?.[2] ?? "কমপ্লিশন রেট" },
                { val: course.stats.extra,          lbl: course.stats.labels?.[3] ?? "" },
              ].filter((s) => s.val).map((stat, i) => (
                <div key={i}>
                  <div className="text-3xl font-black text-white mb-1">{stat.val}</div>
                  <div className="text-amber-400 text-sm font-semibold">{stat.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. BLUEPRINT SHOWCASE */}
      {course.blueprintSection && (
        <section style={{ order: ord("blueprint") }} className="bg-slate-900 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            {course.blueprintSection.title && (
              <SectionHeading
                title={course.blueprintSection.title}
                subtitle={course.blueprintSection.subtitle}
              />
            )}
            {course.blueprintSection.image && (
              <div className="mb-8">
                <img
                  src={course.blueprintSection.image}
                  alt="Blueprint"
                  className="mx-auto max-w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
            )}
            <a
              href={ctaHref}
              className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-10 py-4 rounded-xl text-lg transition-colors"
            >
              {course.hero?.ctaText ?? "এখনই এনরোল করুন"}
            </a>
          </div>
        </section>
      )}

      {/* 5. WHY JOIN GRID */}
      {course.whyJoinItems && course.whyJoinItems.length > 0 && (
        <section style={{ order: ord("whyJoin") }} className="bg-slate-800 py-16 px-4 border-y border-slate-700">
          <div className="max-w-4xl mx-auto">
            <SectionHeading title={h.whyJoin || "কেন আমাদের সাথে যোগ দেবেন?"} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {course.whyJoinItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200 text-sm leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. FEATURES GRID (3×3) */}
      {course.featuresGrid?.items && course.featuresGrid.items.length > 0 && (
        <section style={{ order: ord("featuresGrid") }} className="bg-slate-900 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <SectionHeading
              title={course.featuresGrid.title ?? "কোর্সে কী কী পাবেন"}
              subtitle={course.featuresGrid.subtitle}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {course.featuresGrid.items.map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-amber-500/40 transition-colors"
                >
                  {item.icon
                    ? <span className="text-3xl">{item.icon}</span>
                    : <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-amber-400" />
                      </div>
                  }
                  <p className="text-white text-sm font-semibold leading-snug">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. BONUS CHECKLIST */}
      {course.bonusChecklist?.items && course.bonusChecklist.items.length > 0 && (
        <section style={{ order: ord("bonusChecklist") }} className="bg-slate-800 py-16 px-4 border-y border-slate-700">
          <div className="max-w-4xl mx-auto">
            <SectionHeading title={course.bonusChecklist.title ?? "বোনাস কী কী পাবেন"} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {course.bonusChecklist.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-slate-900" />
                  </div>
                  <span className="text-slate-200 text-sm leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. CHALLENGE CARD */}
      {course.challengeSection?.title && (
        <section style={{ order: ord("challenge") }} className="bg-slate-900 py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="border-2 border-amber-500/50 rounded-3xl p-8 relative">
              {course.challengeSection.monthCount && (
                <span className="absolute -top-4 left-8 bg-amber-500 text-slate-900 font-black text-sm px-4 py-1.5 rounded-full">
                  {course.challengeSection.monthCount} মাসের চ্যালেঞ্জ
                </span>
              )}
              <h3 className="text-2xl font-black text-white mb-4 mt-2">
                {course.challengeSection.title}
              </h3>
              {course.challengeSection.description && (
                <p className="text-slate-300 text-base leading-relaxed mb-5">
                  {course.challengeSection.description}
                </p>
              )}
              {course.challengeSection.linkText && (
                <a href={ctaHref} className="text-amber-400 font-bold text-sm hover:underline">
                  {course.challengeSection.linkText}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 9. LEVEL ROADMAP */}
      {course.supportLevels?.levels && course.supportLevels.levels.length > 0 && (
        <section style={{ order: ord("supportLevels") }} className="bg-slate-800 py-16 px-4 border-y border-slate-700">
          <div className="max-w-3xl mx-auto">
            <SectionHeading
              title={course.supportLevels.title ?? "লেভেল রোডম্যাপ"}
              subtitle={course.supportLevels.subtitle}
            />
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-700" />
              <div className="space-y-6 ml-2">
                {course.supportLevels.levels.map((level, i) => (
                  <div key={i} className="flex items-start gap-6 pl-10 relative">
                    {/* Dot */}
                    <div
                      className="absolute left-0 top-1.5 h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-black"
                      style={{ color: level.color ?? "#f59e0b", borderColor: level.color ?? "#f59e0b", backgroundColor: `${level.color ?? "#f59e0b"}20` }}
                    >
                      {i + 1}
                    </div>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex-1 hover:border-amber-500/30 transition-colors">
                      <p className="font-black text-white mb-1" style={{ color: level.color ?? "#f59e0b" }}>
                        {level.label}
                      </p>
                      <p className="text-slate-300 text-sm leading-relaxed">{level.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 10. SALES UPDATE SLIDER */}
      {course.salesUpdateSlider?.images && course.salesUpdateSlider.images.length > 0 && (
        <section style={{ order: ord("salesUpdate") }} className="bg-slate-900 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <SectionHeading
              title={course.salesUpdateSlider.title ?? "সেলস আপডেট"}
              subtitle={course.salesUpdateSlider.subtitle}
            />
            <ImageSlider images={course.salesUpdateSlider.images} />
          </div>
        </section>
      )}

      {/* 11. COMMUNITY SECTION */}
      {course.communitySection?.images && course.communitySection.images.length > 0 && (
        <section style={{ order: ord("community") }} className="bg-slate-800 py-16 px-4 border-y border-slate-700">
          <div className="max-w-4xl mx-auto">
            <SectionHeading
              title={course.communitySection.title ?? "কমিউনিটি"}
              subtitle={course.communitySection.subtitle}
            />
            <ImageSlider images={course.communitySection.images} />
            {course.communitySection.caption && (
              <p className="text-center text-slate-400 text-sm mt-4">{course.communitySection.caption}</p>
            )}
          </div>
        </section>
      )}

      {/* 12. TEXT REVIEWS SLIDER */}
      {course.textReviewsSlider?.reviews && course.textReviewsSlider.reviews.length > 0 && (
        <section style={{ order: ord("textReviews") }} className="bg-slate-900 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <SectionHeading title={course.textReviewsSlider.title ?? "রিভিউ"} />
            <ReviewSlider reviews={course.textReviewsSlider.reviews} />
          </div>
        </section>
      )}

      {/* 13. SUCCESS STORIES */}
      {course.successStories?.stories && course.successStories.stories.length > 0 && (
        <section style={{ order: ord("successStories") }} className="bg-slate-800 py-16 px-4 border-y border-slate-700">
          <div className="max-w-4xl mx-auto">
            <SectionHeading title={course.successStories.title ?? "সাফল্যের গল্প"} />
            <div className="space-y-4">
              {course.successStories.stories.map((story, i) => (
                <div
                  key={i}
                  className="bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-5 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-lg mb-1">{story.name}</p>
                    {story.badge && (
                      <span className="inline-block bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                        {story.badge}
                      </span>
                    )}
                    {story.description && (
                      <p className="text-slate-300 text-sm leading-relaxed">{story.description}</p>
                    )}
                  </div>
                  {story.image && (
                    <img
                      src={story.image}
                      alt={story.name}
                      className="h-24 w-24 rounded-2xl object-cover shrink-0 border border-slate-700"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 14. VIDEO GRID */}
      {course.videoGrid?.videos && course.videoGrid.videos.length > 0 && (
        <section style={{ order: ord("videoGrid") }} className="bg-slate-900 py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <SectionHeading title={course.videoGrid.title ?? "ভিডিও"} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {course.videoGrid.videos.map((vid, i) => {
                const thumb = vid.thumbnail || ytThumb(vid.url);
                return (
                  <a
                    key={i}
                    href={previewMode ? "#" : vid.url}
                    target={previewMode ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="group relative block rounded-2xl overflow-hidden border-2 border-red-600 hover:border-amber-500 transition-colors"
                  >
                    {thumb
                      ? <img src={thumb} alt={`Video ${i + 1}`} className="w-full aspect-video object-cover bg-slate-800" />
                      : <div className="w-full aspect-video bg-slate-800 flex items-center justify-center">
                          <Play className="h-10 w-10 text-slate-600" />
                        </div>
                    }
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
                        <Play className="h-5 w-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 15. FAQ (2-column) + Contact Buttons */}
      {course.faq && course.faq.length > 0 && (
        <section style={{ order: ord("faq") }} className="bg-slate-800 py-16 px-4 border-y border-slate-700">
          <div className="max-w-5xl mx-auto">
            <SectionHeading title={h.faq || "সচরাচর জিজ্ঞাসা"} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {course.faq.map((item, i) => (
                <FaqItem key={i} q={item.question} a={item.answer} />
              ))}
            </div>
            {(course.faqContactButtons?.messengerUrl || course.faqContactButtons?.phone) && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {course.faqContactButtons.messengerUrl && (
                  <a
                    href={previewMode ? "#" : course.faqContactButtons.messengerUrl}
                    target={previewMode ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Message Us
                  </a>
                )}
                {course.faqContactButtons.phone && (
                  <a
                    href={previewMode ? "#" : `tel:${course.faqContactButtons.phone}`}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    Call Us
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 16. ENROLLMENT FORM */}
      <div style={{ order: ord("enrollment") }}>
        <LiveEnrollmentForm
          course={course}
          baseUrl={baseUrl}
          previewMode={previewMode}
          user={user}
          enrolled={enrolled}
          checkoutError={checkoutError}
          sectionClassName="py-14 bg-white"
        />
      </div>

      {/* 17. FOOTER */}
      <footer style={{ order: ord("footer") }} className="bg-slate-900 border-t border-slate-800 py-10 px-4 text-center">
        <p className="text-xl font-black text-white mb-1">
          {course.footerBranding?.brandName ?? course.title}
        </p>
        {course.footerBranding?.tagline && (
          <p className="text-amber-400 text-sm font-semibold mb-4">{course.footerBranding.tagline}</p>
        )}
        <div className="flex justify-center mb-6">
          <a
            href={ctaHref}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-8 py-3 rounded-xl transition-colors"
          >
            {course.hero?.ctaText ?? "এখনই যোগ দিন"}
          </a>
        </div>
        <p className="text-slate-600 text-xs">
          {course.footerBranding?.copyright ?? `© ${new Date().getFullYear()} ${course.footerBranding?.brandName ?? course.title}. All rights reserved.`}
        </p>
      </footer>
    </TemplateStyleScope>
  );
}
