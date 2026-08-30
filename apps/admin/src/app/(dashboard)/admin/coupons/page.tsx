import { adminApi } from "@/features/admin/api";
import { CouponsClient } from "@/features/admin/CouponsClient";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const res = await adminApi.coupons({ per_page: 20 }).catch(() => null);
  const initialData = res?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };

  return (
    <div className="space-y-6">
      <CouponsClient initialData={initialData} />
    </div>
  );
}
