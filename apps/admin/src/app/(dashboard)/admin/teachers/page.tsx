import { teachersApi } from "@/features/teachers/api";
import { TeachersClient } from "@/features/teachers/TeachersClient";

export const metadata = { title: "Teachers" };

export default async function TeachersPage() {
  const res = await teachersApi.list({ per_page: 20 }).catch(() => null);
  const initialData = res?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };

  return <TeachersClient initialData={initialData} />;
}
