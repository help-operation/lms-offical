import {
  getAdminUsersAction,
  getRolesAction,
  getPermissionsAction,
  getCourseOptionsAction,
} from "@/features/roles/actions";
import { authApi } from "@/features/auth/api";
import { RolesClient } from "@/features/roles/RolesClient";

export const metadata = { title: "Roles & Permissions" };

export default async function RolesPage() {
  const [usersRes, rolesRes, permsRes, courseOptionsRes, me] = await Promise.all([
    getAdminUsersAction({ page: 1 }),
    getRolesAction(),
    getPermissionsAction(),
    getCourseOptionsAction(),
    authApi.me().catch(() => null),
  ]);

  const initial = usersRes.success
    ? usersRes.data
    : {
        data: [],
        pagination: { total: 0, per_page: 20, current_page: 1, last_page: 0, from: 0, to: 0 },
        stats: { total: 0, superAdmins: 0, instructors: 0 },
      };

  const roles = rolesRes.success ? rolesRes.data : [];
  const permissionGroups = permsRes.success ? permsRes.data : [];
  const courseOptions = courseOptionsRes.success
    ? courseOptionsRes.data
    : { courses: [], liveCourses: [] };
  const permissions = me?.data.permissions ?? [];

  return (
    <RolesClient
      initial={initial}
      roles={roles}
      permissionGroups={permissionGroups}
      courseOptions={courseOptions}
      permissions={permissions}
    />
  );
}
