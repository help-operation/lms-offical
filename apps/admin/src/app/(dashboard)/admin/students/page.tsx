import { studentsApi } from "@/features/students/api";
import { StudentsClient } from "@/features/students/StudentsClient";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const [listRes, statsRes] = await Promise.all([
    studentsApi.list({ per_page: 20 }).catch(() => null),
    studentsApi.stats().catch(() => null),
  ]);

  const initialData = listRes?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };
  const initialStats = statsRes?.data ?? undefined;

  return <StudentsClient initialData={initialData} initialStats={initialStats} />;
}
