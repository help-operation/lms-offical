"use client";

import { useState, useEffect, type CSSProperties } from "react";
import {
  ChevronDown, ChevronUp, Check, Play, Phone, Clock,
  CalendarDays, Star, Users, FileText, Video, Award,
} from "lucide-react";
import { LiveEnrollmentForm, type EnrollmentUser } from "./live-enrollment-form";
import { LiveCoursePromoBar } from "./live-course-promo-bar";
import { TemplateStyleScope, type StyleOverrides } from "./template-style-overrides";
import { resolveSectionOrder } from "./live-course-template";
import { LiveDot } from "./live-dot";

// ─── Data Interface ───────────────────────────────────────────────────────────

export interface LiveCourseTemplate5Data {
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
    promoText?: string;
    rating?: number;
    ratingCount?: number;
    studentCountText?: string;
  };
  batchInfo?: {
    startDate?: string;
    liveSchedule?: string;
    supportSchedule?: string;
    seatsLeft?: string;
    batchName?: string;
  };
  tools?: Array<{ name: string; icon?: string }>;
  instructors?: Array<{
    name: string; title?: string; image?: string; bio?: string; profileUrl?: string;
  }>;
  whatYouGet?: Array<{ title: string; description?: string; icon?: string }>;
  curriculum?: Array<{ title: string; lessons?: string[] }>;
  videos?: Array<{ url: string; title?: string }>;
  faq?: Array<{ question: string; answer: string }>;
  certificate?: {
    title?: string; highlight?: string; description?: string; image?: string;
  };
  urgencyCta?: { title?: string; whatsapp?: string };
  t5StatCards?: Array<{ icon?: string; value: string; label: string }>;
  t5WhoFor?: { title?: string; items?: string[]; ctaText?: string; ctaUrl?: string };
  t5RealProjects?: { title?: string; items?: string[] };
  t5Roadmap?: { title?: string; steps?: Array<{ title: string; description?: string }> };

  /** Custom heading text per page section, keyed by section id. */
  sectionHeadings?: Record<string, string>;
  /** Custom render order of page sections, by section id. Empty = template default. */
  sectionOrder?: string[];
  courseType?: 'live' | 'bundle';
  bundledCourses?: Array<{ id: number; title: string; price: string; thumbnail: string | null }>;
}

// ─── Defaults (so the template renders fully with no data, matching the design) ─

const D = {
  badge: "লাইভ কোর্স",
  subtitle:
    "আপনি কি ভিডিও কনটেন্ট এর জগতে পা রাখতে চান? আপনার সৃজনশীলতার মাধ্যমে অসাধারণ ভিডিও কনটেন্ট তৈরি করতে চান? তাহলে আমাদের এই কোর্সটি আপনার জন্য উপযুক্ত!",
  statCards: [
    { icon: "file", value: "৬০", label: "মডিউল" },
    { icon: "video", value: "২০+", label: "রেগুলার ক্লাস" },
    { icon: "play", value: "২০+", label: "রেকর্ড ক্লাস" },
    { icon: "project", value: "৫+", label: "রিয়েল প্রজেক্ট" },
    { icon: "community", value: "", label: "কমিউনিটি" },
  ] as { icon?: string; value: string; label: string }[],
  whatYouGet: [
    { title: "৩ মাসের স্টাডি প্ল্যান" },
    { title: "২০ টি লাইভ ক্লাস" },
    { title: "সাপ্তাহিক ২ দিন ক্লাস" },
    { title: "ক্লাস নোটস" },
    { title: "ফ্রিল্যান্সিং মার্কেটপ্লেস গাইডলাইন" },
    { title: "এসেসমেন্ট ও সার্টিফিকেট" },
  ],
  whoForTitle: "কাদের প্রয়োজন",
  whoFor: [
    "যারা Facebook Page বা YouTube Channel খুলেছেন কিন্তু কনটেন্ট বানাতে হিমশিম খাচ্ছেন",
    "যারা কনটেন্ট তৈরি করতে চান কিন্তু কোথা থেকে শুরু করবেন বুঝতে পারছেন না",
    "যারা ভিডিও এডিটিং স্কিল এর মাধ্যমে ফ্রিল্যান্সিং করতে চান",
    "কলেজ/ভার্সিটি ছাত্রছাত্রী",
  ],
  projectsTitle: "যেসব রিয়েল লাইফ প্রজেক্ট করানো হবে",
  projects: ["Documentary Video Edit", "Travel Vlog Video Edit", "SkillKoro Real Project", "Promotional Video Edit"],
  roadmapTitle: "🎬 NextGen Video Editor হবার রোডম্যাপ",
  roadmap: [
    { title: "ভিডিও এডিটিং ফান্ডামেন্টালস", description: "ভিডিও কীভাবে কাজ করে—timeline, cuts, resolution, FPS basics শিখুন।" },
    { title: "এডিটিং সফটওয়্যার পরিচিতি", description: "CapCut, Premiere Pro, After Effects, DaVinci—সব টুলের পরিচয়।" },
    { title: "Cutting & Trimming Skills", description: "সঠিকভাবে কাটিং, ট্রিমিং, timeline control শিখে editing muscle strong করুন।" },
    { title: "মাল্টি-লেয়ার ও এডভান্সড এডিটিং", description: "Multiple tracks, overlays, masking—professional workflow আয়ত্ত করুন।" },
    { title: "টেক্সট, ক্যাপশন ও মোশন গ্রাফিক্স", description: "Titles, subtitles, lower-thirds থেকে simple motion animation তৈরি করুন।" },
    { title: "কালার কারেকশন ও গ্রেডিং", description: "Skin tone ঠিক করা, LUTs, cinematic look—color mastery অর্জন।" },
    { title: "অডিও ডিজাইন ও সাউন্ড মিক্সিং", description: "Noise remove, EQ, SFX, voice sync—ভিডিওর sound quality perfect করুন।" },
    { title: "AI Video Editing Tools", description: "Auto-caption, AI voiceover, face swap, AI effects দিয়ে instant output!" },
    { title: "Social Media Editing (Reels/Shorts)", description: "Hook, pacing, retention style, trend-based editing শিখুন।" },
  ],
  certTitle: "সার্টিফিকেট",
  certDesc: "কোর্সটি সফলভাবে শেষ করলে আপনার জন্য আছে সার্টিফিকেট যা আপনি -",
  certPoints: [
    "আপনার সিভিতে যোগ করতে পারবেন",
    "লিংকডিন প্রোফাইলে সরাসরি শেয়ার করুন",
    "আপনার সিভিতে যোগ করতে পারবেন",
    "লিংকডিন প্রোফাইলে সরাসরি শেয়ার করুন",
  ],
  outcomeTags: [
    "Pro video editor", "Social media content creator", "Color grading specialist",
    "AI video editor", "Freelance-ready professional", "Client-handling expert",
  ],
  faq: [
    { question: "আমি যদি ভিডিও এডিটিং সম্পর্কে কিছুই না জানি, তাহলে কি আমি এই কোর্সটি করতে পারব?", answer: "অবশ্যই! এই কোর্সটি একদম শূন্য থেকে শুরু করা হয়েছে, তাই পূর্ব অভিজ্ঞতার প্রয়োজন নেই।" },
    { question: "মোবাইল দিয়ে করা যাবে কি?", answer: "ক্লাস মোবাইলে দেখা গেলেও, এডিটিং প্র্যাকটিসের জন্য একটি কম্পিউটার/ল্যাপটপ প্রয়োজন।" },
    { question: "কোর্সের সময়কাল কতটুকু?", answer: "কোর্সটির মেয়াদ প্রায় ৩ মাস, সপ্তাহে ২টি করে লাইভ ক্লাস।" },
    { question: "কোর্স শেষে কি সার্টিফিকেট প্রদান করা হবে?", answer: "হ্যাঁ, কোর্স সফলভাবে সম্পন্ন করলে সার্টিফিকেট দেওয়া হবে।" },
  ],
  tools: [
    { name: "Adobe Premiere Pro" }, { name: "Adobe After Effects" }, { name: "Adobe Audition" },
    { name: "Audacity" }, { name: "Capcut PC" }, { name: "Davinci" },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

const GREEN = "#16a34a";

function getYouTubeEmbed(url: string): string {
  if (!url) return "";
  if (url.includes("embed/")) return url;
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

function useCountdown(target?: string | null) {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    if (!target) return;
    const end = new Date(target).getTime();
    if (Number.isNaN(end)) return;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

function StatIcon({ name }: { name?: string }) {
  const cls = "h-7 w-7 text-green-600";
  switch (name) {
    case "video": return <Video className={cls} />;
    case "play": return <Play className={cls} />;
    case "project": return <FileText className={cls} />;
    case "community": return <Users className={cls} />;
    default: return <FileText className={cls} />;
  }
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50">
        <span className="text-sm font-semibold text-gray-800">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-green-600" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">{a}</div>}
    </div>
  );
}

function CurriculumGroup({ title, lessons }: { title: string; lessons: string[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-center text-base font-bold text-green-700">{title}</h3>
      {lessons.map((lesson, i) => (
        <CurriculumRow key={i} index={i + 1} text={lesson} />
      ))}
    </div>
  );
}

function CurriculumRow({ index, text }: { index: number; text: string }) {
  const [open, setOpen] = useState(false);
  const colors = ["bg-red-500", "bg-blue-500", "bg-amber-500", "bg-green-500", "bg-violet-500", "bg-cyan-500", "bg-pink-500"];
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-3 py-3 text-left">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${colors[index % colors.length]}`}>
          {index}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-700">{text}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

/** Default top-to-bottom section order for Template 5 (Masterclass). */
export const TEMPLATE5_SECTION_ORDER = [
  "countdown", "hero", "tools", "demoVideo", "instructors", "about", "whatYouGet",
  "whoFor", "projects", "curriculum", "roadmap", "certificate", "faq", "enrollment",
] as const;

export function LiveCourseTemplate5({
  course,
  previewMode = false,
  baseUrl = "",
  user,
  enrolled = false,
  checkoutError,
  logoUrl,
  logoAlt,
}: {
  course: LiveCourseTemplate5Data;
  previewMode?: boolean;
  baseUrl?: string;
  user?: EnrollmentUser | null;
  enrolled?: boolean;
  checkoutError?: string | null;
  logoUrl?: string;
  logoAlt?: string;
}) {
  const countdown = useCountdown(course.countdownEnd);

  const statCards = course.t5StatCards?.length ? course.t5StatCards : D.statCards;
  const whatYouGet = course.whatYouGet?.length ? course.whatYouGet : D.whatYouGet;
  const whoFor = course.t5WhoFor?.items?.length ? course.t5WhoFor.items : D.whoFor;
  const projects = course.t5RealProjects?.items?.length ? course.t5RealProjects.items : D.projects;
  const roadmap = course.t5Roadmap?.steps?.length ? course.t5Roadmap.steps : D.roadmap;
  const curriculum = course.curriculum?.length ? course.curriculum : [];
  const faq = course.faq?.length ? course.faq : D.faq;
  const instructors = course.instructors?.length ? course.instructors : [];
  const tools = course.tools?.length ? course.tools : D.tools;
  const demoVideo = course.videos?.[0]?.url || course.hero?.videoUrl || "";

  const scrollToEnroll = previewMode
    ? undefined
    : () => document.getElementById("t5-enroll")?.scrollIntoView({ behavior: "smooth" });

  const h = course.sectionHeadings ?? {};
  // DOM order preserved (keeps style-override targeting intact); sections are
  // reordered visually via the CSS `order` property.
  const order = resolveSectionOrder(course.sectionOrder, TEMPLATE5_SECTION_ORDER);
  const ord = (id: string) => { const i = order.indexOf(id); return i === -1 ? 999 : i; };

  return (
    <TemplateStyleScope overrides={course.styleOverrides} className="bg-white text-gray-900 flex flex-col">
      {logoUrl && (
        <LiveCoursePromoBar
          logoUrl={logoUrl}
          logoAlt={logoAlt ?? "Logo"}
          price={course.price}
          originalPrice={course.originalPrice}
          countdownEnd={course.countdownEnd}
          accentColor={GREEN}
        />
      )}
      {/* ── Offer countdown strip ───────────────────────────────────────────── */}
      {countdown && (
        <div className="bg-green-600 py-2.5 text-white" style={{ order: ord("countdown") }}>
          <div className="container mx-auto flex flex-wrap items-center justify-center gap-3 px-4 text-sm font-semibold">
            <span>{course.urgencyCta?.title ?? "অফারের আর মাত্র বাকি"}</span>
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
              <Clock className="h-4 w-4" />
              {countdown.d} দিন {countdown.h} ঘ. {countdown.m} মি. {countdown.s} সে.
            </span>
          </div>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-10" style={{ order: ord("hero") }}>
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[1fr_400px]">
          {/* Left */}
          <div>
            <span
              className="badge-glow inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-semibold text-green-700"
              style={{ "--glow-rgb": "34 197 94" } as CSSProperties}
            >
              <LiveDot color="bg-green-500" /> {course.hero?.badgeText ?? D.badge}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">{course.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              {course.batchInfo?.batchName && (
                <span className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-bold text-white">{course.batchInfo.batchName}</span>
              )}
              <span className="flex items-center gap-1 text-sm text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                <span className="ml-1 text-gray-500">({course.hero?.ratingCount ?? 230})</span>
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600">{course.hero?.subtitle ?? D.subtitle}</p>

            {/* Stat cards */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {statCards.map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 rounded-xl border border-green-200 bg-white px-3 py-4 text-center">
                  <StatIcon name={s.icon} />
                  {s.value && <span className="text-lg font-extrabold text-gray-900">{s.value}</span>}
                  <span className="text-xs font-medium text-gray-600">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Batch info bar */}
            <div className="mt-5 grid gap-4 rounded-xl border-l-4 border-green-500 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
              {course.batchInfo?.batchName && <BatchCell icon={<CalendarDays className="h-4 w-4 text-green-600" />} label="ব্যাচ" value={course.batchInfo.batchName} />}
              {course.batchInfo?.startDate && <BatchCell icon={<CalendarDays className="h-4 w-4 text-green-600" />} label="শুরু হবে" value={course.batchInfo.startDate} />}
              {course.batchInfo?.liveSchedule && <BatchCell icon={<Video className="h-4 w-4 text-green-600" />} label="লাইভ ক্লাস" value={course.batchInfo.liveSchedule} />}
              {course.batchInfo?.supportSchedule && <BatchCell icon={<Video className="h-4 w-4 text-green-600" />} label="রেকর্ড ক্লাস" value={course.batchInfo.supportSchedule} />}
            </div>
          </div>

          {/* Right purchase card */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border-2 border-green-100 bg-white p-3 shadow-sm">
              <div className="relative overflow-hidden rounded-xl bg-gray-100">
                {course.hero?.bannerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.hero.bannerImage} alt={course.title} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-green-600 to-emerald-700 text-white">
                    <Play className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 px-2">
                <button
                  onClick={scrollToEnroll}
                  className="cta-premium rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700"
                  style={{ "--cta-rgb": "34 197 94" } as CSSProperties}
                >
                  এখনই ভর্তি হন
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl font-extrabold text-green-700">Tk. {course.price}</span>
                  {course.originalPrice && <span className="text-sm text-gray-400 line-through">Tk. {course.originalPrice}</span>}
                </div>
              </div>
              {course.hero?.promoText && (
                <p className="mt-1.5 flex items-center gap-1 px-2 text-sm text-green-600 font-medium">
                  <Check className="h-4 w-4" /> {course.hero.promoText}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools ───────────────────────────────────────────────────────────── */}
      <Section order={ord("tools")} title={h.tools || "যেসব টুলস ও টেকনোলোজি শিখবেন"}>
        <div className="flex flex-wrap justify-center gap-3">
          {tools.map((t, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
              {t.name}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Demo video ──────────────────────────────────────────────────────── */}
      {demoVideo && (
        <Section order={ord("demoVideo")} title={h.demoVideo || "ডেমো ক্লাস"}>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <iframe src={getYouTubeEmbed(demoVideo)} title="Demo" className="aspect-video w-full" allowFullScreen />
          </div>
        </Section>
      )}

      {/* ── Instructors ─────────────────────────────────────────────────────── */}
      {instructors.length > 0 && (
        <Section order={ord("instructors")} title={h.instructors || "Meet Our Lead Instructors"}>
          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
            {instructors.map((ins, i) => (
              <div key={i} className="rounded-2xl border border-green-100 bg-green-50/40 p-5">
                <div className="flex items-center gap-3">
                  {ins.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ins.image} alt={ins.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-200 text-green-700 font-bold">{ins.name[0]}</div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{ins.name}</p>
                    <p className="text-xs text-gray-500">{ins.title}</p>
                  </div>
                </div>
                {ins.bio && <p className="mt-3 text-xs leading-relaxed text-gray-600">{ins.bio}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── About + outcome tags ────────────────────────────────────────────── */}
      <Section order={ord("about")}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm leading-relaxed text-gray-600">{course.hero?.subtitle ?? D.subtitle}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {D.outcomeTags.map((tag) => (
              <span key={tag} className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">⭐ {tag}</span>
            ))}
          </div>
        </div>
      </Section>

      {/* ── What you get ────────────────────────────────────────────────────── */}
      <Section order={ord("whatYouGet")} title={h.whatYouGet || "এই কোর্সে যা যা পাচ্ছেন"}>
        <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {whatYouGet.map((w, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-6 text-center">
              <Award className="h-7 w-7 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">{w.title}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Who is this for ─────────────────────────────────────────────────── */}
      <Section order={ord("whoFor")} title={course.t5WhoFor?.title ?? D.whoForTitle}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {whoFor.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {item}
              </div>
            ))}
          </div>
          <button onClick={scrollToEnroll} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
            {course.t5WhoFor?.ctaText ?? "Free Career Consultancy"}
          </button>
        </div>
      </Section>

      {/* ── Real life projects ──────────────────────────────────────────────── */}
      <Section order={ord("projects")} title={course.t5RealProjects?.title ?? D.projectsTitle}>
        <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm font-medium text-gray-700">{p}</div>
          ))}
        </div>
      </Section>

      {/* ── Curriculum ──────────────────────────────────────────────────────── */}
      {curriculum.length > 0 && (
        <Section order={ord("curriculum")} title={h.curriculum || "লাইভ ক্লাস"}>
          <div className="mx-auto max-w-3xl space-y-6">
            {curriculum.map((group, i) => (
              <CurriculumGroup key={i} title={group.title} lessons={group.lessons ?? []} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Roadmap timeline ────────────────────────────────────────────────── */}
      <Section order={ord("roadmap")} title={course.t5Roadmap?.title ?? D.roadmapTitle}>
        <div className="mx-auto max-w-3xl">
          <div className="relative border-l-2 border-green-300 pl-6">
            {roadmap.map((step, i) => (
              <div key={i} className="relative mb-6">
                <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-green-500 bg-white" />
                <div className="rounded-xl border border-dashed border-green-300 bg-white p-4">
                  <p className="text-sm font-bold text-green-700">{step.title}</p>
                  {step.description && <p className="mt-1 text-xs text-gray-600">{step.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Certificate ─────────────────────────────────────────────────────── */}
      <Section order={ord("certificate")} title={course.certificate?.title ?? D.certTitle}>
        <div className="mx-auto max-w-3xl rounded-2xl bg-gray-50 p-6">
          <p className="text-sm font-semibold text-gray-800">{course.certificate?.description ?? D.certDesc}</p>
          <div className="mt-3 space-y-2">
            {D.certPoints.map((pt, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-600" /> {pt}
              </div>
            ))}
          </div>
          {course.certificate?.image && (
            <div className="mt-5 overflow-hidden rounded-xl border-2 border-green-200 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={course.certificate.image} alt="Certificate" className="w-full rounded-lg" />
            </div>
          )}
        </div>
      </Section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <Section order={ord("faq")} title={h.faq || "সচরাচর জিজ্ঞাসা"}>
        <div className="mx-auto max-w-3xl space-y-2.5">
          {faq.map((f, i) => <FaqItem key={i} q={f.question} a={f.answer} />)}
        </div>
        {course.urgencyCta?.whatsapp && (
          <div className="mx-auto mt-6 max-w-3xl">
            <p className="mb-2 text-sm font-semibold text-green-700">আরো জিজ্ঞাসা আছে ?</p>
            <a href={`tel:${course.urgencyCta.whatsapp}`} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">
              <Phone className="h-4 w-4" /> কল করুন
            </a>
          </div>
        )}
      </Section>

      {/* ── Enrollment form ─────────────────────────────────────────────────── */}
      <div id="t5-enroll" style={{ order: ord("enrollment") }}>
        <LiveEnrollmentForm course={course} baseUrl={baseUrl} previewMode={previewMode} user={user} enrolled={enrolled} checkoutError={checkoutError} sectionClassName="py-14 bg-gray-50" />
      </div>

      {/* ── Sticky bottom bar ───────────────────────────────────────────────── */}
      {!previewMode && (
        <div className="sticky bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur" style={{ order: 999 }}>
          <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
            <div className="hidden sm:block">
              {course.urgencyCta?.whatsapp && <p className="text-xs font-semibold text-gray-700">কল করুন : {course.urgencyCta.whatsapp}</p>}
              <p className="text-sm font-extrabold text-green-700">Tk. {course.price}{course.originalPrice && <span className="ml-1 text-xs text-gray-400 line-through">Tk. {course.originalPrice}</span>}</p>
            </div>
            <button
              onClick={scrollToEnroll}
              className="cta-premium ml-auto rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700"
              style={{ "--cta-rgb": "34 197 94" } as CSSProperties}
            >
              এনরোল করুন
            </button>
          </div>
        </div>
      )}
    </TemplateStyleScope>
  );
}

// ─── Small layout helpers ────────────────────────────────────────────────────

function Section({ title, children, order }: { title?: string; children: React.ReactNode; order?: number }) {
  return (
    <section className="py-10" style={order !== undefined ? { order } : undefined}>
      <div className="container mx-auto px-4">
        {title && <h2 className="mb-6 text-center text-2xl font-bold text-green-700">{title}</h2>}
        {children}
      </div>
    </section>
  );
}

function BatchCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      {icon}
      <div>
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-xs font-semibold text-gray-700">{value}</p>
      </div>
    </div>
  );
}
