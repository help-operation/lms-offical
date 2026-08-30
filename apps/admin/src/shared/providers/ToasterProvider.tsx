"use client";

import { Toaster } from "@repo/ui/sonner";

/**
 * Client boundary for the Sonner toaster. The shared `@repo/ui/sonner` module
 * uses client-only hooks (useTheme), so it must be rendered from a Client
 * Component — the root layout is a Server Component.
 */
export function ToasterProvider() {
  return <Toaster position="top-center" richColors />;
}
