"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasPermission } from "@/features/auth/permissions";
import { requiredPermissionFor, firstAllowedPath } from "./admin-menu";

/**
 * Page-level access gate. The sidebar hides links and the API blocks data, but
 * the page routes themselves are otherwise reachable directly (URL, default
 * landing, bookmark). This redirects a role that lacks the current page's
 * `view_*` permission to its first allowed page, instead of rendering an empty
 * shell. Super Admin (no `permissions` filtering) is never blocked.
 *
 * Security is still enforced server-side by the API guards — this is the
 * navigation layer that keeps the UI consistent with what a role can access.
 */
export function RouteGuard({
  permissions,
  isSuperAdmin,
  children,
}: {
  permissions: string[];
  isSuperAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const required = isSuperAdmin ? undefined : requiredPermissionFor(pathname);
  const allowed =
    isSuperAdmin || !required || hasPermission(permissions, required);
  const fallback = isSuperAdmin ? undefined : firstAllowedPath(permissions);

  useEffect(() => {
    if (!allowed && fallback && pathname !== fallback) {
      router.replace(fallback);
    }
  }, [allowed, fallback, pathname, router]);

  if (allowed) return <>{children}</>;

  // No page at all is permitted — avoid a redirect loop; show a notice.
  if (!fallback) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-center">
        <div>
          <p className="text-sm font-medium text-gray-900">No access</p>
          <p className="mt-1 text-sm text-gray-500">
            Your role doesn&apos;t have access to any pages. Please contact an
            administrator.
          </p>
        </div>
      </div>
    );
  }

  // Redirecting — render nothing so the blocked page never flashes.
  return null;
}
