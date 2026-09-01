import {
  SquaresFour,
  BookBookmark,
  VideoCamera,
  Users,
  GraduationCap as GraduationCapPhosphor,
  Pulse,
  UserList,
  Stack,
  Tag,
  ChartLineUp,
  Receipt,
  Newspaper,
  Headset,
  Broadcast,
  Megaphone,
  Certificate,
  Images,
  Layout,
  FileText,
  Sliders,
  ClockCounterClockwise,
  UsersThree,
  Gauge,
  ChatCircle,
  CreditCard,
  Rows,
  UserCircle,
  ChalkboardTeacher,
  ClipboardText,
  Flag,
  Trophy,
  EnvelopeOpen,
  Bell,
  EnvelopeSimple,
  ChatText,
  HouseLine,
  AlignBottom,
  Info,
  Question,
  Star,
  Gift,
  ShieldCheck,
  ArrowUUpLeft,
  Article,
  Globe,
  ShareNetwork,
  ChartBar,
  Code,
  Wrench,
  XCircle,
  CloudArrowUp,
} from "@phosphor-icons/react";
import { hasPermission } from "@/features/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  color: string;
  perm?: string;
};

export type MenuGroup = {
  label: string;
  icon: React.ElementType;
  color: string;
  items: NavItem[];
};

// Single source of truth for the admin sidebar (both Super Admin and custom
// roles render from this list) AND the page-level access map. Every item
// carries the `view_*` permission that gates its page; for custom roles an item
// appears only when the role grants it, while Super Admin sees them all.
export const menuGroups: MenuGroup[] = [
  {
    label: "Overview",
    icon: Gauge,
    color: "bg-violet-500",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: SquaresFour, color: "bg-violet-500", perm: "view_dashboard" },
      { href: "/admin/revenue", label: "Revenue", icon: ChartLineUp, color: "bg-cyan-500", perm: "view_revenue" },
      { href: "/admin/payments", label: "Payment Management", icon: CreditCard, color: "bg-emerald-500", perm: "view_revenue" },
      { href: "/admin/failed-payment", label: "Failed Payment", icon: XCircle, color: "bg-red-500", perm: "view_revenue" },
      { href: "/admin/activity", label: "Activity Log", icon: ClockCounterClockwise, color: "bg-slate-500", perm: "view_activity_log" },
    ],
  },
  {
    label: "People",
    icon: UsersThree,
    color: "bg-blue-500",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, color: "bg-blue-500", perm: "view_users" },
      { href: "/admin/students", label: "Students", icon: UserCircle, color: "bg-sky-500", perm: "view_students" },
      { href: "/admin/enrollments", label: "Enrollments", icon: GraduationCapPhosphor, color: "bg-indigo-500", perm: "view_enrollments" },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, color: "bg-purple-500", perm: "view_live" },
      { href: "/admin/progress", label: "Progress", icon: Pulse, color: "bg-cyan-500", perm: "view_progress" },
      { href: "/admin/leads", label: "Leads", icon: UserList, color: "bg-fuchsia-500", perm: "view_leads" },
      { href: "/admin/interests", label: "Interests", icon: Star, color: "bg-amber-400", perm: "view_interests" },
      { href: "/admin/teachers", label: "Teachers", icon: ChalkboardTeacher, color: "bg-teal-500", perm: "view_teachers" },
      { href: "/admin/instructor-applications", label: "Instructor Applications", icon: ClipboardText, color: "bg-violet-500", perm: "view_applications" },
      { href: "/admin/roles", label: "Roles", icon: UsersThree, color: "bg-violet-700", perm: "view_roles" },
    ],
  },
  {
    label: "Courses",
    icon: BookBookmark,
    color: "bg-pink-500",
    items: [
      { href: "/admin/courses", label: "Recorded Courses", icon: BookBookmark, color: "bg-pink-500", perm: "view_courses" },
      { href: "/admin/categories", label: "Categories", icon: Stack, color: "bg-orange-500", perm: "view_categories" },
      { href: "/admin/live-courses", label: "Live Courses", icon: Broadcast, color: "bg-red-500", perm: "view_live" },
      { href: "/admin/coupons", label: "Coupons", icon: Tag, color: "bg-green-500", perm: "view_coupons" },
      { href: "/admin/certificates", label: "Certificates", icon: Certificate, color: "bg-teal-600", perm: "view_certificates" },
    ],
  },
  {
    label: "Content",
    icon: Newspaper,
    color: "bg-rose-500",
    items: [
      { href: "/admin/blog", label: "Blog", icon: Newspaper, color: "bg-rose-500", perm: "view_blog" },
      { href: "/admin/blog/categories", label: "Blog Categories", icon: Tag, color: "bg-rose-400", perm: "view_blog_categories" },
      { href: "/admin/blog/comments", label: "Blog Comments", icon: ChatCircle, color: "bg-rose-300", perm: "view_blog_comments" },
      { href: "/admin/banners", label: "Banners", icon: Flag, color: "bg-rose-600", perm: "view_banners" },
      { href: "/admin/success-stories", label: "Success Stories", icon: Trophy, color: "bg-amber-500", perm: "view_success_stories" },
      { href: "/admin/media", label: "Media", icon: Images, color: "bg-purple-500", perm: "view_media" },
    ],
  },
  {
    label: "Website Sections",
    icon: Layout,
    color: "bg-teal-500",
    items: [
      { href: "/admin/content/home-templates", label: "Website Templates", icon: SquaresFour, color: "bg-teal-700", perm: "view_section_landing" },
      { href: "/admin/content/home", label: "Landing Page", icon: HouseLine, color: "bg-teal-500", perm: "view_section_landing" },
      { href: "/admin/content/footer", label: "Footer", icon: AlignBottom, color: "bg-cyan-500", perm: "view_section_footer" },
      { href: "/admin/content/contact", label: "Contact", icon: EnvelopeSimple, color: "bg-blue-500", perm: "view_section_contact" },
      { href: "/admin/content/about", label: "About", icon: Info, color: "bg-sky-500", perm: "view_section_about" },
      { href: "/admin/content/faq", label: "FAQ", icon: Question, color: "bg-indigo-500", perm: "view_section_faq" },
      { href: "/admin/content/our-instructor", label: "Mentors", icon: UserCircle, color: "bg-violet-500", perm: "view_section_mentors" },
      { href: "/admin/content/success-stories", label: "Success Stories", icon: Star, color: "bg-amber-500", perm: "view_section_success" },
      { href: "/admin/content/live-classes", label: "Live Classes", icon: VideoCamera, color: "bg-red-500", perm: "view_section_live_classes" },
      { href: "/admin/content/free-courses", label: "Free Courses", icon: Gift, color: "bg-green-500", perm: "view_section_free_courses" },
      { href: "/admin/content/courses", label: "Courses Page", icon: BookBookmark, color: "bg-pink-500", perm: "view_section_courses" },
      { href: "/admin/content/blog", label: "Blog Page", icon: Newspaper, color: "bg-rose-500", perm: "view_section_blog" },
      { href: "/admin/content/join-as-instructor", label: "Join as Instructor", icon: ChalkboardTeacher, color: "bg-teal-600", perm: "view_section_join_instructor" },
      { href: "/admin/content/login", label: "Login Page", icon: ShieldCheck, color: "bg-sky-500", perm: "view_section_login" },
      { href: "/admin/content/signup", label: "Signup Page", icon: UserCircle, color: "bg-violet-500", perm: "view_section_signup" },
    ],
  },
  {
    label: "Legal Pages",
    icon: FileText,
    color: "bg-indigo-500",
    items: [
      { href: "/admin/pages/privacy-policy", label: "Privacy Policy", icon: ShieldCheck, color: "bg-indigo-500", perm: "view_page_privacy" },
      { href: "/admin/pages/return-policy", label: "Return Policy", icon: ArrowUUpLeft, color: "bg-orange-500", perm: "view_page_return" },
      { href: "/admin/pages/terms-conditions", label: "Terms & Conditions", icon: Article, color: "bg-rose-500", perm: "view_page_terms" },
    ],
  },
  {
    label: "Communication",
    icon: ChatCircle,
    color: "bg-amber-500",
    items: [
      { href: "/admin/support", label: "Support", icon: Headset, color: "bg-amber-500", perm: "view_support" },
      { href: "/admin/messages", label: "Messages", icon: EnvelopeOpen, color: "bg-cyan-600", perm: "view_messages" },
      { href: "/admin/notifications", label: "Notifications", icon: Bell, color: "bg-yellow-500", perm: "view_notifications" },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone, color: "bg-orange-500", perm: "view_announcements" },
      { href: "/admin/email-templates", label: "Email Templates", icon: EnvelopeSimple, color: "bg-lime-600", perm: "view_email_templates" },
      { href: "/admin/sms-templates", label: "SMS Templates", icon: ChatText, color: "bg-sky-600", perm: "view_sms_templates" },
      { href: "/admin/student-filters", label: "Student Filters (preview)", icon: UserList, color: "bg-indigo-500" },
      { href: "/admin/message-history", label: "Message History", icon: ClockCounterClockwise, color: "bg-violet-500", perm: "view_broadcast_jobs" },
    ],
  },
  {
    label: "Finance",
    icon: CreditCard,
    color: "bg-emerald-500",
    items: [
      { href: "/admin/invoices", label: "Invoices", icon: Receipt, color: "bg-emerald-500", perm: "view_invoices" },
      { href: "/admin/invoice-settings", label: "Invoice Settings", icon: Sliders, color: "bg-emerald-600", perm: "view_invoice_settings" },
    ],
  },
  {
    label: "System Settings",
    icon: Sliders,
    color: "bg-gray-600",
    items: [
      // Site identity & content
      { href: "/admin/settings/general", label: "General Settings", icon: Globe, color: "bg-gray-600", perm: "view_settings_general" },
      { href: "/admin/settings/menus", label: "Menus", icon: Rows, color: "bg-slate-500", perm: "view_menus" },
      { href: "/admin/settings/social-links", label: "Social Links", icon: ShareNetwork, color: "bg-blue-500", perm: "view_settings_social" },
      // Commerce & marketing
      { href: "/admin/settings/payment", label: "Payment", icon: CreditCard, color: "bg-emerald-600", perm: "view_settings_payment" },
      { href: "/admin/settings/tracking", label: "Analytics", icon: ChartBar, color: "bg-fuchsia-500", perm: "view_settings_tracking" },
      // Developer tools
      { href: "/admin/settings/code-snippets", label: "Code Snippets", icon: Code, color: "bg-slate-600", perm: "view_code_snippets" },
      { href: "/admin/settings/configaction", label: "Configaction", icon: CloudArrowUp, color: "bg-indigo-600", perm: "view_settings_configaction" },
      // Operations — last, since it's the most drastic control
      { href: "/admin/settings/maintenance", label: "Maintenance Mode", icon: Wrench, color: "bg-gray-500", perm: "view_settings_maintenance" },
    ],
  },
];

/**
 * Routes that aren't sidebar items but still need permission gating — the
 * instructor-personal section. The dashboard mirrors the platform dashboard's
 * `view_dashboard`; live classes map to `view_live`. (`/instructor/settings` is
 * the admin's own account settings and stays open to any authenticated admin.)
 */
const EXTRA_ROUTE_PERMS: { href: string; perm?: string }[] = [
  { href: "/instructor/dashboard", perm: "view_dashboard" },
  { href: "/instructor/live-classes", perm: "view_live" },
];

/** Flat [{ href, perm }] for every gated route (menu items + extras). */
const ROUTE_PERMS: { href: string; perm?: string }[] = [
  ...menuGroups.flatMap((g) => g.items.map((i) => ({ href: i.href, perm: i.perm }))),
  ...EXTRA_ROUTE_PERMS,
];

/**
 * The `view_*` permission required to open `pathname`, by longest-prefix match
 * (so `/admin/blog/123` resolves to Blog, and `/admin/blog/categories` to the
 * more specific Blog Categories). Returns `undefined` for routes not listed
 * (treated as unrestricted).
 */
export function requiredPermissionFor(pathname: string): string | undefined {
  let bestPerm: string | undefined;
  let bestLen = -1;
  for (const r of ROUTE_PERMS) {
    if (pathname === r.href || pathname.startsWith(`${r.href}/`)) {
      if (r.href.length > bestLen) {
        bestLen = r.href.length;
        bestPerm = r.perm;
      }
    }
  }
  return bestPerm;
}

/** First sidebar route the given permissions can open, in menu order. */
export function firstAllowedPath(permissions: string[]): string | undefined {
  for (const group of menuGroups) {
    for (const item of group.items) {
      if (!item.perm || hasPermission(permissions, item.perm)) return item.href;
    }
  }
  return undefined;
}
