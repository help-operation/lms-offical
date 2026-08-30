"use client";

import { useEffect, useRef } from "react";

type LessonStatus = { status: string | null; duration?: number } | null;

/**
 * Polls Bunny encoding status for lessons that are still "processing" and calls
 * onResolved once each one becomes ready/failed — so a transcoding video flips
 * to Ready on the curriculum row without the user reloading the page.
 *
 * Bunny finishes uploading first, then transcodes; this bridges that gap (the
 * webhook may be unreachable in local dev, and a soft refresh won't reseed the
 * builder's local state).
 */
export function useBunnyStatusPolling(
  pendingLessonIds: number[],
  fetchStatus: (lessonId: number) => Promise<LessonStatus>,
  onResolved: (lessonId: number, result: { status: "ready" | "failed"; duration?: number }) => void,
  intervalMs = 8000,
) {
  // Stable key so the effect only re-runs when the *set* of pending ids changes.
  const key = [...pendingLessonIds].sort((a, b) => a - b).join(",");

  const fetchRef = useRef(fetchStatus);
  fetchRef.current = fetchStatus;
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  useEffect(() => {
    if (!key) return;
    const ids = key.split(",").map(Number);
    let active = true;

    const tick = async () => {
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetchRef.current(id).catch(() => null);
          if (!active || !res) return;
          if (res.status === "ready" || res.status === "failed") {
            onResolvedRef.current(id, { status: res.status, duration: res.duration });
          }
        }),
      );
    };

    const interval = setInterval(tick, intervalMs);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [key, intervalMs]);
}
