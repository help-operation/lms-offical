import { Suspense, type ReactNode } from "react";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import { getPublicSiteSettings, getPublicMetaDescription } from "@/features/cms/api/settings";
import HeroSection from "@/features/landing/components/HeroSection";
import HeroSectionV2 from "@repo/ui/home-v1-hero";
import CTASection from "@/features/landing/components/CTASection";
import FlexibleLearningSection from "@/features/landing/components/FlexibleLearningSection";
import PartnersSection from "@/features/landing/components/PartnersSection";
import TestimonialSection from "@/features/landing/components/TestimonialSection";
import TopCoursesSection from "@/features/landing/components/TopCoursesSection";
import UpcomingBatchesSection from "@/features/landing/components/UpcomingBatchesSection";
import RecordedCoursesSection from "@/features/landing/components/RecordedCoursesSection";
import AllCoursesSection from "@/features/landing/components/AllCoursesSection";
import OurCoursesSection from "@/features/landing/components/OurCoursesSection";
import CourseFacilitiesSection from "@/features/landing/components/CourseFacilitiesSection";
import GetStartedStepsSection from "@/features/landing/components/GetStartedStepsSection";
import FeaturedInSection from "@/features/landing/components/FeaturedInSection";
import StudentReviewsSection from "@/features/landing/components/StudentReviewsSection";
import SuccessStoriesSection from "@/features/landing/components/SuccessStoriesSection";
import CertificateSection from "@/features/landing/components/CertificateSection";
import PaymentMethodSection from "@/features/landing/components/PaymentMethodSection";
import JoinInstructorSection from "@/features/landing/components/JoinInstructorSection";
import CommunitySection from "@/features/landing/components/CommunitySection";
import { CourseRowSkeleton } from "@/features/landing/components/CourseRow.skeleton";
import { AllCoursesSectionSkeleton } from "@/features/landing/components/AllCoursesSection.skeleton";
import { TestimonialSectionSkeleton } from "@/features/landing/components/TestimonialSection.skeleton";
import { StudentReviewsSectionSkeleton } from "@/features/landing/components/StudentReviewsSection.skeleton";
import { SuccessStoriesSectionSkeleton } from "@/features/landing/components/SuccessStoriesSection.skeleton";
import { InstructorsGridSectionSkeleton } from "@/features/landing/components/InstructorsGridSection.skeleton";
import { StudentStoriesSectionSkeleton } from "@/features/landing/components/StudentStoriesSection.skeleton";
import { ArticlesSectionSkeleton } from "@/features/landing/components/ArticlesSection.skeleton";
import { CoursesGridSectionSkeleton } from "@/features/landing/components/CoursesGridSection.skeleton";
import FeatureCardsSection from "@repo/ui/home-v1-feature-cards";
import CategoriesGridSection from "@/features/landing/components/CategoriesGridSection";
import CtaBannerSection from "@repo/ui/home-v1-cta-banner";
import FeaturedCollageSection from "@repo/ui/home-v1-featured-collage";
import CoursesGridSection from "@/features/landing/components/CoursesGridSection";
import InstructorsGridSection from "@/features/landing/components/InstructorsGridSection";
import StudentStoriesSection from "@/features/landing/components/StudentStoriesSection";
import ArticlesSection from "@/features/landing/components/ArticlesSection";
import FaqAccordionSection from "@repo/ui/home-v1-faq-accordion";

export async function generateMetadata() {
  return { description: await getPublicMetaDescription() };
}

type Content = Record<string, unknown>;
type Renderer = (content: Content) => ReactNode;

/**
 * Registry mapping CMS `type` → React renderer. The admin's "Landing Page"
 * card list defines what renders here and in what order — each section row's
 * `type` field is looked up in this map.
 *
 * Sections whose underlying data is fetched at request time (top_courses,
 * recorded_courses pull from /courses) are wrapped in <Suspense> so the
 * static shell streams immediately and the carousel pops in when ready.
 * All other sections render synchronously from CMS `content` and become part
 * of the prerendered shell via `'use cache'` on the fetcher.
 */
// CMS content is opaque JSON at the page boundary; each section narrows it
// against its own `content?: SomeContent` type and applies its own defaults.
// We cast through `never` so TS allows passing the same shape into every
// strictly-typed component.
const as = <T,>(c: Content): T => c as unknown as T;

const RENDERERS: Record<string, Renderer> = {
  hero:              (c) => <HeroSection              content={as(c)} />,
  hero_v2:           (c) => <HeroSectionV2             content={as(c)} />,
  top_courses:       (c) => (
    <Suspense fallback={<CourseRowSkeleton />}>
      <TopCoursesSection content={as(c)} />
    </Suspense>
  ),
  upcoming_batches:  (c) => (
    <Suspense fallback={<CourseRowSkeleton />}>
      <UpcomingBatchesSection content={as(c)} />
    </Suspense>
  ),
  all_courses:       (c) => (
    <Suspense fallback={<AllCoursesSectionSkeleton />}>
      <AllCoursesSection content={as(c)} />
    </Suspense>
  ),
  recorded_courses:  (c) => (
    <Suspense fallback={<CourseRowSkeleton />}>
      <RecordedCoursesSection content={as(c)} />
    </Suspense>
  ),
  our_courses:       (c) => (
    <Suspense fallback={<CourseRowSkeleton />}>
      <OurCoursesSection content={as(c)} />
    </Suspense>
  ),
  flexible_learning: (c) => <FlexibleLearningSection  content={as(c)} />,
  course_facilities: (c) => <CourseFacilitiesSection  content={as(c)} />,
  testimonials:      (c) => (
    <Suspense fallback={<TestimonialSectionSkeleton />}>
      <TestimonialSection content={as(c)} />
    </Suspense>
  ),
  get_started_steps: (c) => <GetStartedStepsSection   content={as(c)} />,
  featured_in:       (c) => <FeaturedInSection        content={as(c)} />,
  partners:          (c) => <PartnersSection          content={as(c)} />,
  student_reviews:   (c) => (
    <Suspense fallback={<StudentReviewsSectionSkeleton />}>
      <StudentReviewsSection content={as(c)} />
    </Suspense>
  ),
  cta:               (c) => <CTASection               content={as(c)} />,
  success_stories:   (c) => (
    <Suspense fallback={<SuccessStoriesSectionSkeleton />}>
      <SuccessStoriesSection content={as(c)} />
    </Suspense>
  ),
  certificate:       (c) => <CertificateSection       content={as(c)} />,
  payment_method:    (c) => <PaymentMethodSection     content={as(c)} />,
  join_instructor:   (c) => <JoinInstructorSection    content={as(c)} />,
  community:         (c) => <CommunitySection         content={as(c)} />,
  feature_cards_v2:  (c) => <FeatureCardsSection       content={as(c)} />,
  categories_v2:     (c) => (
    <Suspense fallback={<CoursesGridSectionSkeleton showFilters={false} />}>
      <CategoriesGridSection content={as(c)} />
    </Suspense>
  ),
  cta_banner_v2:     (c) => <CtaBannerSection          content={as(c)} />,
  featured_collage_v2: (c) => <FeaturedCollageSection  content={as(c)} />,
  courses_grid_v2:   (c) => (
    <Suspense fallback={<CoursesGridSectionSkeleton />}>
      <CoursesGridSection content={as(c)} />
    </Suspense>
  ),
  instructors_v2:    (c) => (
    <Suspense fallback={<InstructorsGridSectionSkeleton />}>
      <InstructorsGridSection content={as(c)} />
    </Suspense>
  ),
  student_stories_v2: (c) => (
    <Suspense fallback={<StudentStoriesSectionSkeleton />}>
      <StudentStoriesSection content={as(c)} />
    </Suspense>
  ),
  articles_v2:       (c) => (
    <Suspense fallback={<ArticlesSectionSkeleton />}>
      <ArticlesSection content={as(c)} />
    </Suspense>
  ),
  faq_v2:            (c) => <FaqAccordionSection       content={as(c)} />,
  // "newsletter_v2" is intentionally not mapped here — the Elevate template's
  // newsletter banner now renders site-wide from (public)/layout.tsx instead
  // of as a homepage-only section, so this type is skipped if still present
  // in a page's CMS section list (see RENDERERS[it.type] check below).
};

/**
 * Resilience fallback: section types in the canonical order, used when the
 * backend is unreachable AND no cached response exists. Each component then
 * receives empty `content` and falls through to its own hardcoded DEFAULTS
 * — so the site stays visually whole even with the API down. Once the
 * backend comes back, this falls out of use on the next cache refresh.
 */
const FALLBACK_ORDER = [
  "hero",
  "top_courses",
  "upcoming_batches",
  "all_courses",
  "recorded_courses",
  "our_courses",
  "flexible_learning",
  "course_facilities",
  "testimonials",
  "get_started_steps",
  "featured_in",
  "partners",
  "student_reviews",
  "cta",
  "success_stories",
  "certificate",
  "payment_method",
  "join_instructor",
  "community",
];

export default async function HomePage() {
  // Which page_sections `page` discriminator to render is itself a cached,
  // admin-controlled setting — see apps/admin/src/features/home-page-templates.
  // Reuses `getPublicSiteSettings` (already called by the header/footer on
  // every page) rather than a standalone cached fetcher, so this doesn't
  // introduce a brand-new cache-tag population path of its own.
  const { home_template } = await getPublicSiteSettings();

  // Sections come back already filtered to `active=true` and ordered by `order`.
  // The fetcher is cached ('minutes') + tagged ('page-sections:home'), so this
  // becomes part of the PPR static shell after first request.
  const sections = await getPublicPageSections(home_template);

  // Two render modes:
  //  • Backend reachable → use CMS sections (admin controls order/visibility)
  //  • Backend unreachable AND no cache → use FALLBACK_ORDER + empty content,
  //    which makes each component use its built-in DEFAULTS instead of
  //    rendering a blank page.
  const items =
    sections.length > 0
      ? sections.map((s) => ({ key: `s-${s.id}`, type: s.type, content: s.content ?? {} }))
      : FALLBACK_ORDER.map((type, i) => ({ key: `f-${i}`, type, content: {} as Content }));

  return (
    <div>
      {items.map((it) => {
        const render = RENDERERS[it.type];
        if (!render) return null;
        return <div key={it.key}>{render(it.content)}</div>;
      })}
    </div>
  );
}
