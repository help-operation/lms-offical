import { redirect } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { liveCoursesApi } from "@/features/live-courses/api";
import { liveCurriculumApi } from "@/features/live-courses/api/curriculum";
import { LearnShell } from "@/features/learn/LearnShell";
import { LearnSidebar } from "@/features/learn/LearnSidebar";
import { LearnMobileSidebar } from "@/features/learn/LearnMobileSidebar";
import { LessonProgressProvider } from "@/features/learn/LessonProgressContext";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function LiveLearnCourseLayout({ children, params }: Props) {
  const { id } = await params;
  const courseId = Number(id);

  const user = await authApi.me().catch(() => null);
  if (!user) redirect(`/login?redirect=/c/${id}/learn`);

  const dashboard =
    user.data.role === "STUDENT" ? "/student/dashboard" : "/guest/dashboard";

  const courseRes = await liveCoursesApi.getById(courseId).catch(() => null);
  if (!courseRes?.data) redirect(dashboard);
  const course = courseRes.data;

  const status = await liveCurriculumApi.enrollmentStatus(courseId).catch(() => null);
  if (!status?.data?.enrolled) redirect(`/${course.slug}`);

  const curriculumRes = await liveCurriculumApi.curriculum(courseId).catch(() => null);
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
      href: `/c/${id}/learn/${l.id}`,
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
