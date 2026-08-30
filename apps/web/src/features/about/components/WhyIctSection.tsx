export type WhyIctContent = {
  title?: string;
  reasons?: { title: string; desc: string }[];
};

type Props = { content?: WhyIctContent };

const DEFAULTS: Required<WhyIctContent> = {
  title: "The skill journey — why SkillKoro?",
  reasons: [
    {
      title: "Guidance from the country's best entrepreneurs",
      desc: "Direct guidance and hands-on skill assurance from experienced, real-world instructors.",
    },
    {
      title: "Corporate or freelancing-demand courses",
      desc: "Project-based skill development built to match the demands of the job market or freelancing platforms.",
    },
    {
      title: "Professional networking",
      desc: "A career-growth community where students and professionals connect — all in one place.",
    },
  ],
};

const WhyIctSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };
  const reasons = Array.isArray(d.reasons) && d.reasons.length > 0 ? d.reasons : DEFAULTS.reasons;

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-[40px] font-bold text-brand-600 dark:text-brand-400">
          {d.title}
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {reasons.map((r, i) => (
            <div key={i} className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{r.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft dark:text-gray-400">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyIctSection;
