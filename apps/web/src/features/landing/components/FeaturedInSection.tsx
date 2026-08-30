import Image from "next/image";

type OutletItem = { name: string; image?: string };

export type FeaturedInContent = {
  title_prefix?: string;
  title_highlight?: string;
  title_suffix?: string;
  outlets?: (string | OutletItem)[];
};

type Props = { content?: FeaturedInContent };

const DEFAULTS: Omit<FeaturedInContent, "outlets"> & { outlets: OutletItem[] } = {
  title_prefix:    "WE",
  title_highlight: "FEATURED",
  title_suffix:    "IN",
  outlets: [
    { name: "Dhaka Tribune",     image: "" },
    { name: "Suchipotro",        image: "" },
    { name: "dhaka.digit",       image: "" },
    { name: "Swadesh Bangla",    image: "" },
    { name: "The Daily Campus",  image: "" },
    { name: "MIRROR NEWS",       image: "" },
    { name: "Somoy Journal",     image: "" },
    { name: "News Express",      image: "" },
  ],
};

function normalize(raw: (string | OutletItem)[]): OutletItem[] {
  return raw.map((o) => (typeof o === "string" ? { name: o, image: "" } : o));
}

const FeaturedInSection = ({ content = {} }: Props) => {
  const title_prefix    = content.title_prefix    ?? DEFAULTS.title_prefix;
  const title_highlight = content.title_highlight ?? DEFAULTS.title_highlight;
  const title_suffix    = content.title_suffix    ?? DEFAULTS.title_suffix;

  const rawOutlets = Array.isArray(content.outlets) && content.outlets.length > 0
    ? content.outlets
    : DEFAULTS.outlets ?? [];
  const outlets = normalize(rawOutlets as (string | OutletItem)[]);
  const loop = [...outlets, ...outlets];

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-extrabold tracking-wide text-gray-900 dark:text-white">
          {title_prefix} <span className="text-brand-600 dark:text-brand-400">{title_highlight}</span> {title_suffix}
        </h2>

        <div className="relative mt-12 overflow-hidden">
          {/* Edge fades */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white dark:from-gray-900 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white dark:from-gray-900 to-transparent" />

          <div className="flex w-max animate-marquee items-center gap-6 py-2">
            {loop.map((outlet, i) => (
              <div
                key={i}
                className="flex h-16 min-w-[170px] shrink-0 items-center justify-center rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {outlet.image ? (
                  <div className="relative w-[120px] h-[48px]">
                    <Image
                      src={outlet.image}
                      alt={outlet.name}
                      fill
                      className="object-contain"
                      sizes="120px"
                    />
                  </div>
                ) : (
                  <span className="whitespace-nowrap text-base font-bold text-gray-500 dark:text-gray-400">
                    {outlet.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedInSection;
