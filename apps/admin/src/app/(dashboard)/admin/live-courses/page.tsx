import { fetchLiveCoursesAction } from "@/features/live-courses/actions/live-courses.actions";
import { LiveCoursesClient } from "@/features/live-courses/LiveCoursesClient";

export const metadata = { title: "Live Courses" };

export default async function LiveCoursesPage() {
  const res = await fetchLiveCoursesAction();
  const courses = res.data ?? [];

  return (
    <div className="space-y-6">
      <LiveCoursesClient initialCourses={courses} />
    </div>
  );
}
