import { studentsApi } from "@/features/students/api";
import { StudentsClient } from "@/features/students/StudentsClient";
import { GuestsClient } from "@/features/students/GuestsClient";

export const metadata = { title: "Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "guests" ? "guests" : "students";

  if (activeTab === "guests") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Manage students and guests</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
            <a href="/admin/students?tab=students" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Students
            </a>
            <a href="/admin/students?tab=guests" className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm transition-colors">
              Guests
            </a>
          </div>
        </div>
        <GuestsClient />
      </div>
    );
  }

  const [listRes, statsRes] = await Promise.all([
    studentsApi.list({ per_page: 20 }).catch(() => null),
    studentsApi.stats().catch(() => null),
  ]);

  const initialData = listRes?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };
  const initialStats = statsRes?.data ?? undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Manage students and guests</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
          <a href="/admin/students?tab=students" className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm transition-colors">
            Students
          </a>
          <a href="/admin/students?tab=guests" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Guests
          </a>
        </div>
      </div>
      <StudentsClient initialData={initialData} initialStats={initialStats} />
    </div>
  );
}
