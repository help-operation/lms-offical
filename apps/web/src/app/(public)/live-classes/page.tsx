import { Suspense, type ReactNode } from "react";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import SimpleHero from "@/features/cms/components/SimpleHero";
import BatchesGrid from "@/features/live-classes/components/BatchesGrid";
import { CourseRowSkeleton } from "@/features/landing/components/CourseRow.skeleton";

export const metadata = { title: "Upcoming Batches" };

type Content = Record<string, unknown>;
type Renderer = (content: Content) => ReactNode;

const as = <T,>(c: Content): T => c as unknown as T;

const RENDERERS: Record<string, Renderer> = {
  simple_hero:  (c) => <SimpleHero  content={as(c)} />,
  batches_grid: (c) => (
    <Suspense fallback={<CourseRowSkeleton />}>
      <BatchesGrid content={as(c)} />
    </Suspense>
  ),
};

const FALLBACK_ORDER = ["simple_hero", "batches_grid"];

export default async function LiveClassesPage() {
  const sections = await getPublicPageSections("live-classes");

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
