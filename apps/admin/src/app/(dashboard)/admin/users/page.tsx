import { adminApi } from "@/features/admin/api";
import { UsersClient } from "@/features/admin/UsersClient";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const res = await adminApi.users({ per_page: 20 }).catch(() => null);
  const initialData = res?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };

  return <UsersClient initialData={initialData} />;
}
