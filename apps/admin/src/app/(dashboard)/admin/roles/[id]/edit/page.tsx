import {
  getRoleByIdAction,
  getPermissionsAction,
  getCourseOptionsAction,
} from "@/features/roles/actions";
import { EditRoleClient } from "@/features/roles/EditRoleClient";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Role" };

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roleId = Number(id);
  if (isNaN(roleId)) notFound();

  const [roleRes, permsRes, courseOptionsRes] = await Promise.all([
    getRoleByIdAction(roleId),
    getPermissionsAction(),
    getCourseOptionsAction(),
  ]);

  if (!roleRes.success) notFound();

  const role = roleRes.data;
  const permissionGroups = permsRes.success ? permsRes.data : [];
  const courseOptions = courseOptionsRes.success
    ? courseOptionsRes.data
    : { courses: [], liveCourses: [] };

  return (
    <EditRoleClient
      role={role}
      permissionGroups={permissionGroups}
      courseOptions={courseOptions}
    />
  );
}
