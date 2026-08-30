import { CoursesGridV2 } from "@repo/ui/home-v1-courses-grid";
import { MixedCourseCard } from "./MixedCourseCard";
import { getAllMixedCourses } from "@/features/landing/api/landing.api";

export type CategoriesGridContent = {
  eyebrow?: string;
  title?: string;
  cta_label?: string;
  cta_link?: string;
  limit?: number;
};

type Props = { content?: CategoriesGridContent };

export default async function CategoriesGridSection({ content = {} }: Props) {
  // Recorded + free + live courses together, not just recorded ones.
  const mixed = await getAllMixedCourses(content.limit ?? 8, "newest");
  const courses = mixed.map((c) => ({ id: `${c.type}-${c.id}`, title: c.title, thumbnail: c.image }));
  const cards = Object.fromEntries(mixed.map((c) => [`${c.type}-${c.id}`, <MixedCourseCard key={`${c.type}-${c.id}`} c={c} />]));

  // Preserve whichever keys the CMS content actually set (so CoursesGridV2's
  // own defaults still apply to anything left unset) while renaming the two
  // fields this section's old shape used.
  const { cta_label, cta_link, ...rest } = content;
  const mappedContent = {
    ...rest,
    ...(cta_label !== undefined && { see_all_label: cta_label }),
    ...(cta_link !== undefined && { see_all_link: cta_link }),
  };

  return (
    <CoursesGridV2 content={mappedContent} courses={courses} cards={cards} showFilters={false} />
  );
}
