"use client";

import { RouteError } from "@/shared/components/RouteError";

export default function AuthError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} />;
}
