export type FoundingTeamContent = {
  title?: string;
  members?: { name: string; role: string; image: string }[];
};

type Props = { content?: FoundingTeamContent };

const DEFAULTS: Required<FoundingTeamContent> = {
  title: "Our Founding Team",
  members: [
    { name: "Majadur Rahaman Robin", role: "FOUNDER & CEO", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop" },
    { name: "Arif M Rajon",          role: "CBO",           image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop" },
    { name: "MD Kuhel Ahmed",        role: "CTO",           image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=400&fit=crop" },
  ],
};

const FoundingTeamSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };
  const members = Array.isArray(d.members) && d.members.length > 0 ? d.members : DEFAULTS.members;

  return (
    <section className="relative overflow-hidden bg-brand-50 py-16 transition-colors duration-300 dark:bg-gray-800 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-[40px] font-bold text-brand-600 dark:text-brand-400">
          {d.title}
        </h2>

        <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Recurring ring accent */}
          <span className="absolute left-1/2 top-24 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white ring-2 ring-brand-300 dark:bg-gray-900 dark:ring-brand-500/40 lg:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-600 dark:bg-brand-400" />
          </span>

          {members.map((m, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto h-44 w-full max-w-[260px] overflow-hidden rounded-xl shadow-md">
                <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{m.name}</h3>
              <p className="mt-1 text-sm font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                {m.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FoundingTeamSection;
