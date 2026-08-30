// packages/validators/src/course.schema.ts
import { z } from "zod";

export const CourseLevelSchema = z.enum(["beginner", "intermediate", "advanced", "beginner_to_advanced"]);
export type CourseLevel = z.infer<typeof CourseLevelSchema>;

export const CourseStatusSchema = z.enum(["draft", "published", "archived", "inactive", "scheduled", "trash"]);
export type CourseStatus = z.infer<typeof CourseStatusSchema>;

export const LessonTypeSchema = z.enum(["video", "text", "quiz", "assignment"]);
export type LessonType = z.infer<typeof LessonTypeSchema>;

export const VideoSourceSchema = z.enum(["bunny", "external"]);
export type VideoSource = z.infer<typeof VideoSourceSchema>;

export const BunnyStatusSchema = z.enum(["processing", "ready", "failed"]);
export type BunnyStatus = z.infer<typeof BunnyStatusSchema>;

// ─── Course ───────────────────────────────────────────────────────────────────

export const CreateCourseSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(5, "Title must be at least 5 characters")
    .max(255, "Title must be at most 255 characters"),
  description: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  discountPrice: z.coerce.number().min(0).optional(),
  level: CourseLevelSchema.default("beginner"),
  language: z.string().max(50).default("English"),
  showBadge: z.boolean().default(true).optional(),
  template: z.enum(["1", "2"]).default("1").optional(),
  courseType: z.enum(["single", "bundle"]).default("single").optional(),
  bundledCourseIds: z.array(z.number().int().positive()).max(20).optional(),
});
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

// Per-course detail-page content schemas (mirror DB JSON shapes)
export const CourseFacilitySchema = z.object({
  icon: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  desc: z.string().max(1000),
});

export const CourseVideoTestimonialSchema = z.object({
  name: z.string().min(1).max(255),
  role: z.string().max(255).default(""),
  image: z.string().max(1000).default(""),
  videoUrl: z.string().max(1000).optional(),
});

export const CourseFaqItemSchema = z.object({
  question: z.string().min(1).max(1000),
  answer: z.string().min(1).max(5000),
});

export const DetailPageSectionSchema = z.object({
  id: z.string().min(1).max(50),
  enabled: z.boolean(),
});

export const PreviewSlideSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url("Slide URL must be a valid URL"),
  source: z.enum(["r2", "youtube", "vimeo", "external"]).optional(),
});
export type PreviewSlide = z.infer<typeof PreviewSlideSchema>;

export const UpdateCourseSchema = CreateCourseSchema.partial().extend({
  thumbnail: z.string().url("Invalid thumbnail URL").nullable().optional(),
  shortDescription: z.string().max(1000).optional().nullable(),
  isFeatured: z.boolean().optional(),
  isUnlisted: z.boolean().optional(),
  slug: z.string().max(255).optional(),
  status: CourseStatusSchema.optional(),
  publishAt: z.string().datetime().optional().nullable(),
  accessDurationDays: z.coerce.number().int().min(1).optional().nullable(),
  learningOutcomes: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  // Detail-page content
  facilities: z.array(CourseFacilitySchema).optional(),
  targetAudience: z.string().max(5000).optional().nullable(),
  certificatePerks: z.array(z.string().min(1).max(500)).optional(),
  faq: z.array(CourseFaqItemSchema).optional(),
  quizCount: z.coerce.number().int().min(0).optional(),
  exerciseCount: z.coerce.number().int().min(0).optional(),
  hasLifetimeAccess: z.boolean().optional(),
  supportPhone: z.string().max(30).optional().nullable(),
  paymentInstructions: z.string().max(5000).optional().nullable(),
  paymentGuideVideo: z.string().max(1000).optional().nullable(),
  certificateImage: z.string().max(1000).optional().nullable(),
  detailPageSections: z.array(DetailPageSectionSchema).optional(),
  previewSlides: z.array(PreviewSlideSchema).optional(),
  publishAs: z.enum(['admin', 'teacher']).optional(),
  requireSequentialProgress: z.boolean().optional(),
  template: z.enum(["1", "2"]).optional(),
  socialProofImage: z.string().url().optional().nullable().or(z.literal("")),
  styleOverrides: z.record(z.any()).optional(),
  batchInfo: z.array(z.object({ label: z.string(), value: z.string(), bgColor: z.string() })).optional(),
  toolsInfo: z.array(z.object({ name: z.string(), image: z.string(), bgColor: z.string() })).optional(),
  toolsTitle: z.string().max(255).optional().nullable(),
  whyDifferentInfo: z.object({
    title: z.string().max(255).optional(),
    features: z.array(z.object({ title: z.string(), description: z.string(), image: z.string(), bgColor: z.string() })).optional(),
    stats: z.array(z.object({ value: z.string(), label: z.string(), bgColor: z.string() })).optional(),
  }).optional(),
  instructorsInfo: z.object({
    title: z.string().max(255).optional(),
    instructors: z.array(z.object({
      name: z.string(), role: z.string(), photo: z.string(),
      years: z.string(), clients: z.string(), projects: z.string(),
      yearsLabel: z.string().optional(), clientsLabel: z.string().optional(), projectsLabel: z.string().optional(),
      summary: z.string(), skills: z.array(z.string()),
      experience: z.array(z.string()),
      companies: z.array(z.object({ name: z.string(), logo: z.string() })),
    })).optional(),
  }).optional(),
  benefitsTitle: z.string().max(255).optional().nullable(),
  benefitsInfo: z.object({
    title: z.string().max(255).optional(),
    subtitle: z.string().max(500).optional(),
    items: z.array(z.object({
      title: z.string(),
      description: z.string(),
      image: z.string(),
    })).optional(),
  }).optional(),
  videoTestimonialsInfo: z.object({
    title: z.string().max(255).optional(),
    items: z.array(z.object({
      title: z.string(),
      videoUrl: z.string(),
    })).optional(),
  }).optional(),
  testimonialsInfo: z.object({
    title: z.string().max(255).optional(),
    items: z.array(z.object({
      name: z.string(),
      role: z.string(),
      quote: z.string(),
    })).optional(),
  }).optional(),
  valueBreakdownInfo: z.object({
    title: z.string().max(500).optional(),
    highlightWords: z.string().max(100).optional(),
    items: z.array(z.object({
      name: z.string(),
      price: z.string(),
      description: z.string(),
    })).optional(),
    offerTitle: z.string().max(500).optional(),
    offerHighlight: z.string().max(100).optional(),
    offerSubtitle1: z.string().max(500).optional(),
    offerSubtitle2: z.string().max(500).optional(),
    timerHours: z.string().max(50).optional(),
    timerMinutes: z.string().max(50).optional(),
    timerSeconds: z.string().max(50).optional(),
    ctaText: z.string().max(200).optional(),
    paymentButtonText: z.string().max(200).optional(),
    offerLabel: z.string().max(200).optional(),
  }).optional(),
  bundleCurriculum: z.array(z.object({ title: z.string().min(1).max(255), lessons: z.array(z.string().min(1).max(255)).max(50) })).max(20).optional(),
  bundleCurriculumHeader: z.object({ title: z.string().max(100).optional(), moduleLabel: z.string().max(50).optional(), courseTypeLabel: z.string().max(50).optional() }).optional(),
  masteryCheckoutImage: z.string().max(1000).optional().nullable().or(z.literal("")),
  masterySectionOrder: z.array(z.string().min(1).max(50)).max(30).optional(),
  manualStudentCount: z.coerce.number().int().min(0).optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional(),
  ratingCount: z.coerce.number().int().min(0).optional(),
  ratingSource: z.enum(['auto', 'static']).optional(),
});
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

// ─── Course Module ────────────────────────────────────────────────────────────

export const CreateModuleSchema = z.object({
  title: z
    .string({ required_error: "Module title is required" })
    .min(2, "Title must be at least 2 characters")
    .max(255, "Title must be at most 255 characters"),
  order: z.number().int().min(0).optional(),
});
export type CreateModuleInput = z.infer<typeof CreateModuleSchema>;

export const UpdateModuleSchema = CreateModuleSchema.partial();
export type UpdateModuleInput = z.infer<typeof UpdateModuleSchema>;

export const ReorderModulesSchema = z.object({
  order: z.array(
    z.object({
      id: z.number().int().positive(),
      order: z.number().int().min(0),
    })
  ),
});
export type ReorderModulesInput = z.infer<typeof ReorderModulesSchema>;

// ─── Lesson ───────────────────────────────────────────────────────────────────

export const CreateLessonSchema = z.object({
  title: z
    .string({ required_error: "Lesson title is required" })
    .min(2, "Title must be at least 2 characters")
    .max(255, "Title must be at most 255 characters"),
  type: LessonTypeSchema.default("video"),
  content: z.string().optional(),
  isFree: z.boolean().default(false),
  order: z.number().int().min(0).optional(),
});
export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;

export const UpdateLessonSchema = CreateLessonSchema.partial().extend({
  videoSource: VideoSourceSchema.optional(),
  bunnyVideoId: z.string().optional(),
  bunnyStatus: BunnyStatusSchema.optional(),
  externalVideoUrl: z.string().url().optional(),
  duration: z.number().int().min(0).optional(),
});
export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>;

export const ReorderLessonsSchema = z.object({
  order: z.array(
    z.object({
      id: z.number().int().positive(),
      order: z.number().int().min(0),
    })
  ),
});
export type ReorderLessonsInput = z.infer<typeof ReorderLessonsSchema>;

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export const QuizQuestionTypeSchema = z.enum(["single", "multiple"]);
export type QuizQuestionType = z.infer<typeof QuizQuestionTypeSchema>;

export const UpsertQuizSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  passingScore: z.coerce.number().int().min(1).max(100).default(70),
});
export type UpsertQuizInput = z.infer<typeof UpsertQuizSchema>;

export const QuizAnswerInputSchema = z.object({
  answer: z.string().min(1, "Answer text is required").max(1000),
  isCorrect: z.boolean().default(false),
});

export const UpsertQuestionSchema = z.object({
  question: z.string().min(2, "Question is required").max(2000),
  type: QuizQuestionTypeSchema.default("single"),
  order: z.number().int().min(0).optional(),
  answers: z
    .array(QuizAnswerInputSchema)
    .min(2, "At least 2 answers are required")
    .max(8, "At most 8 answers")
    .refine((a) => a.some((x) => x.isCorrect), "Mark at least one answer correct"),
});
export type UpsertQuestionInput = z.infer<typeof UpsertQuestionSchema>;

export const SubmitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.number().int().positive(),
      answerIds: z.array(z.number().int().positive()),
    })
  ),
});
export type SubmitQuizInput = z.infer<typeof SubmitQuizSchema>;

// ─── Assignment ───────────────────────────────────────────────────────────────

export const UpsertAssignmentSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  maxFiles: z.number().int().min(0).max(10).default(1),
  filesRequired: z.boolean().default(false),
});
export type UpsertAssignmentInput = z.infer<typeof UpsertAssignmentSchema>;

export const SubmitAssignmentSchema = z
  .object({
    content: z.string().optional(),
    fileUrls: z.array(z.string().url("Invalid file URL")).max(10).optional(),
  })
  .refine(
    (d) => (d.content?.trim()?.length ?? 0) > 0 || (d.fileUrls?.length ?? 0) > 0,
    "Provide submission text or at least one file URL"
  );
export type SubmitAssignmentInput = z.infer<typeof SubmitAssignmentSchema>;

export const GradeSubmissionSchema = z.object({
  grade: z.coerce.number().min(0).max(100),
  feedback: z.string().optional(),
});
export type GradeSubmissionInput = z.infer<typeof GradeSubmissionSchema>;

// ─── Lesson Resource ──────────────────────────────────────────────────────────

export const UpsertResourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  type: z.string().min(1).max(50).default("link"),
  url: z.string().url("Invalid URL").max(500).optional().nullable(),
  content: z.string().optional().nullable(),
}).refine(
  (d) => d.url || d.content,
  { message: "Either a URL or code content is required" },
);
export type UpsertResourceInput = z.infer<typeof UpsertResourceSchema>;

// ─── Category ─────────────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z
    .string({ required_error: "Category name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  description: z.string().optional(),
  icon: z.string().max(100).optional(),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
