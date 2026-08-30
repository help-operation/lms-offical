"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Info, Newspaper, Phone } from "lucide-react";
import { useScrollHidden } from "@/shared/hooks/useScrollHidden";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: BookOpen, label: "All Course", href: "/courses" },
  { icon: Info, label: "About", href: "/about" },
  { icon: Newspaper, label: "Blog", href: "/blog" },
  { icon: Phone, label: "Contact", href: "/contact" },
];

type Props = {
  /** Skip the scroll-hide behavior and keep the nav permanently visible. */
  alwaysVisible?: boolean;
};

/** Fixed bottom icon nav shown on public pages below `lg`. Slides out of view
 * on scroll-down and back in on scroll-up, unless `alwaysVisible` is set. */
export function MobileBottomNav({ alwaysVisible = false }: Props) {
  const pathname = usePathname();
  const scrollHidden = useScrollHidden();
  const hidden = alwaysVisible ? false : scrollHidden;

  return (
    <nav
      aria-label="Mobile footer navigation"
      className={`fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-gray-100 bg-white/95 backdrop-blur transition-transform duration-300 lg:hidden dark:border-gray-800 dark:bg-gray-900/95 ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
    >
      {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              isActive ? "text-brand-600" : "text-gray-400 hover:text-brand-500"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
