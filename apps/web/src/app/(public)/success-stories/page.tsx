import { type ReactNode } from "react";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import SimpleHero from "@/features/cms/components/SimpleHero";
import SuccessStoriesPanel from "@/features/success-stories/components/SuccessStoriesPanel";

export const metadata = {
  title: "Success Stories",
  description: "What our students say about our courses",
};

type Content = Record<string, unknown>;
type Renderer = (content: Content) => ReactNode;
type SearchParams = { tab?: string; category?: string; show?: string };

interface PageProps {
  searchParams: Promise<SearchParams>;
}

const as = <T,>(c: Content): T => c as unknown as T;

const FALLBACK_ORDER = ["simple_hero", "success_stories_panel"];

export default async function SuccessStoriesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sections = await getPublicPageSections("success-stories");

  // RENDERERS captures `sp` so the panel renderer can pass searchParams
  // through to the server component that handles filtering/pagination.
  const RENDERERS: Record<string, Renderer> = {
    simple_hero:           (c) => <SimpleHero           content={as(c)} />,
    success_stories_panel: (c) => <SuccessStoriesPanel  content={as(c)} searchParams={sp} />,
  };

  const items =
    sections.length > 0
      ? sections.map((s) => ({ key: `s-${s.id}`, type: s.type, content: s.content ?? {} }))
      : FALLBACK_ORDER.map((type, i) => ({ key: `f-${i}`, type, content: {} as Content }));

  return (
    <main className="min-h-screen bg-gray-50 py-16 lg:py-20">
      {items.map((it) => {
        const render = RENDERERS[it.type];
        if (!render) return null;
        return <div key={it.key}>{render(it.content)}</div>;
      })}
    </main>
  );
}
