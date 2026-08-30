import { publicApiRequest } from "@/lib/api-client";

export type MenuLink = {
  id: number;
  label: string;
  url: string;
  isExternal: boolean;
  openInNewTab: boolean;
};

export type MenusGrouped = {
  navbar: MenuLink[];
  navbar_more: MenuLink[];
  footer_company: MenuLink[];
  footer_others: MenuLink[];
};

const EMPTY: MenusGrouped = {
  navbar: [],
  navbar_more: [],
  footer_company: [],
  footer_others: [],
};

/**
 * Server-side fetch for the public header/footer menus. Cached for a few
 * minutes (admin edits propagate within ~1 minute) and uses the cookie-free
 * client so the cached output is shareable across all visitors.
 */
export async function getPublicMenus(): Promise<MenusGrouped> {
  const res = await publicApiRequest<MenusGrouped>("/menus", {
    next: { revalidate: 3600, tags: ["menus"] },
  }).catch(() => null);
  return res?.data ?? EMPTY;
}
