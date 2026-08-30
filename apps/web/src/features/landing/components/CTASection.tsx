import Link from "next/link";

export type CTAContent = {
  title?: string;
  subtitle?: string;
  primary_cta?: string;
  primary_cta_link?: string;
  secondary_cta?: string;
  secondary_cta_link?: string;
};

type Props = { content?: CTAContent };

const DEFAULTS: CTAContent = {
  title:               "Admissions Open",
  subtitle:            "Don't delay the decision to build your career. Join us, start your skill development journey, and enroll in the best courses.",
  primary_cta:         "Visit the community",
  primary_cta_link:    "/community",
  secondary_cta:       "Browse courses",
  secondary_cta_link:  "/courses",
};

const CTASection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content } as Required<CTAContent>;

  return (
    <section className="bg-gradient-to-br from-surface-cta via-surface-cta-mid to-surface-teal px-4 py-20">
      <div className="container mx-auto text-center text-white">
        <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">{d.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 md:text-lg">
          {d.subtitle}
        </p>

        <div className="mt-10 flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href={d.primary_cta_link ?? "#"}
            className="rounded-md border-2 border-white px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-surface-teal sm:px-7 sm:py-3 sm:text-base"
          >
            {d.primary_cta}
          </Link>
          <Link
            href={d.secondary_cta_link ?? "#"}
            className="rounded-md border-2 border-white px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-surface-teal sm:px-7 sm:py-3 sm:text-base"
          >
            {d.secondary_cta}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
