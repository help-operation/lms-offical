import { shopApi, type ShopProduct } from "@/features/shop/api";
import { notFound } from "next/navigation";
import { ShopProductDetailClient } from "@/features/shop/components/ShopProductDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const res = await shopApi.getProduct(slug);
    const product = res.data;
    if (!product) return {};
    return {
      title: `${product.metaTitle ?? product.title} | Shop`,
      description: product.metaDescription ?? product.shortDescription ?? undefined,
    };
  } catch {
    return {};
  }
}

export default async function ShopProductPage({ params }: Props) {
  const { slug } = await params;
  let product: ShopProduct;
  try {
    const res = await shopApi.getProduct(slug);
    if (!res.data) return notFound();
    product = res.data;
  } catch {
    return notFound();
  }

  return <ShopProductDetailClient product={product} />;
}
