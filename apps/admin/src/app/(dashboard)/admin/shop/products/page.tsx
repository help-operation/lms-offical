import { shopAdminApi } from "@/features/shop/api";
import { ShopProductsPageClient } from "@/features/shop/ShopProductsPageClient";

export const metadata = { title: "Shop Products | Admin" };

export default async function AdminShopProductsPage() {
  const res = await shopAdminApi.getProducts({ limit: 20 }).catch(() => null);
  const initialData = res?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1 } };

  return <ShopProductsPageClient initialData={initialData} />;
}
