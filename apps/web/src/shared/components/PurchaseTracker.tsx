"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/shared/utils/dataLayer";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

interface PurchaseTrackerProps {
  orderId: number;
  value: number;
  currency?: string;
  items?: { courseId: number; courseTitle: string }[];
}

/**
 * Fires the browser-side Meta Pixel Purchase event and the GTM dataLayer
 * `purchase` event on checkout success. `eventID` must match the
 * `order-${orderId}` convention the API's MetaCapiService uses for the
 * server-side event on the same order, so Meta dedupes the two instead of
 * double-counting the conversion.
 */
export function PurchaseTracker({ orderId, value, currency = "BDT", items }: PurchaseTrackerProps) {
  useEffect(() => {
    if (typeof window.fbq === "function") {
      window.fbq(
        "track",
        "Purchase",
        { value, currency },
        { eventID: `order-${orderId}` },
      );
    }

    trackPurchase({
      transactionId: String(orderId),
      value,
      currency,
      items: (items ?? []).map((i) => ({
        item_id: String(i.courseId),
        item_name: i.courseTitle,
        price: value / Math.max(1, (items ?? []).length),
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, value, currency]);

  return null;
}
