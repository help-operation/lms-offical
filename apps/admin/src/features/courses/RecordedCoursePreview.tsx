"use client";

import { ElevateCoursePreview } from "./ElevateCoursePreview";
import { MasteryCoursePreview } from "./MasteryCoursePreview";

export function RecordedCoursePreview({ course }: { course: any }) {
  if (course.template === "2") {
    return <MasteryCoursePreview course={course} />;
  }
  return <ElevateCoursePreview course={course} />;
}
