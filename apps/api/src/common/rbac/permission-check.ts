import { ForbiddenException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { adminUsers, permissions, rolePermissions } from 'src/db/schema';
import type { RequestUser } from 'src/common/decorators/current-user.decorator';

/**
 * Shared RBAC helpers for the dynamic, per-record guards (page-sections,
 * system-settings, pages) where the required permission depends on the row or
 * key being touched and so can't be expressed with the static
 * `@RequirePermissions()` decorator. Mirrors `PermissionsGuard`: Super Admin
 * bypasses, only admin accounts carry permissions, slugs resolve from the
 * caller's role on every request.
 */
export function isSuperAdmin(user?: RequestUser): boolean {
  return !!user && user.userType === 'admin' && user.role === 'SUPER_ADMIN';
}

export async function getGrantedSlugs(
  db: DB,
  adminUserId: number,
): Promise<Set<string>> {
  const rows = await db
    .select({ slug: permissions.slug })
    .from(adminUsers)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, adminUsers.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(adminUsers.id, adminUserId));
  return new Set(rows.map((r) => r.slug));
}

/** Throws unless the user is Super Admin or holds **every** slug in `required`. */
export async function assertAllPermissions(
  db: DB,
  user: RequestUser | undefined,
  required: string[],
): Promise<void> {
  if (isSuperAdmin(user)) return;
  if (!user || user.userType !== 'admin')
    throw new ForbiddenException('Access denied');
  if (required.length === 0) return;
  const granted = await getGrantedSlugs(db, user.userId);
  const missing = required.filter((p) => !granted.has(p));
  if (missing.length > 0)
    throw new ForbiddenException(
      `Missing required permission(s): ${missing.join(', ')}`,
    );
}

/** Throws unless the user is Super Admin or holds **at least one** of `anyOf`. */
export async function assertAnyPermission(
  db: DB,
  user: RequestUser | undefined,
  anyOf: string[],
): Promise<void> {
  if (isSuperAdmin(user)) return;
  if (!user || user.userType !== 'admin')
    throw new ForbiddenException('Access denied');
  const granted = await getGrantedSlugs(db, user.userId);
  if (!anyOf.some((p) => granted.has(p)))
    throw new ForbiddenException('Access denied');
}
