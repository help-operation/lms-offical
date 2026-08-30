"use server";

import { apiRequest } from "@/lib/api-client";
import type {
  AdminUser,
  AdminUsersResponse,
  CourseOptions,
  PermissionGroup,
  Role,
} from "./types";

export interface RoleInput {
  name:                   string;
  slug:                   string;
  description:            string | null;
  permissions:            number[];
  assignedCourseIds?:     number[];
  assignedLiveCourseIds?: number[];
}

export async function getAdminUsersAction(params?: {
  page?:   number;
  search?: string;
  role?:   string;
}) {
  try {
    const q = new URLSearchParams();
    if (params?.page)   q.set("page",   String(params.page));
    if (params?.search) q.set("search", params.search);
    if (params?.role)   q.set("role",   params.role);
    const res = await apiRequest<AdminUsersResponse>(
      `/admin/admin-users?${q.toString()}`,
    );
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return {
      success: false as const,
      message: err?.message ?? "Failed to fetch admin users",
    };
  }
}

export async function createAdminUserAction(data: {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
  roleId:    number;
}) {
  try {
    const res = await apiRequest<AdminUser>("/admin/admin-users", {
      method: "POST",
      body:   JSON.stringify(data),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return {
      success: false as const,
      message: err?.message ?? "Failed to create admin user",
    };
  }
}

export async function updateAdminRoleAction(id: number, roleId: number) {
  try {
    const res = await apiRequest<AdminUser>(`/admin/admin-users/${id}/role`, {
      method: "PUT",
      body:   JSON.stringify({ roleId }),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return {
      success: false as const,
      message: err?.message ?? "Failed to update role",
    };
  }
}

export async function updateAdminUserAction(
  id: number,
  data: { firstName?: string; lastName?: string; email?: string },
) {
  try {
    const res = await apiRequest<AdminUser>(`/admin/admin-users/${id}`, {
      method: "PATCH",
      body:   JSON.stringify(data),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return {
      success: false as const,
      message: err?.message ?? "Failed to update admin user",
    };
  }
}

export async function resetAdminPasswordAction(id: number, password: string) {
  try {
    await apiRequest(`/admin/admin-users/${id}/password`, {
      method: "PUT",
      body:   JSON.stringify({ password }),
    });
    return { success: true as const };
  } catch (err: any) {
    return {
      success: false as const,
      message: err?.message ?? "Failed to reset password",
    };
  }
}

// ─── Roles & Permissions ────────────────────────────────────────────────────

export async function getRolesAction() {
  try {
    const res = await apiRequest<Role[]>("/admin/roles");
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch roles" };
  }
}

export async function getPermissionsAction() {
  try {
    const res = await apiRequest<PermissionGroup[]>("/admin/permissions");
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch permissions" };
  }
}

export async function getCourseOptionsAction() {
  try {
    const res = await apiRequest<CourseOptions>("/admin/roles/course-options");
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch course options" };
  }
}

export async function createRoleAction(input: RoleInput) {
  try {
    const res = await apiRequest<Role>("/admin/roles", {
      method: "POST",
      body:   JSON.stringify(input),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to create role" };
  }
}

export async function updateRoleAction(id: number, input: RoleInput) {
  try {
    const res = await apiRequest<Role>(`/admin/roles/${id}`, {
      method: "PUT",
      body:   JSON.stringify(input),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to update role" };
  }
}

export async function deleteRoleAction(id: number) {
  try {
    await apiRequest(`/admin/roles/${id}`, { method: "DELETE" });
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to delete role" };
  }
}

export async function toggleAdminStatusAction(id: number) {
  try {
    const res = await apiRequest<AdminUser>(`/admin/admin-users/${id}/toggle`, {
      method: "POST",
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return {
      success: false as const,
      message: err?.message ?? "Failed to toggle status",
    };
  }
}

export async function deleteAdminUserAction(id: number) {
  try {
    await apiRequest(`/admin/admin-users/${id}`, { method: "DELETE" });
    return { success: true as const };
  } catch (err: any) {
    return {
      success: false as const,
      message: err?.message ?? "Failed to delete admin user",
    };
  }
}
