import type { PermissionType } from 'src/db/schema';

export interface PermissionSeed {
  slug: string;
  name: string;
  group: string;
  type: PermissionType;
}

/**
 * The full catalog of admin permissions, modelled **per page** with CRUD-level
 * granularity. Each sidebar page is its own group; within a group there is a
 * `view` (page) permission plus the create / update / delete and named
 * workflow permissions (`api`) that map to that page's real endpoints — only
 * verbs that actually exist on the backend are listed.
 *
 * Slugs are stable identifiers used by the backend guard and the admin UI;
 * renaming a slug is a breaking change (see the migration in rbac-seeder).
 */
export const PERMISSION_CATALOG: PermissionSeed[] = [
  // ── Overview ───────────────────────────────────────────────────────────────
  { slug: 'view_dashboard', name: 'View Dashboard', group: 'dashboard', type: 'page' },

  { slug: 'view_revenue', name: 'View Revenue', group: 'revenue', type: 'page' },

  { slug: 'view_activity_log', name: 'View Activity Log', group: 'activity', type: 'page' },

  // ── People ─────────────────────────────────────────────────────────────────
  { slug: 'view_users', name: 'View Users', group: 'users', type: 'page' },
  { slug: 'update_users', name: 'Update Users', group: 'users', type: 'api' },

  { slug: 'view_students', name: 'View Students', group: 'students', type: 'page' },
  { slug: 'update_students', name: 'Update Students', group: 'students', type: 'api' },
  { slug: 'delete_students', name: 'Delete Students', group: 'students', type: 'api' },

  { slug: 'view_enrollments', name: 'View Enrollments', group: 'enrollments', type: 'page' },
  { slug: 'create_enrollments', name: 'Manually Enroll Students', group: 'enrollments', type: 'api' },

  { slug: 'view_progress', name: 'View Progress', group: 'progress', type: 'page' },

  { slug: 'view_leads', name: 'View Leads', group: 'leads', type: 'page' },
  { slug: 'update_leads', name: 'Update Leads', group: 'leads', type: 'api' },
  { slug: 'delete_leads', name: 'Delete Leads', group: 'leads', type: 'api' },

  { slug: 'view_interests', name: 'View Interests', group: 'interests', type: 'page' },

  { slug: 'view_teachers', name: 'View Teachers', group: 'teachers', type: 'page' },
  { slug: 'update_teachers', name: 'Update Teachers', group: 'teachers', type: 'api' },
  { slug: 'delete_teachers', name: 'Delete Teachers', group: 'teachers', type: 'api' },

  { slug: 'view_applications', name: 'View Instructor Applications', group: 'applications', type: 'page' },
  { slug: 'approve_applications', name: 'Approve Applications', group: 'applications', type: 'api' },
  { slug: 'reject_applications', name: 'Reject Applications', group: 'applications', type: 'api' },
  { slug: 'delete_applications', name: 'Delete Applications', group: 'applications', type: 'api' },

  { slug: 'view_roles', name: 'View Roles', group: 'roles', type: 'page' },
  { slug: 'create_roles', name: 'Create Roles', group: 'roles', type: 'api' },
  { slug: 'update_roles', name: 'Update Roles', group: 'roles', type: 'api' },
  { slug: 'delete_roles', name: 'Delete Roles', group: 'roles', type: 'api' },

  { slug: 'view_admins', name: 'View Admin Users', group: 'admins', type: 'page' },
  { slug: 'create_admins', name: 'Create Admin Users', group: 'admins', type: 'api' },
  { slug: 'update_admins', name: 'Update Admin Users', group: 'admins', type: 'api' },
  { slug: 'delete_admins', name: 'Delete Admin Users', group: 'admins', type: 'api' },

  // ── Courses ────────────────────────────────────────────────────────────────
  { slug: 'view_courses', name: 'View Courses', group: 'courses', type: 'page' },
  { slug: 'create_courses', name: 'Create Courses', group: 'courses', type: 'api' },
  { slug: 'update_courses', name: 'Update Courses', group: 'courses', type: 'api' },
  { slug: 'delete_courses', name: 'Delete Courses', group: 'courses', type: 'api' },
  { slug: 'publish_courses', name: 'Publish Courses', group: 'courses', type: 'api' },
  { slug: 'approve_courses', name: 'Approve / Feature Courses', group: 'courses', type: 'api' },
  { slug: 'edit_assigned_courses', name: 'Edit Assigned Courses Only', group: 'courses', type: 'api' },

  { slug: 'view_categories', name: 'View Categories', group: 'categories', type: 'page' },
  { slug: 'create_categories', name: 'Create Categories', group: 'categories', type: 'api' },
  { slug: 'update_categories', name: 'Update Categories', group: 'categories', type: 'api' },
  { slug: 'delete_categories', name: 'Delete Categories', group: 'categories', type: 'api' },

  { slug: 'view_coupons', name: 'View Coupons', group: 'coupons', type: 'page' },
  { slug: 'create_coupons', name: 'Create Coupons', group: 'coupons', type: 'api' },
  { slug: 'update_coupons', name: 'Update Coupons', group: 'coupons', type: 'api' },
  { slug: 'delete_coupons', name: 'Delete Coupons', group: 'coupons', type: 'api' },

  { slug: 'view_live', name: 'View Live Courses', group: 'live', type: 'page' },
  { slug: 'create_live', name: 'Create Live Courses', group: 'live', type: 'api' },
  { slug: 'update_live', name: 'Update Live Courses', group: 'live', type: 'api' },
  { slug: 'delete_live', name: 'Delete Live Courses', group: 'live', type: 'api' },
  { slug: 'publish_live', name: 'Publish Live Courses', group: 'live', type: 'api' },
  { slug: 'grade_live', name: 'Grade Live Submissions', group: 'live', type: 'api' },
  { slug: 'edit_assigned_live_courses', name: 'Edit Assigned Live Courses Only', group: 'live', type: 'api' },

  { slug: 'view_certificates', name: 'View Certificates', group: 'certificates', type: 'page' },
  { slug: 'issue_certificates', name: 'Issue Certificates', group: 'certificates', type: 'api' },

  // ── Content ────────────────────────────────────────────────────────────────
  { slug: 'view_blog', name: 'View Blog', group: 'blog', type: 'page' },
  { slug: 'create_blog', name: 'Create Blog Posts', group: 'blog', type: 'api' },
  { slug: 'update_blog', name: 'Update Blog Posts', group: 'blog', type: 'api' },
  { slug: 'delete_blog', name: 'Delete Blog Posts', group: 'blog', type: 'api' },

  { slug: 'view_blog_categories', name: 'View Blog Categories', group: 'blog_categories', type: 'page' },
  { slug: 'create_blog_categories', name: 'Create Blog Categories', group: 'blog_categories', type: 'api' },
  { slug: 'update_blog_categories', name: 'Update Blog Categories', group: 'blog_categories', type: 'api' },
  { slug: 'delete_blog_categories', name: 'Delete Blog Categories', group: 'blog_categories', type: 'api' },

  { slug: 'view_blog_comments', name: 'View Blog Comments', group: 'blog_comments', type: 'page' },
  { slug: 'delete_blog_comments', name: 'Delete Blog Comments', group: 'blog_comments', type: 'api' },

  { slug: 'view_banners', name: 'View Banners', group: 'banners', type: 'page' },
  { slug: 'create_banners', name: 'Create Banners', group: 'banners', type: 'api' },
  { slug: 'update_banners', name: 'Update Banners', group: 'banners', type: 'api' },
  { slug: 'delete_banners', name: 'Delete Banners', group: 'banners', type: 'api' },

  { slug: 'view_success_stories', name: 'View Success Stories', group: 'success_stories', type: 'page' },
  { slug: 'create_success_stories', name: 'Create Success Stories', group: 'success_stories', type: 'api' },
  { slug: 'update_success_stories', name: 'Update Success Stories', group: 'success_stories', type: 'api' },
  { slug: 'delete_success_stories', name: 'Delete Success Stories', group: 'success_stories', type: 'api' },

  { slug: 'view_media', name: 'View Media', group: 'media', type: 'page' },
  { slug: 'upload_media', name: 'Upload Media', group: 'media', type: 'api' },
  { slug: 'update_media', name: 'Update Media', group: 'media', type: 'api' },
  { slug: 'delete_media', name: 'Delete Media', group: 'media', type: 'api' },

  // ── Website Sections (per page, enforced by section.page) ────────────────────
  { slug: 'view_section_landing', name: 'View Landing Page', group: 'section_landing', type: 'page' },
  { slug: 'update_section_landing', name: 'Update Landing Page', group: 'section_landing', type: 'api' },

  { slug: 'view_section_footer', name: 'View Footer', group: 'section_footer', type: 'page' },
  { slug: 'update_section_footer', name: 'Update Footer', group: 'section_footer', type: 'api' },

  { slug: 'view_section_contact', name: 'View Contact Section', group: 'section_contact', type: 'page' },
  { slug: 'update_section_contact', name: 'Update Contact Section', group: 'section_contact', type: 'api' },

  { slug: 'view_section_about', name: 'View About Section', group: 'section_about', type: 'page' },
  { slug: 'update_section_about', name: 'Update About Section', group: 'section_about', type: 'api' },

  { slug: 'view_section_faq', name: 'View FAQ Section', group: 'section_faq', type: 'page' },
  { slug: 'update_section_faq', name: 'Update FAQ Section', group: 'section_faq', type: 'api' },

  { slug: 'view_section_mentors', name: 'View Mentors Section', group: 'section_mentors', type: 'page' },
  { slug: 'update_section_mentors', name: 'Update Mentors Section', group: 'section_mentors', type: 'api' },

  { slug: 'view_section_success', name: 'View Success Stories Section', group: 'section_success', type: 'page' },
  { slug: 'update_section_success', name: 'Update Success Stories Section', group: 'section_success', type: 'api' },

  { slug: 'view_section_live_classes', name: 'View Live Classes Section', group: 'section_live_classes', type: 'page' },
  { slug: 'update_section_live_classes', name: 'Update Live Classes Section', group: 'section_live_classes', type: 'api' },

  { slug: 'view_section_free_courses', name: 'View Free Courses Section', group: 'section_free_courses', type: 'page' },
  { slug: 'update_section_free_courses', name: 'Update Free Courses Section', group: 'section_free_courses', type: 'api' },

  { slug: 'view_section_courses', name: 'View Courses Page Section', group: 'section_courses', type: 'page' },
  { slug: 'update_section_courses', name: 'Update Courses Page Section', group: 'section_courses', type: 'api' },

  { slug: 'view_section_blog', name: 'View Blog Page Section', group: 'section_blog', type: 'page' },
  { slug: 'update_section_blog', name: 'Update Blog Page Section', group: 'section_blog', type: 'api' },

  { slug: 'view_section_join_instructor', name: 'View Join as Instructor Page', group: 'section_join_instructor', type: 'page' },
  { slug: 'update_section_join_instructor', name: 'Update Join as Instructor Page', group: 'section_join_instructor', type: 'api' },

  { slug: 'view_section_login', name: 'View Login Page Section', group: 'section_login', type: 'page' },
  { slug: 'update_section_login', name: 'Update Login Page Section', group: 'section_login', type: 'api' },

  { slug: 'view_section_signup', name: 'View Signup Page Section', group: 'section_signup', type: 'page' },
  { slug: 'update_section_signup', name: 'Update Signup Page Section', group: 'section_signup', type: 'api' },

  // ── Legal Pages (per slug) ───────────────────────────────────────────────────
  { slug: 'view_page_privacy', name: 'View Privacy Policy', group: 'page_privacy', type: 'page' },
  { slug: 'update_page_privacy', name: 'Update Privacy Policy', group: 'page_privacy', type: 'api' },

  { slug: 'view_page_return', name: 'View Return Policy', group: 'page_return', type: 'page' },
  { slug: 'update_page_return', name: 'Update Return Policy', group: 'page_return', type: 'api' },

  { slug: 'view_page_terms', name: 'View Terms & Conditions', group: 'page_terms', type: 'page' },
  { slug: 'update_page_terms', name: 'Update Terms & Conditions', group: 'page_terms', type: 'api' },

  // ── Communication ────────────────────────────────────────────────────────────
  { slug: 'view_support', name: 'View Support', group: 'support', type: 'page' },
  { slug: 'update_support', name: 'Reply / Update Support', group: 'support', type: 'api' },

  { slug: 'view_messages', name: 'View Messages', group: 'messages', type: 'page' },
  { slug: 'update_messages', name: 'Update Messages', group: 'messages', type: 'api' },
  { slug: 'delete_messages', name: 'Delete Messages', group: 'messages', type: 'api' },

  { slug: 'view_notifications', name: 'View Notifications', group: 'notifications', type: 'page' },

  { slug: 'view_announcements', name: 'View Announcements', group: 'announcements', type: 'page' },
  { slug: 'create_announcements', name: 'Create Announcements', group: 'announcements', type: 'api' },
  { slug: 'update_announcements', name: 'Update Announcements', group: 'announcements', type: 'api' },
  { slug: 'delete_announcements', name: 'Delete Announcements', group: 'announcements', type: 'api' },

  { slug: 'view_email_templates', name: 'View Email Templates', group: 'email_templates', type: 'page' },
  { slug: 'update_email_templates', name: 'Update Email Templates', group: 'email_templates', type: 'api' },
  { slug: 'send_test_email', name: 'Send Test Email', group: 'email_templates', type: 'api' },
  { slug: 'send_manual_email', name: 'Send Manual Email to Selected Students', group: 'email_templates', type: 'api' },

  { slug: 'view_sms_templates', name: 'View SMS Templates', group: 'sms_templates', type: 'page' },
  { slug: 'update_sms_templates', name: 'Update SMS Templates', group: 'sms_templates', type: 'api' },
  { slug: 'send_test_sms', name: 'Send Test SMS', group: 'sms_templates', type: 'api' },
  { slug: 'send_sms_broadcast', name: 'Send SMS Broadcast', group: 'sms_templates', type: 'api' },
  { slug: 'send_manual_sms', name: 'Send Manual SMS to Selected Students', group: 'sms_templates', type: 'api' },
  { slug: 'view_broadcast_jobs', name: 'View Manual SMS/Email Send History', group: 'sms_templates', type: 'page' },

  // ── Finance ────────────────────────────────────────────────────────────────
  { slug: 'view_invoices', name: 'View Invoices', group: 'invoices', type: 'page' },

  { slug: 'view_invoice_settings', name: 'View Invoice Settings', group: 'invoice_settings', type: 'page' },
  { slug: 'update_invoice_settings', name: 'Update Invoice Settings', group: 'invoice_settings', type: 'api' },

  // ── System / Settings (per tab) ──────────────────────────────────────────────
  { slug: 'view_settings_general', name: 'View General Settings', group: 'settings_general', type: 'page' },
  { slug: 'update_settings_general', name: 'Update General Settings', group: 'settings_general', type: 'api' },

  { slug: 'view_menus', name: 'View Menus', group: 'menus', type: 'page' },
  { slug: 'create_menus', name: 'Create Menus', group: 'menus', type: 'api' },
  { slug: 'update_menus', name: 'Update Menus', group: 'menus', type: 'api' },
  { slug: 'delete_menus', name: 'Delete Menus', group: 'menus', type: 'api' },

  { slug: 'view_settings_payment', name: 'View Payment Settings', group: 'settings_payment', type: 'page' },
  { slug: 'update_settings_payment', name: 'Update Payment Settings', group: 'settings_payment', type: 'api' },

  { slug: 'view_settings_social', name: 'View Social Links', group: 'settings_social', type: 'page' },
  { slug: 'update_settings_social', name: 'Update Social Links', group: 'settings_social', type: 'api' },

  { slug: 'view_settings_tracking', name: 'View Analytics', group: 'settings_tracking', type: 'page' },
  { slug: 'update_settings_tracking', name: 'Update Analytics', group: 'settings_tracking', type: 'api' },

  { slug: 'view_code_snippets', name: 'View Code Snippets', group: 'code_snippets', type: 'page' },
  { slug: 'create_code_snippets', name: 'Create Code Snippets', group: 'code_snippets', type: 'api' },
  { slug: 'update_code_snippets', name: 'Update Code Snippets', group: 'code_snippets', type: 'api' },
  { slug: 'delete_code_snippets', name: 'Delete Code Snippets', group: 'code_snippets', type: 'api' },

  { slug: 'view_settings_maintenance', name: 'View Maintenance Mode', group: 'settings_maintenance', type: 'page' },
  { slug: 'update_settings_maintenance', name: 'Update Maintenance Mode', group: 'settings_maintenance', type: 'api' },

  { slug: 'view_settings_configaction', name: 'View Configaction', group: 'settings_configaction', type: 'page' },
  { slug: 'update_settings_configaction', name: 'Update Configaction', group: 'settings_configaction', type: 'api' },
];

/** Human-readable labels for permission groups, used by the admin UI. */
export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  revenue: 'Revenue',
  activity: 'Activity Log',
  users: 'Users',
  students: 'Students',
  enrollments: 'Enrollments',
  progress: 'Progress',
  leads: 'Leads',
  teachers: 'Teachers',
  applications: 'Instructor Applications',
  roles: 'Roles',
  admins: 'Admin Users',
  courses: 'Courses',
  categories: 'Categories',
  coupons: 'Coupons',
  live: 'Live Courses',
  certificates: 'Certificates',
  blog: 'Blog',
  blog_categories: 'Blog Categories',
  blog_comments: 'Blog Comments',
  banners: 'Banners',
  success_stories: 'Success Stories',
  media: 'Media',
  section_landing: 'Landing Page',
  section_footer: 'Footer',
  section_contact: 'Contact Section',
  section_about: 'About Section',
  section_faq: 'FAQ Section',
  section_mentors: 'Mentors Section',
  section_success: 'Success Stories Section',
  section_live_classes: 'Live Classes Section',
  section_free_courses: 'Free Courses Section',
  section_courses: 'Courses Page',
  section_blog: 'Blog Page Section',
  section_join_instructor: 'Join as Instructor Page',
  section_login: 'Login Page',
  section_signup: 'Signup Page',
  page_privacy: 'Privacy Policy',
  page_return: 'Return Policy',
  page_terms: 'Terms & Conditions',
  support: 'Support',
  messages: 'Messages',
  notifications: 'Notifications',
  announcements: 'Announcements',
  email_templates: 'Email Templates',
  sms_templates: 'SMS Templates',
  invoices: 'Invoices',
  invoice_settings: 'Invoice Settings',
  settings_general: 'General Settings',
  menus: 'Menus',
  settings_payment: 'Payment Settings',
  settings_social: 'Social Links',
  settings_tracking: 'Analytics',
  code_snippets: 'Code Snippets',
  settings_maintenance: 'Maintenance Mode',
  settings_configaction: 'Configaction',
};

/**
 * Legacy slug → new slug(s) migration map. Applied once per existing role by the
 * RBAC seeder: every role holding an old slug is granted the listed new slugs,
 * then the old permission rows are deleted. Keeps existing custom roles working
 * across the per-page CRUD refactor. Super Admin is unaffected (auto-granted all).
 */
export const LEGACY_PERMISSION_MIGRATION: Record<string, string[]> = {
  // users group previously gated users + students + teachers + leads
  manage_users: [
    'update_users',
    'view_students',
    'update_students',
    'delete_students',
    'view_teachers',
    'update_teachers',
    'delete_teachers',
    'view_leads',
    'update_leads',
    'delete_leads',
    'view_interests',
  ],
  manage_students: ['view_students', 'update_students', 'delete_students'],
  manage_teachers: ['view_teachers', 'update_teachers', 'delete_teachers'],
  manage_applications: ['approve_applications', 'reject_applications', 'delete_applications'],
  manage_categories: ['create_categories', 'update_categories', 'delete_categories'],
  manage_coupons: ['create_coupons', 'update_coupons', 'delete_coupons'],
  manage_live: ['create_live', 'update_live', 'delete_live', 'publish_live', 'grade_live'],
  manage_blog: [
    'create_blog',
    'update_blog',
    'delete_blog',
    'view_blog_categories',
    'create_blog_categories',
    'update_blog_categories',
    'delete_blog_categories',
    'view_blog_comments',
    'delete_blog_comments',
  ],
  manage_banners: ['create_banners', 'update_banners', 'delete_banners'],
  manage_success_stories: ['create_success_stories', 'update_success_stories', 'delete_success_stories'],
  manage_media: ['upload_media', 'update_media', 'delete_media'],
  manage_support: ['update_support'],
  manage_messages: ['update_messages', 'delete_messages'],
  // dropped in the per-page model (view-only / per-user) — delete the grant
  manage_enrollments: [],
  manage_notifications: [],
  manage_announcements: ['create_announcements', 'update_announcements', 'delete_announcements'],
  manage_email_templates: ['update_email_templates', 'send_test_email', 'send_manual_email'],
  manage_sms_templates: ['update_sms_templates', 'send_test_sms', 'send_sms_broadcast'],
  manage_roles: ['create_roles', 'update_roles', 'delete_roles'],
  manage_admins: ['view_admins', 'create_admins', 'update_admins', 'delete_admins'],
  // content split into per-section + per-legal-page
  manage_content: [
    'view_section_landing', 'update_section_landing',
    'view_section_footer', 'update_section_footer',
    'view_section_contact', 'update_section_contact',
    'view_section_about', 'update_section_about',
    'view_section_faq', 'update_section_faq',
    'view_section_mentors', 'update_section_mentors',
    'view_section_success', 'update_section_success',
    'view_section_live_classes', 'update_section_live_classes',
    'view_section_free_courses', 'update_section_free_courses',
    'view_section_courses', 'update_section_courses',
    'view_section_blog', 'update_section_blog',
    'view_section_join_instructor', 'update_section_join_instructor',
    'view_section_login', 'update_section_login',
    'view_section_signup', 'update_section_signup',
    'view_page_privacy', 'update_page_privacy',
    'view_page_return', 'update_page_return',
    'view_page_terms', 'update_page_terms',
  ],
  view_content: [
    'view_section_landing', 'view_section_footer', 'view_section_contact',
    'view_section_about', 'view_section_faq', 'view_section_mentors',
    'view_section_success', 'view_section_live_classes', 'view_section_free_courses',
    'view_section_courses', 'view_section_blog', 'view_section_join_instructor',
    'view_section_login', 'view_section_signup',
    'view_page_privacy', 'view_page_return', 'view_page_terms',
  ],
  // settings split per tab
  manage_settings: [
    'update_settings_general',
    'view_menus', 'create_menus', 'update_menus', 'delete_menus',
    'update_settings_payment',
    'update_settings_social',
    'update_settings_tracking',
    'view_code_snippets', 'create_code_snippets', 'update_code_snippets', 'delete_code_snippets',
    'update_settings_maintenance',
    'update_settings_configaction',
  ],
  view_settings: [
    'view_settings_general', 'view_menus', 'view_settings_payment',
    'view_settings_social', 'view_settings_tracking', 'view_code_snippets',
    'view_settings_maintenance', 'view_settings_configaction',
  ],
};

/** Seeded system roles (slug ↔ legacy admin enum). Protected from edit/delete. */
export const SYSTEM_ROLES = {
  superAdmin: {
    slug: 'super-admin',
    name: 'Super Admin',
    description: 'Full, unrestricted access to every part of the platform.',
    adminEnum: 'SUPER_ADMIN' as const,
  },
  instructor: {
    slug: 'instructor',
    name: 'Instructor',
    description: 'Can manage their courses, content, live classes and support.',
    adminEnum: 'INSTRUCTOR' as const,
  },
};

/**
 * Default permissions granted to the seeded Instructor role on first creation.
 * Applied only when the role is newly created, so later admin edits are kept.
 */
export const INSTRUCTOR_DEFAULT_PERMISSIONS: string[] = [
  'view_dashboard',
  'view_courses',
  'create_courses',
  'update_courses',
  'view_enrollments',
  'view_progress',
  'view_blog',
  'create_blog',
  'update_blog',
  'delete_blog',
  'view_support',
  'update_support',
  'view_live',
  'create_live',
  'update_live',
  'grade_live',
  'view_media',
  'upload_media',
  'update_media',
  'delete_media',
];
