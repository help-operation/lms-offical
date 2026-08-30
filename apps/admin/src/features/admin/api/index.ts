import { apiRequest } from "@/lib/api-client";

// ─── Shared pagination types (mirrors backend PaginatedResponse) ──────────────

export interface TablePagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: TablePagination;
}

export interface TableQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  [key: string]: unknown;
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface CourseTypeStats {
  students: number;
  courses: number;
  enrollments: number;
  revenue: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalRevenue: string;
  recorded: CourseTypeStats;
  live: CourseTypeStats;
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  avatar: string | null;
  createdAt: string | null;
}

export interface RevenueOrder {
  id: number;
  status: string;
  finalAmount: string;
  createdAt: string | null;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userEmail: string | null;
}

export interface PaymentRecord {
  id: number;
  invoiceNumber: string | null;
  courseType: "recorded" | "live";
  courseTitles: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  amount: string;
  method: string | null;
  date: string | null;
}

export interface AdminCourse {
  id: number;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  isUnlisted: boolean;
  price: string;
  totalStudents: number;
  rating: string | null;
  instructorFirstName: string | null;
  instructorLastName: string | null;
  categoryName: string | null;
  createdAt: string | null;
  template: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}

export type CouponScope =
  | "all"
  | "all_recorded"
  | "specific_recorded"
  | "all_live"
  | "specific_live";

export interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  scope: CouponScope;
  scopeCourses:     { id: number; title: string }[];
  scopeLiveCourses: { id: number; title: string }[];
  createdAt: string | null;
}

export interface PickerCourse {
  id: number;
  title: string;
}

export const adminApi = {
  stats: () => apiRequest<PlatformStats>("/admin/stats"),

  users: (params?: TableQueryParams) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
      });
    }
    return apiRequest<PaginatedResponse<AdminUser>>(`/admin/users${q.toString() ? `?${q}` : ""}`);
  },

  usersExport: (params?: TableQueryParams) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && k !== "page" && k !== "per_page")
          q.set(k, String(v));
      });
    }
    q.set("per_page", "100000");
    return apiRequest<AdminUser[]>(`/admin/users/export${q.toString() ? `?${q}` : ""}`);
  },

  suspendUser: (id: number) =>
    apiRequest<{ id: number; status: string }>(`/admin/users/${id}/suspend`, { method: "POST" }),

  activateUser: (id: number) =>
    apiRequest<{ id: number; status: string }>(`/admin/users/${id}/activate`, { method: "POST" }),

  changeRole: (id: number, role: string) =>
    apiRequest<{ id: number; role: string }>(`/admin/users/${id}/role`, {
      method: "POST",
      body: JSON.stringify({ role }),
    }),

  getUser: (id: number) =>
    apiRequest<AdminUser>(`/admin/users/${id}`),

  createUser: (data: { firstName: string; lastName: string; email?: string; phone?: string; password: string }) =>
    apiRequest<AdminUser>(`/admin/users`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUser: (id: number, data: { firstName?: string; lastName?: string; email?: string | null; phone?: string | null }) =>
    apiRequest<AdminUser>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  resetUserPassword: (id: number, password: string) =>
    apiRequest<{ id: number }>(`/admin/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    }),

  deleteUser: (id: number) =>
    apiRequest<{ id: number }>(`/admin/users/${id}`, { method: "DELETE" }),

  revenue: () => apiRequest<RevenueOrder[]>("/admin/revenue"),
  liveRevenue: () => apiRequest<RevenueOrder[]>("/admin/live-revenue"),
  completedPayments: () => apiRequest<PaymentRecord[]>("/admin/payments/completed"),
  failedPayments: () => apiRequest<PaymentRecord[]>("/admin/payments/failed"),

  courses: (params?: TableQueryParams) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
      });
    }
    return apiRequest<PaginatedResponse<AdminCourse>>(`/admin/courses${q.toString() ? `?${q}` : ""}`);
  },
  approveCourse: (id: number) =>
    apiRequest<AdminCourse>(`/admin/courses/${id}/approve`, { method: "POST" }),
  rejectCourse: (id: number) =>
    apiRequest<AdminCourse>(`/admin/courses/${id}/reject`, { method: "POST" }),
  featureCourse: (id: number) =>
    apiRequest<AdminCourse>(`/admin/courses/${id}/feature`, { method: "POST" }),

  categories: (params?: TableQueryParams) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
      });
    }
    return apiRequest<PaginatedResponse<AdminCategory>>(`/admin/categories${q.toString() ? `?${q}` : ""}`);
  },
  createCategory: (data: { name: string; description?: string; icon?: string }) =>
    apiRequest<AdminCategory>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id: number, data: { name?: string; description?: string; icon?: string }) =>
    apiRequest<AdminCategory>(`/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: number) =>
    apiRequest<null>(`/admin/categories/${id}`, { method: "DELETE" }),
  toggleCategory: (id: number) =>
    apiRequest<AdminCategory>(`/admin/categories/${id}/toggle`, { method: "POST" }),

  coupons: (params?: TableQueryParams) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
      });
    }
    return apiRequest<PaginatedResponse<Coupon>>(`/admin/coupons${q.toString() ? `?${q}` : ""}`);
  },
  createCoupon: (data: {
    code: string;
    type: string;
    value: number;
    maxUses?: number;
    expiresAt?: string;
    scope?: CouponScope;
    courseIds?: number[];
    liveCourseIds?: number[];
  }) =>
    apiRequest<Coupon>("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCoupon: (
    id: number,
    data: {
      value?: number;
      maxUses?: number;
      expiresAt?: string;
      isActive?: boolean;
      scope?: CouponScope;
      courseIds?: number[];
      liveCourseIds?: number[];
    }
  ) =>
    apiRequest<Coupon>(`/admin/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCoupon: (id: number) =>
    apiRequest<null>(`/admin/coupons/${id}`, { method: "DELETE" }),
  toggleCoupon: (id: number) =>
    apiRequest<Coupon>(`/admin/coupons/${id}/toggle`, { method: "POST" }),

  couponPickerCourses: () =>
    apiRequest<PickerCourse[]>("/admin/coupons/picker/courses"),
  couponPickerLiveCourses: () =>
    apiRequest<PickerCourse[]>("/admin/coupons/picker/live-courses"),
};
