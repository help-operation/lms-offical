import {
  Award,
  BookOpen,
  Calendar,
  Compass,
  FileCheck,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  NotebookPen,
  Receipt,
  Settings,
  Shield,
  Bell,
  CreditCard,
  HelpCircle,
  User,
  LogOut,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

export type NavItemColor = "blue" | "purple" | "orange" | "rose" | "amber" | "emerald" | "cyan" | "pink" | "slate" | "brand";

export interface DashboardNavItemDef {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: string;
  color: NavItemColor;
}

export interface DashboardNavSection {
  title: string;
  items: DashboardNavItemDef[];
}

export const guestNavItems: DashboardNavItemDef[] = [
  { label: "Dashboard", href: "/guest/dashboard", icon: LayoutDashboard, color: "blue" },
  { label: "Explore Courses", href: "/courses", icon: Compass, color: "orange" },
];

export const studentNavSections: DashboardNavSection[] = [
  {
    title: "LEARN",
    items: [
      { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard, color: "blue" },
      { label: "My Courses", href: "/student/courses", icon: BookOpen, color: "purple" },
      { label: "Explore Courses", href: "/courses", icon: Compass, color: "orange" },
      { label: "Classes / Schedule", href: "/student/classes", icon: Calendar, color: "rose" },
      { label: "My Progress", href: "/student/progress", icon: GraduationCap, color: "emerald" },
    ],
  },
  {
    title: "ACTIVITY",
    items: [
      { label: "Assignments", href: "/student/assignments", icon: FileCheck, color: "amber" },
      { label: "Quizzes & Exams", href: "/student/quizzes", icon: Shield, color: "cyan" },
      { label: "Certificates", href: "/student/certificates", icon: Award, color: "pink" },
    ],
  },
  {
    title: "FINANCIAL",
    items: [
      { label: "Payment History", href: "/student/payment-history", icon: Receipt, color: "emerald" },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      { label: "Notifications", href: "/student/notifications", icon: Bell, color: "amber" },
      { label: "Messages", href: "/student/messages", icon: MessageSquare, color: "cyan" },
      { label: "Support", href: "/student/support", icon: HelpCircle, color: "blue" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "My Profile", href: "/student/profile", icon: User, color: "purple" },
      { label: "Settings", href: "/dashboard/settings", icon: Settings, color: "slate" },
    ],
  },
];

/** Flat list of all student nav items (for mobile drawer that doesn't group). */
export const studentNavItems: DashboardNavItemDef[] = studentNavSections.flatMap(
  (s) => s.items
);

export const settingsItems: DashboardNavItemDef[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings, color: "slate" },
];

/** Bottom quick-access items for mobile sticky footer. */
export const quickAccessItems: DashboardNavItemDef[] = [
  { label: "Home", href: "/student/dashboard", icon: LayoutDashboard, color: "blue" },
  { label: "My Courses", href: "/student/courses", icon: BookOpen, color: "purple" },
  { label: "Continue Learning", href: "/courses", icon: PlayCircle, color: "brand" },
  { label: "Notifications", href: "/student/notifications", icon: Bell, color: "amber" },
  { label: "Profile", href: "/student/profile", icon: User, color: "purple" },
];
