"use client";

import { useMemo, useState, useTransition } from "react";
import { X, FloppyDisk, SpinnerGap, CheckCircle } from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { bulkUpdateTrackingItemsAction } from "./registry-actions";
import type { TrackingItem, TrackingItemCategory, UpdateTrackingItemInput } from "./registry-api";

/** Everything except core_tag — those live inline on the main page, not in this modal. */
const CATEGORY_ORDER: TrackingItemCategory[] = ["ecommerce_event", "content_engagement", "user_data", "consent"];

const CATEGORY_LABELS: Record<TrackingItemCategory, string> = {
  core_tag: "Core Tags",
  ecommerce_event: "Ecommerce Events",
  content_engagement: "Content & Engagement",
  user_data: "User Data",
  consent: "Consent",
};

const HINTS: Record<string, string> = {
  event_page_view: "Fires on every client-side navigation — without this, GTM only sees the very first page of a visit.",
  event_view_item: "Fires when a student opens a course or live-class landing page.",
  event_view_item_list: "Fires once when the /courses listing page loads.",
  event_select_item: "Fires when a student clicks a course card in a listing.",
  event_add_to_cart: "Fires when a student clicks Enroll, before checkout starts.",
  event_remove_from_cart: "Fires when a student removes a course from their cart.",
  event_begin_checkout: "Fires when the checkout page loads with items in it.",
  event_purchase: "Fires once payment succeeds — the most important conversion event.",
  event_sign_up: "Fires when a new account is created.",
  event_login: "Fires on successful login.",
  event_view_cart: "Fires when a student opens the cart page with items in it.",
  event_add_payment_info: "Fires right before redirecting to the payment gateway.",
  event_add_shipping_info: "For flows with a shipping step — not used by digital courses today.",
  content_context: "Pushes page type, category, and author into the dataLayer on every page view.",
  user_context: "Pushes a hashed customer profile (login state, role, order history) — never raw email or phone.",
  enhanced_conversions: "For Google Ads/GA4 conversion matching. Pushes PLAIN email, phone, and name (Google's tag hashes it) on every page — unlike Customer Context above, this is not pre-hashed. Only enable if you're using Google Ads.",
  engagement_search: "Fires when a student searches the course catalog, with the query and result count.",
  engagement_scroll: "Fires at 25/50/75/90% scroll depth on course and blog pages.",
  engagement_video: "Fires start/progress/pause/complete for native lesson preview video players.",
  consent_mode: "Google Consent Mode v2 — gates every tag above on visitor consent. Recommended to leave on.",
};

interface Props {
  initial: TrackingItem[];
  onClose: () => void;
  onSaved: (updated: TrackingItem[]) => void;
}

export function RegistryEventsModal({ initial, onClose, onSaved }: Props) {
  const items = useMemo(() => initial.filter((i) => i.category !== "core_tag"), [initial]);
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.key, i.enabled])),
  );
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<TrackingItemCategory, TrackingItem[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const item of items) map.get(item.category)?.push(item);
    return map;
  }, [items]);

  function toggle(key: string, original: boolean) {
    setValues((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setDirty(Object.entries(next).some(([k, v]) => v !== (items.find((i) => i.key === k)?.enabled ?? v)));
      return next;
    });
  }

  function handleClose() {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    onClose();
  }

  function handleSave() {
    const updates: UpdateTrackingItemInput[] = items
      .filter((i) => values[i.key] !== i.enabled)
      .map((i) => ({ key: i.key, enabled: values[i.key] }));
    if (updates.length === 0) {
      onClose();
      return;
    }

    startTransition(async () => {
      const res = await bulkUpdateTrackingItemsAction(updates);
      if (res.success) {
        const merged = initial.map((i) => res.data.find((u) => u.key === i.key) ?? i);
        onSaved(merged);
        toast.success("Event settings saved");
        onClose();
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  return (
    <div
      className="modal-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 backdrop-blur-sm dark:bg-black/60 sm:p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel-in flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-2xl sm:rounded-lg"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-bold text-gray-900 dark:text-white">dataLayer events</h2>
              {dirty && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              Choose which events and engagement signals are pushed into GTM's dataLayer.
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {CATEGORY_ORDER.map((category) => {
              const categoryItems = grouped.get(category) ?? [];
              if (categoryItems.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="space-y-3">
                    {categoryItems.map((item, idx) => {
                      const enabled = values[item.key];
                      return (
                        <div
                          key={item.key}
                          style={{ animationDelay: `${Math.min(idx, 8) * 25}ms` }}
                          className="list-item-in flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-800/50"
                        >
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`${enabled ? "Disable" : "Enable"} ${item.label}`}
                            onClick={() => toggle(item.key, item.enabled)}
                            disabled={isPending}
                            className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 ${
                              enabled ? "bg-brand-600" : "bg-gray-300 dark:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                enabled ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</p>
                              <code className="rounded bg-gray-200/70 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 dark:bg-slate-700 dark:text-gray-400">
                                {item.key}
                              </code>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{HINTS[item.key] ?? ""}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
