/**
 * "Our Courses" — a tabbed carousel of courses grouped by category.
 *
 * Fetches published courses and the category list from the API, groups the
 * courses under their category, and renders the tabbed carousel. If there are
 * no categories with courses yet, the section hides itself so the home page
 * never shows an empty carousel.
 */
import { getCoursesByCategory } from "@/features/landing/api/landing.api";
import { OurCoursesCarousel } from "@/features/landing/components/OurCoursesCarousel";

export type OurCoursesContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

type Props = { content?: OurCoursesContent };

export default async function OurCoursesSection(props: Props) {
  void props; // content is reserved for future heading customisation
  const categories = await getCoursesByCategory();

  if (categories.length === 0) return null;

  return (
    <section className="bg-[#FBFAF9] dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 pt-16 pb-10 lg:pt-24 lg:pb-14">
      <div className="container mx-auto px-4">
        <OurCoursesCarousel categories={categories} />
      </div>
    </section>
  );
}
