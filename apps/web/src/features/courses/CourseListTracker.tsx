"use client";

import { useEffect } from "react";
import { trackViewItemList, type DataLayerItem } from "@/shared/utils/dataLayer";

interface Props {
  items: DataLayerItem[];
  listName: string;
}

export function CourseListTracker({ items, listName }: Props) {
  useEffect(() => {
    if (items.length === 0) return;
    trackViewItemList(items, listName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listName, items.length]);

  return null;
}
