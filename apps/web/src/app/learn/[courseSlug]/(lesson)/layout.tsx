import { redirect } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { coursesApi } from "@/features/courses/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { LearnShell } from "@/features/learn/LearnShell";
import { LearnSidebar } from "@/features/learn/LearnSidebar";
import { LearnMobileSidebar } from "@/features/learn/LearnMobileSidebar";
import { LessonProgressProvider } from "@/features/learn/LessonProgressContext";

interface Props {
  children: React.ReactNode;
  params: Promise<{ courseSlug: string }>;
}

// This layout wraps only /(lesson)/[lessonId] pages. Sibling routes such as
// /suspended, /expired, and the course-root redirect page are NOT wrapped,
// which avoids enrollment-check redirect loops for those informational pages.
export default async function LearnCourseLayout({ children, params }: Props) {
  const { courseSlug } = await params;

  const user = await authApi.me().catch(() => null);
  if (!user) redirect(`/login?redirect=/learn/${courseSlug}`);

  const dashboard =
    user.data.role === "STUDENT" ? "/student/dashboard" : "/guest/dashboard";

  const courseRes = await coursesApi.detail(courseSlug).catch(() => null);
  if (!courseRes?.data) redirect(dashboard);
  const course = courseRes.data;

  const status = await enrollmentsApi.enrollmentStatus(course.id).catch(() => null);
  if (!status?.data?.enrolled) redirect(dashboard);

  const curriculumRes = await enrollmentsApi.curriculum(course.id).catch(() => null);
  if (!curriculumRes?.data) redirect(dashboard);

  const modules = curriculumRes.data;
  const allLessons = modules.flatMap((m) => m.lessons);

  const sidebarModules = modules.map((m) => ({
    id: m.id,
    title: m.title,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type as "video" | "text" | "quiz" | "assignment",
      href: `/learn/${courseSlug}/${l.id}`,
      duration: l.duration,
      isFree: l.isFree,
      completed: !!l.progress?.completedAt,
      isLocked: !!l.isLocked,
    })),
  }));

  const initialCompletedIds = allLessons
    .filter((l) => !!l.progress?.completedAt)
    .map((l) => l.id);

  return (
    <LessonProgressProvider initialCompletedIds={initialCompletedIds}>
      <LearnShell
        homeHref={dashboard}
        backHref={dashboard}
        courseTitle={course.title}
        sidebar={<LearnSidebar modules={sidebarModules} trackProgress />}
        mobileSidebar={<LearnMobileSidebar modules={sidebarModules} trackProgress />}
      >
        {children}
      </LearnShell>
    </LessonProgressProvider>
  );
}
