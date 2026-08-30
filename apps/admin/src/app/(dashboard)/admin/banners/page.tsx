import { bannersAdminApi } from "@/features/banners/api";
import { BannersManager } from "@/features/banners/BannersManager";
import type { BannersGrouped } from "@/features/banners/types";

export const metadata = { title: "Banners" };

const EMPTY: BannersGrouped = { popup: [], top_strip: [] };

export default async function BannersPage() {
  const res = await bannersAdminApi.getAll().catch(() => null);
  const initial: BannersGrouped = res?.data ?? EMPTY;
  return <BannersManager initial={initial} />;
}
