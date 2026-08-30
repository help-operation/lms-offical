"use client";

import { useEffect } from "react";
import { trackSearch } from "@/shared/utils/dataLayer";

interface Props {
  query: string;
  resultCount: number;
}

/** Fires once per search-results page load when a `?search=` query is present. */
export function CourseSearchTracker({ query, resultCount }: Props) {
  useEffect(() => {
    if (!query.trim()) return;
    trackSearch(query, resultCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, resultCount]);

  return null;
}
