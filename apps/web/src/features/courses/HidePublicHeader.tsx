"use client";

import { useEffect } from "react";

/**
 * When mounted, adds `data-mastery-page="true"` to <body>.
 * This is used by global CSS to hide the main <PublicHeader>.
 * Automatically cleaned up on unmount.
 */
export function HidePublicHeader() {
  useEffect(() => {
    document.body.setAttribute("data-mastery-page", "true");
    return () => {
      document.body.removeAttribute("data-mastery-page");
    };
  }, []);

  return null;
}
