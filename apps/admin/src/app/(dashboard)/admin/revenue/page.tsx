import { adminApi } from "@/features/admin/api";
import { RevenueClient } from "@/features/admin/RevenueClient";

export const metadata = { title: "Revenue" };

export default async function AdminRevenuePage() {
  const res = await adminApi.revenue().catch(() => null);
  const orders = res?.data ?? [];

  const total = orders.reduce((sum, o) => sum + Number(o.finalAmount), 0);
  const paid = orders.filter((o) => o.status === "paid");
  const paidTotal = paid.reduce((sum, o) => sum + Number(o.finalAmount), 0);
  const pending = orders.filter((o) => o.status === "pending");

  return (
    <RevenueClient
      orders={orders}
      stats={{
        totalOrders: orders.length,
        paidOrders: paid.length,
        pendingOrders: pending.length,
        totalRevenue: paidTotal,
      }}
    />
  );
}
