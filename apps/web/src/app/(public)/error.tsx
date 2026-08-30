"use client";

import { RouteError } from "@/shared/components/RouteError";

export default function PublicError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} />;
}
