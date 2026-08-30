import { shopAdminApi } from "@/features/shop/api";
import { ShopOrdersPageClient } from "@/features/shop/ShopOrdersPageClient";

export const metadata = { title: "Shop Orders | Admin" };

export default async function AdminShopOrdersPage() {
  const res = await shopAdminApi.getOrders(1, 20).catch(() => null);
  const initialData = res?.data ?? { orders: [], total: 0, page: 1, limit: 20 };

  return <ShopOrdersPageClient initialData={initialData} />;
}
