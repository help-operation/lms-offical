import { Award, Clock, Globe2, HeadphonesIcon, type LucideIcon } from "lucide-react";

export type FeatureCardItem = {
  icon?: string;
  title?: string;
  desc?: string;
  link?: string;
};

export type FeatureCardsContent = {
  items?: FeatureCardItem[];
};

type Props = { content?: FeatureCardsContent };

const ICON_MAP: Record<string, LucideIcon> = {
  instructor: Award,
  support: HeadphonesIcon,
  access: Clock,
  anywhere: Globe2,
};

const CARD_STYLES = [
  { bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-400", icon: "text-violet-500 dark:text-violet-400" },
  { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", icon: "text-amber-500 dark:text-amber-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", icon: "text-emerald-500 dark:text-emerald-400" },
  { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", icon: "text-rose-500 dark:text-rose-400" },
];

const DEFAULTS: Required<FeatureCardsContent> = {
  items: [
    { icon: "instructor", title: "Expert Instructor", desc: 'Expert Instructor knowledgeable, experienced, and provides quality education and guidance.', link: "/about" },
    { icon: "support", title: "24/7 Support Available", desc: 'With "24/7 Support Available," help is always accessible for any concerns or questions.', link: "/contact" },
    { icon: "access", title: "Lifetime access", desc: 'With "Lifetime access," users have perpetual and unrestricted use of a product or service.', link: "/courses" },
    { icon: "anywhere", title: "Learn Anywhere", desc: 'With "Learn Anywhere," education and skill development can happen from any location, anytime.', link: "/courses" },
  ],
};

export function FeatureCardsV2({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<FeatureCardsContent>;

  return (
    <section className="bg-white py-14 transition-colors duration-300 dark:bg-gray-900">
      <div className="container mx-auto grid grid-cols-1 gap-5 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {d.items.map((item, i) => {
          const style = CARD_STYLES[i % CARD_STYLES.length]!;
          const Icon = ICON_MAP[item.icon ?? ""] ?? Award;
          return (
            <div key={i} className={`rounded-2xl p-6 ${style.bg}`}>
              <Icon className={`h-7 w-7 ${style.icon}`} />
              <h3 className={`mt-4 text-base font-bold ${style.text}`}>{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{item.desc}</p>
              <a href={item.link ?? "#"} className={`mt-4 inline-block text-sm font-semibold underline ${style.text}`}>
                Read More
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FeatureCardsV2;
