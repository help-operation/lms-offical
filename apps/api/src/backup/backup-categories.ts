// Backup category definitions — maps logical domains to REAL database tables with dependency ordering.
// All table names are verified against apps/api/src/db/schema.ts pgTable definitions.

export const MANIFEST_VERSION = 1;
export const SUPPORTED_MANIFEST_VERSIONS = [1];

export interface BackupCategoryDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  tables: string[]; // ordered: parents before children
  dependencies: string[]; // other category IDs that must be imported first
}

export const BACKUP_CATEGORIES: BackupCategoryDef[] = [
  {
    id: 'students',
    label: 'Users & Students',
    description: 'User accounts, profiles, education, experience, enrollments, progress, certificates',
    icon: 'Users',
    tables: [
      'public.users',
      'public.student_profiles',
      'public.user_education',
      'public.user_experience',
      'public.user_skills',
      'public.user_documents',
      'public.enrollments',
      'public.lesson_progress',
      'public.notes',
      'public.certificates',
      'public.cart_items',
      'public.wishlists',
      'public.user_course_interests',
      'public.referrals',
      'public.referral_earnings',
      'public.blog_post_likes',
      'public.blog_post_comments',
      'public.support_tickets',
      'public.support_messages',
      'public.notifications',
      'public.push_subscriptions',
      'public.activity_logs',
    ],
    dependencies: [],
  },
  {
    id: 'courses',
    label: 'Recorded Courses',
    description: 'Course catalog, modules, lessons, resources, assignments, quizzes, reviews',
    icon: 'BookBookmark',
    tables: [
      'public.categories',
      'public.courses',
      'public.course_modules',
      'public.lessons',
      'public.lesson_resources',
      'public.reviews',
      'public.assignments',
      'public.assignment_submissions',
      'public.quizzes',
      'public.quiz_questions',
      'public.quiz_answers',
      'public.quiz_attempts',
      'public.instructor_profiles',
      'public.instructor_applications',
      'public.coupon_recorded_courses',
      'public.course_bundle_items',
    ],
    dependencies: [],
  },
  {
    id: 'live-courses',
    label: 'Live Courses',
    description: 'Live classes, modules, lessons, attendance, quizzes, assignments, recordings',
    icon: 'Broadcast',
    tables: [
      'public.live_courses',
      'public.live_course_modules',
      'public.live_course_lessons',
      'public.live_lesson_progress',
      'public.live_certificates',
      'public.live_lesson_quizzes',
      'public.live_lesson_quiz_questions',
      'public.live_lesson_quiz_answers',
      'public.live_lesson_quiz_attempts',
      'public.live_lesson_assignments',
      'public.live_lesson_assignment_submissions',
      'public.live_sessions',
      'public.live_session_attendance',
      'public.live_course_resources',
      'public.live_course_recorded_bundles',
      'public.live_course_batches',
      'public.live_notes',
      'public.coupon_live_courses',
    ],
    dependencies: [],
  },
  {
    id: 'payments',
    label: 'Payments & Orders',
    description: 'Orders, payments, coupons, cart, wishlists, live enrollments & subscriptions',
    icon: 'Receipt',
    tables: [
      'public.orders',
      'public.order_items',
      'public.payments',
      'public.payment_confirmations',
      'public.coupons',
      'public.coupon_usages',
      'public.cart_items',
      'public.wishlists',
      'public.live_enrollments',
      'public.live_payments',
      'public.live_subscriptions',
      'public.live_subscription_payments',
      'public.invoice_number_counters',
    ],
    dependencies: ['students', 'courses', 'live-courses'],
  },
  {
    id: 'blog',
    label: 'Blog',
    description: 'Blog posts, categories, tags, likes, comments',
    icon: 'Newspaper',
    tables: [
      'public.blog_categories',
      'public.blog_posts',
      'public.blog_tags',
      'public.blog_post_tags',
      'public.blog_post_likes',
      'public.blog_post_comments',
    ],
    dependencies: ['students'],
  },
  {
    id: 'support',
    label: 'Support & Leads',
    description: 'Support tickets, messages, leads, canned responses',
    icon: 'Headset',
    tables: [
      'public.support_tickets',
      'public.support_messages',
      'public.canned_responses',
      'public.leads',
      'public.contact_messages',
    ],
    dependencies: ['students'],
  },
  {
    id: 'cms',
    label: 'CMS & Settings',
    description: 'Pages, menus, tracking, code snippets, roles, permissions, site config',
    icon: 'Layout',
    tables: [
      'public.system_settings',
      // payment_gateway_configs & storage_provider_configs excluded — contain API secrets
      'public.tracking_settings',
      'public.tracking_items',
      'public.code_snippets',
      'public.site_pages',
      'public.page_sections',
      'public.menu_items',
      'public.media_files',
      'public.announcements',
      'public.banners',
      'public.success_stories',
      'public.custom_fonts',
      'public.site_visits',
      'public.roles',
      'public.permissions',
      'public.role_permissions',
      'public.role_course_assignments',
      'public.role_live_course_assignments',
    ],
    dependencies: [],
  },
  {
    id: 'notifications',
    label: 'Notifications & Messaging',
    description: 'Notifications, email/SMS templates, message broadcasts, communication balances',
    icon: 'Bell',
    tables: [
      'public.email_templates',
      'public.sms_templates',
      'public.admin_notifications',
      'public.message_broadcast_jobs',
      'public.message_broadcast_recipients',
      'public.communication_balances',
    ],
    dependencies: [],
  },
];

// ─── Manifest Types ──────────────────────────────────────────────────────────

export interface TableManifest {
  table: string;
  rowCount: number;
  columns: string[];
}

export interface BackupManifest {
  version: number;
  backupType: 'category' | 'selective' | 'full';
  category?: string; // category ID if backupType === 'category'
  createdAt: string;
  tables: TableManifest[];
  recordCounts: Record<string, number>;
  dependencies: string[]; // category IDs that must be restored first
  checksum: string; // sha256 of the data payload
}

// ─── Conflict resolution strategies ──────────────────────────────────────────

export type ConflictStrategy = 'skip' | 'overwrite' | 'merge';

export interface ImportPreview {
  manifest: BackupManifest;
  conflicts: TableConflict[];
  totalRecords: number;
}

export interface TableConflict {
  table: string;
  existingCount: number;
  incomingCount: number;
  strategy: ConflictStrategy;
}

// ─── Import job tracking ─────────────────────────────────────────────────────

export type ImportStatus = 'validating' | 'dry_run' | 'importing' | 'completed' | 'failed' | 'rolled_back';

export interface ImportJobRow {
  id: number;
  backupJobId: number;
  status: ImportStatus;
  conflictStrategy: ConflictStrategy;
  manifest: BackupManifest | null;
  preview: ImportPreview | null;
  importedTables: string[] | null;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdBy: number | null;
  createdAt: Date | null;
}
