import { Suspense, type ReactNode } from "react";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import AboutIntro from "@/features/about/components/AboutIntro";
import FoundingTeamSection from "@/features/about/components/FoundingTeamSection";
import WhyIctSection from "@/features/about/components/WhyIctSection";
import MediaSection from "@/features/about/components/MediaSection";
import MilestonesSection from "@/features/about/components/MilestonesSection";
import TestimonialSection from "@/features/landing/components/TestimonialSection";
import PartnersSection from "@/features/landing/components/PartnersSection";
import CertificateSection from "@/features/landing/components/CertificateSection";
import CommunitySection from "@/features/landing/components/CommunitySection";

export const metadata = { title: "About Us" };

type Content = Record<string, unknown>;
type Renderer = (content: Content) => ReactNode;

// Same opaque-JSON → strict-prop cast helper as the home page.
const as = <T,>(c: Content): T => c as unknown as T;

const RENDERERS: Record<string, Renderer> = {
  about_intro:   (c) => <AboutIntro          content={as(c)} />,
  founding_team: (c) => <FoundingTeamSection content={as(c)} />,
  testimonials:  (c) => (
    <Suspense fallback={<div className="py-24" />}>
      <TestimonialSection content={as(c)} />
    </Suspense>
  ),
  partners:      (c) => <PartnersSection     content={as(c)} />,
  why_ict:       (c) => <WhyIctSection       content={as(c)} />,
  certificate:   (c) => <CertificateSection  content={as(c)} />,
  media:         (c) => <MediaSection        content={as(c)} />,
  milestones:    (c) => <MilestonesSection   content={as(c)} />,
  community:     (c) => <CommunitySection    content={as(c)} />,
};

const FALLBACK_ORDER = [
  "about_intro",
  "founding_team",
  "testimonials",
  "partners",
  "why_ict",
  "certificate",
  "media",
  "milestones",
  "community",
];

export default async function AboutPage() {
  const [sections, homeSections] = await Promise.all([
    getPublicPageSections("about"),
    getPublicPageSections("home"),
  ]);

  // Use home page data for sections shared between home and about
  const homePartners    = homeSections.find((s) => s.type === "partners")?.content    ?? {};
  const homeCertificate = homeSections.find((s) => s.type === "certificate")?.content ?? {};

  const sharedContent = (type: string): Content | null => {
    if (type === "partners")    return homePartners;
    if (type === "certificate") return homeCertificate;
    return null;
  };

  const items =
    sections.length > 0
      ? sections.map((s) => ({
          key: `s-${s.id}`,
          type: s.type,
          content: sharedContent(s.type) ?? (s.content ?? {}),
        }))
      : FALLBACK_ORDER.map((type, i) => ({
          key: `f-${i}`,
          type,
          content: sharedContent(type) ?? ({} as Content),
        }));

  return (
    <div className="min-h-screen bg-white transition-colors duration-300 animate-content-in dark:bg-gray-950">
      {items.map((it) => {
        const render = RENDERERS[it.type];
        if (!render) return null;
        return <div key={it.key}>{render(it.content)}</div>;
      })}
    </div>
  );
}
