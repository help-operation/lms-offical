"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApiBrowser } from "@/features/auth/api/browser";

/**
 * Drop-in (renders nothing). On mount, rotates the auth token so a
 * GUEST promoted to STUDENT (after a successful enrollment/checkout)
 * gets the updated role immediately, then refreshes server components.
 */
export function SessionRefresher() {
  const router = useRouter();
  useEffect(() => {
    let done = false;
    authApiBrowser
      .refresh()
      .catch(() => {})
      .finally(() => {
        if (!done) router.refresh();
      });
    return () => {
      done = true;
    };
  }, [router]);
  return null;
}
