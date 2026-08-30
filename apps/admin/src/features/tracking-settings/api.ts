import { apiRequest } from "@/lib/api-client";

export interface TrackingSettings {
  id: number;
  gtmId: string | null;
  ga4Id: string | null;
  fbPixelId: string | null;
  fbCapiAccessToken: string | null;
  fbCapiTestEventCode: string | null;
  clarityId: string | null;
  gadsId: string | null;
  gscVerification: string | null;
  eventPageView: boolean;
  eventViewItem: boolean;
  eventViewItemList: boolean;
  eventSelectItem: boolean;
  eventAddToCart: boolean;
  eventRemoveFromCart: boolean;
  eventBeginCheckout: boolean;
  eventPurchase: boolean;
  eventSignUp: boolean;
  eventLogin: boolean;
  updatedAt: string;
}

export type UpdateTrackingSettingsInput = Partial<Omit<TrackingSettings, "id" | "updatedAt">>;

export const trackingSettingsApi = {
  get: () => apiRequest<TrackingSettings>("/tracking-settings/admin"),
  update: (data: UpdateTrackingSettingsInput) =>
    apiRequest<TrackingSettings>("/tracking-settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
