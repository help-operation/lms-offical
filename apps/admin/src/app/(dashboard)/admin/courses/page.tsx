import { adminApi } from "@/features/admin/api";
import { categoriesApi } from "@/features/courses/api";
import { AdminCoursesClient } from "@/features/admin/AdminCoursesClient";

export const metadata = { title: "Courses" };

export default async function AdminCoursesPage() {
  const [res, categoriesRes, statsRes] = await Promise.all([
    adminApi.courses({ per_page: 20 }).catch(() => null),
    categoriesApi.list().catch(() => null),
    adminApi.stats().catch(() => null),
  ]);
  const categories = categoriesRes?.data ?? [];
  const initialData = res?.data ?? {
    data: [],
    pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 },
  };
  const stats = statsRes?.data ?? null;

  return (
    <div className="space-y-6">
      <AdminCoursesClient initialData={initialData} categories={categories} stats={stats} />
    </div>
  );
}
