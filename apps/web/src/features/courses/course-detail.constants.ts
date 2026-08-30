import {
  PlayCircle,
  FileText,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Award,
  Video,
  Code,
  Clock,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  CourseFacility,
  CourseFaqItem,
  DetailPageSection,
} from "@/features/courses/api";

/**
 * Map admin-editable icon strings → lucide React components.
 * Keep these in sync with FACILITY_ICONS in the admin's CourseDetailPageForm.
 */
export const FACILITY_ICON_MAP: Record<string, LucideIcon> = {
  "play-circle":    PlayCircle,
  "file-text":      FileText,
  "check-circle":   CheckCircle2,
  "book-open":      BookOpen,
  "graduation-cap": GraduationCap,
  "award":          Award,
  "video":          Video,
  "code":           Code,
  "clock":          Clock,
  "users":          Users,
};

export function getFacilityIcon(iconKey: string): LucideIcon {
  return FACILITY_ICON_MAP[iconKey] ?? PlayCircle;
}

/**
 * Canonical body-section list with admin-friendly labels + nav labels.
 * Keep in sync with SECTION_DEFINITIONS in the admin's CourseDetailPageForm.
 * `nav` is shown in the sticky section nav; sections without `nav` are
 * rendered but don't appear in the nav (e.g. "more-questions" CTA).
 */
export const SECTION_DEFINITIONS: { id: string; label: string; nav?: string }[] = [
  { id: "instructor",     label: "Course Instructor",                 nav: "Course Instructor" },
  { id: "structure",      label: "How the course is organized",       nav: "How it's organized" },
  { id: "learn",          label: "What you'll learn",                 nav: "What you'll learn" },
  { id: "details",        label: "Course details",                     nav: "Course details" },
  { id: "content",        label: "Content preview (curriculum)",       nav: "Content preview" },
  { id: "certificate",    label: "Certificate",                        nav: "Certificate" },
  { id: "reviews",        label: "What students say + Reviews",        nav: "Reviews" },
  { id: "requirements",   label: "Requirements",                       nav: "Requirements" },
  { id: "payment",        label: "How to pay",                         nav: "How to pay" },
  { id: "faq",            label: "FAQ",                                nav: "FAQ" },
  { id: "more-questions", label: "Have more questions? (call CTA)" },
];

// Mastery template only needs curriculum section
export const MASTERY_SECTION_DEFINITIONS: { id: string; label: string; nav?: string }[] = [
  { id: "content", label: "Content preview (curriculum)", nav: "Content preview" },
];

export function getSectionDefinitions(template: string): { id: string; label: string; nav?: string }[] {
  return template === "2" ? MASTERY_SECTION_DEFINITIONS : SECTION_DEFINITIONS;
}

export const DEFAULT_SECTION_ORDER: DetailPageSection[] = SECTION_DEFINITIONS.map(
  (s) => ({ id: s.id, enabled: true }),
);

export const MASTERY_DEFAULT_SECTION_ORDER: DetailPageSection[] = MASTERY_SECTION_DEFINITIONS.map(
  (s) => ({ id: s.id, enabled: true }),
);

function getDefaultSectionOrder(template: string): DetailPageSection[] {
  return template === "2" ? MASTERY_DEFAULT_SECTION_ORDER : DEFAULT_SECTION_ORDER;
}

/**
 * Merge saved section list with the canonical definition: keeps saved order
 * & enabled state where present, appends any new section types at the end
 * so courses don't lose sections when we add new ones in code.
 */
export function mergeDetailPageSections(
  saved: DetailPageSection[] | null | undefined,
  template?: string,
): DetailPageSection[] {
  const tmpl = template ?? "1";
  const definitions = getSectionDefinitions(tmpl);
  const validIds = new Set(definitions.map((s) => s.id));
  const savedList = Array.isArray(saved) && saved.length > 0 ? saved : getDefaultSectionOrder(tmpl);
  const savedIds = new Set(savedList.map((s) => s.id));
  const kept = savedList.filter((s) => validIds.has(s.id));
  const missing = definitions
    .filter((s) => !savedIds.has(s.id))
    .map((s) => ({ id: s.id, enabled: true }));
  return [...kept, ...missing];
}

/**
 * Build the sticky-nav items for a given resolved sections list.
 * Skips disabled sections AND sections without a `nav` label.
 */
export function buildNavItems(
  sections: DetailPageSection[],
): { id: string; label: string }[] {
  return sections
    .filter((s) => s.enabled)
    .map((s) => {
      const def = SECTION_DEFINITIONS.find((d) => d.id === s.id);
      if (!def?.nav) return null;
      return { id: s.id, label: def.nav };
    })
    .filter((x): x is { id: string; label: string } => x !== null);
}

/**
 * Per-course content DEFAULTS — used when a course's DB columns are empty
 * (admin hasn't customized that course yet) OR when the API is unreachable.
 * Mirrors the starter values seeded into the admin editor for a fresh course.
 */

export const DEFAULT_FACILITIES: CourseFacility[] = [
  { icon: "play-circle",  title: "Video lectures",     desc: "Recorded lessons you can watch anytime, at your own pace." },
  { icon: "file-text",    title: "Lecture sheets",     desc: "Chapter-wise notes and sheets after every lesson." },
  { icon: "check-circle", title: "Quiz sets",          desc: "Self-assessment quizzes to test what you've learned." },
  { icon: "book-open",    title: "Practice exercises", desc: "Hands-on exercises you can do any time to build real skill." },
];

export const DEFAULT_TARGET_AUDIENCE =
  "Anyone who wants to build practical, job-ready skills — from complete beginners to those looking to level up. Learn at your own pace, on any device.";

export const DEFAULT_CERTIFICATE_PERKS: string[] = [
  "Add it to your CV / resume",
  "Share it directly on your LinkedIn profile",
  "Share it on Facebook with one click",
];


export const DEFAULT_FAQ: CourseFaqItem[] = [
  { question: "How do I buy this course?",                  answer: "Click 'Buy this course' → 'Get started' → log in with your phone or email → choose a payment method → complete payment. The course instantly appears in 'My Courses'." },
  { question: "How do I pay with bKash?",                   answer: "Select bKash at checkout, complete the payment from your bKash app, and your enrollment activates automatically." },
  { question: "How do I report a technical problem?",       answer: "Use the community group, one-to-one support, or the Contact page — our support team responds quickly during office hours." },
  { question: "Can I cancel a course enrollment?",          answer: "Yes, within the refund window. Contact support with your order details and we'll process it." },
  { question: "How do I start the course after buying?",    answer: "After payment, click 'Start course' or open your dashboard — all enrolled courses live there." },
];

/** Site-wide defaults that act as fallbacks for per-course overrides. */
export const DEFAULT_SUPPORT_PHONE = "16910";
export const DEFAULT_WHATSAPP_NUMBER = "8801XXXXXXXXX";
export const DEFAULT_PAYMENT_INSTRUCTIONS =
  "Pay securely with bKash, Nagad, Rocket or card via SSLCommerz. Need help?";
