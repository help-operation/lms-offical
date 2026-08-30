export type InstructorsGridContent = {
  eyebrow?: string;
  title?: string;
  limit?: number;
};

export type InstructorGridItem = {
  id: string | number;
  name: string;
  avatar?: string | null;
  expertise?: string | null;
};

type Props = {
  content?: InstructorsGridContent;
  instructors: InstructorGridItem[];
};

const DEFAULTS: Required<InstructorsGridContent> = {
  eyebrow: "Our Instructor",
  title: "Meet Our Skill Instructors",
  limit: 4,
};

export function InstructorsGridV2({ content = {}, instructors }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<InstructorsGridContent>;

  if (instructors.length === 0) return null;
  const shown = instructors.slice(0, d.limit);

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{d.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{d.title}</h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((inst) => (
            <div key={inst.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
              <div className="aspect-[4/3] w-full overflow-hidden">
                {inst.avatar ? (
                  <img src={inst.avatar} alt={inst.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-100 text-3xl font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    {inst.name.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{inst.name}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{inst.expertise || "Instructor"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default InstructorsGridV2;
