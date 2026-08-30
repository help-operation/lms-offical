import { apiRequest } from "@/lib/api-client";

export interface PreviewSlide {
  type: "image" | "video";
  url: string;
  source?: "r2" | "youtube" | "vimeo" | "external";
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

export interface InstructorCourse {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  learningOutcomes: string | null;
  requirements: string | null;
  thumbnail: string | null;
  price: string;
  discountPrice: string | null;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  status: "draft" | "published" | "archived" | "inactive" | "scheduled" | "trash";
  publishAt: string | null;
      isFeatured: boolean;
      isUnlisted: boolean;
      showBadge: boolean;
  totalLessons: number;
  totalDuration: number;
  totalStudents: number;
  manualStudentCount: number | null;
  rating: string | null;
  ratingCount: number;
  ratingSource: string;
  categoryId: number | null;
  categoryName: string | null;
  bunnyPreviewVideoId: string | null;
  previewVideoSource: "bunny" | "external" | null;
  previewExternalUrl: string | null;
  // Per-course detail-page content
  facilities: CourseFacility[] | null;
  targetAudience: string | null;
  certificatePerks: string[] | null;
  faq: CourseFaqItem[] | null;
  quizCount: number;
  exerciseCount: number;
  hasLifetimeAccess: boolean;
  accessDurationDays: number | null;
  supportPhone: string | null;
  paymentInstructions: string | null;
  paymentGuideVideo: string | null;
  certificateImage: string | null;
  detailPageSections: DetailPageSection[] | null;
  previewSlides: PreviewSlide[] | null;
  publishAs: "admin" | "teacher";
  requireSequentialProgress: boolean;
  template: string;
  courseType?: "single" | "bundle";
  bundledCourses?: Array<{ id: number; title: string; slug: string; price: string; thumbnail: string | null }>;
  bundleCurriculum?: Array<{ title: string; lessons: string[] }>;
  bundleCurriculumHeader?: { title?: string; moduleLabel?: string; courseTypeLabel?: string };
  masteryCheckoutImage?: string | null;
  socialProofImage: string | null;
  styleOverrides: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export type CourseDetailPageInput = {
  learningOutcomes?: string | null;
  requirements?: string | null;
  facilities?: CourseFacility[];
  targetAudience?: string | null;
  certificatePerks?: string[];
  faq?: CourseFaqItem[];
  quizCount?: number;
  exerciseCount?: number;
  hasLifetimeAccess?: boolean;
  supportPhone?: string | null;
  paymentInstructions?: string | null;
  paymentGuideVideo?: string | null;
  certificateImage?: string | null;
  detailPageSections?: DetailPageSection[];
  previewSlides?: PreviewSlide[];
};

export interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  position: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  type: "video" | "text" | "quiz" | "assignment";
  description: string | null;
  order: number;
  isFree: boolean;
  // Video source
  videoSource: "bunny" | "external" | null;
  bunnyVideoId: string | null;
  bunnyStatus: "processing" | "ready" | "failed" | null;
  externalVideoUrl: string | null;
  duration: number;
  content: string | null;
}

export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
  totalRevenue: string;
  avgRating: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export const instructorCoursesApi = {
  list: () => apiRequest<InstructorCourse[]>("/course-builder"),

  get: (id: number) => apiRequest<InstructorCourse>(`/course-builder/${id}`),

  create: (data: {
    title: string;
    description?: string;
    categoryId?: number;
    level: string;
    language: string;
    price: string | number;
    discountPrice?: string | number;
    template?: "1" | "2";
    courseType?: "single" | "bundle";
    bundledCourseIds?: number[];
    bundleCurriculum?: Array<{ title: string; lessons: string[] }>;
    bundleCurriculumHeader?: { title?: string; moduleLabel?: string; courseTypeLabel?: string };
    masteryCheckoutImage?: string | null;
  }) =>
    apiRequest<InstructorCourse>("/course-builder", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: Partial<{
      title: string;
      shortDescription: string | null;
      description: string;
      categoryId: number;
      level: string;
      language: string;
      price: string | number;
      discountPrice: string | number;
      thumbnail: string | null;
      styleOverrides: Record<string, any>;
      batchInfo: { label: string; value: string; bgColor: string }[];
      toolsInfo: { name: string; image: string; bgColor: string }[];
      toolsTitle: string | null;
      whyDifferentInfo: { title?: string; features?: { title: string; description: string; image: string; bgColor: string }[]; stats?: { value: string; label: string; bgColor: string }[] };
      instructorsInfo: { title?: string; instructors?: { name: string; role: string; photo: string; years: string; clients: string; projects: string; yearsLabel?: string; clientsLabel?: string; projectsLabel?: string; summary: string; skills: string[]; experience: string[]; companies: { name: string; logo: string }[] }[] };
      benefitsTitle: string | null;
      benefitsInfo: { title?: string; subtitle?: string; items?: { title: string; description: string; image: string }[] };
      videoTestimonialsInfo: { title?: string; items?: { title: string; videoUrl: string }[] };
      testimonialsInfo: { title?: string; items?: { name: string; role: string; quote: string }[] };
      valueBreakdownInfo: { title?: string; highlightWords?: string; items?: { name: string; price: string; description: string }[]; offerTitle?: string; offerHighlight?: string; offerSubtitle1?: string; offerSubtitle2?: string; ctaText?: string; offerLabel?: string };
      rating?: number;
      ratingCount?: number;
      ratingSource?: string;
      socialProofImage?: string | null;
      courseType?: "single" | "bundle";
      bundledCourseIds?: number[];
      bundleCurriculum?: Array<{ title: string; lessons: string[] }>;
      bundleCurriculumHeader?: { title?: string; moduleLabel?: string; courseTypeLabel?: string };
      masteryCheckoutImage?: string | null;
    }>
  ) =>
    apiRequest<InstructorCourse>(`/course-builder/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    apiRequest<null>(`/course-builder/${id}`, { method: "DELETE" }),

  updatePreview: (
    id: number,
    data: {
      previewVideoSource?: "bunny" | "external";
      previewExternalUrl?: string;
      bunnyPreviewVideoId?: string;
    }
  ) =>
    apiRequest<InstructorCourse>(`/course-builder/${id}/preview`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  duplicate: (id: number, includeCurriculum: boolean) =>
    apiRequest<InstructorCourse>(`/course-builder/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify({ includeCurriculum }),
    }),

  publish: (id: number) =>
    apiRequest<InstructorCourse>(`/course-builder/${id}/publish`, { method: "POST" }),

  unpublish: (id: number) =>
    apiRequest<InstructorCourse>(`/course-builder/${id}/unpublish`, { method: "POST" }),

  restore: (id: number) =>
    apiRequest<InstructorCourse>(`/course-builder/${id}/restore`, { method: "POST" }),

  purge: (id: number) =>
    apiRequest<null>(`/course-builder/${id}/purge`, { method: "DELETE" }),

  schedule: (id: number, publishAt: string) =>
    apiRequest<InstructorCourse>(`/course-builder/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ publishAt }),
    }),

  unschedule: (id: number) =>
    apiRequest<InstructorCourse>(`/course-builder/${id}/unschedule`, { method: "POST" }),

  getCurriculum: (id: number) =>
    apiRequest<CourseModule[]>(`/course-builder/${id}/curriculum`),

  stats: () => apiRequest<InstructorStats>("/course-builder/stats"),
};

export const modulesApi = {
  create: (courseId: number, data: { title: string; description?: string }) =>
    apiRequest<CourseModule>(`/course-builder/courses/${courseId}/modules`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (courseId: number, moduleId: number, data: { title?: string; description?: string }) =>
    apiRequest<CourseModule>(`/course-builder/modules/${moduleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (courseId: number, moduleId: number) =>
    apiRequest<null>(`/course-builder/modules/${moduleId}`, { method: "DELETE" }),

  reorder: (courseId: number, orderedIds: { id: number; order: number }[]) =>
    apiRequest<null>(`/course-builder/courses/${courseId}/modules/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ order: orderedIds }),
    }),
};

export type LessonType = "video" | "text" | "quiz" | "assignment";

export const lessonsApi = {
  create: (
    moduleId: number,
    data: { title: string; type?: LessonType; content?: string; isFree?: boolean }
  ) =>
    apiRequest<Lesson>(`/course-builder/modules/${moduleId}/lessons`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    moduleId: number,
    lessonId: number,
    data: { title?: string; type?: LessonType; content?: string; isFree?: boolean; duration?: number }
  ) =>
    apiRequest<Lesson>(`/course-builder/lessons/${lessonId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (moduleId: number, lessonId: number) =>
    apiRequest<null>(`/course-builder/lessons/${lessonId}`, {
      method: "DELETE",
    }),

  reorder: (moduleId: number, orderedIds: { id: number; order: number }[]) =>
    apiRequest<null>(`/course-builder/modules/${moduleId}/lessons/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ order: orderedIds }),
    }),

  getPlayback: (lessonId: number) =>
    apiRequest<
      | { source: "bunny"; iframeUrl: string; status: string }
      | { source: "external"; url: string }
    >(`/course-builder/lessons/${lessonId}/playback`),
};

export const categoriesApi = {
  list: () => apiRequest<Category[]>("/categories"),
};

export const instructorProfileApi = {
  get: () =>
    apiRequest<{
      bio: string | null;
      expertise: string | null;
      displayName: string | null;
      displayAvatar: string | null;
    }>("/course-builder/profile/me"),
  update: (data: {
    bio?: string;
    expertise?: string;
    displayName?: string | null;
    displayAvatar?: string | null;
  }) =>
    apiRequest<{ updated: boolean }>("/course-builder/profile/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
