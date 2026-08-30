import Link from "next/link";
import { Plus } from "lucide-react";
import { adminApi } from "@/features/admin/api";
import { categoriesApi } from "@/features/courses/api";
import { AdminCoursesClient } from "@/features/admin/AdminCoursesClient";
import { InstructorProfileModal } from "@/features/instructor/InstructorProfileModal";

export const metadata = { title: "Courses" };

export default async function AdminCoursesPage() {
  const [res, categoriesRes] = await Promise.all([
    adminApi.courses({ per_page: 20 }).catch(() => null),
    categoriesApi.list().catch(() => null),
  ]);
  const categories = categoriesRes?.data ?? [];
  const initialData = res?.data ?? {
    data: [],
    pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{initialData.pagination.total} courses total</p>
        </div>
        <div className="flex items-center gap-3">
          <InstructorProfileModal />
          <Link
            href="/admin/courses/new"
            className="flex items-center gap-2 bg-indigo-600 dark:bg-brand hover:bg-indigo-700 dark:hover:bg-brand-hover text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Course
          </Link>
        </div>
      </div>
      <AdminCoursesClient initialData={initialData} categories={categories} />
    </div>
  );
}
