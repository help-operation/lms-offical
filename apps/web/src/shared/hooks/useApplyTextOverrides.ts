"use client";

import { useEffect, useRef } from "react";

/**
 * Applies text overrides from styleOverrides to elements within a container.
 * The selectors come from the admin preview's InlineStyleEditor.
 * This hook re-applies on every render when overrides change.
 */
export function useApplyTextOverrides(
  containerRef: React.RefObject<HTMLElement | null>,
  textOverrides: Record<string, string> | undefined,
) {
  const originalTexts = useRef<Map<Element, string>>(new Map());

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !textOverrides || Object.keys(textOverrides).length === 0) return;

    // Restore any previously overridden texts first
    originalTexts.current.forEach((original, el) => {
      (el as HTMLElement).textContent = original;
    });
    originalTexts.current.clear();

    // Apply new text overrides
    for (const [selector, text] of Object.entries(textOverrides)) {
      try {
        // Try :scope > selector first (direct children), then full selector
        let el = root.querySelector(`:scope > ${selector}`);
        if (!el) el = root.querySelector(selector);
        if (el) {
          // Store original text before replacing
          if (!originalTexts.current.has(el)) {
            originalTexts.current.set(el, el.textContent ?? "");
          }
          el.textContent = text;
        }
      } catch {
        // Invalid selector, skip
      }
    }

    return () => {
      // Cleanup: restore original texts
      originalTexts.current.forEach((original, el) => {
        (el as HTMLElement).textContent = original;
      });
      originalTexts.current.clear();
    };
  }, [containerRef, textOverrides]);
}
