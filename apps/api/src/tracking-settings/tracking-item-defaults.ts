import type { TrackingItemCategory, TrackingItemConfig, TrackingItemKey } from '@repo/validators';
import { TRACKING_ITEM_KEYS } from '@repo/validators';

export interface TrackingItemDefault {
  key: TrackingItemKey;
  category: TrackingItemCategory;
  label: string;
  enabled: boolean;
  config: TrackingItemConfig;
}

/**
 * Fresh-install defaults for every known registry key. `scripts/backfill-tracking-items.ts`
 * starts from this list and overrides `enabled`/`config` using the legacy `tracking_settings`
 * row where one exists; `TrackingItemsService.ensureSeeded` uses it as-is for a brand new
 * environment with no legacy data at all.
 */
export const TRACKING_ITEM_DEFAULTS: TrackingItemDefault[] = [
  { key: 'gtm', category: 'core_tag', label: 'Google Tag Manager', enabled: false, config: {} },
  { key: 'ga4', category: 'core_tag', label: 'Google Analytics 4', enabled: false, config: {} },
  { key: 'fb_pixel', category: 'core_tag', label: 'Facebook Pixel', enabled: false, config: {} },
  { key: 'clarity', category: 'core_tag', label: 'Microsoft Clarity', enabled: false, config: {} },
  { key: 'gads', category: 'core_tag', label: 'Google Ads', enabled: false, config: {} },

  { key: 'event_page_view', category: 'ecommerce_event', label: 'Page View', enabled: true, config: {} },
  { key: 'event_view_item', category: 'ecommerce_event', label: 'View Item', enabled: true, config: {} },
  { key: 'event_view_item_list', category: 'ecommerce_event', label: 'View Item List', enabled: true, config: {} },
  { key: 'event_select_item', category: 'ecommerce_event', label: 'Select Item', enabled: true, config: {} },
  { key: 'event_add_to_cart', category: 'ecommerce_event', label: 'Add to Cart', enabled: true, config: {} },
  { key: 'event_remove_from_cart', category: 'ecommerce_event', label: 'Remove from Cart', enabled: true, config: {} },
  { key: 'event_begin_checkout', category: 'ecommerce_event', label: 'Begin Checkout', enabled: true, config: {} },
  { key: 'event_purchase', category: 'ecommerce_event', label: 'Purchase', enabled: true, config: {} },
  { key: 'event_sign_up', category: 'ecommerce_event', label: 'Sign Up', enabled: true, config: {} },
  { key: 'event_login', category: 'ecommerce_event', label: 'Login', enabled: true, config: {} },
  { key: 'event_view_cart', category: 'ecommerce_event', label: 'View Cart', enabled: false, config: {} },
  { key: 'event_add_payment_info', category: 'ecommerce_event', label: 'Add Payment Info', enabled: false, config: {} },
  { key: 'event_add_shipping_info', category: 'ecommerce_event', label: 'Add Shipping Info', enabled: false, config: {} },

  { key: 'content_context', category: 'content_engagement', label: 'Page/Content Context', enabled: false, config: {} },
  { key: 'user_context', category: 'user_data', label: 'Customer Context (hashed)', enabled: false, config: {} },
  // Unlike user_context above, this pushes PLAIN (unhashed) email/phone/name — Google's
  // own Enhanced Conversions flow expects that and hashes it client-side in its tag.
  { key: 'enhanced_conversions', category: 'user_data', label: 'Google Enhanced Conversions', enabled: false, config: {} },
  { key: 'engagement_search', category: 'content_engagement', label: 'Site Search Tracking', enabled: false, config: {} },
  { key: 'engagement_scroll', category: 'content_engagement', label: 'Scroll Depth Tracking', enabled: false, config: {} },
  { key: 'engagement_video', category: 'content_engagement', label: 'Video Engagement Tracking', enabled: false, config: {} },

  { key: 'consent_mode', category: 'consent', label: 'Google Consent Mode v2', enabled: true, config: {} },
];

if (TRACKING_ITEM_DEFAULTS.length !== TRACKING_ITEM_KEYS.length) {
  throw new Error('TRACKING_ITEM_DEFAULTS is out of sync with TRACKING_ITEM_KEYS');
}
