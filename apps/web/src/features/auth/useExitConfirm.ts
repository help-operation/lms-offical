"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PendingAction = "modal-close" | "navigate" | "back" | null;

/**
 * Shows a custom exit-confirmation dialog before the user leaves the login/
 * register screen — via modal close, an in-app link click, or the browser
 * back button. Real tab-close/refresh can only trigger the browser's own
 * native "Leave site?" prompt (beforeunload can't render custom UI in any
 * modern browser), so that case is handled separately and can't match the
 * mockup's styled dialog.
 */
export function useExitConfirm({
  mode,
  onLeave,
}: {
  mode: "modal" | "page";
  onLeave: () => void;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const pendingActionRef = useRef<PendingAction>(null);
  const pendingHrefRef = useRef<string | null>(null);
  const router = useRouter();

  const requestLeave = useCallback(() => {
    pendingActionRef.current = "modal-close";
    setShowDialog(true);
  }, []);

  const confirm = useCallback(() => {
    setShowDialog(false);
    const action = pendingActionRef.current;
    const href = pendingHrefRef.current;
    pendingActionRef.current = null;
    pendingHrefRef.current = null;

    if (action === "navigate" && href) {
      router.push(href);
    } else if (action === "back") {
      window.history.back();
    } else {
      onLeave();
    }
  }, [onLeave, router]);

  const cancel = useCallback(() => {
    setShowDialog(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    pendingHrefRef.current = null;

    // Re-arm the back-button guard so the next back press is interceptable too.
    if (action === "back") {
      window.history.pushState(null, "", window.location.href);
    }
  }, []);

  // Intercept in-app link clicks (page mode only).
  useEffect(() => {
    if (mode !== "page") return;

    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;

      e.preventDefault();
      pendingActionRef.current = "navigate";
      pendingHrefRef.current = href;
      setShowDialog(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [mode]);

  // Intercept the browser back button (page mode only).
  useEffect(() => {
    if (mode !== "page") return;

    window.history.pushState(null, "", window.location.href);
    function handlePopState() {
      pendingActionRef.current = "back";
      setShowDialog(true);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mode]);

  // Best-effort native prompt for real tab close/refresh.
  useEffect(() => {
    if (mode !== "page") return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [mode]);

  return { showDialog, requestLeave, confirm, cancel };
}
