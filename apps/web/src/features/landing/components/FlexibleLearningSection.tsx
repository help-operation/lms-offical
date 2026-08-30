export type FlexibleLearningContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  stats?: { value: string; label: string }[];
};

type Props = { content?: FlexibleLearningContent };

const DEFAULTS: FlexibleLearningContent = {
  eyebrow:  "Why Choose Us",
  title:    "The country's best fastest skill development platform",
  subtitle: "Build your future through real-world projects, expert instructors, and up-to-date courses.",
  image:    "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&h=700&fit=crop",
  stats: [
    { value: "2+",    label: "Instructors"           },
    { value: "4212+", label: "Learners"              },
    { value: "17%",   label: "Course completion rate" },
    { value: "4+",    label: "Total courses"         },
  ],
};

const FlexibleLearningSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content } as Required<FlexibleLearningContent>;
  const stats = Array.isArray(d.stats) ? d.stats : DEFAULTS.stats ?? [];

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-6 sm:p-10 lg:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* Left — image */}
            <div className="overflow-hidden rounded-2xl shadow-md">
              <img
                src={d.image}
                alt={d.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Right — copy + stats */}
            <div>
              <h2 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white md:text-[40px] md:leading-[1.2]">
                {d.title}
              </h2>
              <p className="mt-4 max-w-md text-base text-gray-500 dark:text-gray-400">{d.subtitle}</p>

              <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10">
                {(stats as { value: string; label: string }[]).map((s, i) => (
                  <div
                    key={i}
                    className="relative ps-4 after:absolute after:left-0 after:top-0 after:h-full after:w-[3px] after:rounded-full after:bg-brand-600 after:content-['']"
                  >
                    <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">{s.value}</p>
                    <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlexibleLearningSection;
