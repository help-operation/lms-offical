import { getAllMixedCourses, type MixedCourse } from "@/features/landing/api/landing.api";
import AllCoursesSectionClient from "./AllCoursesSectionClient";

export type AllCoursesContent = {
  title_prefix?: string;
  title_highlight?: string;
  title_suffix?: string;
  see_all_label?: string;
  see_all_link?: string;
  rows?: number;
  sort_order?: string;
};

type Props = { content?: AllCoursesContent };

const DEFAULTS: AllCoursesContent = {
  title_prefix:    "All",
  title_highlight: "Courses",
  title_suffix:    "",
  see_all_label:   "See all",
  see_all_link:    "/courses",
  rows:            2,
  sort_order:      "newest",
};

export default async function AllCoursesSection({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<AllCoursesContent>;
  const rows = Math.max(1, Math.round(d.rows));
  const courseList = await getAllMixedCourses(rows * 4, d.sort_order);

  if (courseList.length === 0) return null;

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <AllCoursesSectionClient courses={courseList} d={d} />
      </div>
    </section>
  );
}
