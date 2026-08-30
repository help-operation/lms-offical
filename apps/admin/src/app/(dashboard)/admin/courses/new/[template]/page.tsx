import { notFound } from "next/navigation";
import { Suspense } from "react";
import { categoriesApi } from "@/features/courses/api";
import { RECORDED_TEMPLATES } from "@/features/courses/recorded-templates";
import { CourseEditorPage } from "@/features/courses/CourseEditorPage";
import type { InstructorCourse } from "@/features/courses/api";

interface Props {
  params: Promise<{ template: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { template: templateId } = await params;
  const tpl = RECORDED_TEMPLATES.find((t) => t.id === templateId);
  return { title: `New Course — ${tpl?.name ?? "Unknown Template"}` };
}

export default async function NewCourseWithTemplatePage({ params }: Props) {
  const { template: templateId } = await params;
  const tpl = RECORDED_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) notFound();

  const categoriesRes = await categoriesApi.list().catch(() => null);
  const categories = categoriesRes?.data ?? [];

  const mockCourse: InstructorCourse = {
    id: 0,
    title: "Untitled Course",
    slug: "",
    shortDescription: null,
    description: null,
    learningOutcomes: null,
    requirements: null,
    thumbnail: null,
    price: "0",
    discountPrice: null,
    level: "beginner",
    language: "Bangla",
    status: "draft",
    publishAt: null,
    isFeatured: false,
    isUnlisted: false,
    showBadge: false,
    totalLessons: 0,
    totalDuration: 0,
    totalStudents: 0,
    manualStudentCount: null,
    rating: null,
    ratingCount: 0,
    ratingSource: "auto",
    categoryId: null,
    categoryName: null,
    bunnyPreviewVideoId: null,
    previewVideoSource: null,
    previewExternalUrl: null,
    facilities: null,
    targetAudience: null,
    certificatePerks: null,
    faq: null,
    quizCount: 0,
    exerciseCount: 0,
    hasLifetimeAccess: false,
    accessDurationDays: null,
    supportPhone: null,
    paymentInstructions: null,
    paymentGuideVideo: null,
    certificateImage: null,
    detailPageSections: null,
    previewSlides: null,
    publishAs: "admin",
    requireSequentialProgress: false,
    template: tpl.dbTemplate,
    socialProofImage: null,
    styleOverrides: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <CourseEditorPage
      course={mockCourse}
      categories={categories}
      modules={[]}
      role="SUPER_ADMIN"
      mode="create"
      templateId={tpl.id}
    />
  );
}
