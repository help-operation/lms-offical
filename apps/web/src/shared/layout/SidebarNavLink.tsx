"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { NavItemColor } from "@/shared/layout/dashboard-nav";

const colorMap: Record<NavItemColor, { icon: string; activeBg: string; activeText: string; hoverBg: string; accent: string }> = {
  blue:   { icon: "text-blue-500",    activeBg: "bg-blue-50",    activeText: "text-blue-700",    hoverBg: "hover:bg-blue-50/60",  accent: "bg-blue-500" },
  purple: { icon: "text-violet-500",  activeBg: "bg-violet-50",  activeText: "text-violet-700",  hoverBg: "hover:bg-violet-50/60",accent: "bg-violet-500" },
  orange: { icon: "text-orange-500",  activeBg: "bg-orange-50",  activeText: "text-orange-700",  hoverBg: "hover:bg-orange-50/60",accent: "bg-orange-500" },
  rose:   { icon: "text-rose-500",    activeBg: "bg-rose-50",    activeText: "text-rose-700",    hoverBg: "hover:bg-rose-50/60",  accent: "bg-rose-500" },
  amber:  { icon: "text-amber-500",   activeBg: "bg-amber-50",   activeText: "text-amber-700",   hoverBg: "hover:bg-amber-50/60", accent: "bg-amber-500" },
  emerald:{ icon: "text-emerald-500", activeBg: "bg-emerald-50", activeText: "text-emerald-700", hoverBg: "hover:bg-emerald-50/60",accent: "bg-emerald-500" },
  cyan:   { icon: "text-cyan-500",    activeBg: "bg-cyan-50",    activeText: "text-cyan-700",    hoverBg: "hover:bg-cyan-50/60",  accent: "bg-cyan-500" },
  pink:   { icon: "text-pink-500",    activeBg: "bg-pink-50",    activeText: "text-pink-700",    hoverBg: "hover:bg-pink-50/60",  accent: "bg-pink-500" },
  slate:  { icon: "text-slate-400",   activeBg: "bg-slate-100",  activeText: "text-slate-700",   hoverBg: "hover:bg-slate-50",    accent: "bg-slate-400" },
  brand:  { icon: "text-brand-600",   activeBg: "bg-brand-50",   activeText: "text-brand-700",   hoverBg: "hover:bg-brand-50/60", accent: "bg-brand-500" },
};

/**
 * Sidebar nav item that highlights itself when the current route matches `href`
 * (exact match or a nested sub-route). Lives in a client component because the
 * dashboard layout is a server component and can't read the pathname.
 */
export function SidebarNavLink({
  href,
  icon,
  children,
  color = "brand",
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  color?: NavItemColor;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const colors = colorMap[color];

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
        isActive
          ? `${colors.activeBg} ${colors.activeText} dark:bg-brand-500/10 dark:text-brand-300`
          : `text-slate-500 ${colors.hoverBg} hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100`
      }`}
    >
      {isActive && (
        <span className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full ${colors.accent}`} />
      )}
      <span className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center [&>svg]:h-[20px] [&>svg]:w-[20px] transition-colors ${
        isActive ? colors.icon : `${colors.icon} opacity-60`
      }`}>
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
}
