import { notFound } from "next/navigation";
import { instructorCoursesApi, categoriesApi } from "@/features/courses/api";
import { authApi } from "@/features/auth/api";
import { CourseEditorPage } from "@/features/courses/CourseEditorPage";

export const metadata = { title: "Edit Course" };

export default async function CourseEditRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) notFound();

  const [courseRes, curriculumRes, categoriesRes, userRes] = await Promise.all([
    instructorCoursesApi.get(courseId).catch(() => null),
    instructorCoursesApi.getCurriculum(courseId).catch(() => null),
    categoriesApi.list().catch(() => null),
    authApi.me().catch(() => null),
  ]);

  if (!courseRes?.data) notFound();

  const role = userRes?.data?.role ?? "INSTRUCTOR";

  return (
    <CourseEditorPage
      course={courseRes.data}
      categories={categoriesRes?.data ?? []}
      modules={curriculumRes?.data ?? []}
      role={role}
    />
  );
}
