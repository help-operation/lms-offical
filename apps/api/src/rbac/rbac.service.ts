import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { adminUsers, permissions, rolePermissions } from 'src/db/schema';

/**
 * Read-side helpers for resolving an admin's effective permissions. Used by the
 * `/auth/me` endpoint so the frontend `hasPermission()` matches backend
 * enforcement exactly.
 */
@Injectable()
export class RbacService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  /** Permission slugs granted to an admin via their assigned role. */
  async getAdminPermissionSlugs(adminUserId: number): Promise<string[]> {
    const rows = await this.db
      .select({ slug: permissions.slug })
      .from(adminUsers)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, adminUsers.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(adminUsers.id, adminUserId));
    return rows.map((r) => r.slug);
  }

  /** Every permission slug in the catalog (used for Super Admins). */
  async getAllPermissionSlugs(): Promise<string[]> {
    const rows = await this.db
      .select({ slug: permissions.slug })
      .from(permissions);
    return rows.map((r) => r.slug);
  }

  /**
   * Effective permissions for an admin, accounting for the Super Admin
   * all-access short-circuit.
   */
  async getEffectivePermissions(
    adminUserId: number,
    role: string,
  ): Promise<string[]> {
    if (role === 'SUPER_ADMIN') return this.getAllPermissionSlugs();
    return this.getAdminPermissionSlugs(adminUserId);
  }
}
