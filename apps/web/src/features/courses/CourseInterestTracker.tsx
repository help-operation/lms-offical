"use client";

import { useEffect } from "react";
import { trackCourseInterestAction, trackLiveCourseInterestAction } from "@/features/courses/actions/courses.actions";

interface Props {
  courseId?: number;
  liveCourseId?: number;
}

export function CourseInterestTracker({ courseId, liveCourseId }: Props) {
  useEffect(() => {
    if (courseId) trackCourseInterestAction(courseId);
    else if (liveCourseId) trackLiveCourseInterestAction(liveCourseId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
