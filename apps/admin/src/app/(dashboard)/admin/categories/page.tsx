import { adminApi } from "@/features/admin/api";
import { CategoriesClient } from "@/features/admin/CategoriesClient";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const res = await adminApi.categories({ per_page: 20 }).catch(() => null);
  const initialData = res?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };

  return (
    <div className="space-y-6">
      <CategoriesClient initialData={initialData} />
    </div>
  );
}
