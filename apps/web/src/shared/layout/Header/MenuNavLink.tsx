"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MenuLink } from "@/features/cms/api/menus";

/** Exact match for "/", otherwise the current path is this link or a subpath of it. */
function isActivePath(pathname: string, url: string, isExternal: boolean) {
  if (isExternal || !url) return false;
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

/** Renders a menu link as <Link> (internal) or <a> (external), underlined in the brand color when active. */
export function MenuNavLink({ item, className }: { item: MenuLink; className?: string }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.url, item.isExternal);

  const label = (
    <span className="relative inline-block">
      {item.label}
      {active && (
        <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-brand-600 dark:bg-brand-400" />
      )}
    </span>
  );

  const activeCls = active ? "text-brand-600 dark:text-brand-400" : "";

  if (item.isExternal) {
    return (
      <a
        href={item.url}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noreferrer" : undefined}
        className={`${className ?? ""} ${activeCls}`}
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={item.url} target={item.openInNewTab ? "_blank" : undefined} className={`${className ?? ""} ${activeCls}`}>
      {label}
    </Link>
  );
}
