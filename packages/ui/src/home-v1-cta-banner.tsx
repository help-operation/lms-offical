
export type CtaBannerContent = {
  eyebrow?: string;
  title_line1?: string;
  title_line2?: string;
  cta_label?: string;
  cta_link?: string;
};

type Props = { content?: CtaBannerContent };

const DEFAULTS: Required<CtaBannerContent> = {
  eyebrow: "The Best Choice",
  title_line1: "Apply for Your favorite",
  title_line2: "Courses Today !",
  cta_label: "Apply Now",
  cta_link: "/courses",
};

export function CtaBannerV2({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<CtaBannerContent>;

  return (
    <section className="relative overflow-hidden bg-brand-600 py-16 text-center text-white">
      <div className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">{d.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
          {d.title_line1}
          <br />
          {d.title_line2}
        </h2>
        <a
          href={d.cta_link}
          className="mt-7 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          {d.cta_label}
        </a>
      </div>
    </section>
  );
}

export default CtaBannerV2;
