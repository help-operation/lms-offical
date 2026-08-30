import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { adminUsers, permissions, rolePermissions, roles } from 'src/db/schema';
import {
  INSTRUCTOR_DEFAULT_PERMISSIONS,
  LEGACY_PERMISSION_MIGRATION,
  PERMISSION_CATALOG,
  SYSTEM_ROLES,
} from './permission-catalog';

/**
 * Idempotent RBAC seeder. On every boot it ensures the permission catalog and
 * the two protected system roles exist, keeps Super Admin granted every
 * permission, and backfills `admin_users.role_id` from the legacy enum. Safe to
 * run repeatedly — it only inserts what is missing and never reverts admin edits
 * to non-system permission sets.
 */
@Injectable()
export class RbacSeederService implements OnModuleInit {
  private readonly logger = new Logger(RbacSeederService.name);

  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedPermissions();
      await this.migrateLegacyPermissions();
      const { superAdminId, instructorId, instructorCreated } =
        await this.seedRoles();
      await this.syncSuperAdminPermissions(superAdminId);
      if (instructorCreated) {
        await this.seedInstructorPermissions(instructorId);
      }
      await this.backfillAdminRoleIds(superAdminId, instructorId);
      this.logger.log('RBAC seed complete');
    } catch (err) {
      // Never block app boot on a seeding hiccup — surface it instead.
      this.logger.error('RBAC seed failed', err as Error);
    }
  }

  /** Insert any catalog permissions that don't already exist (by slug). */
  private async seedPermissions(): Promise<void> {
    await this.db
      .insert(permissions)
      .values(PERMISSION_CATALOG)
      .onConflictDoNothing({ target: permissions.slug });
  }

  /**
   * One-time, idempotent migration from the old coarse permissions to the new
   * per-page CRUD model. For every role that still holds a legacy slug, grant
   * the replacement slugs, then delete the legacy permission row (which removes
   * its role links too). Once the legacy rows are gone this is a no-op.
   */
  private async migrateLegacyPermissions(): Promise<void> {
    const legacySlugs = Object.keys(LEGACY_PERMISSION_MIGRATION);

    // Which legacy permissions still exist in the DB?
    const legacyRows = await this.db
      .select({ id: permissions.id, slug: permissions.slug })
      .from(permissions)
      .where(inArray(permissions.slug, legacySlugs));
    if (legacyRows.length === 0) return;

    // Resolve every replacement slug to its (new) permission id.
    const replacementSlugs = [
      ...new Set(Object.values(LEGACY_PERMISSION_MIGRATION).flat()),
    ];
    const newRows = replacementSlugs.length
      ? await this.db
          .select({ id: permissions.id, slug: permissions.slug })
          .from(permissions)
          .where(inArray(permissions.slug, replacementSlugs))
      : [];
    const idBySlug = new Map(newRows.map((r) => [r.slug, r.id]));

    for (const legacy of legacyRows) {
      // Roles currently granted this legacy permission.
      const holders = await this.db
        .select({ roleId: rolePermissions.roleId })
        .from(rolePermissions)
        .where(eq(rolePermissions.permissionId, legacy.id));

      const replacements = LEGACY_PERMISSION_MIGRATION[legacy.slug] ?? [];
      const grants = holders.flatMap((h) =>
        replacements
          .map((slug) => idBySlug.get(slug))
          .filter((id): id is number => id !== undefined)
          .map((permissionId) => ({ roleId: h.roleId, permissionId })),
      );

      if (grants.length > 0) {
        await this.db
          .insert(rolePermissions)
          .values(grants)
          .onConflictDoNothing();
      }

      // Drop the legacy permission (and its role links) for good.
      await this.db
        .delete(rolePermissions)
        .where(eq(rolePermissions.permissionId, legacy.id));
      await this.db.delete(permissions).where(eq(permissions.id, legacy.id));
    }

    this.logger.log(
      `Migrated ${legacyRows.length} legacy permission(s) to the per-page model`,
    );
  }

  /** Ensure both system roles exist; report whether Instructor was just created. */
  private async seedRoles(): Promise<{
    superAdminId: number;
    instructorId: number;
    instructorCreated: boolean;
  }> {
    const superAdminId = await this.ensureRole(SYSTEM_ROLES.superAdmin);
    const instructor = await this.ensureRoleTracked(SYSTEM_ROLES.instructor);
    return {
      superAdminId: superAdminId.id,
      instructorId: instructor.id,
      instructorCreated: instructor.created,
    };
  }

  private async ensureRole(role: {
    slug: string;
    name: string;
    description: string;
  }): Promise<{ id: number }> {
    const { id } = await this.ensureRoleTracked(role);
    return { id };
  }

  private async ensureRoleTracked(role: {
    slug: string;
    name: string;
    description: string;
  }): Promise<{ id: number; created: boolean }> {
    const [existing] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.slug, role.slug))
      .limit(1);

    if (existing) return { id: existing.id, created: false };

    const [inserted] = await this.db
      .insert(roles)
      .values({
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: true,
      })
      .returning({ id: roles.id });

    return { id: inserted.id, created: true };
  }

  /** Grant Super Admin every permission (auto-includes newly added ones). */
  private async syncSuperAdminPermissions(superAdminId: number): Promise<void> {
    const allPerms = await this.db
      .select({ id: permissions.id })
      .from(permissions);
    if (allPerms.length === 0) return;

    await this.db
      .insert(rolePermissions)
      .values(
        allPerms.map((p) => ({ roleId: superAdminId, permissionId: p.id })),
      )
      .onConflictDoNothing();
  }

  /** Grant the default permission set to a freshly created Instructor role. */
  private async seedInstructorPermissions(instructorId: number): Promise<void> {
    const defaults = await this.db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.slug, INSTRUCTOR_DEFAULT_PERMISSIONS));
    if (defaults.length === 0) return;

    await this.db
      .insert(rolePermissions)
      .values(
        defaults.map((p) => ({ roleId: instructorId, permissionId: p.id })),
      )
      .onConflictDoNothing();
  }

  /** Point existing admins at their dynamic role based on the legacy enum. */
  private async backfillAdminRoleIds(
    superAdminId: number,
    instructorId: number,
  ): Promise<void> {
    await this.db
      .update(adminUsers)
      .set({ roleId: superAdminId })
      .where(
        and(eq(adminUsers.role, 'SUPER_ADMIN'), isNull(adminUsers.roleId)),
      );

    await this.db
      .update(adminUsers)
      .set({ roleId: instructorId })
      .where(and(eq(adminUsers.role, 'INSTRUCTOR'), isNull(adminUsers.roleId)));
  }
}
