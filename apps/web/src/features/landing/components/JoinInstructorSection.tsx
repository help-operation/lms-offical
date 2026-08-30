import Link from "next/link";

export type JoinInstructorContent = {
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_link?: string;
  image?: string;
};

type Props = { content?: JoinInstructorContent };

const DEFAULTS: JoinInstructorContent = {
  title:     "Join as an instructor",
  subtitle:  "Open up a unique new chapter in your own career.",
  cta_label: "Join now",
  cta_link:  "/contact",
  image:     "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=600&fit=crop",
};

const JoinInstructorSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content } as Required<JoinInstructorContent>;

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-200 via-brand-300 to-brand-400">
          <div className="grid items-center lg:grid-cols-2">
            {/* Left — copy */}
            <div className="p-8 sm:p-12 lg:p-16">
              <h2 className="text-3xl md:text-[40px] font-bold leading-tight text-gray-900">
                {d.title}
              </h2>
              <p className="mt-4 text-base text-gray-700">
                {d.subtitle}
              </p>
              <Link
                href={d.cta_link}
                className="mt-8 inline-flex rounded-md bg-gradient-to-r from-brand-from to-brand-to px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
              >
                {d.cta_label}
              </Link>
            </div>

            {/* Right — instructors image */}
            <div className="relative h-64 lg:h-full">
              <img
                src={d.image}
                alt="Instructors"
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinInstructorSection;
