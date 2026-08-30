"use client";

import { useEffect } from "react";
import { trackViewItem } from "@/shared/utils/dataLayer";

interface Props {
  courseId: number;
  title: string;
  price: number;
}

export function CourseViewTracker({ courseId, title, price }: Props) {
  useEffect(() => {
    trackViewItem({ item_id: String(courseId), item_name: title, price });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return null;
}
