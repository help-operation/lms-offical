import { instructorCoursesApi } from "@/features/courses/api";
import { authApi } from "@/features/auth/api";
import { InstructorDashboardClient } from "@/features/instructor/InstructorDashboardClient";

export const metadata = { title: "Dashboard" };

export default async function InstructorDashboardPage() {
  const [statsRes, coursesRes, userRes] = await Promise.all([
    instructorCoursesApi.stats().catch(() => null),
    instructorCoursesApi.list().catch(() => null),
    authApi.me().catch(() => null),
  ]);

  const s = statsRes?.data;
  const recentCourses = (coursesRes?.data ?? []).slice(0, 5);
  const user = userRes?.data;

  return (
    <InstructorDashboardClient
      stats={{
        totalCourses: s?.totalCourses ?? 0,
        publishedCourses: s?.publishedCourses ?? 0,
        totalStudents: s?.totalStudents ?? 0,
        totalRevenue: Number(s?.totalRevenue ?? 0),
        avgRating: s?.avgRating ? Number(s.avgRating) : null,
      }}
      recentCourses={recentCourses}
      userName={user ? `${user.firstName} ${user.lastName}` : "Instructor"}
    />
  );
}
