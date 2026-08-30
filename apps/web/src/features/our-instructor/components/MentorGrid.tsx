import { getPublicInstructors } from "@/features/cms/api/instructors";

export type MentorGridContent = Record<string, unknown>;
type Props = { content?: MentorGridContent };

const MentorGrid = async ({ content: _ }: Props) => {
  const instructors = await getPublicInstructors();

  if (instructors.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-14">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {instructors.map((m) => {
          const name = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
          return (
            <div
              key={m.id}
              className="overflow-hidden rounded-2xl border border-brand-100 bg-white p-3 text-center shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gray-100">
                {m.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatar} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-50 text-3xl font-bold text-brand-300">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-base font-bold text-brand-600">{name}</h3>
              <p className="mb-2 mt-1 text-sm text-ink-soft">{m.expertise || "Instructor"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MentorGrid;
