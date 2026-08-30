import { shopAdminApi } from "@/features/shop/api";
import { ShopProductFormClient } from "@/features/shop/ShopProductFormClient";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Product | Shop Admin" };

export default async function EditShopProductPage({ params }: Props) {
  const { id } = await params;
  const res = await shopAdminApi.getProduct(Number(id)).catch(() => null);
  if (!res?.data) return notFound();

  return <ShopProductFormClient mode="edit" product={res.data} />;
}
