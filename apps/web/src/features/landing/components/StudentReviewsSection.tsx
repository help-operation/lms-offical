import Link from "next/link";
import { StudentReviewsCarousel } from "@/features/landing/components/StudentReviewsCarousel";
import { getFeaturedReviews } from "@/features/cms/api/reviews";
import type { LandingReview } from "@/features/landing/types";

export type StudentReviewsContent = {
  title?: string;
  subtitle?: string;
  see_all_label?: string;
  see_all_link?: string;
  reviews?: LandingReview[];
};

type Props = { content?: StudentReviewsContent };

export default async function StudentReviewsSection({ content = {} }: Props) {
  const title         = content.title         ?? "Our students' feedback";
  const subtitle      = content.subtitle      ?? "The positive experiences and opinions students have gained while advancing their careers and personal growth through our courses.";
  const see_all_label = content.see_all_label ?? "See all";
  const see_all_link  = content.see_all_link  ?? "/courses";

  // Fetch live curated reviews; fall back to CMS content reviews
  const liveReviews = await getFeaturedReviews();

  const reviews: LandingReview[] =
    liveReviews.length > 0
      ? liveReviews.map((r) => ({
          id:     r.id,
          name:   r.displayName  ?? "Anonymous",
          batch:  r.displayRole  ?? "",
          rating: r.rating,
          text:   r.comment      ?? "",
        }))
      : Array.isArray(content.reviews) && content.reviews.length > 0
        ? content.reviews
        : [];

  if (reviews.length === 0) return null;

  return (
    <section className="overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 xl:grid-cols-[360px_1fr]">
          {/* Left — heading */}
          <div>
            <h2 className="text-3xl font-bold leading-snug text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
            <Link
              href={see_all_link}
              className="mt-7 inline-flex rounded-md bg-gradient-to-r from-brand-from to-brand-to px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
            >
              {see_all_label}
            </Link>
          </div>

          {/* Right — carousel */}
          <StudentReviewsCarousel reviews={reviews} />
        </div>
      </div>
    </section>
  );
}
