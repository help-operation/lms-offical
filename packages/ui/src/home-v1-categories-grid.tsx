import { BookOpen, Tag } from "lucide-react";

export type CategoryItem = {
  title?: string;
  image?: string;
  course_count?: string;
};

export type CategoriesGridContent = {
  eyebrow?: string;
  title?: string;
  cta_label?: string;
  cta_link?: string;
  items?: CategoryItem[];
};

type Props = { content?: CategoriesGridContent };

const DEFAULTS: Required<CategoriesGridContent> = {
  eyebrow: "Learn Best Things",
  title: "Explore Courses by Categories",
  cta_label: "View all Courses",
  cta_link: "/courses",
  items: [
    { title: "Graphic Design", course_count: "Over 700 Courses", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300&h=300&fit=crop" },
    { title: "UI/UX Design", course_count: "Over 480 Courses", image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=300&h=300&fit=crop" },
    { title: "Software Development", course_count: "Over 190 Courses", image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=300&fit=crop" },
    { title: "Web Development", course_count: "Over 540 Courses", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=300&fit=crop" },
    { title: "Photography", course_count: "Over 340 Courses", image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=300&fit=crop" },
    { title: "Audio + Music", course_count: "Over 320 Courses", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop" },
    { title: "Digital Marketing", course_count: "Over 720 Courses", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=300&fit=crop" },
    { title: "3D + Animation", course_count: "Over 910 Courses", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=300&fit=crop" },
  ],
};

export function CategoriesGridV2({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<CategoriesGridContent>;

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{d.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{d.title}</h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {d.items.map((cat, i) => (
            <a
              key={i}
              href={`/courses?search=${encodeURIComponent(cat.title ?? "")}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="relative h-[190px] w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute left-3 top-3">
                  <span className="flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-xs font-bold text-white">
                    <Tag className="h-3 w-3" />
                    Category
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  {cat.course_count}
                </div>

                <h3 className="mt-3 line-clamp-2 min-h-[48px] text-[15px] font-bold text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                  {cat.title}
                </h3>

                <div className="mt-auto flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-gray-700">
                  <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">Browse courses</span>
                  <span className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-4 py-2 text-sm font-bold text-white shadow-md transition-all group-hover:scale-105">
                    Explore
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={d.cta_link}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {d.cta_label}
          </a>
        </div>
      </div>
    </section>
  );
}

export default CategoriesGridV2;
