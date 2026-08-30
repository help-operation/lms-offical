"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `callback` on a fixed interval while `enabled`. The callback ref is
 * refreshed every render so it always sees the latest closed-over state
 * without tearing down and restarting the interval (which would reset the
 * countdown to `intervalMs` on every keystroke/scroll).
 */
export function useAutoplay(callback: () => void, intervalMs: number, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}
