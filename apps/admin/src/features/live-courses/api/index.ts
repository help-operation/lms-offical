import { apiRequest } from "@/lib/api-client";
import type { StyleOverrides } from "@repo/ui/template-style-overrides";

export interface LiveCourseSection {
  /** Per-element style overrides keyed by selector path (click-to-edit). */
  styleOverrides?: StyleOverrides;
  /** Icon shown before each curriculum lesson row. */
  lessonIcon?: string;
  hero?: {
    badgeText?: string;
    subtitle?: string;
    bannerImage?: string;
    rating?: number;
    ratingCount?: number;
    ctaText?: string;
    secondaryCtaText?: string;
    promoText?: string;
    studentCountText?: string;
    // Template 2 split headline
    headline?: string;
    headlineHighlight?: string;
    headlineAfter?: string;
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
    name: string; title?: string; image?: string;
    bio?: string; students?: string; courses?: string; rating?: string;
    years?: string; clients?: string; projects?: string; profileUrl?: string;
  }>;
  whatYouGet?: Array<{ title: string; description?: string; icon?: string }>;
  videos?: Array<{ url: string; title?: string; description?: string }>;
  testimonials?: Array<{ name: string; role?: string; review: string }>;
  valueItems?: Array<{ title: string; description?: string; value: string }>;
  /** Editable copy for the Value Breakdown section (Template 1). */
  valueSection?: { heading?: string; totalLabel?: string; offerLine?: string; ctaText?: string };
  /** Custom heading text per page section, keyed by section id. */
  sectionHeadings?: Record<string, string>;
  /** Custom render order of page sections, by section id. Empty = template default. */
  sectionOrder?: string[];
}

export interface LiveCourse extends LiveCourseSection {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published" | "inactive" | "scheduled" | "trash";
  publishAt: string | null;
  showBadge: boolean;
  hasLifetimeAccess: boolean;
  accessDurationDays: number | null;
  price: string;
  originalPrice: string | null;
  hasSubscription: boolean;
  monthlyPrice: string | null;
  totalValue: string | null;
  totalLiveClasses: string | null;
  totalModules: string | null;
  countdownEnd: string | null;
  template: string;
  // Template 2 specific
  faq?: Array<{ question: string; answer: string }>;
  comparisonTable?: {
    col1Label?: string; col2Label?: string;
    rows?: Array<{ feature: string; col1?: string; col2?: string; highlight?: boolean }>;
  };
  pcRequirements?: {
    basic?: { ram?: string; processor?: string; storage?: string; graphics?: string; note?: string };
    pro?:   { ram?: string; processor?: string; storage?: string; graphics?: string; note?: string };
    internet?: string;
  };
  ctaBanner?: { label?: string; title?: string; price?: string; originalPrice?: string; buttonText?: string; installment1?: string; installment2?: string };
  certificate?: { title?: string; highlight?: string; description?: string; image?: string; founderName?: string; founderRole?: string };
  urgencyCta?: { batchLabel?: string; title?: string; highlight?: string; subtitle?: string; buttonText?: string; whatsapp?: string };
  videoTabs?: Array<{ category: string; videos: Array<{ url: string; title?: string; thumbnail?: string }> }>;
  // Template 3 specific
  marqueeText?: string | null;
  announcementBar?: { text?: string; ctaText?: string; ctaAnchor?: string };
  blueprintSection?: { title?: string; subtitle?: string; image?: string };
  whyJoinItems?: string[];
  featuresGrid?: { title?: string; subtitle?: string; items?: Array<{ icon?: string; text: string }> };
  bonusChecklist?: { title?: string; items?: string[] };
  challengeSection?: { title?: string; monthCount?: string; description?: string; linkText?: string };
  supportLevels?: { title?: string; subtitle?: string; levels?: Array<{ label: string; description: string; color?: string }> };
  salesUpdateSlider?: { title?: string; subtitle?: string; images?: string[] };
  communitySection?: { title?: string; subtitle?: string; caption?: string; images?: string[] };
  textReviewsSlider?: { title?: string; reviews?: Array<{ name: string; role?: string; avatar?: string; text: string }> };
  successStories?: { title?: string; stories?: Array<{ name: string; badge?: string; description?: string; image?: string }> };
  videoGrid?: { title?: string; videos?: Array<{ url: string; thumbnail?: string }> };
  faqContactButtons?: { messengerUrl?: string; phone?: string };
  footerBranding?: { brandName?: string; tagline?: string; copyright?: string };
  // Template 4 specific
  t4LiveSessionCard?: { batchLabel?: string; title?: string; description?: string; mentorLine1?: string; mentorLine2?: string; features?: string[]; ctaText?: string };
  t4StudentProgress?: { preText?: string; title?: string; images?: string[] };
  t4ForWhomSection?: { title?: string; titleHighlight?: string; cards?: Array<{ icon?: string; title: string; description?: string }>; closingText?: string };
  t4InstructorStory?: { title?: string; titleHighlight?: string; bio?: string; videoUrl?: string };
  t4ModuleGrid?: { title?: string; titleHighlight?: string; modules?: Array<{ icon?: string; title: string; bullets?: string[]; fullWidth?: boolean }> };
  t4PricingSection?: { bonusLabel?: string; bonusText?: string; savingsText?: string; ctaText?: string; paymentBadge1?: string; paymentBadge2?: string; paymentBadge3?: string };
  t4SupportSection?: { title?: string; content?: string; instructorImage?: string };
  t4CountdownBanner?: { text?: string; ctaText?: string };
  // Template 5 specific
  t5StatCards?: Array<{ icon?: string; value: string; label: string }>;
  t5WhoFor?: { title?: string; items?: string[]; ctaText?: string; ctaUrl?: string };
  t5RealProjects?: { title?: string; items?: string[] };
  t5Roadmap?: { title?: string; steps?: Array<{ title: string; description?: string }> };
  // Template 6 specific
  t6Credentials?: Array<{ icon: string; label: string }>;
  t6Stats?: Array<{ value: string; label: string }>;
  t6Comparison?: Array<{ feature: string; selfStudy: boolean; liveCourse: boolean }>;
  t6Organs?: Array<{ name: string; icon?: string }>;
  t6Instructor?: { name?: string; title?: string; credentials?: string; photo?: string; hospital?: string };
  t6WhoFor?: { title?: string; items?: string[] };
  t6Pricing?: { tiers?: Array<{ name: string; price: string; period: string; features?: string[]; highlighted?: boolean }> };
  t6Video?: string;
  t6Testimonials?: Array<{ name: string; rating?: number; text: string; photo?: string }>;
  /** If true, students must complete lessons in order to unlock the next one. */
  requireSequentialProgress?: boolean;
  /** Whether this is a live course or a recorded-course bundle. */
  courseType?: 'live' | 'bundle';
  /** Recorded courses included in this bundle (populated when courseType = 'bundle'). */
  bundledCourses?: RecordedCourseSummary[];
  /** IDs of recorded courses to include (write-only, used in create/update). */
  bundledCourseIds?: number[];
  createdAt: string;
  updatedAt: string;
}

export type LiveCourseListItem = Pick<
  LiveCourse,
  "id" | "title" | "slug" | "status" | "publishAt" | "price" | "originalPrice" | "createdAt" | "updatedAt" | "template"
>;

export type UpsertLiveCourseDto = Omit<LiveCourse, "id" | "createdAt" | "updatedAt" | "status" | "publishAt">;

// ─── Curriculum types ─────────────────────────────────────────────────────────

export interface LiveCourseLesson {
  id: number;
  moduleId: number;
  liveCourseId: number;
  title: string;
  type: "video" | "text";
  videoSource: "bunny" | "external" | null;
  bunnyVideoId: string | null;
  bunnyStatus: "processing" | "ready" | "failed" | null;
  externalVideoUrl: string | null;
  duration: number;
  content: string | null;
  isFree: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiveCourseModule {
  id: number;
  liveCourseId: number;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  lessons: LiveCourseLesson[];
}

export const adminLiveCurriculumApi = {
  getModules: (courseId: number) =>
    apiRequest<LiveCourseModule[]>(`/admin/live-courses/${courseId}/modules`),

  createModule: (courseId: number, title: string) =>
    apiRequest<LiveCourseModule>(`/admin/live-courses/${courseId}/modules`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  updateModule: (moduleId: number, title: string) =>
    apiRequest<LiveCourseModule>(`/admin/live-courses/modules/${moduleId}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),

  deleteModule: (moduleId: number) =>
    apiRequest<{ deleted: boolean }>(`/admin/live-courses/modules/${moduleId}`, {
      method: "DELETE",
    }),

  reorderModules: (courseId: number, order: { id: number; order: number }[]) =>
    apiRequest<LiveCourseModule[]>(`/admin/live-courses/${courseId}/modules/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),

  createLesson: (moduleId: number, data: { title: string; type?: string; content?: string; isFree?: boolean }) =>
    apiRequest<LiveCourseLesson>(`/admin/live-courses/modules/${moduleId}/lessons`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateLesson: (lessonId: number, data: Partial<LiveCourseLesson>) =>
    apiRequest<LiveCourseLesson>(`/admin/live-courses/lessons/${lessonId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteLesson: (lessonId: number) =>
    apiRequest<{ deleted: boolean }>(`/admin/live-courses/lessons/${lessonId}`, {
      method: "DELETE",
    }),

  reorderLessons: (moduleId: number, order: { id: number; order: number }[]) =>
    apiRequest<LiveCourseLesson[]>(`/admin/live-courses/modules/${moduleId}/lessons/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),

  getBunnyCredentials: (lessonId: number) =>
    apiRequest<{ uploadUrl: string; videoId: string; title: string }>(`/admin/live-courses/lessons/${lessonId}/bunny-credentials`, {
      method: "POST",
    }),

  setExternalUrl: (lessonId: number, url: string, duration?: number) =>
    apiRequest<LiveCourseLesson>(`/admin/live-courses/lessons/${lessonId}/external-url`, {
      method: "POST",
      body: JSON.stringify({ url, duration }),
    }),
};

export const adminLiveCoursesApi = {
  list: (status?: string) =>
    apiRequest<LiveCourseListItem[]>(
      `/admin/live-courses${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),

  get: (id: number) =>
    apiRequest<LiveCourse>(`/admin/live-courses/${id}`),

  checkSlug: (slug: string, excludeId?: number) =>
    apiRequest<{ available: boolean }>(
      `/admin/live-courses/check-slug?slug=${encodeURIComponent(slug)}${excludeId ? `&excludeId=${excludeId}` : ""}`,
    ),

  create: (data: UpsertLiveCourseDto) =>
    apiRequest<LiveCourse>("/admin/live-courses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<UpsertLiveCourseDto>) =>
    apiRequest<LiveCourse>(`/admin/live-courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  duplicate: (id: number, includeCurriculum: boolean) =>
    apiRequest<LiveCourse>(`/admin/live-courses/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify({ includeCurriculum }),
    }),

  togglePublish: (id: number) =>
    apiRequest<{ id: number; status: string }>(`/admin/live-courses/${id}/toggle-publish`, {
      method: "PATCH",
    }),

  delete: (id: number) =>
    apiRequest<{ deleted: boolean }>(`/admin/live-courses/${id}`, {
      method: "DELETE",
    }),

  restore: (id: number) =>
    apiRequest<LiveCourse>(`/admin/live-courses/${id}/restore`, { method: "POST" }),

  purge: (id: number) =>
    apiRequest<{ deleted: boolean }>(`/admin/live-courses/${id}/purge`, { method: "DELETE" }),

  schedule: (id: number, publishAt: string) =>
    apiRequest<LiveCourse>(`/admin/live-courses/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ publishAt }),
    }),

  unschedule: (id: number) =>
    apiRequest<LiveCourse>(`/admin/live-courses/${id}/unschedule`, { method: "POST" }),
};

// ─── Recorded courses (for bundle picker) ────────────────────────────────────

export interface RecordedCourseSummary {
  id: number;
  title: string;
  slug: string;
  price: string;
  thumbnail: string | null;
}

export const adminRecordedCoursesApi = {
  list: () => apiRequest<RecordedCourseSummary[]>('/admin/live-courses/recorded-courses'),
};

// ─── Teachers (for "Add from teachers" in the Instructors panel) ──────────────

export interface LiveCourseTeacher {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatar: string | null;
  bio: string | null;
  expertise: string | null;
  displayName: string | null;
  displayAvatar: string | null;
  totalStudents: number;
  totalCourses: number;
  rating: string | null;
}

export const liveCourseTeachersApi = {
  list: () => apiRequest<LiveCourseTeacher[]>(`/admin/live-courses/teachers`),
};
