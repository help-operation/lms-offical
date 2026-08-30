export type Banner = {
  id: number;
  placement: "popup" | "top_strip";
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  openInNewTab: boolean;
  isActive: boolean;
  order: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BannersGrouped = {
  popup: Banner[];
  top_strip: Banner[];
};

export const PLACEMENTS = ["popup", "top_strip"] as const;
export type Placement = (typeof PLACEMENTS)[number];

export const PLACEMENT_META: Record<Placement, { label: string; description: string }> = {
  popup:     { label: "Popup modal",  description: "Centered image popup on page load (once per session)" },
  top_strip: { label: "Top strip",    description: "Full-width dismissible bar under the header" },
};
