// packages/validators/src/tracking.schema.ts
import { z } from "zod";

/**
 * Public — fired by the pageview beacon on every navigation in the web app.
 * source/device/country/city are NOT accepted from the client — the API
 * derives them server-side from the Referer/User-Agent headers and IP.
 */
export const CreateVisitSchema = z.object({
  path:      z.string().min(1).max(500),
  referrer:  z.string().max(1000).optional().nullable(),
  sessionId: z.string().min(1).max(64),
  userId:    z.number().int().positive().optional().nullable(),
});
export type CreateVisitInput = z.infer<typeof CreateVisitSchema>;

/**
 * Public — fired via navigator.sendBeacon on page unload to record how long
 * the visitor stayed on the previous page.
 */
export const UpdateVisitDurationSchema = z.object({
  seconds: z.coerce.number().int().min(0).max(86_400),
});
export type UpdateVisitDurationInput = z.infer<typeof UpdateVisitDurationSchema>;

// ─── Tracking item registry ─────────────────────────────────────────────────
// Data-driven capability list (replaces the old fixed event*/*Id columns) so
// admins can toggle individual tags/events/engagement signals from Settings.

export const TrackingItemCategorySchema = z.enum([
  'core_tag',
  'ecommerce_event',
  'content_engagement',
  'user_data',
  'consent',
]);
export type TrackingItemCategory = z.infer<typeof TrackingItemCategorySchema>;

/** Every known registry key. Keep in sync with apps/api's seed list. */
export const TRACKING_ITEM_KEYS = [
  'gtm', 'ga4', 'fb_pixel', 'clarity', 'gads',
  'event_page_view', 'event_view_item', 'event_view_item_list', 'event_select_item',
  'event_add_to_cart', 'event_remove_from_cart', 'event_begin_checkout', 'event_purchase',
  'event_sign_up', 'event_login', 'event_view_cart', 'event_add_payment_info', 'event_add_shipping_info',
  'content_context', 'user_context', 'enhanced_conversions',
  'engagement_search', 'engagement_scroll', 'engagement_video',
  'consent_mode',
] as const;
export type TrackingItemKey = (typeof TRACKING_ITEM_KEYS)[number];

/** Sub-fields inside `config` that must never leave the server in the public projection. */
export const TRACKING_ITEM_SECRET_CONFIG_FIELDS = ['capiAccessToken', 'capiTestEventCode'] as const;

/** Loose id/config shape — most items carry a single vendor id string, some carry extra fields. */
export const TrackingItemConfigSchema = z
  .object({
    id: z.string().max(100).optional(),
    capiAccessToken: z.string().max(500).optional(),
    capiTestEventCode: z.string().max(50).optional(),
  })
  .partial()
  .catchall(z.unknown());
export type TrackingItemConfig = z.infer<typeof TrackingItemConfigSchema>;

export const UpdateTrackingItemSchema = z.object({
  key:     z.enum(TRACKING_ITEM_KEYS),
  enabled: z.boolean().optional(),
  config:  TrackingItemConfigSchema.optional(),
});
export type UpdateTrackingItemInput = z.infer<typeof UpdateTrackingItemSchema>;

export const BulkUpdateTrackingItemsSchema = z.object({
  items: z.array(UpdateTrackingItemSchema).min(1).max(TRACKING_ITEM_KEYS.length),
});
export type BulkUpdateTrackingItemsInput = z.infer<typeof BulkUpdateTrackingItemsSchema>;
