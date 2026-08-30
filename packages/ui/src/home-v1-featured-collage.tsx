import { CountUpNumber } from "./home-v1-count-up-number";

export type StatItem = { label?: string; value?: string };

export type FeaturedCollageContent = {
  eyebrow?: string;
  title?: string;
  images?: string[];
  stats?: StatItem[];
};

type Props = { content?: FeaturedCollageContent };

const DEFAULTS: Required<FeaturedCollageContent> = {
  eyebrow: "New Courses",
  title: "Newly Launched Courses",
  images: [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&h=700&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=340&h=220&fit=crop",
    "https://images.unsplash.com/photo-1517842645767-c639042777db?w=340&h=220&fit=crop",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=340&h=440&fit=crop",
  ],
  stats: [
    { label: "Users", value: "123456" },
    { label: "Instructors", value: "123456" },
    { label: "Students", value: "123456" },
    { label: "Enrollment", value: "123456" },
    { label: "Courses", value: "123456" },
  ],
};

export function FeaturedCollageV2({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<FeaturedCollageContent>;
  const [big, ...rest] = d.images;

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{d.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{d.title}</h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {big && (
            <div className="col-span-1 row-span-2 overflow-hidden rounded-2xl">
              <img src={big} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          {rest.slice(0, 3).map((src, i) => (
            <div key={i} className={`overflow-hidden rounded-2xl ${i === 2 ? "row-span-2" : ""}`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-6 dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-5">
          {d.stats.map((stat, i) => (
            <div key={i} className="text-center">
              <CountUpNumber value={stat.value ?? "0"} className="text-2xl font-extrabold text-brand-700 dark:text-brand-400" />
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedCollageV2;
