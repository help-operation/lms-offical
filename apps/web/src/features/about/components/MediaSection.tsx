import Link from "next/link";

export type MediaContent = {
  title?: string;
  articles?: {
    id: number;
    outlet: string;
    date: string;
    image: string;
    title: string;
    link?: string;
  }[];
};

type Props = { content?: MediaContent };

const DEFAULTS: Required<MediaContent> = {
  title: "SkillKoro in Media",
  articles: [
    { id: 1, outlet: "THE BUSINESS STANDARD", date: "25th Nov 2025", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=360&fit=crop", title: "SkillKoro launches idea innovation 5.0", link: "/blog" },
    { id: 2, outlet: "THE BUSINESS STANDARD", date: "25th Nov 2025", image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=360&fit=crop", title: "SkillKoro launches idea innovation 5.0", link: "/blog" },
    { id: 3, outlet: "THE BUSINESS STANDARD", date: "25th Nov 2025", image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=360&fit=crop", title: "SkillKoro launches idea innovation 5.0", link: "/blog" },
  ],
};

const MediaSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };
  const articles = Array.isArray(d.articles) && d.articles.length > 0 ? d.articles : DEFAULTS.articles;

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-[40px] font-bold text-brand-600 dark:text-brand-400">
          {d.title}
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition-colors hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {a.outlet}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{a.date}</span>
              </div>

              <div className="mt-3 h-44 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
                <img src={a.image} alt={a.title} className="h-full w-full object-cover" />
              </div>

              <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">{a.title}</h3>
              <Link
                href={a.link ?? "/blog"}
                className="mt-3 inline-block text-sm font-semibold text-brand-600 underline hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Read Full Article
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MediaSection;
