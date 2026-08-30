import { publicApiRequest } from "@/lib/api-client";

export type Banner = {
  id: number;
  placement: "popup" | "top_strip";
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  openInNewTab: boolean;
};

export type BannersGrouped = {
  popup: Banner[];
  top_strip: Banner[];
};

const EMPTY: BannersGrouped = { popup: [], top_strip: [] };

/**
 * Server-side fetch of the active, in-schedule banners. Cached for a few
 * minutes and cookie-free so the result is shareable across visitors.
 */
export async function getPublicBanners(): Promise<BannersGrouped> {
  const res = await publicApiRequest<BannersGrouped>("/banners", {
    next: { revalidate: 3600, tags: ["banners"] },
  }).catch(() => null);
  return res?.data ?? EMPTY;
}
