declare global {
  interface Window {
    dataLayer?: unknown[];
    /** Tracking-item registry, inlined into <head> by app/layout.tsx — keyed by
     *  registry key (e.g. "event_view_item"), not the raw GA4 event name. */
    __trackingRegistry?: Record<string, { enabled: boolean; config: Record<string, unknown> }>;
  }
}

export interface DataLayerItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
}

/** Defaults to enabled when the registry hasn't loaded yet (matches the always-on behaviour before this setting existed). */
function isEventEnabled(event: string): boolean {
  if (typeof window === "undefined") return false;
  return window.__trackingRegistry?.[`event_${event}`]?.enabled ?? true;
}

/**
 * Pushes a GA4/GTM Enhanced-Ecommerce style event. Resets `ecommerce` first
 * per Google's guidance — otherwise GTM's variable reader can merge stale
 * nested objects from a previous push instead of reading the new one.
 */
function pushEcommerceEvent(event: string, ecommerce: Record<string, unknown>, topLevel: Record<string, unknown> = {}) {
  if (!isEventEnabled(event)) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ...topLevel, ecommerce });
}

function pushEvent(event: string, payload: Record<string, unknown> = {}) {
  if (!isEventEnabled(event)) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}

export function trackPageView(path: string) {
  pushEvent("page_view", { page_path: path });
}

export function trackViewItem(item: DataLayerItem, currency = "BDT") {
  pushEcommerceEvent("view_item", { currency, value: item.price, items: [item] });
}

export function trackViewItemList(items: DataLayerItem[], listName?: string, currency = "BDT") {
  pushEcommerceEvent("view_item_list", {
    currency,
    ...(listName ? { item_list_name: listName } : {}),
    items,
  });
}

export function trackSelectItem(item: DataLayerItem, listName?: string, currency = "BDT") {
  pushEcommerceEvent("select_item", {
    currency,
    ...(listName ? { item_list_name: listName } : {}),
    items: [item],
  });
}

export function trackAddToCart(item: DataLayerItem, currency = "BDT") {
  const value = item.price * (item.quantity ?? 1);
  pushEcommerceEvent("add_to_cart", { currency, value, items: [item] });
}

export function trackRemoveFromCart(item: DataLayerItem, currency = "BDT") {
  const value = item.price * (item.quantity ?? 1);
  pushEcommerceEvent("remove_from_cart", { currency, value, items: [item] });
}

export function trackBeginCheckout(items: DataLayerItem[], value: number, currency = "BDT") {
  pushEcommerceEvent("begin_checkout", { currency, value, items });
}

export function trackViewCart(items: DataLayerItem[], currency = "BDT") {
  const value = items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);
  pushEcommerceEvent("view_cart", { currency, value, items });
}

export function trackAddPaymentInfo(
  items: DataLayerItem[],
  value: number,
  paymentMethod: string,
  currency = "BDT",
) {
  pushEcommerceEvent("add_payment_info", { currency, value, payment_type: paymentMethod, items });
}

export function trackAddShippingInfo(
  items: DataLayerItem[],
  value: number,
  shippingTier?: string,
  currency = "BDT",
) {
  pushEcommerceEvent("add_shipping_info", {
    currency,
    value,
    ...(shippingTier ? { shipping_tier: shippingTier } : {}),
    items,
  });
}

export function trackPurchase(input: {
  transactionId: string;
  value: number;
  items: DataLayerItem[];
  currency?: string;
  coupon?: string;
}) {
  pushEcommerceEvent(
    "purchase",
    {
      transaction_id: input.transactionId,
      value: input.value,
      currency: input.currency ?? "BDT",
      ...(input.coupon ? { coupon: input.coupon } : {}),
      items: input.items,
    },
    // Top-level order_id — Google Enhanced Conversions expects this alongside
    // ecommerce.transaction_id (which already carries the same value); not PII,
    // so pushed unconditionally rather than gated behind the enhanced_conversions toggle.
    { order_id: input.transactionId },
  );
}

export function trackSignUp(method = "email") {
  pushEvent("sign_up", { method });
}

export function trackLogin(method = "email") {
  pushEvent("login", { method });
}

// ─── Engagement tracking ──────────────────────────────────────────────────────
// Registry keys here are NOT event_*-prefixed (they gate a signal, not a GA4
// ecommerce event) and default OFF (opt-in), unlike the always-on-by-default
// ecommerce events above.

function isEngagementEnabled(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.__trackingRegistry?.[key]?.enabled ?? false;
}

export function trackSearch(query: string, resultCount: number) {
  if (!isEngagementEnabled("engagement_search")) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "search", search_term: query, result_count: resultCount });
}

export function trackScrollDepth(threshold: 25 | 50 | 75 | 90) {
  if (!isEngagementEnabled("engagement_scroll")) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "scroll_depth", percent_scrolled: threshold });
}

export type VideoEngagementAction = "start" | "progress" | "pause" | "complete";

export function trackVideoEngagement(
  videoId: string,
  action: VideoEngagementAction,
  progressPercent?: 25 | 50 | 75 | 100,
) {
  if (!isEngagementEnabled("engagement_video")) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "video_engagement",
    video_id: videoId,
    video_action: action,
    ...(progressPercent !== undefined ? { video_percent: progressPercent } : {}),
  });
}
