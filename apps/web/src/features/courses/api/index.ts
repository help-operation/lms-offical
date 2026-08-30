import { apiRequest } from "@/lib/api-client";

export interface PreviewSlide {
  type: "image" | "video";
  url: string;
  source?: "r2" | "youtube" | "vimeo" | "external";
}

export interface PublicCourse {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  thumbnail: string | null;
  price: string;
  discountPrice: string | null;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  isFeatured: boolean;
  showBadge: boolean;
  totalLessons: number;
  totalDuration: number;
  totalStudents: number;
  rating: string | null;
  ratingCount: number;
  ratingSource: string;
  previewPlaybackId: string | null;
  previewSlides: PreviewSlide[] | null;
  categoryName: string | null;
  categorySlug: string | null;
  instructorFirstName: string;
  instructorLastName: string;
  instructorAvatar: string | null;
  styleOverrides?: Record<string, any>;
  batchInfo?: { label: string; value: string; bgColor: string }[];
  toolsInfo?: { name: string; image: string; bgColor: string }[];
  toolsTitle?: string | null;
  whyDifferentInfo?: { title?: string; features?: { title: string; description: string; image: string; bgColor: string }[]; stats?: { value: string; label: string; bgColor: string }[] };
  instructorsInfo?: { title?: string; instructors?: { name: string; role: string; photo: string; years: string; clients: string; projects: string; yearsLabel?: string; clientsLabel?: string; projectsLabel?: string; summary: string; skills: string[]; experience: string[]; companies: { name: string; logo: string }[] }[] };
  benefitsTitle?: string | null;
  benefitsInfo?: { title?: string; subtitle?: string; items?: { title: string; description: string; image: string }[] };
  videoTestimonialsInfo?: { title?: string; items?: { title: string; videoUrl: string }[] };
  testimonialsInfo?: { title?: string; items?: { name: string; role: string; quote: string }[] };
  valueBreakdownInfo?: { title?: string; highlightWords?: string; items?: { name: string; price: string; description: string }[]; offerTitle?: string; offerHighlight?: string; offerSubtitle1?: string; offerSubtitle2?: string; ctaText?: string; paymentButtonText?: string; offerLabel?: string; timerHours?: string; timerMinutes?: string; timerSeconds?: string };
}

export interface CourseFacility {
  icon: string;
  title: string;
  desc: string;
}


export interface CourseFaqItem {
  question: string;
  answer: string;
}

export interface DetailPageSection {
  id: string;
  enabled: boolean;
}

export interface PublicCourseDetail extends PublicCourse {
  status: string;
  learningOutcomes: string | null;
  requirements: string | null;
  instructorId: number;
  instructorBio: string | null;
  instructorExpertise: string | null;
  instructorTotalStudents: number;
  instructorTotalCourses: number;
  instructorRating: string | null;
  // Per-course detail-page content
  facilities: CourseFacility[] | null;
  targetAudience: string | null;
  certificatePerks: string[] | null;
  faq: CourseFaqItem[] | null;
  quizCount: number;
  exerciseCount: number;
  hasLifetimeAccess: boolean;
  supportPhone: string | null;
  paymentInstructions: string | null;
  paymentGuideVideo: string | null;
  certificateImage: string | null;
  detailPageSections: DetailPageSection[] | null;
  template: string;
  courseType?: "single" | "bundle";
  bundledCourses?: Array<{ id: number; title: string; slug: string; price: string; discountPrice: string | null; thumbnail: string | null }>;
  bundleCurriculum?: Array<{ title: string; lessons: string[] }>;
  bundleCurriculumHeader?: { title?: string; moduleLabel?: string; courseTypeLabel?: string };
  masteryCheckoutImage?: string | null;
  socialProofImage: string | null;
}

export interface CurriculumLesson {
  id: number;
  moduleId: number;
  title: string;
  type: string;
  duration: number;
  isFree: boolean;
  order: number;
}

export interface CurriculumModule {
  id: number;
  title: string;
  order: number;
  lessons: CurriculumLesson[];
}

export type ReviewSource = "student" | "admin_curated";
export type ReviewType = "text" | "video";

export interface CourseReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string | null;
  source: ReviewSource;
  reviewType: ReviewType;
  videoUrl: string | null;
  videoThumbnail: string | null;
  // Student-submitted rows
  userId: number | null;
  userFirstName: string | null;
  userLastName: string | null;
  userAvatar: string | null;
  // Admin-curated rows
  displayName: string | null;
  displayRole: string | null;
  displayAvatar: string | null;
}

export interface CourseReviews {
  avg: number;
  total: number;
  distribution: Record<string, number>;
  reviews: CourseReview[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}

export interface PlatformStats {
  totalCourses: number;
  totalStudents: number;
  totalInstructors: number;
}

export const coursesApi = {
  list: (params?: {
    categoryId?: number;
    level?: string;
    search?: string;
    page?: number;
    limit?: number;
    /** true → only courses with isFeatured=true (drives "Top Courses"). */
    featured?: boolean;
    /** 'free' = price=0, 'paid' = price>0. */
    pricing?: "free" | "paid";
    /** 'live' = totalLessons=0, 'recorded' = totalLessons>0. */
    type?: "live" | "recorded";
  }) => {
    const query = new URLSearchParams();
    if (params?.categoryId) query.set("categoryId", String(params.categoryId));
    if (params?.level) query.set("level", params.level);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.featured) query.set("featured", "true");
    if (params?.pricing) query.set("pricing", params.pricing);
    if (params?.type) query.set("type", params.type);
    const qs = query.toString();
    return apiRequest<PublicCourse[]>(`/courses${qs ? `?${qs}` : ""}`);
  },

  detail: (slug: string) =>
    apiRequest<PublicCourseDetail>(`/courses/${slug}`),

  curriculum: (courseId: number) =>
    apiRequest<CurriculumModule[]>(`/courses/${courseId}/curriculum`),

  reviews: (courseId: number) =>
    apiRequest<CourseReviews>(`/courses/${courseId}/reviews`),

  search: (q: string) =>
    apiRequest<PublicCourse[]>(`/courses/search?q=${encodeURIComponent(q)}`),

  categories: () => apiRequest<Category[]>("/categories"),

  stats: () => apiRequest<PlatformStats>("/stats"),
};
