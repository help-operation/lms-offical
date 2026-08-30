import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq, inArray, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  adminUsers,
  courses,
  liveCourses,
  permissions,
  roleCourseAssignments,
  roleLiveCourseAssignments,
  rolePermissions,
  roles,
} from 'src/db/schema';
import { PERMISSION_GROUP_LABELS, SYSTEM_ROLES } from './permission-catalog';

export interface RoleInput {
  name: string;
  slug: string;
  description?: string | null;
  permissions: number[];
  /** Recorded-course ids this role may edit under `edit_assigned_courses`. */
  assignedCourseIds?: number[];
  /** Live-course ids this role may edit under `edit_assigned_live_courses`. */
  assignedLiveCourseIds?: number[];
}

@Injectable()
export class RolesService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  /** List all roles with their permission ids, course assignments, and admin-user counts. */
  async list() {
    const allRoles = await this.db.select().from(roles).orderBy(roles.id);

    const permRows = await this.db
      .select({
        roleId: rolePermissions.roleId,
        permissionId: rolePermissions.permissionId,
      })
      .from(rolePermissions);

    const courseRows = await this.db
      .select({ roleId: roleCourseAssignments.roleId, courseId: roleCourseAssignments.courseId })
      .from(roleCourseAssignments);

    const liveCourseRows = await this.db
      .select({ roleId: roleLiveCourseAssignments.roleId, liveCourseId: roleLiveCourseAssignments.liveCourseId })
      .from(roleLiveCourseAssignments);

    const userCounts = await this.db
      .select({ roleId: adminUsers.roleId, count: sql<number>`count(*)::int` })
      .from(adminUsers)
      .groupBy(adminUsers.roleId);

    const permsByRole = new Map<number, number[]>();
    for (const row of permRows) {
      const list = permsByRole.get(row.roleId) ?? [];
      list.push(row.permissionId);
      permsByRole.set(row.roleId, list);
    }

    const coursesByRole = new Map<number, number[]>();
    for (const row of courseRows) {
      const list = coursesByRole.get(row.roleId) ?? [];
      list.push(row.courseId);
      coursesByRole.set(row.roleId, list);
    }

    const liveCoursesByRole = new Map<number, number[]>();
    for (const row of liveCourseRows) {
      const list = liveCoursesByRole.get(row.roleId) ?? [];
      list.push(row.liveCourseId);
      liveCoursesByRole.set(row.roleId, list);
    }

    const usersByRole = new Map<number, number>();
    for (const row of userCounts) {
      if (row.roleId != null) usersByRole.set(row.roleId, row.count);
    }

    return allRoles.map((role) => ({
      ...role,
      permissionIds: permsByRole.get(role.id) ?? [],
      assignedCourseIds: coursesByRole.get(role.id) ?? [],
      assignedLiveCourseIds: liveCoursesByRole.get(role.id) ?? [],
      usersCount: usersByRole.get(role.id) ?? 0,
    }));
  }

  /** A single role with the ids of its granted permissions and assigned courses. */
  async findOne(id: number) {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);
    if (!role) throw new NotFoundException('Role not found');

    const permRows = await this.db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, id));

    const courseRows = await this.db
      .select({ courseId: roleCourseAssignments.courseId })
      .from(roleCourseAssignments)
      .where(eq(roleCourseAssignments.roleId, id));

    const liveCourseRows = await this.db
      .select({ liveCourseId: roleLiveCourseAssignments.liveCourseId })
      .from(roleLiveCourseAssignments)
      .where(eq(roleLiveCourseAssignments.roleId, id));

    return {
      ...role,
      permissionIds: permRows.map((p) => p.permissionId),
      assignedCourseIds: courseRows.map((c) => c.courseId),
      assignedLiveCourseIds: liveCourseRows.map((c) => c.liveCourseId),
    };
  }

  /** Lightweight course lists for the role editor's course-assignment picker. */
  async getCourseOptions() {
    const recorded = await this.db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .orderBy(asc(courses.title));

    const live = await this.db
      .select({ id: liveCourses.id, title: liveCourses.title })
      .from(liveCourses)
      .orderBy(asc(liveCourses.title));

    return { courses: recorded, liveCourses: live };
  }

  /** The full permission catalog grouped by module, for the role editor UI. */
  async getPermissionsGrouped() {
    const all = await this.db
      .select({
        id: permissions.id,
        name: permissions.name,
        slug: permissions.slug,
        group: permissions.group,
        type: permissions.type,
      })
      .from(permissions)
      .orderBy(permissions.id);

    const byGroup = new Map<string, typeof all>();
    for (const perm of all) {
      const list = byGroup.get(perm.group) ?? [];
      list.push(perm);
      byGroup.set(perm.group, list);
    }

    return Array.from(byGroup.entries()).map(([group, perms]) => ({
      group,
      label: PERMISSION_GROUP_LABELS[group] ?? group,
      permissions: perms,
    }));
  }

  async create(input: RoleInput) {
    const slug = this.normalizeSlug(input.slug);
    if (!input.name?.trim() || !slug) {
      throw new BadRequestException('Name and slug are required');
    }

    const [existing] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.slug, slug))
      .limit(1);
    if (existing)
      throw new ConflictException('A role with this slug already exists');

    const [created] = await this.db
      .insert(roles)
      .values({
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        isSystem: false,
      })
      .returning();

    await this.setPermissions(created.id, input.permissions);
    await this.setCourseAssignments(created.id, input.assignedCourseIds, input.assignedLiveCourseIds);
    return this.findOne(created.id);
  }

  async update(id: number, input: RoleInput) {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);
    if (!role) throw new NotFoundException('Role not found');

    // The Super Admin role is fully locked — it always has every permission.
    if (role.slug === SYSTEM_ROLES.superAdmin.slug) {
      throw new ForbiddenException('The Super Admin role cannot be modified');
    }

    // System roles keep their slug; only name/description/permissions may change.
    const slug = role.isSystem ? role.slug : this.normalizeSlug(input.slug);
    if (!input.name?.trim() || !slug) {
      throw new BadRequestException('Name and slug are required');
    }

    if (slug !== role.slug) {
      const [clash] = await this.db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.slug, slug))
        .limit(1);
      if (clash && clash.id !== id) {
        throw new ConflictException('A role with this slug already exists');
      }
    }

    await this.db
      .update(roles)
      .set({
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id));

    await this.setPermissions(id, input.permissions);
    await this.setCourseAssignments(id, input.assignedCourseIds, input.assignedLiveCourseIds);
    return this.findOne(id);
  }

  async remove(id: number) {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminUsers)
      .where(eq(adminUsers.roleId, id));
    if (count > 0) {
      throw new BadRequestException(
        'Reassign the admins using this role before deleting it',
      );
    }

    await this.db.delete(roles).where(eq(roles.id, id));
    return { success: true };
  }

  /** Replace a role's permission set with the given permission ids. */
  private async setPermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    await this.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    const ids = [...new Set(permissionIds ?? [])];
    if (ids.length === 0) return;

    // Only insert ids that actually exist, so a bad payload can't poison the set.
    const valid = await this.db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.id, ids));

    if (valid.length === 0) return;
    await this.db
      .insert(rolePermissions)
      .values(valid.map((p) => ({ roleId, permissionId: p.id })))
      .onConflictDoNothing();
  }

  /**
   * Replace a role's course assignments (used by `edit_assigned_courses` /
   * `edit_assigned_live_courses`). Each param `undefined` leaves that table
   * untouched; an explicit `[]` clears it.
   */
  private async setCourseAssignments(
    roleId: number,
    courseIds: number[] | undefined,
    liveCourseIds: number[] | undefined,
  ): Promise<void> {
    if (courseIds !== undefined) {
      await this.db.delete(roleCourseAssignments).where(eq(roleCourseAssignments.roleId, roleId));
      const ids = [...new Set(courseIds)];
      if (ids.length > 0) {
        const valid = await this.db.select({ id: courses.id }).from(courses).where(inArray(courses.id, ids));
        if (valid.length > 0) {
          await this.db
            .insert(roleCourseAssignments)
            .values(valid.map((c) => ({ roleId, courseId: c.id })))
            .onConflictDoNothing();
        }
      }
    }

    if (liveCourseIds !== undefined) {
      await this.db.delete(roleLiveCourseAssignments).where(eq(roleLiveCourseAssignments.roleId, roleId));
      const ids = [...new Set(liveCourseIds)];
      if (ids.length > 0) {
        const valid = await this.db.select({ id: liveCourses.id }).from(liveCourses).where(inArray(liveCourses.id, ids));
        if (valid.length > 0) {
          await this.db
            .insert(roleLiveCourseAssignments)
            .values(valid.map((c) => ({ roleId, liveCourseId: c.id })))
            .onConflictDoNothing();
        }
      }
    }
  }

  private normalizeSlug(slug: string): string {
    return (slug ?? '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
