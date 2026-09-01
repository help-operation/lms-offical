import {
  boolean,
  index,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'GUEST',
  'STUDENT',
  'INSTRUCTOR',
  'SUPER_ADMIN',
]);

export const adminRoleEnum = pgEnum('admin_role', ['SUPER_ADMIN', 'INSTRUCTOR']);

// A permission is either a "page" (can view an admin screen) or an "api"
// (can perform a CRUD/action), mirroring the admin RBAC permission catalog.
export const permissionTypeEnum = pgEnum('permission_type', ['page', 'api']);

export const userStatusEnum = pgEnum('user_status', [
  'active',
  'suspended',
  'pending',
]);

export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);

// ─── Site visit tracking (dashboard visitor analytics) ─────────────────────────

export const visitSourceEnum = pgEnum('visit_source', [
  'facebook',
  'youtube',
  'website',
  'linkedin',
  'twitter',
  'instagram',
  'direct',
  'other',
]);

export const visitDeviceEnum = pgEnum('visit_device', [
  'mobile',
  'tablet',
  'desktop',
  'unknown',
]);

export const courseStatusEnum = pgEnum('course_status', [
  'draft',
  'published',
  'archived', // legacy — no longer written; existing rows migrated to 'inactive'
  'inactive',
  'scheduled',
  'trash',
]);

export const courseLevelEnum = pgEnum('course_level', [
  'beginner',
  'intermediate',
  'advanced',
  'beginner_to_advanced',
]);

export const lessonTypeEnum = pgEnum('lesson_type', [
  'video',
  'text',
  'quiz',
  'assignment',
]);

export const recordedCourseTypeEnum = pgEnum('recorded_course_type', ['single', 'bundle']);

export const videoSourceEnum = pgEnum('video_source', ['bunny', 'external']);

export const bunnyStatusEnum = pgEnum('bunny_status', [
  'processing',
  'ready',
  'failed',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'cancelled',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'bkash',
  'nagad',
  'rocket',
  'upay',
  'card',
  'free',
  'paystation',
  'bkash_pgw',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const couponTypeEnum  = pgEnum('coupon_type', ['percentage', 'fixed']);
export const couponScopeEnum = pgEnum('coupon_scope', [
  'all',
  'all_recorded',
  'specific_recorded',
  'all_live',
  'specific_live',
]);

export const ticketStatusEnum = pgEnum('ticket_status', [
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const ticketCategoryEnum = pgEnum('ticket_category', [
  'billing',
  'technical',
  'course_content',
  'certificate',
  'refund',
  'other',
]);

export const blogStatusEnum = pgEnum('blog_status', ['draft', 'published']);

export const liveClassStatusEnum = pgEnum('live_class_status', [
  'scheduled',
  'live',
  'ended',
  'cancelled',
]);

export const quizQuestionTypeEnum = pgEnum('quiz_question_type', [
  'single',
  'multiple',
]);

export const referralStatusEnum = pgEnum('referral_status', [
  'pending',
  'completed',
]);

export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'active',
  'completed',
  'refunded',
  'suspended',
]);

export const submissionStatusEnum = pgEnum('submission_status', [
  'submitted',
  'graded',
]);

// ─── Users & Auth ──────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  // email: required for INSTRUCTOR/SUPER_ADMIN, optional for phone-OTP users
  email: varchar('email', { length: 150 }).unique(),
  // phone: required for GUEST/STUDENT OTP auth, not used by admin/instructor
  phone: varchar('phone', { length: 20 }).unique(),
  // password: null for OTP-only users
  password: varchar('password', { length: 255 }),
  role: userRoleEnum('role').default('GUEST').notNull(),
  status: userStatusEnum('status').default('active').notNull(),
  avatar: varchar('avatar', { length: 500 }),
  // Self-reported, nullable — historical rows show as "Not specified" on the dashboard.
  gender: genderEnum('gender'),
  // Billing/location fields — not collected anywhere yet (no checkout step asks for
  // them today), added ahead of a future feature. Null until then; consumers (e.g.
  // Google Enhanced Conversions) must handle absence gracefully, not require it.
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  // Master switch for transactional emails (certificate, enrollment, etc.)
  emailNotifications: boolean('email_notifications').notNull().default(true),
  // ── Auth hardening ───────────────────────────────────────────────────────
  // Failed-login lockout: counts consecutive failures; lockedUntil holds the
  // active lock expiry (null when not locked).
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  // Token revocation: any JWT issued before this instant is rejected (set on
  // logout and password change/reset).
  tokensValidFrom: timestamp('tokens_valid_from'),
  // Last successful login on the student web app (apps/web). Null until first login.
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const adminUsers = pgTable('admin_users', {
  id:        serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName:  varchar('last_name',  { length: 100 }).notNull(),
  email:     varchar('email', { length: 150 }).notNull().unique(),
  password:  varchar('password', { length: 255 }).notNull(),
  // Legacy coarse role (kept as the identity used for the SUPER_ADMIN
  // all-access short-circuit). The dynamic role below drives permissions.
  role:      adminRoleEnum('role').notNull(),
  // Dynamic role for RBAC. Nullable during migration; backfilled by the seeder.
  roleId:    integer('role_id').references(() => roles.id, { onDelete: 'set null' }),
  status:    userStatusEnum('status').default('active').notNull(),
  avatar:    varchar('avatar', { length: 500 }),
  // ── Auth hardening (mirror of users table) ───────────────────────────────
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  tokensValidFrom: timestamp('tokens_valid_from'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── RBAC: Roles & Permissions (admin panel) ───────────────────────────────────

export const roles = pgTable('roles', {
  id:          serial('id').primaryKey(),
  name:        varchar('name', { length: 100 }).notNull(),
  slug:        varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  // System roles (super-admin, instructor) are seeded and protected from
  // deletion / slug changes.
  isSystem:    boolean('is_system').default(false).notNull(),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});

export const permissions = pgTable('permissions', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 150 }).notNull(),
  slug:      varchar('slug', { length: 100 }).notNull().unique(),
  // Module the permission belongs to, e.g. 'courses', used to group the UI.
  group:     varchar('group', { length: 50 }).notNull(),
  type:      permissionTypeEnum('type').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

// ── Per-course edit assignments ─────────────────────────────────────────────
// Used by the `edit_assigned_courses` / `edit_assigned_live_courses`
// permissions: a role holding one of these is restricted to editing only the
// courses explicitly assigned here (in addition to any it owns), instead of
// every course the underlying route would otherwise allow.
export const roleCourseAssignments = pgTable(
  'role_course_assignments',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.courseId] })],
);

export const roleLiveCourseAssignments = pgTable(
  'role_live_course_assignments',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    liveCourseId: integer('live_course_id')
      .notNull()
      .references(() => liveCourses.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.liveCourseId] })],
);

export const otpVerifications = pgTable('otp_verifications', {
  id: serial('id').primaryKey(),
  // OTP is keyed by phone OR email (exactly one is set per row)
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 150 }),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Admin password-reset tokens (link-based) ──────────────────────────────────
// Single-use, 15-minute reset links for admin accounts. Only the SHA-256 hash of
// the token is stored — the raw token lives only in the emailed link.
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  adminUserId: integer('admin_user_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const studentProfiles = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  bio: text('bio'),
  profession: varchar('profession', { length: 150 }),
  socialLinks: json('social_links').$type<Record<string, string>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const instructorProfiles = pgTable('instructor_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'cascade' })
    .unique(),
  bio: text('bio'),
  expertise: varchar('expertise', { length: 255 }),
  // Teacher display identity (overrides admin login name when publishAs='teacher')
  displayName:   varchar('display_name',   { length: 255 }),
  displayAvatar: varchar('display_avatar', { length: 500 }),
  payoutInfo: json('payout_info').$type<Record<string, string>>(),
  socialLinks: json('social_links').$type<Record<string, string>>(),
  totalStudents: integer('total_students').default(0).notNull(),
  totalCourses: integer('total_courses').default(0).notNull(),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Categories & Courses ─────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  instructorId: integer('instructor_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 280 }).notNull().unique(),
  shortDescription: text('short_description'),
  description: text('description'),
  thumbnail: varchar('thumbnail', { length: 500 }),
  price: numeric('price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  discountPrice: numeric('discount_price', { precision: 10, scale: 2 }),
  level: courseLevelEnum('level').default('beginner').notNull(),
  language: varchar('language', { length: 50 }).default('English').notNull(),
  status: courseStatusEnum('status').default('draft').notNull(),
  // Set when status='scheduled' — CoursesSchedulerService flips status to
  // 'published' once this timestamp passes.
  publishAt: timestamp('publish_at'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isUnlisted: boolean('is_unlisted').default(false).notNull(),
  showBadge: boolean('show_badge').default(true).notNull(),
  // Preview / trailer video
  bunnyPreviewVideoId: varchar('bunny_preview_video_id', { length: 100 }),
  previewVideoSource: videoSourceEnum('preview_video_source'),
  previewExternalUrl: varchar('preview_external_url', { length: 1000 }),
  learningOutcomes: text('learning_outcomes'), // newline-separated bullet points
  requirements: text('requirements'),           // newline-separated bullet points
  totalLessons: integer('total_lessons').default(0).notNull(),
  totalDuration: integer('total_duration').default(0).notNull(), // seconds
  totalStudents: integer('total_students').default(0).notNull(),
  manualStudentCount: integer('manual_student_count'),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00'),
  ratingCount: integer('rating_count').default(0).notNull(),
  ratingSource: varchar('rating_source', { length: 10 }).default('auto').notNull(),
  // ── Per-course detail-page content (replaces hardcoded constants in web)
  facilities: json('facilities')
    .$type<{ icon: string; title: string; desc: string }[]>()
    .default([]),
  targetAudience: text('target_audience'),
  certificatePerks: json('certificate_perks').$type<string[]>().default([]),
  // NOTE: videoTestimonials JSON was replaced by curated rows in the `reviews`
  // table (source='admin_curated', type='video'). Column dropped via db:push.
  faq: json('faq').$type<{ question: string; answer: string }[]>().default([]),
  quizCount: integer('quiz_count').default(0).notNull(),
  exerciseCount: integer('exercise_count').default(0).notNull(),
  hasLifetimeAccess: boolean('has_lifetime_access').default(true).notNull(),
  // Fixed access length in days, used to compute a new enrollment's
  // expiresAt at purchase time when hasLifetimeAccess=false. Ignored when
  // hasLifetimeAccess=true.
  accessDurationDays: integer('access_duration_days'),
  // Optional per-course overrides — null = fall back to web-side default
  supportPhone: varchar('support_phone', { length: 30 }),
  paymentInstructions: text('payment_instructions'),
  paymentGuideVideo: varchar('payment_guide_video', { length: 1000 }),
  certificateImage: varchar('certificate_image', { length: 1000 }),
  // Section order + visibility for the public /courses/[slug] body.
  // Null = fall back to canonical order with everything enabled.
  detailPageSections: json('detail_page_sections')
    .$type<{ id: string; enabled: boolean }[]>()
    .default([]),
  previewSlides: json('preview_slides')
    .$type<{ type: 'image' | 'video'; url: string; source?: string }[]>()
    .default([]),
  // 'admin' → show adminUsers name/avatar; 'teacher' → show instructorProfiles displayName/displayAvatar
  publishAs: varchar('publish_as', { length: 10 })
    .$type<'admin' | 'teacher'>()
    .default('admin')
    .notNull(),
  requireSequentialProgress: boolean('require_sequential_progress').default(false).notNull(),
  // Detail page template: "1" = Elevate (default for recorded courses)
  template: varchar('template', { length: 5 }).default('1').notNull(),
  /** Mastery-only bundle: 'single' (default) or 'bundle' (contains multiple recorded courses) */
  courseType: recordedCourseTypeEnum('course_type').default('single').notNull(),
  socialProofImage: varchar('social_proof_image', { length: 1000 }),
  styleOverrides: json('style_overrides').$type<Record<string, { fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; backgroundColor?: string; ranges?: Array<{ start: number; end: number; text: string; fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; backgroundColor?: string }> }>>().default({}),
  batchInfo: json('batch_info').$type<{ label: string; value: string; bgColor: string }[]>().default([]),
  toolsInfo: json('tools_info').$type<{ name: string; image: string; bgColor: string }[]>().default([]),
  toolsTitle: text('tools_title'),
  whyDifferentInfo: json('why_different_info').$type<{ title?: string; features?: { title: string; description: string; image: string; bgColor: string }[]; stats?: { value: string; label: string; bgColor: string }[] }>().default({ features: [], stats: [] }),
  instructorsInfo: json('instructors_info').$type<{ title?: string; instructors?: { name: string; role: string; photo: string; years: string; clients: string; projects: string; summary: string; skills: string[]; experience: string[]; companies: { name: string; logo: string }[] }[] }>().default({ instructors: [] }),
  benefitsTitle: text('benefits_title'),
  benefitsInfo: json('benefits_info').$type<{ title?: string; subtitle?: string; items?: { title: string; description: string; image: string }[] }>().default({ items: [] }),
  videoTestimonialsInfo: json('video_testimonials_info').$type<{ title?: string; items?: { title: string; videoUrl: string }[] }>().default({ items: [] }),
  testimonialsInfo: json('testimonials_info').$type<{ title?: string; items?: { name: string; role: string; quote: string }[] }>().default({ items: [] }),
  valueBreakdownInfo: json('value_breakdown_info').$type<{ title?: string; highlightWords?: string; items?: { name: string; price: string; description: string }[]; offerTitle?: string; offerHighlight?: string; offerSubtitle1?: string; offerSubtitle2?: string; timerHours?: string; timerMinutes?: string; timerSeconds?: string; ctaText?: string }>().default({ items: [] }),
  /** Bundle-only lightweight curriculum for the landing page "কোর্স কারিকুলাম" display ( Mastery bundle ). Not courseModules. */
  bundleCurriculum: json('bundle_curriculum').$type<Array<{ title: string; lessons: string[] }>>().default([]),
  bundleCurriculumHeader: json('bundle_curriculum_header').$type<{ title?: string; moduleLabel?: string; courseTypeLabel?: string }>().default({ title: "কোর্স কারিকুলাম", moduleLabel: "মডিউল", courseTypeLabel: "রেকর্ডেড কোর্স" }),
  masteryCheckoutImage: varchar('mastery_checkout_image', { length: 1000 }),
  /** Mastery template section order - controls visual order of landing page sections */
  masterySectionOrder: json('mastery_section_order').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const courseModules = pgTable('course_modules', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id')
    .notNull()
    .references(() => courseModules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  type: lessonTypeEnum('type').default('video').notNull(),
  // Video source — only set when type = 'video'
  videoSource: videoSourceEnum('video_source'),
  // Bunny Stream fields
  bunnyVideoId: varchar('bunny_video_id', { length: 100 }),
  bunnyStatus: bunnyStatusEnum('bunny_status'),
  // External video URL (YouTube, MP4, etc.)
  externalVideoUrl: varchar('external_video_url', { length: 1000 }),
  duration: integer('duration').default(0).notNull(), // seconds
  // Rich text content — only set when type = 'text'
  content: text('content'),
  isFree: boolean('is_free').default(false).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const lessonResources = pgTable('lesson_resources', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // pdf, zip, link, code, etc.
  url: varchar('url', { length: 500 }),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Learning ─────────────────────────────────────────────────────────────────

export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  orderId: integer('order_id').references(() => orders.id, {
    onDelete: 'set null',
  }),
  status: enrollmentStatusEnum('status').default('active').notNull(),
  // Admin's free-text reason when status is set to 'suspended' via
  // ManageEnrollmentModal — shown to the student on /learn/[slug]/suspended.
  statusReason: text('status_reason'),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
}, (t) => [
  // One enrollment per user per course. Makes onConflictDoNothing() atomic so
  // concurrent/duplicate enrollments (and their confirmation SMS/email) can't
  // be created twice — even without a DB transaction on the Neon HTTP driver.
  unique('enrollments_user_course_uniq').on(t.userId, t.courseId),
]);

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    watchedSeconds: integer('watched_seconds').default(0).notNull(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique('uq_lesson_progress_user_lesson').on(t.userId, t.lessonId)],
);

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  // timestamp in seconds within the video where the note was taken
  videoTimestamp: integer('video_timestamp').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const certificates = pgTable(
  'certificates',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    /** Short unique code printed on the certificate — used for public verification */
    certificateCode: varchar('certificate_code', { length: 100 }).notNull().unique(),
    certificateUrl: varchar('certificate_url', { length: 500 }),
    issuedAt: timestamp('issued_at').defaultNow(),
  },
  (t) => [unique('uq_certificate_user_course').on(t.userId, t.courseId)],
);

// ─── Assignments & Quizzes ────────────────────────────────────────────────────

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, {
    onDelete: 'cascade',
  }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date'),
  maxFiles: integer('max_files').default(1).notNull(),
  filesRequired: boolean('files_required').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  assignmentId: integer('assignment_id')
    .notNull()
    .references(() => assignments.id, { onDelete: 'cascade' }),
  content: text('content'),
  fileUrls: jsonb('file_urls').$type<string[]>().default([]).notNull(),
  status: submissionStatusEnum('status').default('submitted').notNull(),
  grade: numeric('grade', { precision: 5, scale: 2 }),
  feedback: text('feedback'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  gradedAt: timestamp('graded_at'),
});

export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, {
    onDelete: 'cascade',
  }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  passingScore: integer('passing_score').default(70).notNull(), // percentage
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  type: quizQuestionTypeEnum('type').default('single').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizAnswers = pgTable('quiz_answers', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id')
    .notNull()
    .references(() => quizQuestions.id, { onDelete: 'cascade' }),
  answer: text('answer').notNull(),
  isCorrect: boolean('is_correct').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
  passed: boolean('passed').default(false).notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
});

// ─── Live Classes ─────────────────────────────────────────────────────────────

export const liveClasses = pgTable('live_classes', {
  id: serial('id').primaryKey(),
  instructorId: integer('instructor_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').references(() => courses.id, {
    onDelete: 'set null',
  }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  meetingUrl: varchar('meeting_url', { length: 500 }),
  status: liveClassStatusEnum('status').default('scheduled').notNull(),
  /** Set once the "starting soon" reminder SMS has gone out (cron dedup). */
  reminderSentAt: timestamp('reminder_sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const liveClassAttendees = pgTable('live_class_attendees', {
  id: serial('id').primaryKey(),
  liveClassId: integer('live_class_id')
    .notNull()
    .references(() => liveClasses.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow(),
});

// ─── Commerce ─────────────────────────────────────────────────────────────────

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: couponTypeEnum('type').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  maxUses:   integer('max_uses'),
  usedCount: integer('used_count').default(0).notNull(),
  expiresAt: timestamp('expires_at'),
  isActive:  boolean('is_active').default(true).notNull(),
  scope:     couponScopeEnum('scope').default('all').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow(),
});

export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow(),
});

// orders is referenced by enrollments so we declare it before enrollments above,
// but TypeScript needs forward references — we use a workaround via lazy references.
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  // Nullable for guest orders that flow through the leads system. Once the
  // admin converts a lead to a user (Phase 3), this is backfilled. Existing
  // logged-in user flow always sets it.
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  finalAmount: numeric('final_amount', { precision: 10, scale: 2 }).notNull(),
  couponId: integer('coupon_id').references(() => coupons.id, {
    onDelete: 'set null',
  }),
  status: orderStatusEnum('status').default('pending').notNull(),
  // Set the instant the confirmation SMS/admin notification is claimed for this
  // order. Acts as an idempotency marker so racing/duplicate payment callbacks
  // can never send the enrollment SMS more than once.
  confirmationSmsSentAt: timestamp('confirmation_sms_sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
});

// ── Payment confirmation tokens (one-time success/result pages) ─────────────
// The payment-gateway callback is the only place a real payment result exists.
// After it verifies a payment (success OR failure), it mints one row here and
// redirects the browser with just `?t=<token>`. The success/result page
// exchanges the token for its display `params` and the row is atomically marked
// consumed — so the result page is verified (only the callback can mint a
// token) AND one-time (a refresh/back-button finds the token already consumed
// and is redirected away). Tokens older than the TTL are treated as expired.
export const paymentConfirmations = pgTable('payment_confirmations', {
  id: serial('id').primaryKey(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  // Exactly the query params the result page used to read from the URL
  // (status, orderId, leadId, invoice, courseId, slug, …) — now server-issued.
  params: json('params').$type<Record<string, string>>().notNull(),
  consumedAt: timestamp('consumed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Per-year atomic counter backing the human-facing SKINV-{year}-{seq} invoice
// number. A single upsert (`INSERT ... ON CONFLICT DO UPDATE ... RETURNING`)
// increments it race-safely without needing an interactive transaction.
export const invoiceNumberCounters = pgTable('invoice_number_counters', {
  year: integer('year').primaryKey(),
  count: integer('count').default(0).notNull(),
});

// ── Leads (guest checkout capture) ──────────────────────────────────────────
// When a guest fills the checkout form and clicks "Complete Payment", we
// insert a `lead` row BEFORE redirecting to the payment gateway. The row
// survives whether or not the payment completes, so admin can follow up.
//
// Lifecycle:
//   pending   – form submitted, payment not yet confirmed (default)
//   paid      – payment gateway confirmed success (Phase 2)
//   converted – admin created a user + assigned the course (Phase 3)
//   cancelled – admin marked the lead dead (no follow-up needed)
// Lead lifecycle is now just a workflow state: `pending` (needs handling) →
// `complete` (account created / enrolled / closed). Payment status lives on the
// linked order, not the lead. The legacy values (paid/converted/cancelled) are
// kept in the enum for historical rows but are no longer written by the app.
export const leadStatusEnum = pgEnum('lead_status', [
  'pending',
  'complete',
  // ── legacy (no longer written) ──
  'paid',
  'converted',
  'cancelled',
]);

// Where the lead came from. `checkout` = guest clicked Complete Payment with
// full info; `interest_box` = phone-only soft capture from the course detail
// page sidebar; `manual` = admin entered manually. New sources can be added
// without touching the lead lifecycle.
export const leadSourceEnum = pgEnum('lead_source', [
  'checkout',
  'interest_box',
  'callback_widget',
  'manual',
  'failed_payment',
  'abandoned_checkout',
  'checkout_visit',
  'live_checkout',
]);

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  // Nullable: interest-box leads only collect a phone number. Checkout leads
  // still always have name + email (enforced at the validator layer).
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  // Nullable for failed_payment auto-captures where the user has no phone on file
  phone: varchar('phone', { length: 30 }),
  source: leadSourceEnum('source').default('checkout').notNull(),
  // Courses the guest intended to buy. Stored as JSON int[] so a lead can
  // cover a multi-item cart (matches the existing /checkout?courseIds=… shape).
  courseIds: json('course_ids').$type<number[]>().notNull().default([]),
  couponCode: varchar('coupon_code', { length: 100 }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).default('0.00').notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  finalAmount: numeric('final_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  status: leadStatusEnum('status').default('pending').notNull(),
  // Admin's free-text notes (call summary, next-step reminders, etc.)
  notes: text('notes'),
  // Set in Phase 3 when admin clicks "Create user from this lead"
  convertedUserId: integer('converted_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  // Set in Phase 2 when payment confirms — links the lead to its order row
  orderId: integer('order_id').references(() => orders.id, {
    onDelete: 'set null',
  }),
  // Live-course / bundle guest checkout — mirrors orderId/courseIds above but
  // points at the live_enrollments row created directly by the live-courses
  // flow (which has no orders/order_items of its own).
  liveEnrollmentId: integer('live_enrollment_id').references(() => liveEnrollments.id, {
    onDelete: 'set null',
  }),
  liveCourseId: integer('live_course_id').references(() => liveCourses.id, {
    onDelete: 'set null',
  }),
  /** Set once an abandoned-checkout reminder SMS has gone out (cron dedup). */
  abandonedSmsSentAt: timestamp('abandoned_sms_sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

// Tracks which published courses a logged-in user has visited when they
// don't yet own that course. Deduplicated per (user, course) so repeat visits
// just update seenAt — one row max per user per course.
export const userCourseInterests = pgTable(
  'user_course_interests',
  {
    id:           serial('id').primaryKey(),
    userId:       integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    courseId:     integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
    liveCourseId: integer('live_course_id').references(() => liveCourses.id, { onDelete: 'cascade' }),
    firstSeenAt:  timestamp('first_seen_at').defaultNow().notNull(),
    lastSeenAt:   timestamp('last_seen_at').defaultNow().notNull(),
    visitCount:   integer('visit_count').default(1).notNull(),
    createdAt:    timestamp('created_at').defaultNow().notNull(),
  },
);

export type UserCourseInterest = typeof userCourseInterests.$inferSelect;

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  // Nullable for guest payments (lead-driven, before user is created).
  // Backfilled in Phase 3 when admin converts the lead.
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  bkashTrxId: varchar('bkash_trx_id', { length: 100 }),
  // Sender/payer mobile number for offline manual (admin-recorded) payments.
  payerPhone: varchar('payer_phone', { length: 20 }),
  // PayStation fields
  paystationInvoiceId: varchar('paystation_invoice_id', { length: 100 }),
  paystationTrxId: varchar('paystation_trx_id', { length: 100 }),
  paystationMethod: varchar('paystation_method', { length: 50 }), // bKash/Nagad/Rocket/Upay/Mastercard/Visa
  // bKash Tokenized Checkout (PGW) fields — distinct from the legacy bkashTrxId
  // above, which is used by the manual paste-your-trx-id confirmation flow.
  bkashInvoiceNumber: varchar('bkash_invoice_number', { length: 100 }),
  bkashPaymentId: varchar('bkash_payment_id', { length: 100 }),
  bkashPgwTrxId: varchar('bkash_pgw_trx_id', { length: 100 }),
  bkashPgwStatus: varchar('bkash_pgw_status', { length: 30 }),
  status: paymentStatusEnum('status').default('pending').notNull(),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
  // Human-facing sequential number shown on the invoice PDF (e.g. SKINV-2025-0001).
  // Separate from paystationInvoiceId, which stays internal for gateway lookups.
  displayInvoiceNumber: varchar('display_invoice_number', { length: 40 }).unique(),
});

// Installment payments recorded against a live-course enrollment. Mirrors the
// recorded-course `payments` table (one row per amount actually received) —
// `liveEnrollments.amount` is the course fee; totalPaid/due/status are derived
// by summing this table's completed rows, same as orders+payments for recorded.
// Gateway-driven live checkout (bKash/PayStation) doesn't write here — it still
// pays the full amount in one shot directly on `liveEnrollments`, so rows here
// only exist for admin-recorded manual/installment payments.
export const livePayments = pgTable('live_payments', {
  id: serial('id').primaryKey(),
  liveEnrollmentId: integer('live_enrollment_id')
    .notNull()
    .references(() => liveEnrollments.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  bkashTrxId: varchar('bkash_trx_id', { length: 100 }),
  payerPhone: varchar('payer_phone', { length: 20 }),
  status: paymentStatusEnum('status').default('completed').notNull(),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
  displayInvoiceNumber: varchar('display_invoice_number', { length: 40 }).unique(),
});

export const couponUsages = pgTable('coupon_usages', {
  id: serial('id').primaryKey(),
  couponId: integer('coupon_id')
    .notNull()
    .references(() => coupons.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  orderId: integer('order_id').references(() => orders.id, {
    onDelete: 'set null',
  }),
  usedAt: timestamp('used_at').defaultNow(),
});

// ─── Reviews & Referrals ──────────────────────────────────────────────────────

// Source distinguishes organic student reviews from admin-curated ones.
// Both display together on the course detail page and count toward the
// average rating, but only curated rows can be admin-edited.
export const reviewSourceEnum = pgEnum('review_source', [
  'student',
  'admin_curated',
]);

// Curated reviews can be either plain-text or video testimonials.
// Student-submitted reviews are always 'text'.
export const reviewTypeEnum = pgEnum('review_type', ['text', 'video']);

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  // Nullable: admin-curated rows have no real user. Postgres treats NULLs as
  // distinct so the unique constraint below still works for both kinds.
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  instructorReply: text('instructor_reply'),
  // Polymorphism fields (set when source='admin_curated', else NULL)
  source: reviewSourceEnum('source').default('student').notNull(),
  reviewType: reviewTypeEnum('review_type').default('text').notNull(),
  displayName: varchar('display_name', { length: 255 }),
  displayRole: varchar('display_role', { length: 100 }),
  displayAvatar: varchar('display_avatar', { length: 1000 }),
  videoUrl: varchar('video_url', { length: 1000 }),
  videoThumbnail: varchar('video_thumbnail', { length: 1000 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  // One review per (user, course). Multiple NULL userIds are allowed by
  // Postgres semantics — admin can add many curated reviews per course.
  userCourseUnique: unique('reviews_user_course_unique').on(t.userId, t.courseId),
}));

export const referrals = pgTable('referrals', {
  id: serial('id').primaryKey(),
  referrerId: integer('referrer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  referredId: integer('referred_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: referralStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const referralEarnings = pgTable('referral_earnings', {
  id: serial('id').primaryKey(),
  referralId: integer('referral_id')
    .notNull()
    .references(() => referrals.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Blog ─────────────────────────────────────────────────────────────────────

export const blogCategories = pgTable('blog_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  authorId: integer('author_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => blogCategories.id, {
    onDelete: 'set null',
  }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 280 }).notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content'),
  thumbnail: varchar('thumbnail', { length: 500 }),
  status: blogStatusEnum('status').default('draft').notNull(),
  shareCount: integer('share_count').default(0).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Blog Engagement ──────────────────────────────────────────────────────────

export const blogPostLikes = pgTable(
  'blog_post_likes',
  {
    id:        serial('id').primaryKey(),
    postId:    integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [unique('uq_blog_like_user_post').on(t.postId, t.userId)],
);

export const blogPostComments = pgTable('blog_post_comments', {
  id:        serial('id').primaryKey(),
  postId:    integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // null = top-level; non-null = reply (max 1 level deep enforced in service)
  parentId:  integer('parent_id').references((): AnyPgColumn => blogPostComments.id, { onDelete: 'cascade' }),
  content:   text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Support ──────────────────────────────────────────────────────────────────

export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  category: ticketCategoryEnum('category').default('other').notNull(),
  status: ticketStatusEnum('status').default('open').notNull(),
  priority: ticketPriorityEnum('priority').default('medium').notNull(),
  assignedTo: integer('assigned_to').references(() => adminUsers.id, { onDelete: 'set null' }),
  // Flipped to true when the SLA cron detects no activity for >24 h.
  // Reset to false on each new reply so the alert fires again if the ticket
  // goes cold a second time.
  slaBreach: boolean('sla_breach').default(false).notNull(),
  // Per-side "last seen" markers, used to compute unread badges. A ticket is
  // unread for a side when updatedAt is newer than that side's read marker.
  lastStudentReadAt: timestamp('last_student_read_at'),
  lastAdminReadAt: timestamp('last_admin_read_at'),
  // Set the moment status transitions into 'resolved'/'closed' — used for Avg
  // Solution Time on the dashboard. Null for tickets resolved before this
  // column existed, or still open.
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const supportMessages = pgTable('support_messages', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id')
    .notNull()
    .references(() => supportTickets.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  isInternal: boolean('is_internal').default(false).notNull(),
  attachments: jsonb('attachments').$type<{ url: string; name: string }[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Canned responses (quick-reply templates for support agents) ──────────────

export const cannedResponses = pgTable('canned_responses', {
  id:        serial('id').primaryKey(),
  title:     varchar('title', { length: 100 }).notNull(),
  body:      text('body').notNull(),
  category:  varchar('category', { length: 50 }).default('general').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Push subscriptions ───────────────────────────────────────────────────────

export const pushSubscriptions = pgTable('push_subscriptions', {
  id:       serial('id').primaryKey(),
  userId:   integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh:   text('p256dh').notNull(),
  auth:     text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── System ───────────────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  /** Optional in-app destination, e.g. "/student/support". Clicking the
   *  notification routes here. Null = not clickable. */
  link: varchar('link', { length: 500 }),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Admin-facing notifications. Admins live in `admin_users` (separate from
 * `users`), so they get their own table. Events like new support tickets,
 * leads, signups, and paid enrollments fan out one row per admin user.
 */
export const adminNotifications = pgTable('admin_notifications', {
  id: serial('id').primaryKey(),
  adminUserId: integer('admin_user_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  /** Optional in-app destination, e.g. "/admin/support". */
  link: varchar('link', { length: 500 }),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id:           serial('id').primaryKey(),
  /** Set when the actor is a regular user */
  userId:       integer('user_id').references(() => users.id,      { onDelete: 'set null' }),
  /** Set when the actor is an admin user */
  adminUserId:  integer('admin_user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  action:       varchar('action',    { length: 100 }).notNull(),
  entity:       varchar('entity',    { length: 100 }),
  entityId:     integer('entity_id'),
  meta:         json('meta').$type<Record<string, unknown>>(),
  createdAt:    timestamp('created_at').defaultNow(),
}, (table) => [
  index('activity_logs_created_at_idx').on(table.createdAt),
  index('activity_logs_admin_user_id_idx').on(table.adminUserId),
  index('activity_logs_user_id_idx').on(table.userId),
]);

export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Admin-managed payment gateway configuration. One row per gateway id (e.g.
// 'paystation', 'bkash') — `credentials` holds the gateway's field values
// (see packages/validators/src/payment-gateway.schema.ts for the field
// list); values marked `secret` in that schema are encrypted before being
// written here (see CredentialEncryptionService). Exactly one row should
// have isActive=true at a time — that's the gateway checkout actually uses.
export const paymentGatewayConfigs = pgTable('payment_gateway_configs', {
  id: serial('id').primaryKey(),
  gateway: varchar('gateway', { length: 50 }).notNull().unique(),
  enabled: boolean('enabled').notNull().default(false),
  isActive: boolean('is_active').notNull().default(false),
  credentials: jsonb('credentials').$type<Record<string, string>>().default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Admin-managed file storage provider configuration (Cloudflare R2 today).
// Same shape as `paymentGatewayConfigs` — one row per provider id, credentials
// held as a JSON blob with secret fields (see
// packages/validators/src/storage-provider.schema.ts) encrypted at rest via
// CredentialEncryptionService. Lets an admin rotate R2 keys from the UI
// without editing server env vars or redeploying.
export const storageProviderConfigs = pgTable('storage_provider_configs', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull().unique(),
  credentials: jsonb('credentials').$type<Record<string, string>>().default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Site Pages (CMS) ─────────────────────────────────────────────────────────

export const sitePages = pgTable('site_pages', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').default('').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type SitePage = typeof sitePages.$inferSelect;
export type NewSitePage = typeof sitePages.$inferInsert;

// ─── Page Sections (Section-Based CMS) ────────────────────────────────────────

export const pageSections = pgTable('page_sections', {
  id:        serial('id').primaryKey(),
  page:      varchar('page',  { length: 50  }).notNull(),          // e.g. 'home'
  slug:      varchar('slug',  { length: 100 }).notNull(),          // e.g. 'hero'
  label:     varchar('label', { length: 100 }).notNull(),          // display name
  type:      varchar('type',  { length: 50  }).notNull(),          // component type
  order:     integer('order').default(0).notNull(),
  active:    boolean('active').default(true).notNull(),
  content:   json('content').$type<Record<string, unknown>>().default({}),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type PageSection    = typeof pageSections.$inferSelect;
export type NewPageSection = typeof pageSections.$inferInsert;

// ─── Navigation Menus (Header / Footer link management) ───────────────────────

/**
 * Editable header/footer menu links. The four menus are fixed slots — admins
 * manage their *items*, not create new menus — so a single table keyed by a
 * `menu` discriminator is used (mirrors the page_sections pattern):
 *   • navbar          — primary top navigation
 *   • navbar_more     — the "More" dropdown
 *   • footer_company  — footer "Company" column
 *   • footer_others   — footer "Others" column
 */
export const menuItems = pgTable('menu_items', {
  id:           serial('id').primaryKey(),
  menu:         varchar('menu',  { length: 40  }).notNull(),
  label:        varchar('label', { length: 120 }).notNull(),
  url:          varchar('url',   { length: 500 }).notNull(),
  /** True when `url` points off-site — rendered as <a> instead of <Link>. */
  isExternal:   boolean('is_external').default(false).notNull(),
  openInNewTab: boolean('open_in_new_tab').default(false).notNull(),
  order:        integer('order').default(0).notNull(),
  isActive:     boolean('is_active').default(true).notNull(),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
});

export type MenuItem    = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

// ─── Recorded Course Bundles (Mastery template only) ─────────────────────────

// ─── Live Courses ─────────────────────────────────────────────────────────────

export const liveCourseStatusEnum = pgEnum('live_course_status', ['draft', 'published', 'inactive', 'scheduled', 'trash']);
export const liveBatchStatusEnum  = pgEnum('live_batch_status',  ['upcoming', 'active', 'ended']);
export const liveCourseTypeEnum   = pgEnum('live_course_type',   ['live', 'bundle']);

export const liveCourses = pgTable('live_courses', {
  id:             serial('id').primaryKey(),
  title:          varchar('title',         { length: 255 }).notNull(),
  slug:           varchar('slug',          { length: 280 }).notNull().unique(),
  status:         liveCourseStatusEnum('status').default('draft').notNull(),
  // Set when status='scheduled' — CoursesSchedulerService flips status to
  // 'published' once this timestamp passes.
  publishAt:      timestamp('publish_at'),
  showBadge:      boolean('show_badge').default(true).notNull(),
  // Access control — mirrors courses.hasLifetimeAccess/accessDurationDays.
  hasLifetimeAccess:  boolean('has_lifetime_access').default(true).notNull(),
  accessDurationDays: integer('access_duration_days'),
  courseType:     liveCourseTypeEnum('course_type').default('live').notNull(),
  price:          numeric('price',         { precision: 10, scale: 2 }).default('0').notNull(),
  originalPrice:  numeric('original_price',{ precision: 10, scale: 2 }),
  hasSubscription: boolean('has_subscription').default(false).notNull(),
  monthlyPrice:   numeric('monthly_price', { precision: 10, scale: 2 }),

  // ── Section data stored as JSON ────────────────────────────────────────────
  hero:           json('hero').$type<{
    badgeText?: string;
    subtitle?: string;
    bannerImage?: string;
    rating?: number;
    ratingCount?: number;
    ctaText?: string;
    promoText?: string;
    studentCountText?: string;
    // Template 2 / 4 / 6 split headline
    headline?: string;
    headlineHighlight?: string;
    headlineAfter?: string;
    secondaryCtaText?: string;
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
  }>().default({}),

  paymentLogos:   json('payment_logos').$type<Array<{
    name: string; image?: string;
  }>>().default([]),

  batchInfo:      json('batch_info').$type<{
    startDate?: string;
    liveSchedule?: string;
    supportSchedule?: string;
    seatsLeft?: string;
  }>().default({}),

  curriculum:     json('curriculum').$type<Array<{
    title: string; lessons?: string[];
  }>>().default([]),

  tools:          json('tools').$type<Array<{
    name: string; icon?: string; bgColor?: string;
  }>>().default([]),

  whyDifferent:   json('why_different').$type<Array<{
    title: string; description?: string; icon?: string;
  }>>().default([]),

  stats:          json('stats').$type<{
    studentsCount?: string;
    ratingsCount?: string;
    completionRate?: string;
    extra?: string;
    labels?: [string, string, string, string];
  }>().default({}),

  instructors:    json('instructors').$type<Array<{
    name: string; title?: string; image?: string;
    bio?: string; students?: string; courses?: string; rating?: string;
    years?: string; clients?: string; projects?: string; profileUrl?: string;
  }>>().default([]),

  whatYouGet:     json('what_you_get').$type<Array<{
    title: string; description?: string; icon?: string;
  }>>().default([]),

  videos:         json('videos').$type<Array<{
    url: string; title?: string; description?: string;
  }>>().default([]),

  testimonials:   json('testimonials').$type<Array<{
    name: string; role?: string; review: string;
  }>>().default([]),

  valueItems:     json('value_items').$type<Array<{
    title: string; description?: string; value: string;
  }>>().default([]),

  totalValue:      varchar('total_value',      { length: 50 }),
  totalLiveClasses: varchar('total_live_classes', { length: 20 }),
  /** Optional override for the module count shown in the curriculum stat line. Blank = auto-count. */
  totalModules:    varchar('total_modules', { length: 20 }),
  countdownEnd:    timestamp('countdown_end'),

  // ── Template 2 specific fields ─────────────────────────────────────────────
  template:        varchar('template', { length: 5 }).default('1').notNull(),

  faq:             json('faq').$type<Array<{
    question: string; answer: string;
  }>>().default([]),

  comparisonTable: json('comparison_table').$type<{
    col1Label?: string;
    col2Label?: string;
    rows?: Array<{ feature: string; col1?: string; col2?: string; highlight?: boolean }>;
  }>().default({}),

  pcRequirements:  json('pc_requirements').$type<{
    basic?: { ram?: string; processor?: string; storage?: string; graphics?: string; note?: string };
    pro?:   { ram?: string; processor?: string; storage?: string; graphics?: string; note?: string };
    internet?: string;
  }>().default({}),

  ctaBanner:       json('cta_banner').$type<{
    label?: string;
    title?: string;
    price?: string;
    originalPrice?: string;
    buttonText?: string;
    installment1?: string;
    installment2?: string;
  }>().default({}),

  certificate:     json('certificate').$type<{
    title?: string;
    highlight?: string;
    description?: string;
    image?: string;
    founderName?: string;
    founderRole?: string;
  }>().default({}),

  urgencyCta:      json('urgency_cta').$type<{
    batchLabel?: string;
    title?: string;
    highlight?: string;
    subtitle?: string;
    buttonText?: string;
    whatsapp?: string;
  }>().default({}),

  videoTabs:       json('video_tabs').$type<Array<{
    category: string;
    videos: Array<{ url: string; title?: string; thumbnail?: string }>;
  }>>().default([]),

  // ── Template 3 specific fields ─────────────────────────────────────────────
  marqueeText:       varchar('marquee_text', { length: 500 }),

  announcementBar:   json('announcement_bar').$type<{
    text?: string; ctaText?: string; ctaAnchor?: string;
  }>().default({}),

  blueprintSection:  json('blueprint_section').$type<{
    title?: string; subtitle?: string; image?: string;
  }>().default({}),

  whyJoinItems:      json('why_join_items').$type<string[]>().default([]),

  featuresGrid:      json('features_grid').$type<{
    title?: string; subtitle?: string;
    items?: Array<{ icon?: string; text: string }>;
  }>().default({}),

  bonusChecklist:    json('bonus_checklist').$type<{
    title?: string; items?: string[];
  }>().default({}),

  challengeSection:  json('challenge_section').$type<{
    title?: string; monthCount?: string; description?: string; linkText?: string;
  }>().default({}),

  supportLevels:     json('support_levels').$type<{
    title?: string; subtitle?: string;
    levels?: Array<{ label: string; description: string; color?: string }>;
  }>().default({}),

  salesUpdateSlider: json('sales_update_slider').$type<{
    title?: string; subtitle?: string; images?: string[];
  }>().default({}),

  communitySection:  json('community_section').$type<{
    title?: string; subtitle?: string; caption?: string; images?: string[];
  }>().default({}),

  textReviewsSlider: json('text_reviews_slider').$type<{
    title?: string;
    reviews?: Array<{ name: string; role?: string; avatar?: string; text: string }>;
  }>().default({}),

  successStories:    json('success_stories').$type<{
    title?: string;
    stories?: Array<{ name: string; badge?: string; description?: string; image?: string }>;
  }>().default({}),

  videoGrid:         json('video_grid').$type<{
    title?: string;
    videos?: Array<{ url: string; thumbnail?: string }>;
  }>().default({}),

  faqContactButtons: json('faq_contact_buttons').$type<{
    messengerUrl?: string; phone?: string;
  }>().default({}),

  footerBranding:    json('footer_branding').$type<{
    brandName?: string; tagline?: string; copyright?: string;
  }>().default({}),

  // ── Template 4 specific fields ─────────────────────────────────────────────
  t4LiveSessionCard: json('t4_live_session_card').$type<{
    batchLabel?: string; title?: string; description?: string;
    mentorLine1?: string; mentorLine2?: string;
    features?: string[]; ctaText?: string;
  }>().default({}),

  t4StudentProgress: json('t4_student_progress').$type<{
    preText?: string; title?: string; images?: string[];
  }>().default({}),

  t4ForWhomSection:  json('t4_for_whom_section').$type<{
    title?: string; titleHighlight?: string;
    cards?: Array<{ icon?: string; title: string; description?: string }>;
    closingText?: string;
  }>().default({}),

  t4InstructorStory: json('t4_instructor_story').$type<{
    title?: string; titleHighlight?: string;
    bio?: string; videoUrl?: string;
  }>().default({}),

  t4ModuleGrid:      json('t4_module_grid').$type<{
    title?: string; titleHighlight?: string;
    modules?: Array<{ icon?: string; title: string; bullets?: string[]; fullWidth?: boolean }>;
  }>().default({}),

  t4PricingSection:  json('t4_pricing_section').$type<{
    bonusLabel?: string; bonusText?: string;
    savingsText?: string; ctaText?: string;
    paymentBadge1?: string; paymentBadge2?: string; paymentBadge3?: string;
  }>().default({}),

  t4SupportSection:  json('t4_support_section').$type<{
    title?: string; content?: string; instructorImage?: string;
  }>().default({}),

  t4CountdownBanner: json('t4_countdown_banner').$type<{
    text?: string; ctaText?: string;
  }>().default({}),

  // ── Template 5 specific fields (Green "Masterclass" style) ──────────────────
  /** The 5 icon stat cards in the hero (Modules / Regular classes / etc.). */
  t5StatCards:   json('t5_stat_cards').$type<Array<{
    icon?: string; value: string; label: string;
  }>>().default([]),

  /** "Who is this for" checklist section. */
  t5WhoFor:      json('t5_who_for').$type<{
    title?: string;
    items?: string[];
    ctaText?: string;
    ctaUrl?: string;
  }>().default({}),

  /** "Real-life projects you'll build" chips. */
  t5RealProjects: json('t5_real_projects').$type<{
    title?: string;
    items?: string[];
  }>().default({}),

  /** The vertical zig-zag "Roadmap" timeline. */
  t5Roadmap:     json('t5_roadmap').$type<{
    title?: string;
    steps?: Array<{ title: string; description?: string }>;
  }>().default({}),

  // ── Template 6 specific fields (Medical Style) ──────────────────────────────
  t6Credentials: json('t6_credentials').$type<Array<{
    icon: string; label: string;
  }>>().default([]),

  t6Stats:       json('t6_stats').$type<Array<{
    value: string; label: string;
  }>>().default([]),

  t6Comparison:  json('t6_comparison').$type<Array<{
    feature: string; selfStudy: boolean; liveCourse: boolean;
  }>>().default([]),

  t6Organs:      json('t6_organs').$type<Array<{
    name: string; icon?: string;
  }>>().default([]),

  t6Instructor:  json('t6_instructor').$type<{
    name?: string; title?: string; credentials?: string; photo?: string; hospital?: string;
  }>().default({}),

  t6WhoFor:      json('t6_who_for').$type<{
    title?: string; items?: string[];
  }>().default({}),

  t6Pricing:     json('t6_pricing').$type<{
    tiers?: Array<{ name: string; price: string; period: string; features?: string[]; highlighted?: boolean }>;
  }>().default({}),

  t6Video:       varchar('t6_video', { length: 500 }),

  t6Testimonials: json('t6_testimonials').$type<Array<{
    name: string; rating?: number; text: string; photo?: string;
  }>>().default([]),

  // ── Per-element style overrides (click-to-edit, keyed by selector path) ─────
  styleOverrides: json('style_overrides').$type<Record<string, {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    backgroundColor?: string;
    ranges?: Array<{
      start: number;
      end: number;
      text: string;
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: number;
      color?: string;
      backgroundColor?: string;
    }>;
  }>>().default({}),

  /** Icon shown before each curriculum lesson row (key from LESSON_ICONS). */
  lessonIcon:     varchar('lesson_icon', { length: 40 }),

  /** Editable copy for the Value Breakdown section (Template 1). */
  valueSection:   json('value_section').$type<{
    heading?: string;
    totalLabel?: string;
    offerLine?: string;
    ctaText?: string;
  }>().default({}),

  /** Custom heading text per page section, keyed by section id. Falls back to the template default. */
  sectionHeadings: json('section_headings').$type<Record<string, string>>().default({}),

  /** Custom render order of page sections, by section id. Empty = template's default order. */
  sectionOrder:    json('section_order').$type<string[]>().default([]),

  requireSequentialProgress: boolean('require_sequential_progress').default(false).notNull(),

  createdAt:      timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
});

export type LiveCourse    = typeof liveCourses.$inferSelect;
export type NewLiveCourse = typeof liveCourses.$inferInsert;

// ─── Live Course Batches ──────────────────────────────────────────────────────

export const liveCourseBatches = pgTable('live_course_batches', {
  id:              serial('id').primaryKey(),
  liveCourseId:    integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  batchName:       varchar('batch_name',       { length: 100 }).notNull(),
  status:          liveBatchStatusEnum('status').default('upcoming').notNull(),
  startDate:       varchar('start_date',        { length: 100 }),
  endDate:         varchar('end_date',          { length: 100 }),
  schedule:        varchar('schedule',          { length: 200 }),
  supportSchedule: varchar('support_schedule',  { length: 200 }),
  maxSeats:        integer('max_seats'),
  seatsFilled:     integer('seats_filled').default(0).notNull(),
  countdownEnd:    varchar('countdown_end',     { length: 50 }),
  notes:           text('notes'),
  /** Set once the "batch starting soon" SMS has gone out (cron dedup). */
  startingSoonSmsSentAt: timestamp('starting_soon_sms_sent_at'),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow(),
});

export type LiveCourseBatch    = typeof liveCourseBatches.$inferSelect;
export type NewLiveCourseBatch = typeof liveCourseBatches.$inferInsert;

// ─── Live Enrollments ─────────────────────────────────────────────────────────

export const liveEnrollments = pgTable('live_enrollments', {
  id:                  serial('id').primaryKey(),
  liveCourseId:        integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  batchId:             integer('batch_id').references(() => liveCourseBatches.id, { onDelete: 'set null' }),
  // Nullable — set when a logged-in user completes payment, or auto-linked
  // on first lesson access by matching email to an existing users row.
  userId:              integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  name:                varchar('name',  { length: 200 }).notNull(),
  phone:               varchar('phone', { length: 20 }),
  email:               varchar('email', { length: 200 }).notNull(),
  paystationInvoiceId: varchar('paystation_invoice_id', { length: 100 }),
  paystationTrxId:     varchar('paystation_trx_id',     { length: 100 }),
  paystationMethod:    varchar('paystation_method',      { length: 50 }),
  // bKash Tokenized Checkout (PGW) fields
  bkashInvoiceNumber:  varchar('bkash_invoice_number', { length: 100 }),
  bkashPaymentId:      varchar('bkash_payment_id',     { length: 100 }),
  bkashPgwTrxId:       varchar('bkash_pgw_trx_id',     { length: 100 }),
  bkashPgwStatus:      varchar('bkash_pgw_status',     { length: 30  }),
  // Sender/payer mobile number for offline manual (admin-recorded) payments.
  payerPhone:          varchar('payer_phone', { length: 20 }),
  amount:              numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status:              varchar('status', { length: 20 }).default('pending').notNull(),
  // Admin's free-text reason when status is set to 'suspended' via
  // ManageEnrollmentModal — shown to the student on the live-course
  // suspended notice page.
  statusReason:        text('status_reason'),
  paidAt:              timestamp('paid_at'),
  expiresAt:           timestamp('expires_at'),
  // Human-facing sequential number shown on the invoice PDF (e.g. SKINV-2025-0001).
  displayInvoiceNumber: varchar('display_invoice_number', { length: 40 }).unique(),
  // Idempotency marker for the confirmation SMS — see orders.confirmationSmsSentAt.
  confirmationSmsSentAt: timestamp('confirmation_sms_sent_at'),
  paymentMode:          varchar('payment_mode', { length: 20 }).default('one_time').notNull(),
  createdAt:           timestamp('created_at').defaultNow(),
});

// ─── Live Subscriptions ──────────────────────────────────────────────────────

export const liveSubscriptionStatusEnum = pgEnum('live_subscription_status', [
  'pending',
  'active',
  'past_due',
  'cancelled',
  'expired',
  'paused',
]);

export const liveSubscriptions = pgTable('live_subscriptions', {
  id:                    serial('id').primaryKey(),
  liveCourseId:          integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  enrollmentId:          integer('enrollment_id').notNull().references(() => liveEnrollments.id, { onDelete: 'cascade' }),
  userId:                integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  batchId:               integer('batch_id').references(() => liveCourseBatches.id, { onDelete: 'set null' }),
  gateway:               varchar('gateway', { length: 30 }).notNull(),
  gatewaySubscriptionId: varchar('gateway_subscription_id', { length: 255 }),
  monthlyPrice:          numeric('monthly_price', { precision: 10, scale: 2 }).notNull(),
  status:                liveSubscriptionStatusEnum('status').default('pending').notNull(),
  currentPeriodStart:    timestamp('current_period_start').notNull(),
  nextBillingAt:         timestamp('next_billing_at').notNull(),
  lastPaymentAt:         timestamp('last_payment_at'),
  cancelledAt:           timestamp('cancelled_at'),
  createdAt:             timestamp('created_at').defaultNow(),
  updatedAt:             timestamp('updated_at').defaultNow(),
});

export type LiveSubscription    = typeof liveSubscriptions.$inferSelect;
export type NewLiveSubscription = typeof liveSubscriptions.$inferInsert;

// ─── Live Subscription Payments ──────────────────────────────────────────────

export const liveSubscriptionPayments = pgTable('live_subscription_payments', {
  id:                    serial('id').primaryKey(),
  subscriptionId:        integer('subscription_id').notNull().references(() => liveSubscriptions.id, { onDelete: 'cascade' }),
  amount:                numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method:                paymentMethodEnum('method').notNull(),
  gatewayInvoiceId:      varchar('gateway_invoice_id', { length: 100 }),
  gatewayTransactionId:  varchar('gateway_transaction_id', { length: 100 }),
  status:                paymentStatusEnum('status').default('pending').notNull(),
  gatewayResponse:       jsonb('gateway_response'),
  paidAt:                timestamp('paid_at'),
  createdAt:             timestamp('created_at').defaultNow(),
});

export type LiveSubscriptionPayment    = typeof liveSubscriptionPayments.$inferSelect;
export type NewLiveSubscriptionPayment = typeof liveSubscriptionPayments.$inferInsert;

// ─── Live Course Curriculum (Modules + Lessons) ───────────────────────────────

export const liveCourseLessonTypeEnum = pgEnum('live_course_lesson_type', [
  'video',
  'text',
  'quiz',
  'assignment',
]);

export const liveCourseModules = pgTable('live_course_modules', {
  id:           serial('id').primaryKey(),
  liveCourseId: integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  title:        varchar('title', { length: 255 }).notNull(),
  order:        integer('order').default(0).notNull(),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
});

export const liveCourseLessons = pgTable('live_course_lessons', {
  id:               serial('id').primaryKey(),
  moduleId:         integer('module_id').notNull().references(() => liveCourseModules.id, { onDelete: 'cascade' }),
  liveCourseId:     integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  title:            varchar('title', { length: 255 }).notNull(),
  type:             liveCourseLessonTypeEnum('type').default('video').notNull(),
  videoSource:      videoSourceEnum('video_source'),
  bunnyVideoId:     varchar('bunny_video_id',      { length: 100 }),
  bunnyStatus:      bunnyStatusEnum('bunny_status'),
  externalVideoUrl: varchar('external_video_url',  { length: 1000 }),
  duration:         integer('duration').default(0).notNull(),
  content:          text('content'),
  isFree:           boolean('is_free').default(false).notNull(),
  order:            integer('order').default(0).notNull(),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow(),
});

export type LiveCourseModule  = typeof liveCourseModules.$inferSelect;
export type LiveCourseLesson  = typeof liveCourseLessons.$inferSelect;

// ─── Live Lesson Progress ─────────────────────────────────────────────────────

export const liveLessonProgress = pgTable(
  'live_lesson_progress',
  {
    id:           serial('id').primaryKey(),
    userId:       integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lessonId:     integer('lesson_id').notNull().references(() => liveCourseLessons.id, { onDelete: 'cascade' }),
    liveCourseId: integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
    completedAt:  timestamp('completed_at'),
    createdAt:    timestamp('created_at').defaultNow(),
    updatedAt:    timestamp('updated_at').defaultNow(),
  },
  (t) => [unique('uq_live_lesson_progress_user_lesson').on(t.userId, t.lessonId)],
);

// ─── Live Certificates ────────────────────────────────────────────────────────

export const liveCertificates = pgTable(
  'live_certificates',
  {
    id:              serial('id').primaryKey(),
    userId:          integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    liveCourseId:    integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
    certificateCode: varchar('certificate_code', { length: 100 }).notNull().unique(),
    certificateUrl:  varchar('certificate_url', { length: 500 }),
    issuedAt:        timestamp('issued_at').defaultNow(),
  },
  (t) => [unique('uq_live_cert_user_course').on(t.userId, t.liveCourseId)],
);

export const liveNotes = pgTable('live_notes', {
  id:             serial('id').primaryKey(),
  userId:         integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId:       integer('lesson_id').notNull().references(() => liveCourseLessons.id, { onDelete: 'cascade' }),
  content:        text('content').notNull(),
  videoTimestamp: integer('video_timestamp').default(0),
  createdAt:      timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
});

// ─── Live Course: assessments (quizzes & assignments) ─────────────────────────
// Parallel to the recorded quizzes/assignments tables, but keyed to live
// lessons/courses (the recorded ones are FK-locked to `lessons`/`courses`).
// Reuses the shared quizQuestionTypeEnum and submissionStatusEnum.

export const liveLessonQuizzes = pgTable('live_lesson_quizzes', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => liveCourseLessons.id, { onDelete: 'cascade' }),
  liveCourseId: integer('live_course_id')
    .notNull()
    .references(() => liveCourses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  passingScore: integer('passing_score').default(70).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const liveLessonQuizQuestions = pgTable('live_lesson_quiz_questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => liveLessonQuizzes.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  type: quizQuestionTypeEnum('type').default('single').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const liveLessonQuizAnswers = pgTable('live_lesson_quiz_answers', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id')
    .notNull()
    .references(() => liveLessonQuizQuestions.id, { onDelete: 'cascade' }),
  answer: text('answer').notNull(),
  isCorrect: boolean('is_correct').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const liveLessonQuizAttempts = pgTable('live_lesson_quiz_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => liveLessonQuizzes.id, { onDelete: 'cascade' }),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
  passed: boolean('passed').default(false).notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
});

export const liveLessonAssignments = pgTable('live_lesson_assignments', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => liveCourseLessons.id, { onDelete: 'cascade' }),
  liveCourseId: integer('live_course_id')
    .notNull()
    .references(() => liveCourses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const liveLessonAssignmentSubmissions = pgTable('live_lesson_assignment_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  assignmentId: integer('assignment_id')
    .notNull()
    .references(() => liveLessonAssignments.id, { onDelete: 'cascade' }),
  content: text('content'),
  fileUrl: varchar('file_url', { length: 500 }),
  status: submissionStatusEnum('status').default('submitted').notNull(),
  grade: numeric('grade', { precision: 5, scale: 2 }),
  feedback: text('feedback'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  gradedAt: timestamp('graded_at'),
});

export type LiveEnrollment    = typeof liveEnrollments.$inferSelect;
export type NewLiveEnrollment = typeof liveEnrollments.$inferInsert;

// ─── Live Course: batch dashboard (sessions / resources / assignments) ────────

/** Scheduled live class within a batch. */
export const liveSessionStatusEnum = pgEnum('live_session_status', [
  'scheduled',
  'live',
  'completed',
  'cancelled',
]);

export const liveSessions = pgTable('live_sessions', {
  id:              serial('id').primaryKey(),
  liveCourseId:    integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  batchId:         integer('batch_id').notNull().references(() => liveCourseBatches.id, { onDelete: 'cascade' }),
  title:           varchar('title', { length: 255 }).notNull(),
  description:     text('description'),
  scheduledAt:     timestamp('scheduled_at').notNull(),
  durationMinutes: integer('duration_minutes').default(60).notNull(),
  meetingUrl:      varchar('meeting_url', { length: 1000 }),
  status:          liveSessionStatusEnum('status').default('scheduled').notNull(),
  recordingUrl:    varchar('recording_url', { length: 1000 }),
  order:           integer('order').default(0).notNull(),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow(),
});

/** One row per student who joined a session (recorded on first Join click). */
export const liveSessionAttendance = pgTable(
  'live_session_attendance',
  {
    sessionId: integer('session_id').notNull().references(() => liveSessions.id, { onDelete: 'cascade' }),
    userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    joinedAt:  timestamp('joined_at').defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.userId] })],
);

/** Downloadable file for a course (batchId null = visible to all batches). */
export const liveCourseResources = pgTable('live_course_resources', {
  id:           serial('id').primaryKey(),
  liveCourseId: integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  batchId:      integer('batch_id').references(() => liveCourseBatches.id, { onDelete: 'cascade' }),
  title:        varchar('title', { length: 255 }).notNull(),
  fileUrl:      varchar('file_url', { length: 1000 }).notNull(),
  fileType:     varchar('file_type', { length: 50 }),
  order:        integer('order').default(0).notNull(),
  createdAt:    timestamp('created_at').defaultNow(),
});

/** Assignment set for a batch. */
export const liveAssignments = pgTable('live_assignments', {
  id:              serial('id').primaryKey(),
  liveCourseId:    integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  batchId:         integer('batch_id').notNull().references(() => liveCourseBatches.id, { onDelete: 'cascade' }),
  title:           varchar('title', { length: 255 }).notNull(),
  description:     text('description'),
  instructionsUrl: varchar('instructions_url', { length: 1000 }),
  dueDate:         timestamp('due_date'),
  maxScore:        integer('max_score').default(100).notNull(),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow(),
});

export const liveAssignmentSubmissionStatusEnum = pgEnum('live_assignment_submission_status', [
  'submitted',
  'graded',
]);

/** A student's submission for an assignment (one per student/assignment). */
export const liveAssignmentSubmissions = pgTable(
  'live_assignment_submissions',
  {
    id:             serial('id').primaryKey(),
    assignmentId:   integer('assignment_id').notNull().references(() => liveAssignments.id, { onDelete: 'cascade' }),
    userId:         integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    submissionUrl:  varchar('submission_url', { length: 1000 }),
    submissionText: text('submission_text'),
    status:         liveAssignmentSubmissionStatusEnum('status').default('submitted').notNull(),
    score:          integer('score'),
    feedback:       text('feedback'),
    submittedAt:    timestamp('submitted_at').defaultNow(),
    gradedAt:       timestamp('graded_at'),
  },
  (t) => [unique().on(t.assignmentId, t.userId)],
);

export type LiveSession             = typeof liveSessions.$inferSelect;
export type LiveCourseResource      = typeof liveCourseResources.$inferSelect;
export type LiveAssignment          = typeof liveAssignments.$inferSelect;
export type LiveAssignmentSubmission = typeof liveAssignmentSubmissions.$inferSelect;

// ─── Coupon scope junction tables ─────────────────────────────────────────────

/** Recorded courses a `specific_recorded` coupon is restricted to. */
export const couponRecordedCourses = pgTable(
  'coupon_recorded_courses',
  {
    couponId: integer('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
    courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.couponId, t.courseId] })],
);

/** Live courses a `specific_live` coupon is restricted to. */
export const couponLiveCourses = pgTable(
  'coupon_live_courses',
  {
    couponId:     integer('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
    liveCourseId: integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.couponId, t.liveCourseId] })],
);

/** Recorded courses bundled inside a Mastery recorded course (template='2' only). */
export const courseBundleItems = pgTable(
  'course_bundle_items',
  {
    bundleCourseId: integer('bundle_course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    bundledCourseId: integer('bundled_course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    order: integer('order').default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.bundleCourseId, t.bundledCourseId] })],
);

/** Recorded courses included in a bundle live course. */
export const liveCourseRecordedBundles = pgTable(
  'live_course_recorded_bundles',
  {
    liveCourseId: integer('live_course_id').notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
    courseId:     integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    order:        integer('order').default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.liveCourseId, t.courseId] })],
);

// ─── Shop ─────────────────────────────────────────────────────────────────────

export const shopProductTypeEnum = pgEnum('shop_product_type', [
  'physical',
  'digital',
  'bundle',
  'tool',
]);

export const shopFulfillmentStatusEnum = pgEnum('shop_fulfillment_status', [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

export const shopProducts = pgTable('shop_products', {
  id:               serial('id').primaryKey(),
  title:            varchar('title',       { length: 255 }).notNull(),
  slug:             varchar('slug',        { length: 280 }).notNull().unique(),
  description:      text('description'),
  shortDescription: text('short_description'),
  type:             shopProductTypeEnum('type').notNull().default('physical'),
  price:            numeric('price',         { precision: 10, scale: 2 }).notNull(),
  discountPrice:    numeric('discount_price',{ precision: 10, scale: 2 }),
  /** JSON array of image URLs */
  images:           json('images').$type<string[]>().notNull().default([]),
  /** null = unlimited stock */
  stock:            integer('stock'),
  /** For digital/bundle: URL delivered after payment */
  downloadUrl:      varchar('download_url', { length: 1000 }),
  /** For bundle type: linked recorded course */
  courseId:         integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  isActive:         boolean('is_active').notNull().default(true),
  isFeatured:       boolean('is_featured').notNull().default(false),
  sortOrder:        integer('sort_order').notNull().default(0),
  metaTitle:        varchar('meta_title', { length: 255 }),
  metaDescription:  text('meta_description'),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow(),
});

export const shopCartItems = pgTable('shop_cart_items', {
  id:        serial('id').primaryKey(),
  /** Set for logged-in users */
  userId:    integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  /** Set for guest sessions (random UUID stored in cookie) */
  sessionId: varchar('session_id', { length: 64 }),
  productId: integer('product_id').notNull().references(() => shopProducts.id, { onDelete: 'cascade' }),
  quantity:  integer('quantity').notNull().default(1),
  addedAt:   timestamp('added_at').defaultNow(),
});

export const shopOrders = pgTable('shop_orders', {
  id:                    serial('id').primaryKey(),
  /** Null for guest orders */
  userId:                integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  name:                  varchar('name',  { length: 255 }).notNull(),
  email:                 varchar('email', { length: 255 }).notNull(),
  phone:                 varchar('phone', { length: 30  }).notNull(),
  /** Delivery address (for physical products) */
  address:               text('address'),
  totalAmount:           numeric('total_amount',    { precision: 10, scale: 2 }).notNull(),
  discountAmount:        numeric('discount_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  finalAmount:           numeric('final_amount',    { precision: 10, scale: 2 }).notNull(),
  couponId:              integer('coupon_id').references(() => shopCoupons.id, { onDelete: 'set null' }),
  status:                orderStatusEnum('status').notNull().default('pending'),
  fulfillmentStatus:     shopFulfillmentStatusEnum('fulfillment_status').notNull().default('pending'),
  paymentMethod:         varchar('payment_method', { length: 50 }),
  bkashTrxId:            varchar('bkash_trx_id', { length: 100 }),
  paystationInvoiceId:   varchar('paystation_invoice_id', { length: 100 }),
  paystationTrxId:       varchar('paystation_trx_id', { length: 100 }),
  paystationMethod:      varchar('paystation_method', { length: 50 }),
  // bKash Tokenized Checkout (PGW) fields
  bkashInvoiceNumber:    varchar('bkash_invoice_number', { length: 100 }),
  bkashPaymentId:        varchar('bkash_payment_id', { length: 100 }),
  bkashPgwTrxId:         varchar('bkash_pgw_trx_id', { length: 100 }),
  bkashPgwStatus:        varchar('bkash_pgw_status', { length: 30 }),
  payerPhone:            varchar('payer_phone', { length: 20 }),
  paidAt:                timestamp('paid_at'),
  notes:                 text('notes'),
  /** Idempotency marker — set once confirmation SMS fires */
  confirmationSmsSentAt: timestamp('confirmation_sms_sent_at'),
  createdAt:             timestamp('created_at').defaultNow(),
  updatedAt:             timestamp('updated_at').defaultNow(),
  // Human-facing sequential number shown on the invoice PDF (e.g. SKINV-2025-0001).
  displayInvoiceNumber:  varchar('display_invoice_number', { length: 40 }).unique(),
});

export const shopOrderItems = pgTable('shop_order_items', {
  id:        serial('id').primaryKey(),
  orderId:   integer('order_id').notNull().references(() => shopOrders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => shopProducts.id, { onDelete: 'restrict' }),
  quantity:  integer('quantity').notNull(),
  /** Price snapshot at time of order */
  price:     numeric('price', { precision: 10, scale: 2 }).notNull(),
  /** Title snapshot at time of order */
  title:     varchar('title', { length: 255 }).notNull(),
});

export const shopCoupons = pgTable('shop_coupons', {
  id:        serial('id').primaryKey(),
  code:      varchar('code', { length: 50 }).notNull().unique(),
  type:      couponTypeEnum('type').notNull(),
  value:     numeric('value', { precision: 10, scale: 2 }).notNull(),
  maxUses:   integer('max_uses'),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at'),
  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const shopCouponUsages = pgTable('shop_coupon_usages', {
  id:        serial('id').primaryKey(),
  couponId:  integer('coupon_id').notNull().references(() => shopCoupons.id, { onDelete: 'cascade' }),
  userId:    integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  orderId:   integer('order_id').notNull().references(() => shopOrders.id, { onDelete: 'cascade' }),
  usedAt:    timestamp('used_at').defaultNow(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type UserStatus = (typeof userStatusEnum.enumValues)[number];

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type AdminRole = (typeof adminRoleEnum.enumValues)[number];

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type PermissionType = (typeof permissionTypeEnum.enumValues)[number];
export type RolePermission = typeof rolePermissions.$inferSelect;

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type CourseModule = typeof courseModules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type LessonResource = typeof lessonResources.$inferSelect;

export type Enrollment = typeof enrollments.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;

export type Assignment = typeof assignments.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;

export type Review = typeof reviews.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;

// ─── Media Library ────────────────────────────────────────────────────────────

export const mediaTypeEnum = pgEnum('media_type', [
  'image',
  'video',
  'audio',
  'document',
  'other',
]);

export const mediaFiles = pgTable('media_files', {
  id:           serial('id').primaryKey(),
  filename:     varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 500 }).notNull(),
  mimeType:     varchar('mime_type', { length: 100 }).notNull(),
  size:         integer('size').notNull(),              // bytes
  type:         mediaTypeEnum('type').notNull().default('other'),
  url:          text('url').notNull(),                  // public R2 URL
  thumbnailUrl: text('thumbnail_url'),                  // null for non-images
  altText:      varchar('alt_text', { length: 500 }),
  caption:      text('caption'),
  uploadedBy:   integer('uploaded_by'),                 // adminUser.id (nullable — system uploads)
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
});

export type MediaFile = typeof mediaFiles.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AdminNotification = typeof adminNotifications.$inferSelect;

// ─── Code Snippets ────────────────────────────────────────────────────────────

export const codeLocationEnum = pgEnum('code_location', ['head', 'body_start', 'body_end']);
export const codeScopeEnum    = pgEnum('code_scope',    ['global', 'specific']);

export const codeSnippets = pgTable('code_snippets', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  code:      text('code').notNull().default(''),
  location:  codeLocationEnum('location').notNull().default('head'),
  scope:     codeScopeEnum('scope').notNull().default('global'),
  /** JSON array of page paths, e.g. ["/courses", "/checkout"] — used when scope = 'specific' */
  pages:     json('pages').$type<string[]>().notNull().default([]),
  isEnabled: boolean('is_enabled').notNull().default(true),
  order:     integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type CodeSnippet = typeof codeSnippets.$inferSelect;

// ─── Tracking Settings ────────────────────────────────────────────────────────

export const trackingSettings = pgTable('tracking_settings', {
  id:              serial('id').primaryKey(),
  /** Google Tag Manager container ID — e.g. GTM-XXXXXXX */
  gtmId:           varchar('gtm_id', { length: 50 }),
  /** Google Analytics 4 Measurement ID — e.g. G-XXXXXXXXXX */
  ga4Id:           varchar('ga4_id', { length: 50 }),
  /** Meta / Facebook Pixel numeric ID */
  fbPixelId:       varchar('fb_pixel_id', { length: 50 }),
  /** Meta Conversions API access token (server-side events, from Events Manager) */
  fbCapiAccessToken: varchar('fb_capi_access_token', { length: 500 }),
  /** Meta Conversions API test event code (Events Manager → Test Events) */
  fbCapiTestEventCode: varchar('fb_capi_test_event_code', { length: 50 }),
  /** Microsoft Clarity project ID */
  clarityId:       varchar('clarity_id', { length: 50 }),
  /** Google Ads conversion ID — e.g. AW-XXXXXXXXXX */
  gadsId:          varchar('gads_id', { length: 100 }),
  /** Google Search Console verification meta content value */
  gscVerification: varchar('gsc_verification', { length: 500 }),

  // ── dataLayer ecommerce event toggles ── all default on; admin can turn
  // individual GTM events off without touching the GTM ID itself.
  eventPageView:      boolean('event_page_view').notNull().default(true),
  eventViewItem:      boolean('event_view_item').notNull().default(true),
  eventViewItemList:  boolean('event_view_item_list').notNull().default(true),
  eventSelectItem:    boolean('event_select_item').notNull().default(true),
  eventAddToCart:     boolean('event_add_to_cart').notNull().default(true),
  eventRemoveFromCart: boolean('event_remove_from_cart').notNull().default(true),
  eventBeginCheckout: boolean('event_begin_checkout').notNull().default(true),
  eventPurchase:      boolean('event_purchase').notNull().default(true),
  eventSignUp:        boolean('event_sign_up').notNull().default(true),
  eventLogin:         boolean('event_login').notNull().default(true),

  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
});

export type TrackingSetting = typeof trackingSettings.$inferSelect;

// ─── Tracking Items (capability registry) ──────────────────────────────────────
// Data-driven replacement for the fixed event* columns above — one row per
// trackable capability (tag, event, or engagement signal) so admins can add
// or toggle items from Settings without a schema migration per item.

export const trackingItemCategoryEnum = pgEnum('tracking_item_category', [
  'core_tag',
  'ecommerce_event',
  'content_engagement',
  'user_data',
  'consent',
]);

export const trackingItems = pgTable('tracking_items', {
  id:         serial('id').primaryKey(),
  /** Stable identifier, e.g. 'gtm', 'event_view_cart', 'engagement_scroll' */
  key:        varchar('key', { length: 100 }).notNull().unique(),
  category:   trackingItemCategoryEnum('category').notNull(),
  label:      varchar('label', { length: 200 }).notNull(),
  enabled:    boolean('enabled').notNull().default(false),
  /** Capability-specific settings (e.g. { id, capiAccessToken } for fb_pixel). Secret sub-fields are stripped in the public projection by an allowlist in the service layer, not enforced at this column. */
  config:     jsonb('config').notNull().default({}),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
  updatedAt:  timestamp('updated_at').notNull().defaultNow(),
});

export type TrackingItem = typeof trackingItems.$inferSelect;

// ─── Site visits (internal pageview/visitor tracking for the dashboard) ───────
// One row per pageview, written by the public /tracking/visit beacon endpoint.
// source/device/country/city are always derived server-side from the request
// (Referer header, User-Agent, IP) — never trusted from client input.

export const siteVisits = pgTable('site_visits', {
  id:              serial('id').primaryKey(),
  // Cookie-based id set by the frontend beacon; dedupe key for unique visitors.
  sessionId:       varchar('session_id', { length: 64 }).notNull(),
  path:            varchar('path', { length: 500 }).notNull(),
  referrer:        varchar('referrer', { length: 1000 }),
  source:          visitSourceEnum('source').default('direct').notNull(),
  device:          visitDeviceEnum('device').default('unknown').notNull(),
  userAgent:       varchar('user_agent', { length: 500 }),
  country:         varchar('country', { length: 100 }),
  city:            varchar('city', { length: 100 }),
  userId:          integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  // Filled in by a follow-up PATCH (sendBeacon on page unload); null until then.
  durationSeconds: integer('duration_seconds'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
});

export type SiteVisit = typeof siteVisits.$inferSelect;
export type NewSiteVisit = typeof siteVisits.$inferInsert;

// ─── Email Templates ──────────────────────────────────────────────────────────

export const emailTemplates = pgTable('email_templates', {
  id:          serial('id').primaryKey(),
  /** Unique event key — e.g. "enrollment_confirmation", "welcome" */
  eventType:   varchar('event_type', { length: 100 }).notNull().unique(),
  /** Human-readable label shown in admin */
  name:        varchar('name', { length: 255 }).notNull(),
  subject:     varchar('subject', { length: 500 }).notNull(),
  htmlBody:    text('html_body').notNull(),
  isEnabled:   boolean('is_enabled').notNull().default(true),
  /** JSON array: [{key: "{{student_name}}", description: "..."}] */
  variables:   text('variables').notNull().default('[]'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;

// ─── SMS Templates ────────────────────────────────────────────────────────────

export const smsTemplates = pgTable('sms_templates', {
  id:          serial('id').primaryKey(),
  /** Unique event key — e.g. "otp_verification", "enrollment_confirmation" */
  eventType:   varchar('event_type', { length: 100 }).notNull().unique(),
  /** Human-readable label shown in admin */
  name:        varchar('name', { length: 255 }).notNull(),
  /** Grouping shown in the admin UI — e.g. "auth", "payments" */
  section:     varchar('section', { length: 50 }).notNull().default('general'),
  /** The SMS text, supports {{variable}} placeholders */
  body:        text('body').notNull(),
  isEnabled:   boolean('is_enabled').notNull().default(true),
  /** JSON array: [{key: "{{code}}", description: "..."}] */
  variables:   text('variables').notNull().default('[]'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});

export type SmsTemplate = typeof smsTemplates.$inferSelect;

// ─── Announcements ────────────────────────────────────────────────────────────

export const announcementTypeEnum = pgEnum('announcement_type', [
  'info',
  'success',
  'warning',
  'error',
]);

export const announcements = pgTable('announcements', {
  id:          serial('id').primaryKey(),
  title:       varchar('title',   { length: 255 }).notNull(),
  body:        text('body').notNull(),
  type:        announcementTypeEnum('type').default('info').notNull(),
  /** When false the announcement is hidden from students */
  isActive:    boolean('is_active').default(true).notNull(),
  /** Optional expiry — hidden automatically after this date */
  expiresAt:   timestamp('expires_at'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});

export type Announcement    = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

// ─── Banners (Popup modal + Top strip) ────────────────────────────────────────

/**
 * Marketing banners shown on the public site. Two placements:
 *   • popup     — centered image modal on page load (dismissible, once/session)
 *   • top_strip — full-width dismissible image bar under the header
 * Optional schedule window (starts_at / ends_at) auto-shows/hides them.
 */
export const banners = pgTable('banners', {
  id:           serial('id').primaryKey(),
  placement:    varchar('placement', { length: 20 }).notNull(), // 'popup' | 'top_strip'
  /** Admin-facing label (not shown to visitors). */
  title:        varchar('title', { length: 255 }).notNull(),
  imageUrl:     varchar('image_url', { length: 1000 }).notNull(),
  /** Optional click-through destination. */
  linkUrl:      varchar('link_url', { length: 1000 }),
  openInNewTab: boolean('open_in_new_tab').default(false).notNull(),
  isActive:     boolean('is_active').default(true).notNull(),
  order:        integer('order').default(0).notNull(),
  startsAt:     timestamp('starts_at'),
  endsAt:       timestamp('ends_at'),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
});

export type Banner    = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;

// ─── Success Stories ──────────────────────────────────────────────────────────

export const successStories = pgTable('success_stories', {
  id:       serial('id').primaryKey(),
  name:     varchar('name',      { length: 255 }).notNull(),
  batch:    varchar('batch',     { length: 100 }).notNull(),
  category: varchar('category',  { length: 100 }).notNull(),
  image:    varchar('image',     { length: 1000 }).notNull().default(''),
  videoUrl: varchar('video_url', { length: 1000 }),
  isActive: boolean('is_active').default(true).notNull(),
  order:    integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type SuccessStory    = typeof successStories.$inferSelect;
export type NewSuccessStory = typeof successStories.$inferInsert;

// ─── Contact Messages ─────────────────────────────────────────────────────────

export const contactMessages = pgTable('contact_messages', {
  id:        serial('id').primaryKey(),
  name:      varchar('name',    { length: 255 }).notNull(),
  email:     varchar('email',   { length: 255 }).notNull(),
  subject:   varchar('subject', { length: 500 }),
  message:   text('message').notNull(),
  isRead:    boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type ContactMessage    = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;

// ─── Instructor Applications ──────────────────────────────────────────────────

export const instructorApplicationStatusEnum = pgEnum('instructor_application_status', ['pending', 'approved', 'rejected']);

export const instructorApplications = pgTable('instructor_applications', {
  id:          serial('id').primaryKey(),
  name:        varchar('name',      { length: 255 }).notNull(),
  email:       varchar('email',     { length: 255 }).notNull(),
  phone:       varchar('phone',     { length: 50 }),
  expertise:   varchar('expertise', { length: 255 }).notNull(),
  experience:  text('experience').notNull(),
  motivation:  text('motivation').notNull(),
  portfolioUrl: varchar('portfolio_url', { length: 500 }),
  status:      instructorApplicationStatusEnum('status').default('pending').notNull(),
  adminNotes:  text('admin_notes'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});

export type InstructorApplication    = typeof instructorApplications.$inferSelect;
export type NewInstructorApplication = typeof instructorApplications.$inferInsert;

export const customFonts = pgTable('custom_fonts', {
  id:          serial('id').primaryKey(),
  familyName:  varchar('family_name', { length: 255 }).notNull().unique(),
  category:    varchar('category', { length: 50 }).notNull().default('sans-serif'),
  weights:     json('weights').$type<number[]>().notNull().default([400]),
  subsets:     json('subsets').$type<string[]>().notNull().default(['latin']),
  style:       varchar('style', { length: 50 }).notNull().default('normal'),
  format:      varchar('format', { length: 10 }).notNull(),
  filePath:    varchar('file_path', { length: 500 }).notNull(),
  fileSize:    integer('file_size').notNull(),
  fileHash:    varchar('file_hash', { length: 64 }).notNull().unique(),
  isActive:    boolean('is_active').default(true).notNull(),
  createdBy:   varchar('created_by', { length: 255 }),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});

export type CustomFont    = typeof customFonts.$inferSelect;
export type NewCustomFont = typeof customFonts.$inferInsert;

export type ShopProduct      = typeof shopProducts.$inferSelect;
export type NewShopProduct   = typeof shopProducts.$inferInsert;
export type ShopOrder        = typeof shopOrders.$inferSelect;
export type NewShopOrder     = typeof shopOrders.$inferInsert;
export type ShopOrderItem    = typeof shopOrderItems.$inferSelect;
export type ShopCoupon       = typeof shopCoupons.$inferSelect;
export type ShopCartItem     = typeof shopCartItems.$inferSelect;

// ─── Manual message broadcasts (Student Filters "Send SMS/Email") ─────────────
// A job is one "Send" click (one channel); recipients are the per-student rows
// so admins can see live progress and look back at who was already messaged.

export const broadcastChannelEnum = pgEnum('broadcast_channel', ['sms', 'email']);
export type BroadcastChannel = (typeof broadcastChannelEnum.enumValues)[number];
export const broadcastJobStatusEnum = pgEnum('broadcast_job_status', [
  'pending',
  'running',
  'completed',
]);
export const broadcastRecipientStatusEnum = pgEnum('broadcast_recipient_status', [
  'pending',
  'sent',
  'failed',
]);

export const messageBroadcastJobs = pgTable('message_broadcast_jobs', {
  id:        serial('id').primaryKey(),
  channel:   broadcastChannelEnum('channel').notNull(),
  subject:   varchar('subject', { length: 255 }), // email only
  message:   text('message').notNull(), // raw composer text/HTML, pre-render
  total:     integer('total').notNull().default(0),
  sent:      integer('sent').notNull().default(0),
  failed:    integer('failed').notNull().default(0),
  status:    broadcastJobStatusEnum('status').default('pending').notNull(),
  createdByAdminId: integer('created_by_admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const messageBroadcastRecipients = pgTable('message_broadcast_recipients', {
  id:        serial('id').primaryKey(),
  jobId:     integer('job_id').notNull().references(() => messageBroadcastJobs.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipient: varchar('recipient', { length: 255 }).notNull(), // phone or email actually used
  status:    broadcastRecipientStatusEnum('status').default('pending').notNull(),
  error:     text('error'),
  sentAt:    timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type MessageBroadcastJob        = typeof messageBroadcastJobs.$inferSelect;
export type NewMessageBroadcastJob     = typeof messageBroadcastJobs.$inferInsert;
export type MessageBroadcastRecipient  = typeof messageBroadcastRecipients.$inferSelect;
export type NewMessageBroadcastRecipient = typeof messageBroadcastRecipients.$inferInsert;
