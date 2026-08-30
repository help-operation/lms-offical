import Image from "next/image";

export type BrandItem = { name: string; image?: string };

export type PartnersContent = {
  title?: string;
  brands?: (string | BrandItem)[];
};

type Props = { content?: PartnersContent };

const DEFAULTS: { title: string; brands: BrandItem[] } = {
  title: "Our Partners",
  brands: [
    { name: "bdjobs.com",      image: "" },
    { name: "FOODi",           image: "" },
    { name: "FURNITO",         image: "" },
    { name: "GRAHO Academy",   image: "" },
    { name: "MotoFix",         image: "" },
    { name: "Rider's Option",  image: "" },
    { name: "RedData",         image: "" },
    { name: "ShahjiPark",      image: "" },
  ],
};

function normalize(raw: (string | BrandItem)[]): BrandItem[] {
  return raw.map((b) => (typeof b === "string" ? { name: b, image: "" } : b));
}

const PartnersSection = ({ content = {} }: Props) => {
  const title = content.title || DEFAULTS.title;
  const rawBrands = Array.isArray(content.brands) && content.brands.length > 0
    ? content.brands
    : DEFAULTS.brands ?? [];
  const brands = normalize(rawBrands as (string | BrandItem)[]);
  const loop = [...brands, ...brands];

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-extrabold text-brand-600">
          {title}
        </h2>

        <div className="relative mt-12 overflow-hidden">
          {/* Edge fades */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white dark:from-gray-900 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white dark:from-gray-900 to-transparent" />

          <div className="flex w-max animate-marquee items-center gap-6 py-2">
            {loop.map((brand, i) => (
              <div
                key={i}
                className="flex h-16 min-w-[170px] shrink-0 items-center justify-center rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {brand.image ? (
                  <div className="relative w-[120px] h-[48px]">
                    <Image
                      src={brand.image}
                      alt={brand.name}
                      fill
                      className="object-contain"
                      sizes="120px"
                    />
                  </div>
                ) : (
                  <span className="whitespace-nowrap text-base font-bold text-gray-500 dark:text-gray-400">
                    {brand.name}
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

export default PartnersSection;
