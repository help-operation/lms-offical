import { apiRequest } from "@/lib/api-client";

export type TrackingItemCategory = "core_tag" | "ecommerce_event" | "content_engagement" | "user_data" | "consent";

export interface TrackingItem {
  id: number;
  key: string;
  category: TrackingItemCategory;
  label: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTrackingItemInput {
  key: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export const trackingItemsApi = {
  list: () => apiRequest<TrackingItem[]>("/tracking-items/admin"),
  bulkUpdate: (items: UpdateTrackingItemInput[]) =>
    apiRequest<TrackingItem[]>("/tracking-items/bulk", {
      method: "PATCH",
      body: JSON.stringify({ items }),
    }),
};
