import { adminApi } from "@/features/admin/api";
import { RevenueClient } from "@/features/admin/RevenueClient";

export const metadata = { title: "Revenue" };

export default async function AdminRevenuePage() {
  const [revenueRes, liveRes] = await Promise.all([
    adminApi.revenue().catch(() => null),
    adminApi.liveRevenue().catch(() => null),
  ]);

  const orders = revenueRes?.data ?? [];
  const liveOrders = liveRes?.data ?? [];

  const paid = orders.filter((o) => o.status === "paid");
  const paidTotal = paid.reduce((sum, o) => sum + Number(o.finalAmount), 0);
  const pending = orders.filter((o) => o.status === "pending");

  const livePaid = liveOrders.filter((o) => o.status === "paid");
  const livePaidTotal = livePaid.reduce((sum, o) => sum + Number(o.finalAmount), 0);

  return (
    <RevenueClient
      orders={orders}
      liveOrders={liveOrders}
      stats={{
        totalOrders: orders.length,
        paidOrders: paid.length,
        pendingOrders: pending.length,
        totalRevenue: paidTotal,
      }}
      liveStats={{
        totalOrders: liveOrders.length,
        paidOrders: livePaid.length,
        pendingOrders: liveOrders.filter((o) => o.status === "pending").length,
        totalRevenue: livePaidTotal,
      }}
    />
  );
}
