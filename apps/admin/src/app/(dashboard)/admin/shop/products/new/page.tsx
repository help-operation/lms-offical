import { ShopProductFormClient } from "@/features/shop/ShopProductFormClient";

export const metadata = { title: "New Product | Shop Admin" };

export default function NewShopProductPage() {
  return <ShopProductFormClient mode="create" />;
}
