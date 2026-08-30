'use client';

import { useEffect, useRef } from 'react';
import { pushApi } from '@/features/notifications/api/push';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Registers the service worker and subscribes to push notifications when the
 * user is logged in. Must be rendered inside a client component.
 * Safe to call multiple times — deduplicates via subscription check.
 */
export function usePushNotifications(enabled = true) {
  const subscribed = useRef(false);

  useEffect(() => {
    if (!enabled || subscribed.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    let active = true;

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          subscribed.current = true;
          return;
        }

        const { data } = await pushApi.getVapidKey();
        if (!data?.key || !active) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.key),
        });

        const json = sub.toJSON();
        const keys = json.keys as { p256dh: string; auth: string };

        await pushApi.subscribe({
          endpoint: json.endpoint!,
          p256dh:   keys.p256dh,
          auth:     keys.auth,
        });

        subscribed.current = true;
      } catch {
        // Push permission denied or VAPID not configured — silently skip
      }
    }

    register();
    return () => { active = false; };
  }, [enabled]);
}
