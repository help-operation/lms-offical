import {
  Award,
  BookOpen,
  Compass,
  LayoutDashboard,
  MessageSquare,
  NotebookPen,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItemDef {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const guestNavItems: DashboardNavItemDef[] = [
  { label: "Dashboard", href: "/guest/dashboard", icon: LayoutDashboard },
  { label: "Explore Courses", href: "/courses", icon: Compass },
];

export const studentNavItems: DashboardNavItemDef[] = [
  { label: "Dashboard",       href: "/student/dashboard",        icon: LayoutDashboard },
  { label: "My Courses",      href: "/student/courses",          icon: BookOpen },
  { label: "Certificates",    href: "/student/certificates",     icon: Award },
  { label: "Notes",           href: "/student/notes",            icon: NotebookPen },
  { label: "Payment History", href: "/student/payment-history",  icon: Receipt },
  { label: "Support",         href: "/student/support",          icon: MessageSquare },
  { label: "Explore Courses", href: "/courses",                  icon: Compass },
];

export const settingsItems: DashboardNavItemDef[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];
