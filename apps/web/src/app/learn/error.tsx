"use client";

import { RouteError } from "@/shared/components/RouteError";

export default function LearnError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} title="Couldn't load this lesson" />;
}
