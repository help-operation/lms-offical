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
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItemDef {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: string;
}

export interface DashboardNavSection {
  title: string;
  items: DashboardNavItemDef[];
}

export const guestNavItems: DashboardNavItemDef[] = [
  { label: "Dashboard", href: "/guest/dashboard", icon: LayoutDashboard },
  { label: "Explore Courses", href: "/courses", icon: Compass },
];

export const studentNavSections: DashboardNavSection[] = [
  {
    title: "Main / Learn",
    items: [
      { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "My Courses", href: "/student/courses", icon: BookOpen },
      { label: "Explore Courses", href: "/courses", icon: Compass },
      { label: "Classes / Schedule", href: "/student/classes", icon: Calendar },
      { label: "My Progress", href: "/student/progress", icon: GraduationCap },
    ],
  },
  {
    title: "Activity",
    items: [
      { label: "Assignments", href: "/student/assignments", icon: FileCheck },
      { label: "Quizzes & Exams", href: "/student/quizzes", icon: Shield },
      { label: "Certificates", href: "/student/certificates", icon: Award },
    ],
  },
  {
    title: "Financial",
    items: [
      { label: "Payment History", href: "/student/payment-history", icon: Receipt },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Notifications", href: "/student/notifications", icon: Bell },
      { label: "Messages", href: "/student/messages", icon: MessageSquare },
      { label: "Support", href: "/student/support", icon: HelpCircle },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "My Profile", href: "/student/profile", icon: User },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

/** Flat list of all student nav items (for mobile drawer that doesn't group). */
export const studentNavItems: DashboardNavItemDef[] = studentNavSections.flatMap(
  (s) => s.items
);

export const settingsItems: DashboardNavItemDef[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];
