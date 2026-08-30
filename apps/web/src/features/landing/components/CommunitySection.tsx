import { Heart } from "lucide-react";

export type CommunityContent = {
  title?: string;
  subtitle?: string;
  members_label?: string;
  members_count?: string;
  avatars?: string[];
};

type Props = { content?: CommunityContent };

const DEFAULTS: CommunityContent = {
  title:         "Join the largest learning community",
  subtitle:
    "With direct guidance from experienced instructors and round-the-clock skill assurance, our project-based skill development and career-focused community brings everything a market or freelancing platform demands — professionals all in one place.",
  members_label: "Our learners now",
  members_count: "22 thousand+",
  avatars: [
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b332906c?w=80&h=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
  ],
};

const PIN_POSITIONS = [
  "top-[30%] left-[22%]",
  "top-[20%] left-[70%]",
  "top-[62%] left-[52%]",
  "top-[70%] left-[30%]",
  "top-[66%] left-[78%]",
];

const CommunitySection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content } as Required<CommunityContent>;
  const avatars = Array.isArray(d.avatars) && d.avatars.length > 0 ? d.avatars : DEFAULTS.avatars ?? [];
  const pins = avatars
    .slice(0, PIN_POSITIONS.length)
    .map((img, i) => ({ img, pos: PIN_POSITIONS[i]! }));

  // Render heading on two lines if it contains a comma or " " separator
  const titleStr = d.title ?? "";
  const titleLines = titleStr.includes("\n") ? titleStr.split("\n") : [titleStr];

  return (
    <section className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <h2 className="text-center text-3xl md:text-[40px] font-bold leading-tight text-brand-600">
          {titleLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < titleLines.length - 1 && <br />}
            </span>
          ))}
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {d.subtitle}
        </p>

        {/* Members badge */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-brand-300 dark:border-brand-700 px-5 py-2">
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{d.members_label}</span>
            <div className="flex -space-x-2">
              {avatars.slice(0, 5).map((a, i) => (
                <img
                  key={i}
                  src={a}
                  alt=""
                  className="h-6 w-6 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                />
              ))}
            </div>
            <span className="text-sm font-bold text-brand-600">{d.members_count}</span>
          </div>
        </div>

        {/* Dotted world map with avatar pins */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          {/* Recurring ring accent */}
          <span className="absolute -right-2 top-1/3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-gray-800 ring-2 ring-brand-300">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
          </span>

          {/* Dotted field */}
          <div className="relative h-[280px] w-full rounded-2xl bg-[radial-gradient(var(--color-map-dot)_1.4px,transparent_1.4px)] [background-size:14px_14px] sm:h-[360px]">
            {/* Dashed connectors */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              fill="none"
            >
              <path d="M22 18 Q 45 2 70 12" stroke="var(--color-accent)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
              <path d="M22 18 Q 35 35 52 37" stroke="var(--color-accent)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
              <path d="M52 37 Q 65 30 78 40" stroke="var(--color-accent)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
              <path d="M52 37 Q 40 45 30 42" stroke="var(--color-accent)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
            </svg>

            {/* Avatar pins */}
            {pins.map((p, i) => (
              <div
                key={i}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${p.pos}`}
              >
                <img
                  src={p.img}
                  alt=""
                  className="h-12 w-12 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-md ring-2 ring-brand-400 sm:h-14 sm:w-14"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
