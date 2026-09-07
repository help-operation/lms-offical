"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  PlayCircle,
  Bell,
  User,
  type LucideIcon,
} from "lucide-react";
import type { NavItemColor } from "@/shared/layout/dashboard-nav";

interface FooterItem {
  label: string;
  href: string;
  icon: LucideIcon;
  color: NavItemColor;
  badge?: number;
}

const defaultItems: FooterItem[] = [
  { label: "Home", href: "/student/dashboard", icon: LayoutDashboard, color: "blue" },
  { label: "My Courses", href: "/student/courses", icon: BookOpen, color: "purple" },
  { label: "Continue Learning", href: "/courses", icon: PlayCircle, color: "brand" },
  { label: "Notifications", href: "/student/notifications", icon: Bell, color: "amber" },
  { label: "Profile", href: "/student/profile", icon: User, color: "purple" },
];

const colorStyles: Record<NavItemColor, { icon: string; activeText: string; activeBg: string }> = {
  blue:    { icon: "text-blue-500",    activeText: "text-blue-600",    activeBg: "bg-blue-50" },
  purple:  { icon: "text-violet-500",  activeText: "text-violet-600",  activeBg: "bg-violet-50" },
  orange:  { icon: "text-orange-500",  activeText: "text-orange-600",  activeBg: "bg-orange-50" },
  rose:    { icon: "text-rose-500",    activeText: "text-rose-600",    activeBg: "bg-rose-50" },
  amber:   { icon: "text-amber-500",   activeText: "text-amber-600",   activeBg: "bg-amber-50" },
  emerald: { icon: "text-emerald-500", activeText: "text-emerald-600", activeBg: "bg-emerald-50" },
  cyan:    { icon: "text-cyan-500",    activeText: "text-cyan-600",    activeBg: "bg-cyan-50" },
  pink:    { icon: "text-pink-500",    activeText: "text-pink-600",    activeBg: "bg-pink-50" },
  slate:   { icon: "text-slate-400",   activeText: "text-slate-600",   activeBg: "bg-slate-100" },
  brand:   { icon: "text-brand-600",   activeText: "text-brand-700",   activeBg: "bg-brand-50" },
};

const darkColorStyles: Record<NavItemColor, { icon: string; activeText: string; activeBg: string }> = {
  blue:    { icon: "text-blue-400",    activeText: "text-blue-300",    activeBg: "bg-blue-500/10" },
  purple:  { icon: "text-violet-400",  activeText: "text-violet-300",  activeBg: "bg-violet-500/10" },
  orange:  { icon: "text-orange-400",  activeText: "text-orange-300",  activeBg: "bg-orange-500/10" },
  rose:    { icon: "text-rose-400",    activeText: "text-rose-300",    activeBg: "bg-rose-500/10" },
  amber:   { icon: "text-amber-400",   activeText: "text-amber-300",   activeBg: "bg-amber-500/10" },
  emerald: { icon: "text-emerald-400", activeText: "text-emerald-300", activeBg: "bg-emerald-500/10" },
  cyan:    { icon: "text-cyan-400",    activeText: "text-cyan-300",    activeBg: "bg-cyan-500/10" },
  pink:    { icon: "text-pink-400",    activeText: "text-pink-300",    activeBg: "bg-pink-500/10" },
  slate:   { icon: "text-slate-500",   activeText: "text-slate-300",   activeBg: "bg-slate-800" },
  brand:   { icon: "text-brand-400",   activeText: "text-brand-300",   activeBg: "bg-brand-500/10" },
};

/**
 * Sticky bottom quick-access nav for mobile/tablet (lg:hidden).
 * Shows 5 icon-only items with "Continue Learning" as the prominent center.
 * Supports safe-area insets and avoids overlapping page content.
 */
export function QuickAccessFooter({
  items = defaultItems,
  notificationBadge = 0,
}: {
  items?: FooterItem[];
  notificationBadge?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 bg-white/95 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Quick access navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {items.map((item, index) => {
          const isCenter = index === 2;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const colors = colorStyles[item.color];
          const darkColors = darkColorStyles[item.color];
          const showBadge = item.label === "Notifications" && notificationBadge > 0;

          if (isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative -mt-5 flex flex-col items-center"
                aria-label={item.label}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors duration-200 ${
                isActive
                  ? `${colors?.activeText} dark:${darkColors?.activeText}`
                  : "text-slate-400 dark:text-slate-500"
              }`}
              aria-label={item.label}
            >
              <span className={`relative flex h-7 w-7 items-center justify-center rounded-xl transition-colors duration-200 ${
                isActive
                  ? `${colors?.activeBg} dark:${darkColors?.activeBg}`
                  : ""
              }`}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                {showBadge && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {notificationBadge > 99 ? "99+" : notificationBadge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] leading-none transition-colors ${
                isActive ? "font-semibold" : "font-medium"
              }`}>
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body,
  );
}
