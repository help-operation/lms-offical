import { shopApi, type ShopProduct } from "@/features/shop/api";
import { ShopPageClient } from "@/features/shop/components/ShopPageClient";

export const metadata = {
  title: "Shop",
  description: "Books, tools, and resources to accelerate your learning journey.",
};

export default async function ShopPage() {
  let products: ShopProduct[] = [];
  try {
    const res = await shopApi.getProducts();
    products = res.data ?? [];
  } catch {
    products = [];
  }

  return <ShopPageClient products={products} />;
}
