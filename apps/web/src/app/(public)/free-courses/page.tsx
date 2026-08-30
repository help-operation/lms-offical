import { Suspense, type ReactNode } from "react";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import SimpleHero from "@/features/cms/components/SimpleHero";
import ComingSoonCard from "@/features/free-courses/components/ComingSoonCard";
import FreeCoursesGrid from "@/features/free-courses/components/FreeCoursesGrid";
import RecordedCoursesSection from "@/features/landing/components/RecordedCoursesSection";
import { CourseRowSkeleton } from "@/features/landing/components/CourseRow.skeleton";

export const metadata = { title: "Free Courses" };

type Content = Record<string, unknown>;
type Renderer = (content: Content) => ReactNode;

const as = <T,>(c: Content): T => c as unknown as T;

const RENDERERS: Record<string, Renderer> = {
  simple_hero:       (c) => <SimpleHero       content={as(c)} />,
  free_courses_grid: (c) => (
    <Suspense fallback={<CourseRowSkeleton />}>
      <FreeCoursesGrid content={as(c)} />
    </Suspense>
  ),
  coming_soon_card:  (c) => <ComingSoonCard   content={as(c)} />,
  recorded_courses:  (c) => (
    <Suspense fallback={<CourseRowSkeleton />}>
      <RecordedCoursesSection content={as(c)} />
    </Suspense>
  ),
};

const FALLBACK_ORDER = ["simple_hero", "free_courses_grid", "coming_soon_card", "recorded_courses"];

export default async function FreeCoursesPage() {
  const sections = await getPublicPageSections("free-courses");

  const items =
    sections.length > 0
      ? sections.map((s) => ({ key: `s-${s.id}`, type: s.type, content: s.content ?? {} }))
      : FALLBACK_ORDER.map((type, i) => ({ key: `f-${i}`, type, content: {} as Content }));

  return (
    <main className="min-h-screen bg-white">
      {items.map((it) => {
        const render = RENDERERS[it.type];
        if (!render) return null;
        return <div key={it.key}>{render(it.content)}</div>;
      })}
    </main>
  );
}
