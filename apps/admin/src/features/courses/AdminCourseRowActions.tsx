import Link from "next/link";
import type { Category } from "@/features/courses/api";

interface AdminCourseRowActionsProps {
  courseId: number;
  // Kept for call-site compatibility; the editor page fetches categories itself.
  categories?: Category[];
}

/**
 * Admin Course Management row actions. Both buttons navigate to the shared
 * course editor page (/course-builder/[id]); the page fetches the full course
 * on its own, so no on-demand fetch is needed here.
 */
export function AdminCourseRowActions({ courseId }: AdminCourseRowActionsProps) {
  return (
    <Link
      href={`/course-builder/${courseId}`}
      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
    >
      Edit
    </Link>
  );
}
