"use client";

import { useState, useRef, useEffect, useCallback, useMemo, type CSSProperties } from "react";
import {
  ChevronDown, ChevronUp, Check, Play, Phone, Clock,
  CalendarDays, Star, Users, FileText, Video, Award, Heart, Brain,
  Calendar, Repeat, Pencil, GripVertical, Minimize2,
} from "lucide-react";
import { LiveEnrollmentForm, type EnrollmentUser } from "./live-enrollment-form";
import { LiveCoursePromoBar } from "./live-course-promo-bar";
import { TemplateStyleScope, type StyleOverrides } from "./template-style-overrides";
import { resolveSectionOrder } from "./live-course-template";

// ─── Data Interface ───────────────────────────────────────────────────────────

export interface LiveCourseTemplate6Data {
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
    headline?: string;
    headlineHighlight?: string;
    headlineAfter?: string;
    subtitle?: string;
    bannerImage?: string;
    anatomicalImage?: string;
    ctaText?: string;
    secondaryCtaText?: string;
    infoBadges?: Array<{ icon: string; label: string; value: string }>;
    pricingCard?: {
      header?: string;
      tiers?: Array<{ icon?: string; label: string; value: string; suffix?: string }>;
      highlighted?: { label?: string; value: string; suffix?: string; badge?: string };
      ctaText?: string;
      installmentNote?: string;
    };
  };
  heroInfoBadges?: Array<{ icon: string; label: string; value: string }>;
  heroPricingCard?: {
    header?: string;
    tiers?: Array<{ icon?: string; label: string; value: string; suffix?: string }>;
    highlighted?: { label?: string; value: string; suffix?: string; badge?: string };
    ctaText?: string;
    installmentNote?: string;
  };
  t6Credentials?: Array<{ icon: string; label: string }>;
  t6Stats?: Array<{ value: string; label: string }>;
  t6Comparison?: Array<{ feature: string; selfStudy: boolean; liveCourse: boolean }>;
  t6Organs?: Array<{ name: string; icon?: string }>;
  curriculum?: Array<{ title: string; lessons?: string[] }>;
  t6Instructor?: { name?: string; title?: string; credentials?: string; photo?: string; hospital?: string };
  t6WhoFor?: { title?: string; items?: string[] };
  t6Pricing?: { tiers?: Array<{ name: string; price: string; period: string; features?: string[]; highlighted?: boolean }> };
  t6Video?: string;
  faq?: Array<{ question: string; answer: string }>;
  t6Testimonials?: Array<{ name: string; rating?: number; text: string; photo?: string }>;

  sectionHeadings?: Record<string, string>;
  sectionOrder?: string[];
  courseType?: 'live' | 'bundle';
  bundledCourses?: Array<{ id: number; title: string; price: string; thumbnail: string | null }>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const D = {
  badge: "অনলাইন লাইভ কোর্স",
  headline: "মানবদেহের গঠন জানুন",
  headlineHighlight: "Anatomy & Physiology বুঝুন",
  headlineAfter: "চিকিৎসাবিজ্ঞানের ভিত্তি গড়ুন",
  subtitle: "Basic Concept of Anatomy & Physiology কোর্সে মানবদেহের ১১টি গুরুত্বপূর্ণ অঙ্গের গঠন, কার্যাপারণ ও পারস্পরিক সম্পর্ক সম্পর্কে ধারণাবিদ্যায়ে পিঠুন। ১৬টি লাইভ ক্লাসের মাধ্যমে আপনার Anatomy & Physiology-এর সুন্দর ধারণাকে আরও মসৃণতিত ও গঠনশীল করুন।",
  infoBadges: [
    { icon: "calendar", label: "কোর্স শুরু", value: "১ সেপ্টেম্বর ২০২৫" },
    { icon: "clock", label: "ক্লাস সময়", value: "রাত ৮:০০টা - ১০:০০টা" },
    { icon: "video", label: "কনটেন্ট ধরন", value: "লাইভ ক্লাস" },
    { icon: "users", label: "সর্বোমোট শিক্ষার্থী", value: "৩০০ জন" },
  ],
  heroPricingCard: {
    header: "ভর্তি ও ফি সংক্রান্ত তথ্য",
    tiers: [
      { icon: "edit", label: "ভর্তি ফি", value: "৮৫,০০০" },
      { icon: "calendar", label: "মাসিক ফি", value: "৮৫০০", suffix: "/ মাস" },
      { icon: "repeat", label: "বার্ষিক ফি", value: "৬৬,০০০", suffix: "/ বছর" },
    ],
    highlighted: {
      label: "বার্ষিক বিশেষ মূল্য",
      value: "৮৫,০০০",
      suffix: "/ বছর",
      badge: "সাশ্রয় ৮৫,০০০",
    },
    ctaText: "এখনই ভর্তি হোন",
  },
  credentials: [
    { icon: "users", label: "৩০০ জন সক্রিয় শিক্ষার্থী" },
    { icon: "video", label: "৯৩টি লাইভ ক্লাস" },
    { icon: "clock", label: "৯৩ ঘণ্টা+ কনটেন্ট" },
    { icon: "award", label: "Professional সার্টিফিকেট (ইন্টারন্যাশনাল)" },
  ],
  stats: [
    { value: "৩০০+", label: "সক্রিয় শিক্ষার্থী" },
    { value: "৯৩টি", label: "লাইভ ক্লাস" },
    { value: "৯৩+", label: "এককমূর্ত লাইভ" },
    { value: "৫টি মডিউল", label: "সম্পূর্ণ কারিকুলাম" },
    { value: "Professional", label: "সার্টিফিকেট (ইন্টারন্যাশনাল)" },
  ],
  comparison: [
    { feature: "অনলাইন প্যাকেজ", selfStudy: false, liveCourse: true },
    { feature: "৬৩টি লাইভ ক্লাস", selfStudy: false, liveCourse: true },
    { feature: "৪৫+ এককমূর্ত লাইভ অংশগ্রহণ", selfStudy: false, liveCourse: true },
    { feature: "Practice Class", selfStudy: false, liveCourse: true },
    { feature: "Extra Knowledge Classes", selfStudy: false, liveCourse: true },
    { feature: "বিশেষজ্ঞ প্রশিক্ষকদের থেকে শেখানো", selfStudy: false, liveCourse: true },
    { feature: "প্রশ্নোত্তর ও সমস্যা সমাধান", selfStudy: false, liveCourse: true },
  ],
  organs: [
    { name: "Brain" }, { name: "Heart" }, { name: "Lungs" }, { name: "Liver" },
    { name: "Kidneys" }, { name: "Stomach" }, { name: "Intestine" },
    { name: "Pancreas" }, { name: "Spleen" }, { name: "Skin" }, { name: "Thyroid Gland" },
  ],
  instructor: {
    name: "ডা. আল আমিন সূদা",
    title: "প্রশিক্ষক",
    credentials: "যুক্তরাজ্যের পেশাদার স্বাস্থ্য বিশেষজ্ঞ",
    hospital: "হোমিও সেবা কেন্দ্র",
  },
  whoForTitle: "এই কোর্সে যা যা পাচ্ছেন",
  whoFor: [
    "১৩৩+ এককমূর্ত কনটেন্ট",
    "৯৩টি লাইভ ক্লাস",
    "Practice Class",
    "Extra Knowledge Classes",
    "Structured Learning",
    "Revision & Discussion",
  ],
  pricing: [
    { name: "ফি ফি", price: "৮৫,০০০", period: "এককালীন", features: ["ফি ভর্তি বিকল্প"], highlighted: false },
    { name: "মাসিক ফি", price: "১৫০০", period: "প্রতি মাস", features: ["মাসিক পেমেন্ট সুবিধা"], highlighted: false },
    { name: "বার্ষিক ফি", price: "৮৫,০০০", period: "১ বছর", features: ["বার্ষিক মূল্য"], highlighted: true },
  ],
  faq: [
    { question: "এই কোর্সে কি শেখানো হবে?", answer: "Anatomy & Physiology এর মৌলিক ধারণা, মানবদেহের অঙ্গগুলোর গঠন ও কার্যাবলী।" },
    { question: "কোর্সের মেয়াদ কত?", answer: "কোর্সটির মেয়াদ ৩ মাস, সপ্তাহে ২টি লাইভ ক্লাস।" },
    { question: "সার্টিফিকেট কি পাবো?", answer: "হ্যাঁ, কোর্স সফলভাবে সম্পন্ন করলে ইন্টারন্যাশনাল সার্টিফিকেট দেওয়া হবে।" },
    { question: "পেমেন্ট কীভাবে করব?", answer: "bKash, Nagad, Rocket, ক্রেডিট/ডেবিট কার্ড বা ব্যাংক ট্রান্সফারে পেমেন্ট করতে পারবেন।" },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RED = "#dc2626";

function getYouTubeEmbed(url: string): string {
  if (!url) return "";
  if (url.includes("embed/")) return url;
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

function CredentialIcon({ name }: { name?: string }) {
  const cls = "h-5 w-5 text-red-600";
  switch (name) {
    case "users": return <Users className={cls} />;
    case "video": return <Video className={cls} />;
    case "clock": return <Clock className={cls} />;
    case "award": return <Award className={cls} />;
    default: return <Check className={cls} />;
  }
}

function HeroInfoBadgeIcon({ name }: { name: string }) {
  const cls = "h-4 w-4 text-red-500 shrink-0";
  switch (name) {
    case "calendar": return <Calendar className={cls} />;
    case "clock":    return <Clock className={cls} />;
    case "video":    return <Video className={cls} />;
    case "users":    return <Users className={cls} />;
    default:         return <Check className={cls} />;
  }
}

function PricingTierIcon({ name }: { name?: string }) {
  const cls = "h-4 w-4 text-red-500 shrink-0";
  switch (name) {
    case "edit":    return <Pencil className={cls} />;
    case "calendar": return <Calendar className={cls} />;
    case "repeat":  return <Repeat className={cls} />;
    default:        return <Check className={cls} />;
  }
}

function OrganIcon({ name }: { name: string }) {
  const s = "h-12 w-12";
  switch (name) {
    case "Brain":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="32" cy="30" rx="20" ry="18" fill="#fca5a5" />
          <path d="M32 12 C28 18, 22 20, 18 28 C14 36, 20 44, 28 46 C24 42, 22 36, 24 30 C26 24, 30 22, 32 18" stroke="#e57373" strokeWidth="1.5" fill="none" />
          <path d="M32 12 C36 18, 42 20, 46 28 C50 36, 44 44, 36 46 C40 42, 42 36, 40 30 C38 24, 34 22, 32 18" stroke="#e57373" strokeWidth="1.5" fill="none" />
          <path d="M32 14 C32 20, 32 30, 32 44" stroke="#e57373" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="24" cy="28" r="3" fill="#ef9a9a" opacity="0.6" />
          <circle cx="40" cy="28" r="3" fill="#ef9a9a" opacity="0.6" />
          <circle cx="32" cy="36" r="2.5" fill="#ef9a9a" opacity="0.5" />
        </svg>
      );
    case "Heart":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 52 C20 42, 8 32, 8 22 C8 14, 14 8, 22 8 C26 8, 30 10, 32 14 C34 10, 38 8, 42 8 C50 8, 56 14, 56 22 C56 32, 44 42, 32 52Z" fill="#ef5350" />
          <path d="M32 52 C20 42, 8 32, 8 22 C8 14, 14 8, 22 8 C26 8, 30 10, 32 14" stroke="#c62828" strokeWidth="1.5" fill="none" />
          <ellipse cx="24" cy="22" rx="6" ry="5" fill="#ef9a9a" opacity="0.5" />
          <path d="M28 18 L32 14 L36 18" stroke="#c62828" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M32 14 L32 38" stroke="#c62828" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
    case "Lungs":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 12 L32 44" stroke="#e57373" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 18 C26 18, 18 22, 16 30 C14 38, 18 46, 24 48 C28 48, 30 44, 32 40" fill="#fca5a5" />
          <path d="M32 18 C38 18, 46 22, 48 30 C50 38, 46 46, 40 48 C36 48, 34 44, 32 40" fill="#fca5a5" />
          <path d="M32 22 C28 22, 22 26, 20 32 C18 38, 22 42, 26 42" stroke="#e57373" strokeWidth="1" fill="none" />
          <path d="M32 22 C36 22, 42 26, 44 32 C46 38, 42 42, 38 42" stroke="#e57373" strokeWidth="1" fill="none" />
          <path d="M22 26 L18 28 M22 32 L17 34 M22 38 L19 40" stroke="#e57373" strokeWidth="0.8" />
          <path d="M42 26 L46 28 M42 32 L47 34 M42 38 L45 40" stroke="#e57373" strokeWidth="0.8" />
        </svg>
      );
    case "Liver":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 28 C12 20, 20 14, 32 14 C44 14, 52 20, 52 28 C52 36, 44 44, 32 44 C20 44, 12 36, 12 28Z" fill="#d32f2f" />
          <path d="M12 28 C12 20, 20 14, 32 14" stroke="#b71c1c" strokeWidth="1.5" fill="none" />
          <path d="M32 14 L32 44" stroke="#b71c1c" strokeWidth="1" strokeDasharray="3 2" />
          <path d="M20 24 C24 22, 28 24, 32 28" stroke="#ef9a9a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M36 22 C40 20, 46 24, 48 28" stroke="#ef9a9a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <ellipse cx="28" cy="32" rx="4" ry="3" fill="#b71c1c" opacity="0.4" />
        </svg>
      );
    case "Kidneys":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 16 C10 16, 6 24, 6 32 C6 40, 10 48, 18 48 C22 48, 24 44, 24 40 L24 24 C24 20, 22 16, 18 16Z" fill="#ef5350" />
          <path d="M46 16 C54 16, 58 24, 58 32 C58 40, 54 48, 46 48 C42 48, 40 44, 40 40 L40 24 C40 20, 42 16, 46 16Z" fill="#ef5350" />
          <ellipse cx="16" cy="32" rx="3" ry="5" fill="#ffcdd2" opacity="0.5" />
          <ellipse cx="48" cy="32" rx="3" ry="5" fill="#ffcdd2" opacity="0.5" />
          <path d="M24 30 C28 28, 36 28, 40 30" stroke="#e57373" strokeWidth="1.5" fill="none" />
          <path d="M24 34 C28 36, 36 36, 40 34" stroke="#e57373" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "Stomach":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M26 10 L26 20 C26 24, 20 28, 14 32 C8 36, 8 44, 14 48 C20 52, 32 52, 40 46 C48 40, 50 28, 44 20 C38 12, 28 10, 26 10Z" fill="#fca5a5" />
          <path d="M26 10 L26 20 C26 24, 20 28, 14 32 C8 36, 8 44, 14 48" stroke="#e57373" strokeWidth="1.5" fill="none" />
          <path d="M30 18 C30 24, 24 30, 18 34" stroke="#e57373" strokeWidth="1" fill="none" />
          <path d="M34 16 C36 24, 34 32, 28 40" stroke="#e57373" strokeWidth="1" fill="none" />
          <circle cx="22" cy="36" r="2" fill="#ef9a9a" opacity="0.6" />
        </svg>
      );
    case "Intestine":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 12 C16 12, 20 12, 24 16 C28 20, 28 28, 24 32 C20 36, 20 44, 24 48 C28 52, 36 52, 40 48 C44 44, 44 36, 40 32 C36 28, 36 20, 40 16 C44 12, 48 12, 48 12" stroke="#e57373" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M16 12 C16 12, 20 12, 24 16 C28 20, 28 28, 24 32 C20 36, 20 44, 24 48 C28 52, 36 52, 40 48 C44 44, 44 36, 40 32 C36 28, 36 20, 40 16 C44 12, 48 12, 48 12" stroke="#fca5a5" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.4" />
          <circle cx="24" cy="32" r="1.5" fill="#e57373" />
          <circle cx="32" cy="40" r="1.5" fill="#e57373" />
          <circle cx="40" cy="32" r="1.5" fill="#e57373" />
          <circle cx="32" cy="24" r="1.5" fill="#e57373" />
        </svg>
      );
    case "Pancreas":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 30 C10 24, 18 20, 28 22 C38 24, 44 28, 50 24 C54 22, 56 26, 54 30 C52 34, 44 38, 34 38 C24 38, 14 36, 10 30Z" fill="#ffab91" />
          <path d="M10 30 C10 24, 18 20, 28 22 C38 24, 44 28, 50 24" stroke="#e57373" strokeWidth="1.5" fill="none" />
          <path d="M18 28 C24 26, 32 28, 40 30" stroke="#e57373" strokeWidth="1" fill="none" />
          <path d="M16 32 C22 30, 30 32, 38 34" stroke="#e57373" strokeWidth="1" fill="none" />
          <circle cx="50" cy="26" r="4" fill="#ffccbc" stroke="#e57373" strokeWidth="1" />
        </svg>
      );
    case "Spleen":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="32" cy="32" rx="16" ry="14" fill="#ef5350" transform="rotate(-15 32 32)" />
          <ellipse cx="32" cy="32" rx="16" ry="14" stroke="#c62828" strokeWidth="1.5" fill="none" transform="rotate(-15 32 32)" />
          <path d="M22 24 C26 28, 30 32, 28 38" stroke="#ffcdd2" strokeWidth="1.5" fill="none" />
          <path d="M32 20 C34 26, 36 32, 34 40" stroke="#ffcdd2" strokeWidth="1.5" fill="none" />
          <path d="M40 26 C38 30, 38 36, 40 40" stroke="#ffcdd2" strokeWidth="1" fill="none" />
        </svg>
      );
    case "Skin":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="44" height="44" rx="6" fill="#ffccbc" />
          <rect x="10" y="10" width="44" height="44" rx="6" stroke="#e57373" strokeWidth="1.5" fill="none" />
          <rect x="16" y="16" width="12" height="8" rx="2" fill="#ef9a9a" opacity="0.6" />
          <rect x="36" y="16" width="12" height="8" rx="2" fill="#ef9a9a" opacity="0.6" />
          <rect x="16" y="30" width="12" height="8" rx="2" fill="#ef9a9a" opacity="0.6" />
          <rect x="36" y="30" width="12" height="8" rx="2" fill="#ef9a9a" opacity="0.6" />
          <path d="M22 20 L22 24 M38 20 L38 24 M22 34 L22 38 M38 34 L38 38" stroke="#e57373" strokeWidth="0.8" />
          <circle cx="28" cy="48" r="1.5" fill="#e57373" opacity="0.5" />
          <circle cx="36" cy="48" r="1.5" fill="#e57373" opacity="0.5" />
        </svg>
      );
    case "Thyroid Gland":
      return (
        <svg className={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M26 18 C20 18, 14 24, 14 32 C14 40, 20 46, 26 46 C30 46, 32 42, 32 38" fill="#ef5350" />
          <path d="M38 18 C44 18, 50 24, 50 32 C50 40, 44 46, 38 46 C34 46, 32 42, 32 38" fill="#ef5350" />
          <path d="M26 18 C20 18, 14 24, 14 32 C14 40, 20 46, 26 46" stroke="#c62828" strokeWidth="1.5" fill="none" />
          <path d="M38 18 C44 18, 50 24, 50 32 C50 40, 44 46, 38 46" stroke="#c62828" strokeWidth="1.5" fill="none" />
          <path d="M32 14 L32 18" stroke="#c62828" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 18 L32 14 M30 12 L32 10 L34 12" stroke="#c62828" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <ellipse cx="24" cy="32" rx="4" ry="6" fill="#ffcdd2" opacity="0.5" />
          <ellipse cx="40" cy="32" rx="4" ry="6" fill="#ffcdd2" opacity="0.5" />
          <circle cx="32" cy="38" r="2" fill="#ef9a9a" />
        </svg>
      );
    default:
      return <Heart className="h-10 w-10 text-red-400" />;
  }
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50">
        <span className="text-sm font-semibold text-gray-800">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-red-600" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">{a}</div>}
    </div>
  );
}

function CurriculumGroup({ title, lessons, index }: { title: string; lessons: string[]; index: number }) {
  const moduleNum = String(index + 1).padStart(2, "0");
  const parts = title.split("—");
  const mainTitle = parts[0]?.trim() ?? title;
  const subtitle = parts.length > 1 ? parts.slice(1).join("—").trim() : "";
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow min-w-[260px] max-w-[300px] shrink-0 snap-start">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
            {moduleNum}
          </span>
          <span className="text-sm font-bold text-gray-900">{mainTitle}</span>
        </div>
        {subtitle && (
          <p className="text-xs font-medium text-gray-500 leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Lessons */}
      <div className="flex-1 px-5 pb-4 space-y-2">
        {lessons.map((lesson, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span className="leading-snug">{lesson}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-red-100 bg-red-50/50 px-5 py-3">
        <span className="text-xs font-bold text-red-600">ক্লাস সংখ্যা: {lessons.length}+</span>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export const TEMPLATE6_SECTION_ORDER = [
  "hero", "statsBar", "comparison", "organGrid",
  "curriculum", "instructor", "whoFor", "valueBreakdown", "video",
  "faq", "testimonials", "enrollment",
] as const;

export function LiveCourseTemplate6({
  course,
  previewMode = false,
  baseUrl = "",
  user,
  enrolled = false,
  checkoutError,
  logoUrl,
  logoAlt,
}: {
  course: LiveCourseTemplate6Data;
  previewMode?: boolean;
  baseUrl?: string;
  user?: EnrollmentUser | null;
  enrolled?: boolean;
  checkoutError?: string | null;
  logoUrl?: string;
  logoAlt?: string;
}) {
  const credentials = course.t6Credentials?.length ? course.t6Credentials : D.credentials;
  const stats = course.t6Stats?.length ? course.t6Stats : D.stats;
  const comparison = course.t6Comparison?.length ? course.t6Comparison : D.comparison;
  const organs = course.t6Organs?.length ? course.t6Organs : D.organs;
  const curriculum = course.curriculum?.length ? course.curriculum : [];
  const faq = course.faq?.length ? course.faq : D.faq;
  const testimonials = course.t6Testimonials?.length ? course.t6Testimonials : [];
  const pricing = course.t6Pricing?.tiers?.length ? course.t6Pricing.tiers : D.pricing;
  const whoFor = course.t6WhoFor?.items?.length ? course.t6WhoFor.items : D.whoFor;

  const scrollToEnroll = previewMode
    ? undefined
    : () => document.getElementById("t6-enroll")?.scrollIntoView({ behavior: "smooth" });

  const h = course.sectionHeadings ?? {};
  const order = resolveSectionOrder(course.sectionOrder, TEMPLATE6_SECTION_ORDER);
  const ord = (id: string) => { const i = order.indexOf(id); return i === -1 ? 999 : i; };

  // ── Draggable Pricing Widget ──
  const widgetRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const didMove = useRef(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    const saved = localStorage.getItem("t6-widget-pos");
    if (saved) {
      try { setCardPos(JSON.parse(saved)); } catch { /* ignore */ }
    }
    const savedMin = localStorage.getItem("t6-widget-minimized");
    if (savedMin === "1") setMinimized(true);
    const hintSeen = localStorage.getItem("t6-widget-hint-seen");
    if (!hintSeen) {
      hintTimer.current = setTimeout(() => setShowHint(true), 1200);
    } else {
      setHintDismissed(true);
    }
    return () => {
      window.removeEventListener("resize", checkMobile);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    setHintDismissed(true);
    localStorage.setItem("t6-widget-hint-seen", "1");
    if (hintTimer.current) { clearTimeout(hintTimer.current); hintTimer.current = null; }
  }, []);

  const persistPos = useCallback((x: number, y: number) => {
    const viewW = typeof window !== "undefined" ? window.innerWidth : 360;
    const viewH = typeof window !== "undefined" ? window.innerHeight : 800;
    const elW = minimized ? 56 : 320;
    const elH = minimized ? 56 : 420;
    const clamped = {
      x: Math.max(0, Math.min(x, viewW - elW)),
      y: Math.max(0, Math.min(y, viewH - elH)),
    };
    setCardPos(clamped);
    localStorage.setItem("t6-widget-pos", JSON.stringify(clamped));
  }, [minimized]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!widgetRef.current) return;
    const rect = widgetRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isDragging.current = true;
    didMove.current = false;
    setDragging(true);
    setSettling(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    didMove.current = true;
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    persistPos(x, y);
  }, [persistPos]);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragging(false);
    if (!hintDismissed && didMove.current) {
      dismissHint();
    }
    setSettling(true);
    setTimeout(() => setSettling(false), 300);
  }, [hintDismissed, dismissHint]);

  const toggleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMinimized((m) => {
      const next = !m;
      localStorage.setItem("t6-widget-minimized", next ? "1" : "0");
      return next;
    });
  }, []);

  const widgetStyle: CSSProperties = cardPos
    ? { position: "fixed", left: cardPos.x, top: cardPos.y, zIndex: 50 }
    : { position: "fixed", right: 16, top: 80, zIndex: 50 };

  return (
    <TemplateStyleScope overrides={course.styleOverrides} className="bg-white text-gray-900 flex flex-col">
      {logoUrl && (
        <LiveCoursePromoBar
          logoUrl={logoUrl}
          logoAlt={logoAlt ?? "Logo"}
          price={course.price}
          originalPrice={course.originalPrice}
          countdownEnd={course.countdownEnd}
          accentColor={RED}
        />
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-white py-8 lg:py-12" style={{ order: ord("hero") }}>
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
            {/* ── Left: Text Content ── */}
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600">
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                {course.hero?.badgeText ?? D.badge}
              </span>

              <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl lg:text-[2.6rem]">
                {course.hero?.headline ?? D.headline}
                <br />
                <span className="text-red-600">{course.hero?.headlineHighlight ?? D.headlineHighlight}</span>
                <br />
                <span>{course.hero?.headlineAfter ?? D.headlineAfter}</span>
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-gray-500">
                {course.hero?.subtitle ?? D.subtitle}
              </p>

              {/* Info Badges Row */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                {(course.hero?.infoBadges?.length ? course.hero.infoBadges : course.heroInfoBadges?.length ? course.heroInfoBadges : D.infoBadges).map((b, i) => (
                  <span key={i} className="flex items-center gap-2 text-sm">
                    <HeroInfoBadgeIcon name={b.icon} />
                    <span className="text-gray-400">{b.label}</span>
                    <span className="font-semibold text-gray-800">{b.value}</span>
                  </span>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={scrollToEnroll}
                  className="rounded-lg bg-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-red-700 transition-colors"
                >
                  {course.hero?.ctaText ?? "এখনই ভর্তি হোন"}
                </button>
                {course.hero?.secondaryCtaText && (
                  <button className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300">
                      <Play className="h-3.5 w-3.5 text-gray-600" />
                    </span>
                    {course.hero.secondaryCtaText}
                  </button>
                )}
              </div>
            </div>

            {/* ── Right: Anatomical Image ── */}
            <div className="flex justify-center items-center">
              <div className="relative">
                {course.hero?.anatomicalImage || course.hero?.bannerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.hero.anatomicalImage || course.hero.bannerImage!}
                    alt={course.title}
                    className="h-[500px] w-auto object-contain drop-shadow-lg"
                  />
                ) : (
                  <div className="flex h-[500px] w-[380px] items-center justify-center rounded-2xl bg-gradient-to-b from-red-100 to-red-200">
                    <Brain className="h-32 w-32 text-red-300" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Widget (draggable floating bubble/card) ─────────────────── */}
      <div
        ref={widgetRef}
        style={widgetStyle}
        className={`select-none touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* ═══ BUBBLE VIEW (minimized) ═══ */}
        {minimized && (
          <div
            onClick={toggleMinimize}
            className={`group flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-all duration-300 ease-out ${
              dragging
                ? "shadow-[0_12px_40px_-8px_rgba(220,38,38,0.5)] scale-110"
                : "hover:shadow-[0_8px_30px_-4px_rgba(220,38,38,0.4)] hover:scale-105"
            } ${settling ? "scale-100" : ""}`}
          >
            <Heart className="h-6 w-6 fill-white/90" />
            {/* Expand hint on hover */}
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
              Expand
            </span>
          </div>
        )}

        {/* ═══ FULL CARD VIEW (expanded) ═══ */}
        {!minimized && (
          <div className="relative">
            {/* Drop zone indicator (while dragging) */}
            {dragging && (
              <div className="pointer-events-none absolute inset-0 -m-2 rounded-3xl border-2 border-dashed border-red-300 bg-red-50/30 animate-t6-pulse-border" />
            )}

            {/* ── Tutorial hint (first visit only) ── */}
            {showHint && (
              <div className={`pointer-events-none absolute z-10 ${
                isMobile
                  ? "-left-14 top-0 h-full w-20"
                  : "-left-20 top-6 flex flex-col items-center"
              }`}>
                {/* Tooltip */}
                <div className={`whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg animate-t6-fade-in ${
                  isMobile ? "absolute -top-10 left-0" : "mb-2"
                }`}>
                  Drag me anywhere
                  <div className={`absolute h-2 w-2 rotate-45 bg-gray-900 ${
                    isMobile ? "-bottom-1 left-4" : "-bottom-1 left-1/2 -translate-x-1/2"
                  }`} />
                </div>

                {/* Desktop: animated cursor */}
                {!isMobile && (
                  <svg className="h-10 w-10 text-red-500 animate-t6-arrow-sway drop-shadow-md" viewBox="0 0 48 48" fill="none">
                    <path d="M12 36C12 36 18 28 24 24C30 20 36 12 36 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M36 12H28M36 12V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="36" r="3" fill="currentColor" opacity="0.3" />
                  </svg>
                )}

                {/* Mobile: finger + dotted path */}
                {isMobile && (
                  <svg className="absolute left-2 top-4 h-24 w-16" viewBox="0 0 64 96" fill="none">
                    <path
                      d="M32 12 C32 12, 32 30, 32 44 C32 58, 18 72, 10 82"
                      stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"
                      className="text-red-300 animate-t6-draw-path" strokeLinecap="round"
                    />
                    <g className="animate-t6-finger-drag">
                      <rect x="22" y="2" width="16" height="32" rx="8" fill="#f87171" opacity="0.9" />
                      <circle cx="30" cy="6" r="5" fill="#ef4444" />
                      <ellipse cx="30" cy="5" rx="3" ry="2.5" fill="#fca5a5" />
                      <line x1="25" y1="14" x2="35" y2="14" stroke="#fca5a5" strokeWidth="0.8" />
                      <line x1="25" y1="20" x2="35" y2="20" stroke="#fca5a5" strokeWidth="0.8" />
                    </g>
                  </svg>
                )}
              </div>
            )}

            {/* ── Main card ── */}
            <div
              className={`w-[min(320px,calc(100vw-32px))] rounded-2xl border bg-white overflow-hidden origin-top-right ${
                dragging
                  ? "border-red-300 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)] scale-[1.03]"
                  : settling
                    ? "border-gray-100 shadow-lg scale-100"
                    : "border-gray-100 shadow-lg hover:shadow-xl"
              } ${dragging ? "transition-none" : "transition-all duration-300 ease-out"}`}
            >
              {/* Handle bar + minimize button */}
              <div className={`flex items-center justify-between px-3 py-2 transition-colors duration-200 ${
                dragging ? "bg-red-50" : "bg-gray-100 hover:bg-gray-200"
              }`}>
                <div className="flex items-center gap-1.5">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-400 select-none">
                    {isMobile ? "Press & hold" : "Drag to move"}
                  </span>
                </div>
                <button
                  onClick={toggleMinimize}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Red Header */}
              <div className="bg-red-600 px-5 py-4">
                <h2 className="text-center text-base font-bold text-white">
                  {course.hero?.pricingCard?.header ?? course.heroPricingCard?.header ?? D.heroPricingCard?.header}
                </h2>
              </div>

              {/* Tiers */}
              <div className="space-y-0 divide-y divide-gray-100">
                {(course.hero?.pricingCard?.tiers ?? course.heroPricingCard?.tiers ?? D.heroPricingCard?.tiers ?? []).map((tier, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5">
                    <span className="flex items-center gap-2.5 text-sm text-gray-600">
                      <PricingTierIcon name={tier.icon} />
                      {tier.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {tier.value}
                      {tier.suffix && <span className="ml-1 text-xs font-normal text-gray-400">{tier.suffix}</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Highlighted Pricing */}
              {(() => {
                const hl = course.hero?.pricingCard?.highlighted ?? course.heroPricingCard?.highlighted ?? D.heroPricingCard?.highlighted;
                if (!hl) return null;
                return (
                  <div className="mx-4 my-3 rounded-xl border-2 border-red-200 bg-red-50/50 p-4 text-center">
                    <p className="text-xs font-semibold text-red-500">{hl.label}</p>
                    <p className="mt-1 text-2xl font-extrabold text-red-600">
                      {hl.value}
                      {hl.suffix && <span className="ml-1 text-sm font-normal text-red-400">{hl.suffix}</span>}
                    </p>
                    {hl.badge && (
                      <span className="mt-2 inline-block rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold text-white">
                        {hl.badge}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* CTA */}
              <div className="px-4 pb-4">
                <button
                  onClick={scrollToEnroll}
                  className="w-full rounded-lg bg-red-600 py-3.5 text-sm font-bold text-white shadow hover:bg-red-700 transition-colors"
                >
                  {course.hero?.pricingCard?.ctaText ?? course.heroPricingCard?.ctaText ?? D.heroPricingCard?.ctaText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-6" style={{ order: ord("statsBar") }}>
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 rounded-xl border border-red-100 bg-white px-3 py-4 text-center">
              <span className="text-lg font-extrabold text-red-700">{s.value}</span>
              <span className="text-xs font-medium text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison Table + Organ Grid ──────────────────────────────────── */}
      <section className="bg-white py-10" style={{ order: ord("comparison") }}>
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
            {/* ── Left: Comparison Table ── */}
            <div>
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                {h.comparison ?? "কেন আমাদের কোর্স সেরা?"}
              </h2>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white">
                      <th className="px-5 py-3.5 text-left text-sm font-bold text-red-600">বিষয়</th>
                      <th className="px-5 py-3.5 text-center text-sm font-semibold text-gray-500">নিজে নিজে পড়ুন</th>
                      <th className="px-5 py-3.5 text-center text-sm font-bold text-red-600">আমাদের কোর্স</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-700">{row.feature}</td>
                        <td className="px-5 py-3.5 text-center">
                          {row.selfStudy ? (
                            <Check className="mx-auto h-5 w-5 text-green-500" />
                          ) : (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-sm font-bold text-red-400">✕</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {row.liveCourse ? (
                            <Check className="mx-auto h-5 w-5 text-green-500" />
                          ) : (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-sm font-bold text-red-400">✕</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Green bottom banner */}
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <Check className="h-5 w-5 shrink-0 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  শুধু তথ্য মূলক নয় — যুক্ত পেয়ে যান সম্পূর্ণ ১৩০+ অনলাইন লাইভ ক্লাস
                </span>
              </div>
            </div>

            {/* ── Right: Organ Grid ── */}
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {organs.map((o, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex h-16 w-16 items-center justify-center">
                      <OrganIcon name={o.name} />
                    </div>
                    <span className="text-center text-xs font-semibold text-gray-700">{o.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Curriculum ────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-10" style={{ order: ord("curriculum") }}>
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-xl font-bold text-gray-900">
            {h.curriculum ?? "কোর্স কারিকুলাম (মোট ৫টি মডিউল)"}
          </h2>
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1">
            {curriculum.length > 0 ? curriculum.map((mod, i) => (
              <CurriculumGroup key={i} index={i} title={mod.title} lessons={mod.lessons ?? []} />
            )) : (
              <>
                <CurriculumGroup index={0} title="Module 01 — মানবদেহের প্রাথমিক ধারণা" lessons={["মানবদেহের পারিভাষিক", "Anatomy কি?", "Physiology কি?", "Body Organization & Systems"]} />
                <CurriculumGroup index={1} title="Module 02 — Major Organs — গঠন ও কার্যাবলী" lessons={["Brain — মস্তিষ্ক", "Heart — হৃদয়", "Lungs — ফুসফুস", "Liver — যকৃৎ", "Kidneys — কিডনি", "Stomach — পাকস্থলী", "Intestine — অন্ত্র", "Pancreas — পাকস্থলী", "Spleen — প্লীহা", "Skin — ত্বক", "Thyroid Gland — থাইরয়েড গ্ল্যান্ড"]} />
                <CurriculumGroup index={2} title="Module 03 — Organ Systems & Their Relationships" lessons={["শরীরের অঙ্গগুলোর পারস্পরিক সম্পর্ক", "Body Systems", "Physiological Functions"]} />
                <CurriculumGroup index={3} title="Module 04 — Practice & Revision" lessons={["Anatomy Practice", "Physiology Practice", "Revision Class", "Knowledge Check"]} />
                <CurriculumGroup index={4} title="Module 05 — Extra Knowledge Classes" lessons={["Extra Knowledge", "Practical Concepts", "Common Questions", "Final Review"]} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Instructor ────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-10" style={{ order: ord("instructor") }}>
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
            {h.instructor ?? "কোর্স ইন্সট্রাক্টর"}
          </h2>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-gray-200 bg-white p-6 sm:flex-row">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-red-100">
              {course.t6Instructor?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.t6Instructor.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-red-600">
                  <Users className="h-10 w-10" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{course.t6Instructor?.name ?? D.instructor.name}</h3>
              <p className="text-sm font-medium text-red-600">{course.t6Instructor?.title ?? D.instructor.title}</p>
              <p className="mt-1 text-sm text-gray-600">{course.t6Instructor?.credentials ?? D.instructor.credentials}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Heart className="h-3 w-3 text-red-500" />
                {course.t6Instructor?.hospital ?? D.instructor.hospital}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who Is This For ───────────────────────────────────────────────── */}
      <section className="bg-white py-10" style={{ order: ord("whoFor") }}>
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
            {course.t6WhoFor?.title ?? h.whoFor ?? D.whoForTitle}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {whoFor.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                <Check className="h-4 w-4 shrink-0 text-red-600" />
                <span className="text-sm font-medium text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value / Pricing ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-10" style={{ order: ord("valueBreakdown") }}>
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
            {h.valueBreakdown ?? "কোর্স ভর্তি ফি এর আজই"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {pricing.map((tier, i) => (
              <div
                key={i}
                className={`rounded-2xl border-2 p-6 text-center ${
                  tier.highlighted
                    ? "border-red-500 bg-red-50 shadow-lg scale-105"
                    : "border-gray-200 bg-white"
                }`}
              >
                {tier.highlighted && (
                  <span className="mb-2 inline-block rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                    সাশ্রয়ী ১৫,০০০
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                <p className="mt-2 text-3xl font-extrabold text-gray-900">{tier.price}</p>
                <p className="text-sm text-gray-500">{tier.period}</p>
                {tier.features?.map((f, j) => (
                  <p key={j} className="mt-2 text-xs text-gray-600">{f}</p>
                ))}
                <button
                  onClick={scrollToEnroll}
                  className={`mt-4 w-full rounded-lg py-3 text-sm font-bold transition-colors ${
                    tier.highlighted
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {tier.highlighted ? "এখনই ভর্তি হোন →" : "বিকল্প নির্বাচন করুন"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Video ─────────────────────────────────────────────────────────── */}
      {course.t6Video && (
        <section className="bg-white py-10" style={{ order: ord("video") }}>
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
              {h.video ?? "কোর্স কেমন হবে, দেখে নিন"}
            </h2>
            <div className="aspect-video overflow-hidden rounded-xl bg-gray-900">
              <iframe
                src={getYouTubeEmbed(course.t6Video)}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-10" style={{ order: ord("faq") }}>
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
            {h.faq ?? "সচরাচর জিজ্ঞাসা (FAQ)"}
          </h2>
          <div className="space-y-3">
            {faq.map((f, i) => (
              <FaqItem key={i} q={f.question} a={f.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="bg-white py-10" style={{ order: ord("testimonials") }}>
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
              {h.testimonials ?? "আমাদের শিক্ষার্থীরা যা বলছেন"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`h-4 w-4 ${(t.rating ?? 5) > j ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700">{t.text}</p>
                  <p className="mt-3 text-xs font-semibold text-gray-900">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Enrollment ────────────────────────────────────────────────────── */}
      <section id="t6-enroll" className="bg-red-900 py-10" style={{ order: ord("enrollment") }}>
        <div className="container mx-auto max-w-xl px-4">
          <div className="rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
              {h.enrollment ?? "এখনই ভর্তি হোন"}
            </h2>
            {!previewMode && (
              <LiveEnrollmentForm
                course={{ id: course.id, title: course.title, price: course.price, slug: course.slug, batchId: course.batchId ?? null }}
                user={user}
                enrolled={enrolled}
                checkoutError={checkoutError}
              />
            )}
          </div>
        </div>
      </section>
    </TemplateStyleScope>
  );
}
