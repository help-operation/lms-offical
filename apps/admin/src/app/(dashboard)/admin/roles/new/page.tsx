import {
  getPermissionsAction,
  getCourseOptionsAction,
} from "@/features/roles/actions";
import { CreateRoleClient } from "@/features/roles/CreateRoleClient";

export const metadata = { title: "Create Role" };

export default async function CreateRolePage() {
  const [permsRes, courseOptionsRes] = await Promise.all([
    getPermissionsAction(),
    getCourseOptionsAction(),
  ]);

  const permissionGroups = permsRes.success ? permsRes.data : [];
  const courseOptions = courseOptionsRes.success
    ? courseOptionsRes.data
    : { courses: [], liveCourses: [] };

  return (
    <CreateRoleClient
      permissionGroups={permissionGroups}
      courseOptions={courseOptions}
    />
  );
}
