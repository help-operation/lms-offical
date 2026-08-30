import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { coursesApi } from "@/features/courses/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { authApi } from "@/features/auth/api";
import { getPublicCourseCtaSettings, getPublicContactSettings, getPublicSiteSettings } from "@/features/cms/api/settings";
import type { CurriculumModule, CourseReviews } from "@/features/courses/api";
import { CourseHero } from "@/features/courses/CourseHero";
import { ElevateCourseHero } from "@/features/courses/ElevateCourseHero";
import { MasteryCourseHero } from "@/features/courses/MasteryCourseHero";
import type { HeroTextOverrides } from "@/features/courses/MasteryCourseHero";
import { CoursePurchaseSidebar } from "@/features/courses/CoursePurchaseSidebar";
import { ElevateCoursePurchaseSidebar } from "@/features/courses/ElevateCoursePurchaseSidebar";
import { CourseHeroOverlap } from "@/features/courses/CourseHeroOverlap";
import { CourseContent } from "@/features/courses/CourseContent";
import { ElevateCourseContent } from "@/features/courses/ElevateCourseContent";
import { MasteryBatchInfo } from "@/features/courses/MasteryBatchInfo";
import { MasteryBenefits } from "@/features/courses/MasteryBenefits";
import { MasteryVideoTestimonials } from "@/features/courses/MasteryVideoTestimonials";
import { MasteryTestimonials } from "@/features/courses/MasteryTestimonials";
import { MasteryValueBreakdown } from "@/features/courses/MasteryValueBreakdown";
import { MasteryToolsSection } from "@/features/courses/MasteryToolsSection";
import { MasteryWhyDifferent } from "@/features/courses/MasteryWhyDifferent";
import { MasteryInstructors } from "@/features/courses/MasteryInstructors";
import { MasteryCurriculum } from "@/features/courses/MasteryCurriculum";
import { MasteryStickyOfferBar } from "@/features/courses/MasteryStickyOfferBar";
import { MasteryBottomBar } from "@/features/courses/MasteryBottomBar";
import { MasteryCheckoutSection } from "@/features/courses/MasteryCheckoutSection";
import { CourseInterestTracker } from "@/features/courses/CourseInterestTracker";
import { CourseViewTracker } from "@/features/courses/CourseViewTracker";
import TopCoursesSection from "@/features/landing/components/TopCoursesSection";
import { ContentContext } from "@/shared/components/ContentContext";
import { ScrollDepthTracker } from "@/shared/components/ScrollDepthTracker";
import { StyleOverridesScope } from "@/shared/components/StyleOverridesScope";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const res = await coursesApi.detail(slug).catch(() => null);
  if (!res?.data) return { title: "Course" };
  return {
    title: res.data.title,
    description: res.data.description ?? undefined,
    openGraph: { images: res.data.thumbnail ? [res.data.thumbnail] : [] },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;

  const [res, user] = await Promise.all([
    coursesApi.detail(slug).catch(() => null),
    authApi.me().catch(() => null),
  ]);

  // Real data only — if the course doesn't exist or hasn't been published,
  // render the standard not-found page.
  if (!res?.data) notFound();
  const course = res.data;

  const [enrollmentRes, curriculumRes, reviewsRes, ctaLabels, contact, siteSettings] = await Promise.all([
    user
      ? enrollmentsApi.enrollmentStatus(course.id).catch(() => null)
      : Promise.resolve(null),
    coursesApi.curriculum(course.id).catch(() => null),
    coursesApi.reviews(course.id).catch(() => null),
    getPublicCourseCtaSettings(),
    getPublicContactSettings(),
    getPublicSiteSettings(),
  ]);

  // Template-based rendering: "1" = Elevate, "2" = Mastery, else Standard
  const template = course.template;
  const isElevate = template === "1";
  const isMastery = template === "2";
  const Hero = isMastery ? MasteryCourseHero : isElevate ? ElevateCourseHero : CourseHero;
  const PurchaseSidebar = isElevate ? ElevateCoursePurchaseSidebar : CoursePurchaseSidebar;
  const Content = isElevate ? ElevateCourseContent : CourseContent;

  const isBundle = (course as any).courseType === "bundle";
  let isEnrolled = enrollmentRes?.data?.enrolled ?? false;
  if (!isEnrolled && isBundle && (course as any).bundledCourses?.length && user) {
    const checks = await Promise.all(
      (course as any).bundledCourses.map((c: any) => enrollmentsApi.enrollmentStatus(c.id).catch(() => null)),
    );
    if (checks.length && checks.every((r) => r?.data?.enrolled)) isEnrolled = true;
  }
  let curriculum: CurriculumModule[] = curriculumRes?.data ?? [];
  // Bundle uses lightweight bundleCurriculum (marketing display) instead of real courseModules
  if (isBundle && (course as any).bundleCurriculum && Array.isArray((course as any).bundleCurriculum) && (course as any).bundleCurriculum.length > 0) {
    curriculum = (course as any).bundleCurriculum.map((m: { title: string; lessons: string[] }, idx: number) => ({
      id: idx + 1000,
      title: m.title,
      order: idx,
      lessons: (m.lessons || []).map((t: string, li: number) => ({ id: li + 1000, moduleId: idx + 1000, title: t, type: "video" as const, duration: 0, isFree: false, order: li })),
    }));
  }
  const reviews: CourseReviews = reviewsRes?.data ?? {
    avg: 0,
    total: 0,
    distribution: {},
    reviews: [],
  };

  const price = parseFloat(course.price);
  const discountPrice = course.discountPrice ? parseFloat(course.discountPrice) : null;

  // Use static rating when ratingSource='static', otherwise use computed rating
  const useStaticRating = course.ratingSource === 'static';
  const rating = useStaticRating
    ? (course.rating ? parseFloat(course.rating) : null)
    : (course.rating ? parseFloat(course.rating) : null);
  const ratingCount = useStaticRating
    ? (course.ratingCount || 0)
    : reviews.total;
  const ratingPct =
    ratingCount > 0
      ? Math.round(((reviews.distribution[5] ?? 0) / ratingCount) * 100)
      : 91;

  // Extract text overrides from styleOverrides
  // The keys are CSS selectors, values have { text, ...styles }
  // We map CSS selectors to semantic hero text keys based on element type
  const heroTextOverrides: HeroTextOverrides = {};
  if (course.styleOverrides && typeof course.styleOverrides === "object") {
    // Dedicated social proof override
    const sp = (course.styleOverrides as any).heroSocialProof;
    if (sp && typeof sp === "object" && typeof sp.text === "string" && sp.text) {
      heroTextOverrides.socialProof = sp.text;
    }
    // Direct CTA override from admin (CourseEditorPage Hero CTA input)
    const ctaDirect = (course.styleOverrides as any).cta?.text ?? (course.styleOverrides as any).heroCta?.text;
    if (typeof ctaDirect === "string" && ctaDirect) heroTextOverrides.cta = ctaDirect;

    for (const [selector, style] of Object.entries(course.styleOverrides)) {
      if (!style || typeof style !== "object" || !("text" in style)) continue;
      const text = (style as any).text;
      if (typeof text !== "string" || !text) continue;

      const sel = selector.toLowerCase();
      // Map by element type in the selector
      if (sel.includes("h1")) {
        heroTextOverrides.title = text;
      } else if (sel.includes("p") && !sel.includes("span")) {
        // Paragraph elements — could be description or social proof
        if (text.includes("আমাদের") || text.includes("20,000") || text.includes("trusted")) {
          heroTextOverrides.socialProof = text;
        } else {
          heroTextOverrides.description = text;
        }
      } else if (sel.includes("a") || sel.includes("button")) {
        // Links/buttons — CTA
        heroTextOverrides.cta = text;
      } else if (text === "Free" || text.startsWith("৳")) {
        heroTextOverrides.price = text;
      } else if (text.includes("লাইভ") || text.includes("Live")) {
        heroTextOverrides.liveBadge = text;
      } else if (text.includes("প্রোমো") || text.includes("Promo")) {
        heroTextOverrides.promoBadge = text;
      }
    }
  }

  return (
    <main className="min-h-screen bg-white transition-colors duration-300 dark:bg-gray-950">
      <ContentContext type="course" category={course.categoryName} />

      {isMastery ? (
        <>
          {/* Hide website header server-side — prevents 1-2s flash of 2 headers (mint Mastery bar + white menubar stacked) your gif shows */}
          <style dangerouslySetInnerHTML={{ __html: `header{display:none!important} body>header{display:none!important} body[data-mastery-page="true"]>header{display:none!important}` }} />
          <div data-mastery-page="true" className="pt-[30px]">
          <StyleOverridesScope overrides={course.styleOverrides}>
            <MasteryStickyOfferBar
              overrides={course.styleOverrides as any}
              courseSlug={course.slug}
              price={price}
              discountPrice={discountPrice}
              logoUrl={siteSettings.logo_url || "/Skillkoro-logo.png"}
              logoAlt={siteSettings.site_name || "Logo"}
              timerHours={course.valueBreakdownInfo?.timerHours}
              timerMinutes={course.valueBreakdownInfo?.timerMinutes}
              timerSeconds={course.valueBreakdownInfo?.timerSeconds}
              ctaText="Enroll"
              offerLabel={course.valueBreakdownInfo?.offerLabel}
            />
            <MasteryCourseHero
              title={course.title}
              categoryName={course.categoryName}
              description={course.shortDescription}
              rating={rating}
              ratingPct={ratingPct}
              ratingCount={ratingCount}
              thumbnail={course.thumbnail}
              price={price}
              discountPrice={discountPrice}
              totalStudents={course.totalStudents}
              textOverrides={heroTextOverrides}
              socialProofImage={course.socialProofImage}
              header={(course as any).bundleCurriculumHeader}
            />
            {(() => {
              const MASTERY_ORDER = ["batch","curriculum","tools","why","instructors","benefits","videoTestimonials","testimonials","value"] as const;
              const saved = (course as any).masterySectionOrder as string[] | undefined;
              const order = (() => {
                if (!saved || saved.length === 0) return [...MASTERY_ORDER];
                const known = new Set(MASTERY_ORDER as readonly string[]);
                const seen = new Set<string>();
                const res: string[] = [];
                for (const id of saved) if (known.has(id) && !seen.has(id)) { res.push(id); seen.add(id); }
                for (const id of MASTERY_ORDER) if (!seen.has(id)) res.push(id);
                return res;
              })();
              const blocks: Record<string, React.ReactNode> = {
                batch: <MasteryBatchInfo items={course.batchInfo} />,
                curriculum: <MasteryCurriculum modules={curriculum} header={(course as any).bundleCurriculumHeader} />,
                tools: <MasteryToolsSection items={course.toolsInfo} title={course.toolsTitle} />,
                why: <MasteryWhyDifferent data={course.whyDifferentInfo} />,
                instructors: <MasteryInstructors data={course.instructorsInfo} />,
                benefits: <MasteryBenefits data={course.benefitsInfo} />,
                videoTestimonials: <MasteryVideoTestimonials data={course.videoTestimonialsInfo} />,
                testimonials: <MasteryTestimonials data={course.testimonialsInfo} />,
                value: <MasteryValueBreakdown data={course.valueBreakdownInfo} />,
              };
              return <>{order.map((id) => blocks[id] ? <React.Fragment key={id}>{blocks[id]}</React.Fragment> : null)}</>;
            })()}
            <MasteryBottomBar
              courseSlug={course.slug}
              price={price}
              discountPrice={discountPrice}
              phone={course.supportPhone || contact.general_contact_phone}
              ctaText={course.valueBreakdownInfo?.ctaText}
              overrides={course.styleOverrides as any}
            />
          </StyleOverridesScope>
          <MasteryCheckoutSection
            course={{
              id: course.id,
              title: course.title,
              slug: course.slug,
              thumbnail: course.thumbnail,
              price,
              discountPrice,
              courseType: (course as any).courseType,
              bundledCourses: (course as any).bundledCourses,
              masteryCheckoutImage: (course as any).masteryCheckoutImage,
            }}
            isLoggedIn={!!user}
            user={user?.data ? { name: `${user.data.firstName} ${user.data.lastName}`.trim(), email: user.data.email ?? "", phone: user.data.phone ?? "" } : null}
            isEnrolled={isEnrolled}
            paymentButtonText={course.valueBreakdownInfo?.paymentButtonText}
          />
          <div className="h-[110px]" />
        </div>
        </>
      ) : (
        <>
          <CourseHeroOverlap
            hero={
              <StyleOverridesScope overrides={course.styleOverrides}>
                <Hero
                  title={course.title}
                  categoryName={course.categoryName}
                  description={course.description}
                  rating={rating}
                  ratingPct={ratingPct}
              ratingCount={ratingCount}
                  thumbnail={course.thumbnail}
                  price={price}
                  discountPrice={discountPrice}
                  totalStudents={course.totalStudents}
                  textOverrides={heroTextOverrides}
                />
              </StyleOverridesScope>
            }
            sidebar={
              <PurchaseSidebar
                course={{
                  id: course.id,
                  slug: course.slug,
                  previewPlaybackId: course.previewPlaybackId,
                  previewSlides: course.previewSlides ?? [],
                  thumbnail: course.thumbnail,
                  title: course.title,
                  isFeatured: course.isFeatured,
                  totalStudents: course.totalStudents,
                  totalDuration: course.totalDuration,
                  totalLessons: course.totalLessons,
                  quizCount: course.quizCount,
                  exerciseCount: course.exerciseCount,
                  hasLifetimeAccess: course.hasLifetimeAccess,
                  supportPhone: course.supportPhone,
                }}
                price={price}
                discountPrice={discountPrice}
                isEnrolled={isEnrolled}
                isLoggedIn={!!user}
                ctaLabels={ctaLabels}
                defaultPhone={contact.general_contact_phone}
              />
            }
          >
            <Content
              course={course}
              curriculum={curriculum}
              reviews={reviews}
              isEnrolled={isEnrolled}
              isLoggedIn={!!user}
              whatsappUrl={contact.general_support_whatsapp}
              defaultPhone={contact.general_contact_phone}
            />
          </CourseHeroOverlap>
          <TopCoursesSection />
        </>
      )}

      {/* System 3 — silently record interest for logged-in, non-enrolled visitors */}
      {user && !isEnrolled && <CourseInterestTracker courseId={course.id} />}

      {/* GTM dataLayer — view_item for the ecommerce funnel */}
      <CourseViewTracker courseId={course.id} title={course.title} price={discountPrice ?? price} />
      <ScrollDepthTracker />
    </main>
  );
}
