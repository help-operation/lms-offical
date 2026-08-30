import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { liveCoursesApi } from "@/features/live-courses/api";
import { liveCurriculumApi, type LiveLesson } from "@/features/live-courses/api/curriculum";
import { certificatesApi } from "@/features/courses/api/certificates";
import { LessonViewer } from "@/features/learn/LessonViewer";
import { CertificateClaimBanner } from "@/features/learn/CertificateClaimBanner";

interface Props {
  params: Promise<{ id: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await liveCoursesApi.getById(Number(id)).catch(() => null);
  return { title: res?.data?.title ?? "Learn" };
}

export default async function LiveLearnPage({ params }: Props) {
  const { id, lessonId } = await params;
  const courseId = Number(id);
  const lessonIdNum = Number(lessonId);

  // Auth and enrollment are gated by the parent (lesson)/layout.tsx.
  const courseRes = await liveCoursesApi.getById(courseId).catch(() => null);
  if (!courseRes?.data) notFound();
  const course = courseRes.data;

  const curriculumRes = await liveCurriculumApi.curriculum(courseId).catch(() => null);
  if (!curriculumRes?.data) notFound();

  const modules = curriculumRes.data;
  const allLessons: LiveLesson[] = modules.flatMap((m) => m.lessons);
  const currentLesson = allLessons.find((l) => l.id === lessonIdNum);

  if (!currentLesson) notFound();

  // Sequential lock: redirect to first accessible lesson.
  if (currentLesson.isLocked) {
    const firstUnlocked = allLessons.find((l) => !l.isLocked && !l.progress?.completedAt);
    const target = firstUnlocked ?? allLessons[0];
    redirect(`/c/${id}/learn/${target!.id}`);
  }

  const currentIndex = allLessons.indexOf(currentLesson);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const courseCompleted =
    allLessons.length > 0 && allLessons.every((l) => !!l.progress?.completedAt);

  let certificateCode: string | null = null;
  if (courseCompleted) {
    const mine = await certificatesApi.mine().catch(() => null);
    certificateCode =
      mine?.data.find((c) => c.liveCourseId === courseId)?.certificateCode ?? null;
  }

  return (
    <>
      {courseCompleted && (
        <div className="px-4 pt-6 sm:px-6">
          <CertificateClaimBanner
            courseId={courseId}
            initialCode={certificateCode}
            variant="live"
          />
        </div>
      )}
      <LessonViewer
        variant="live"
        lesson={{
          id: currentLesson.id,
          title: currentLesson.title,
          type: currentLesson.type,
          content: currentLesson.content,
          duration: currentLesson.duration,
        }}
        prevHref={prevLesson ? `/c/${id}/learn/${prevLesson.id}` : null}
        nextHref={nextLesson ? `/c/${id}/learn/${nextLesson.id}` : null}
        initialCompleted={!!currentLesson.progress?.completedAt}
      />
    </>
  );
}
