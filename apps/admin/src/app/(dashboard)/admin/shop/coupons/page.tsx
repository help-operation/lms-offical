import { shopAdminApi } from "@/features/shop/api";
import { ShopCouponsPageClient } from "@/features/shop/ShopCouponsPageClient";

export const metadata = { title: "Shop Coupons | Admin" };

export default async function AdminShopCouponsPage() {
  const res = await shopAdminApi.getCoupons().catch(() => null);
  const initialData = res?.data ?? { coupons: [], total: 0 };

  return <ShopCouponsPageClient initialData={initialData} />;
}
