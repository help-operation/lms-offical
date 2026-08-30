import { studentsApi } from "@/features/students/api";
import { StudentsClient } from "@/features/students/StudentsClient";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const res = await studentsApi.list({ per_page: 20 }).catch(() => null);
  const initialData = res?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };

  return <StudentsClient initialData={initialData} />;
}
