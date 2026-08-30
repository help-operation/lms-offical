export type MilestonesContent = {
  title?: string;
  subtitle?: string;
  milestones?: { date: string; desc: string }[];
};

type Props = { content?: MilestonesContent };

const DEFAULTS: Required<MilestonesContent> = {
  title: "How far we've come",
  subtitle: "The biggest achievement at SkillKoro is including you as a true companion of time.",
  milestones: [
    { date: "26 December, 2019", desc: "Participated in the BYLC Youth Carnival 2019." },
    { date: "26 December, 2019", desc: "Participated in the BYLC Youth Carnival 2019." },
    { date: "26 December, 2019", desc: "Participated in the BYLC Youth Carnival 2019." },
    { date: "26 December, 2019", desc: "Participated in the BYLC Youth Carnival 2019." },
  ],
};

const MilestonesSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };
  const milestones = Array.isArray(d.milestones) && d.milestones.length > 0 ? d.milestones : DEFAULTS.milestones;

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-[40px] font-bold text-brand-600 dark:text-brand-400">
          {d.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-ink-soft dark:text-gray-400">
          {d.subtitle}
        </p>

        <div className="relative mx-auto mt-16 max-w-4xl">
          {/* Center line */}
          <span className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-brand-200 dark:bg-gray-700 md:block" />

          <div className="space-y-10">
            {milestones.map((m, i) => {
              const dateLeft = i % 2 === 0;
              return (
                <div
                  key={i}
                  className="relative grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-12"
                >
                  {/* Dot */}
                  <span className="absolute left-1/2 top-4 hidden h-4 w-4 -translate-x-1/2 rounded-full bg-brand-600 ring-4 ring-brand-100 dark:bg-brand-400 dark:ring-brand-500/20 md:block" />

                  {dateLeft ? (
                    <>
                      <p className="font-bold text-brand-600 dark:text-brand-400 md:pr-12 md:text-right">
                        {m.date}
                      </p>
                      <p className="text-sm leading-relaxed text-ink-soft dark:text-gray-400 md:pl-12">
                        {m.desc}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="order-2 text-sm leading-relaxed text-ink-soft dark:text-gray-400 md:order-1 md:pr-12 md:text-right">
                        {m.desc}
                      </p>
                      <p className="order-1 font-bold text-brand-600 dark:text-brand-400 md:order-2 md:pl-12">
                        {m.date}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MilestonesSection;
