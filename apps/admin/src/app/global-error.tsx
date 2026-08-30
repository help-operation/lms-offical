"use client";

import "./globals.css";
import { RouteError } from "@/shared/components/RouteError";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <RouteError error={error} reset={reset} />
      </body>
    </html>
  );
}
