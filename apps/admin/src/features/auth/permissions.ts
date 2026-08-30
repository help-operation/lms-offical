/**
 * Client-safe permission check. The `/auth/me` endpoint returns the admin's
 * effective permission slugs (the full catalog for Super Admins), so a simple
 * membership test mirrors backend enforcement.
 */
export function hasPermission(
  permissions: string[] | undefined | null,
  slug: string,
): boolean {
  return Array.isArray(permissions) && permissions.includes(slug);
}

export function hasAnyPermission(
  permissions: string[] | undefined | null,
  slugs: string[],
): boolean {
  return (
    Array.isArray(permissions) && slugs.some((s) => permissions.includes(s))
  );
}
