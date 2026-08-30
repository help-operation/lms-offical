import { apiRequest } from "@/lib/api-client";
import type { StyleOverrides } from "@repo/ui/template-style-overrides";

// ─── Card-level type (list endpoint) ─────────────────────────────────────────

export interface PublicLiveCourseCard {
  id: number;
  title: string;
  slug: string;
  price: string;
  originalPrice: string | null;
  totalLiveClasses: string | null;
  countdownEnd: string | null;
  template: string;
  hero?: { bannerImage?: string; rating?: number; ratingCount?: number };
  showBadge: boolean;
  createdAt: string;
}

// ─── Full detail type (single-course endpoint) ────────────────────────────────

export interface PublicLiveCourse {
  id: number;
  title: string;
  slug: string;
  status: "published";
  price: string;
  originalPrice: string | null;
  totalValue: string | null;
  totalLiveClasses: string | null;
  countdownEnd: string | null;
  template: string;            // "1" | "2" | "3" | "4" | "5" | "6"
  createdAt: string;
  updatedAt: string;

  /** Per-element style overrides keyed by selector path (click-to-edit). */
  styleOverrides?: StyleOverrides;
  /** Icon shown before each curriculum lesson row. */
  lessonIcon?: string;
  /** Editable copy for the Value Breakdown section (Template 1). */
  valueSection?: { heading?: string; totalLabel?: string; offerLine?: string; ctaText?: string };

  // Template 1 fields
  hero?: {
    badgeText?: string; subtitle?: string; bannerImage?: string;
    videoUrl?: string; rating?: number; ratingCount?: number;
    ctaText?: string; secondaryCtaText?: string; promoText?: string; studentCountText?: string;
    // Template 2 split headline
    headline?: string; headlineHighlight?: string; headlineAfter?: string;
    // Template 6 medical
    anatomicalImage?: string;
    infoBadges?: Array<{ icon: string; label: string; value: string }>;
    pricingCard?: {
      header?: string;
      tiers?: Array<{ icon?: string; label: string; value: string; suffix?: string }>;
      highlighted?: { label?: string; value: string; suffix?: string; badge?: string };
      ctaText?: string;
      installmentNote?: string;
    };
  };
  paymentLogos?: Array<{ name: string; image?: string }>;
  batchInfo?: { startDate?: string; liveSchedule?: string; supportSchedule?: string; seatsLeft?: string };
  curriculum?: Array<{ title: string; lessons?: string[] }>;
  tools?: Array<{ name: string; icon?: string; bgColor?: string }>;
  whyDifferent?: Array<{ title: string; description?: string; icon?: string }>;
  stats?: { studentsCount?: string; ratingsCount?: string; completionRate?: string; extra?: string; labels?: [string,string,string,string] };
  instructors?: Array<{ name: string; title?: string; image?: string; bio?: string; students?: string; courses?: string; rating?: string; years?: string; clients?: string; projects?: string; profileUrl?: string }>;
  whatYouGet?: Array<{ title: string; description?: string; icon?: string }>;
  videos?: Array<{ url: string; title?: string; description?: string }>;
  testimonials?: Array<{ name: string; role?: string; review: string; rating?: number; batch?: string }>;
  valueItems?: Array<{ title: string; description?: string; value: string }>;

  // Active / upcoming batch (set by backend from live_course_batches table)
  activeBatch?: {
    id: number;
    batchName: string;
    status: "upcoming" | "active" | "ended";
    startDate?: string | null;
    endDate?: string | null;
    schedule?: string | null;
    supportSchedule?: string | null;
    maxSeats?: number | null;
    seatsFilled: number;
    countdownEnd?: string | null;
  } | null;

  // Template 2 fields
  comparisonTable?: { col1Label?: string; col2Label?: string; rows?: Array<{ feature: string; col1?: string; col2?: string; highlight?: boolean }> };
  faq?: Array<{ question: string; answer: string }>;
  pcRequirements?: { basic?: { ram?: string; processor?: string; storage?: string; graphics?: string; note?: string }; pro?: { ram?: string; processor?: string; storage?: string; graphics?: string; note?: string }; internet?: string };
  ctaBanner?: { label?: string; title?: string; price?: string; originalPrice?: string; buttonText?: string; installment1?: string; installment2?: string };
  certificate?: { title?: string; highlight?: string; description?: string; image?: string; founderName?: string; founderRole?: string };
  urgencyCta?: { batchLabel?: string; title?: string; highlight?: string; subtitle?: string; buttonText?: string; whatsapp?: string };
  videoTabs?: Array<{ category: string; videos: Array<{ url: string; title?: string; thumbnail?: string }> }>;

  // Template 6 fields (Medical Style)
  t6Credentials?: Array<{ icon: string; label: string }>;
  t6Stats?: Array<{ value: string; label: string }>;
  t6Comparison?: Array<{ feature: string; selfStudy: boolean; liveCourse: boolean }>;
  t6Organs?: Array<{ name: string; icon?: string }>;
  t6Instructor?: { name?: string; title?: string; credentials?: string; photo?: string; hospital?: string };
  t6WhoFor?: { title?: string; items?: string[] };
  t6Pricing?: { tiers?: Array<{ name: string; price: string; period: string; features?: string[]; highlighted?: boolean }> };
  t6Video?: string;
  t6Testimonials?: Array<{ name: string; rating?: number; text: string; photo?: string }>;

  /** Whether this is a live course or a recorded-course bundle. */
  courseType?: 'live' | 'bundle';
  /** Recorded courses included in this bundle (only when courseType = 'bundle'). */
  bundledCourses?: Array<{ id: number; title: string; slug: string; price: string; thumbnail: string | null }>;
}

export const liveCoursesApi = {
  list: () =>
    apiRequest<PublicLiveCourseCard[]>(`/live-courses`),

  getBySlug: (slug: string) =>
    apiRequest<PublicLiveCourse>(`/live-courses/by-path?path=${encodeURIComponent(slug)}`),

  getById: (id: number) =>
    apiRequest<PublicLiveCourse>(`/live-courses/by-id/${id}`),
};
