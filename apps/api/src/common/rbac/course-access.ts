import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import {
  adminUsers,
  courses,
  roleCourseAssignments,
  roleLiveCourseAssignments,
} from 'src/db/schema';
import { getGrantedSlugs } from './permission-check';

/**
 * Course-scoped edit access. Backs the `edit_assigned_courses` /
 * `edit_assigned_live_courses` permissions, which restrict a role to editing
 * only the specific courses an admin has assigned to it (in `role_course_assignments`
 * / `role_live_course_assignments`), instead of every course a broader
 * permission like `update_courses` / `update_live` would otherwise unlock.
 */

/** Recorded-course ids explicitly assigned to `adminUserId`'s role. */
export async function getAssignedCourseIds(
  db: DB,
  adminUserId: number,
): Promise<number[]> {
  const rows = await db
    .select({ courseId: roleCourseAssignments.courseId })
    .from(roleCourseAssignments)
    .innerJoin(adminUsers, eq(adminUsers.roleId, roleCourseAssignments.roleId))
    .where(eq(adminUsers.id, adminUserId));
  return rows.map((r) => r.courseId);
}

/** Live-course ids explicitly assigned to `adminUserId`'s role. */
export async function getAssignedLiveCourseIds(
  db: DB,
  adminUserId: number,
): Promise<number[]> {
  const rows = await db
    .select({ liveCourseId: roleLiveCourseAssignments.liveCourseId })
    .from(roleLiveCourseAssignments)
    .innerJoin(adminUsers, eq(adminUsers.roleId, roleLiveCourseAssignments.roleId))
    .where(eq(adminUsers.id, adminUserId));
  return rows.map((r) => r.liveCourseId);
}

/**
 * Whether `adminUserId` may edit recorded course `courseId`, owned by
 * `courseInstructorId`. Super Admin and the owning instructor always can;
 * anyone else only if their role holds `edit_assigned_courses` AND the course
 * is in their role's assignment list. Purely additive — never takes away the
 * existing ownership-based access.
 */
export async function canEditCourse(
  db: DB,
  courseId: number,
  courseInstructorId: number,
  adminUserId: number,
  isAdmin: boolean,
): Promise<boolean> {
  if (isAdmin || courseInstructorId === adminUserId) return true;
  const granted = await getGrantedSlugs(db, adminUserId);
  if (!granted.has('edit_assigned_courses')) return false;
  const assignedIds = await getAssignedCourseIds(db, adminUserId);
  return assignedIds.includes(courseId);
}

/**
 * Whether `adminUserId` may edit live course `liveCourseId`. Live courses
 * have no owner concept, so historically anyone holding `update_live` could
 * edit every live course — that behavior is preserved for roles that don't
 * hold `edit_assigned_live_courses`. Only once a role opts into that
 * permission does it become restricted to its assignment list.
 */
export async function canEditLiveCourse(
  db: DB,
  liveCourseId: number,
  adminUserId: number,
  isAdmin: boolean,
): Promise<boolean> {
  if (isAdmin) return true;
  const granted = await getGrantedSlugs(db, adminUserId);
  if (!granted.has('edit_assigned_live_courses')) return true;
  const assignedIds = await getAssignedLiveCourseIds(db, adminUserId);
  return assignedIds.includes(liveCourseId);
}

/**
 * Course ids a *listing* endpoint (e.g. the admin courses table) should be
 * restricted to, or `null` if the caller should see every course unchanged.
 * Only roles holding `edit_assigned_courses` are restricted — everyone else
 * (including roles that only own courses) keeps seeing the full list, exactly
 * as before this feature existed.
 */
export async function getListableCourseIds(
  db: DB,
  adminUserId: number,
  isAdmin: boolean,
): Promise<number[] | null> {
  if (isAdmin) return null;
  const granted = await getGrantedSlugs(db, adminUserId);
  if (!granted.has('edit_assigned_courses')) return null;
  const [ownedRows, assignedIds] = await Promise.all([
    db.select({ id: courses.id }).from(courses).where(eq(courses.instructorId, adminUserId)),
    getAssignedCourseIds(db, adminUserId),
  ]);
  return [...new Set([...ownedRows.map((r) => r.id), ...assignedIds])];
}

/** Same as `getListableCourseIds`, for live courses (no owner concept, so purely the assignment list). */
export async function getListableLiveCourseIds(
  db: DB,
  adminUserId: number,
  isAdmin: boolean,
): Promise<number[] | null> {
  if (isAdmin) return null;
  const granted = await getGrantedSlugs(db, adminUserId);
  if (!granted.has('edit_assigned_live_courses')) return null;
  return getAssignedLiveCourseIds(db, adminUserId);
}
