import { type ReactNode } from "react";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import SimpleHero from "@/features/cms/components/SimpleHero";
import FAQMain from "@/features/faq/components/FAQMain";

export const metadata = { title: "FAQ" };

type Content = Record<string, unknown>;
type Renderer = (content: Content) => ReactNode;

const as = <T,>(c: Content): T => c as unknown as T;

const RENDERERS: Record<string, Renderer> = {
  simple_hero: (c) => <SimpleHero content={as(c)} />,
  faq_main:    (c) => <FAQMain    content={as(c)} />,
};

const FALLBACK_ORDER = ["simple_hero", "faq_main"];

export default async function FAQPage() {
  const sections = await getPublicPageSections("faq");

  const items =
    sections.length > 0
      ? sections.map((s) => ({ key: `s-${s.id}`, type: s.type, content: s.content ?? {} }))
      : FALLBACK_ORDER.map((type, i) => ({ key: `f-${i}`, type, content: {} as Content }));

  return (
    <main className="min-h-screen bg-white transition-colors duration-300 animate-content-in dark:bg-gray-950">
      {items.map((it) => {
        const render = RENDERERS[it.type];
        if (!render) return null;
        return <div key={it.key}>{render(it.content)}</div>;
      })}
    </main>
  );
}
