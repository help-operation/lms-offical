"use server";

import { revalidatePath } from "next/cache";
import { adminApi } from "@/features/admin/api";
import type { TableQueryParams } from "@/features/admin/api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
      return err.errors.map((e: { message: string }) => e.message).join(", ");
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUsersAction(params: TableQueryParams) {
  try {
    const res = await adminApi.users(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function fetchAllUsersForExportAction(params: TableQueryParams) {
  try {
    const res = await adminApi.usersExport(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function createUserAction(data: {
  firstName: string; lastName: string; email?: string; phone?: string; password: string;
  role?: string; gender?: string; country?: string; city?: string;
  department?: string; designation?: string;
  dateOfBirth?: string; nationalId?: string; joiningDate?: string; employmentType?: string;
  emergencyContactName?: string; emergencyContactPhone?: string;
  salary?: number; bankName?: string; bankAccountNumber?: string;
  presentAddress?: string; permanentAddress?: string;
}) {
  try {
    const res = await adminApi.createUser(data);
    revalidatePath("/admin/users");
    revalidatePath("/admin/students");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function suspendUserAction(id: number) {
  try {
    const res = await adminApi.suspendUser(id);
    revalidatePath("/admin/users");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function activateUserAction(id: number) {
  try {
    const res = await adminApi.activateUser(id);
    revalidatePath("/admin/users");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function changeRoleAction(id: number, role: string) {
  try {
    const res = await adminApi.changeRole(id, role);
    revalidatePath("/admin/users");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateUserAction(
  id: number,
  data: { firstName?: string; lastName?: string; email?: string | null; phone?: string | null },
) {
  try {
    const res = await adminApi.updateUser(id, data);
    revalidatePath("/admin/users");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function resetUserPasswordAction(id: number, password: string) {
  try {
    await adminApi.resetUserPassword(id, password);
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteUserAction(id: number) {
  try {
    await adminApi.deleteUser(id);
    revalidatePath("/admin/users");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function fetchCategoriesAction(params: TableQueryParams) {
  try {
    const res = await adminApi.categories(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function createCategoryAction(data: {
  name: string;
  description?: string;
  icon?: string;
}) {
  try {
    const res = await adminApi.createCategory(data);
    revalidatePath("/admin/categories");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateCategoryAction(
  id: number,
  data: { name?: string; description?: string },
) {
  try {
    const res = await adminApi.updateCategory(id, data);
    revalidatePath("/admin/categories");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function toggleCategoryAction(id: number) {
  try {
    const res = await adminApi.toggleCategory(id);
    revalidatePath("/admin/categories");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteCategoryAction(id: number) {
  try {
    await adminApi.deleteCategory(id);
    revalidatePath("/admin/categories");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export async function fetchCouponsAction(params: TableQueryParams) {
  try {
    const res = await adminApi.coupons(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function createCouponAction(data: {
  code: string;
  type: string;
  value: number;
  maxUses?: number;
  expiresAt?: string;
  scope?: import("@/features/admin/api").CouponScope;
  courseIds?: number[];
  liveCourseIds?: number[];
}) {
  try {
    const res = await adminApi.createCoupon(data);
    revalidatePath("/admin/coupons");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function fetchCouponPickerCoursesAction() {
  try {
    const res = await adminApi.couponPickerCourses();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function fetchCouponPickerLiveCoursesAction() {
  try {
    const res = await adminApi.couponPickerLiveCourses();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function toggleCouponAction(id: number) {
  try {
    const res = await adminApi.toggleCoupon(id);
    revalidatePath("/admin/coupons");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteCouponAction(id: number) {
  try {
    await adminApi.deleteCoupon(id);
    revalidatePath("/admin/coupons");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// ─── Courses (Admin) ──────────────────────────────────────────────────────────

export async function fetchCoursesAction(params: TableQueryParams) {
  try {
    const res = await adminApi.courses(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function approveCourseAction(id: number) {
  try {
    const res = await adminApi.approveCourse(id);
    revalidatePath("/admin/courses");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function rejectCourseAction(id: number) {
  try {
    const res = await adminApi.rejectCourse(id);
    revalidatePath("/admin/courses");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function featureCourseAction(id: number) {
  try {
    const res = await adminApi.featureCourse(id);
    revalidatePath("/admin/courses");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
