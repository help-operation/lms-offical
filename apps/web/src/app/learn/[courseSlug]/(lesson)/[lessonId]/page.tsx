import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { coursesApi } from "@/features/courses/api";
import { enrollmentsApi, type CurriculumLesson } from "@/features/courses/api/enrollments";
import { certificatesApi } from "@/features/courses/api/certificates";
import { LessonViewer } from "@/features/learn/LessonViewer";
import { CertificateClaimBanner } from "@/features/learn/CertificateClaimBanner";

interface Props {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug } = await params;
  const res = await coursesApi.detail(courseSlug).catch(() => null);
  return { title: res?.data?.title ?? "Learn" };
}

export default async function LearnPage({ params }: Props) {
  const { courseSlug, lessonId } = await params;
  const lessonIdNum = Number(lessonId);

  // Auth and enrollment are already gated by the parent (lesson)/layout.tsx.
  // This page only fetches what the lesson content area needs.
  const courseRes = await coursesApi.detail(courseSlug).catch(() => null);
  if (!courseRes?.data) notFound();
  const course = courseRes.data;

  const curriculumRes = await enrollmentsApi.curriculum(course.id).catch(() => null);
  if (!curriculumRes?.data) notFound();

  const modules = curriculumRes.data;
  const allLessons: CurriculumLesson[] = modules.flatMap((m) => m.lessons);
  const currentLesson = allLessons.find((l) => l.id === lessonIdNum);

  if (!currentLesson) notFound();

  // Sequential lock: redirect to the first accessible lesson.
  if (currentLesson.isLocked) {
    const firstUnlocked = allLessons.find((l) => !l.isLocked && !l.progress?.completedAt);
    const target = firstUnlocked ?? allLessons[0];
    redirect(`/learn/${courseSlug}/${target!.id}`);
  }

  const currentIndex = allLessons.indexOf(currentLesson);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const courseCompleted =
    allLessons.length > 0 && allLessons.every((l) => !!l.progress?.completedAt);

  let certificateCode: string | null = null;
  if (courseCompleted) {
    const mine = await certificatesApi.mine().catch(() => null);
    certificateCode =
      mine?.data.find((c) => c.courseId === course.id)?.certificateCode ?? null;
  }

  return (
    <>
      {courseCompleted && (
        <div className="px-4 pt-6 sm:px-6">
          <CertificateClaimBanner courseId={course.id} initialCode={certificateCode} />
        </div>
      )}
      <LessonViewer
        variant="recorded"
        lesson={{
          id: currentLesson.id,
          title: currentLesson.title,
          type: currentLesson.type,
          content: currentLesson.content,
          duration: currentLesson.duration,
        }}
        prevHref={prevLesson ? `/learn/${courseSlug}/${prevLesson.id}` : null}
        nextHref={nextLesson ? `/learn/${courseSlug}/${nextLesson.id}` : null}
        initialCompleted={!!currentLesson.progress?.completedAt}
      />
    </>
  );
}
