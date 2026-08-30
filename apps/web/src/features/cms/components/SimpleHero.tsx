/**
 * Shared hero banner used by `simple_hero` CMS sections (contact, faq, etc.).
 * Same gradient look across all pages so admins get visual consistency.
 */
export type SimpleHeroContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

type Props = { content?: SimpleHeroContent };

const DEFAULTS: Required<SimpleHeroContent> = {
  eyebrow:  "",
  title:    "",
  subtitle: "",
};

const SimpleHero = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-hero to-white transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-tint/40 blur-3xl dark:bg-brand-600/25" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-tint/40 blur-3xl dark:bg-brand-600/25" />

      <div className="container relative mx-auto px-4 py-12 text-center sm:py-16">
        {d.eyebrow && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 sm:text-sm">
            {d.eyebrow}
          </p>
        )}
        {d.title && (
          <h1 className="text-3xl font-bold text-amber-600 dark:text-amber-400 md:text-[44px]">
            {d.title}
          </h1>
        )}
        {d.subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft dark:text-gray-400 md:text-base">
            {d.subtitle}
          </p>
        )}
      </div>
    </section>
  );
};

export default SimpleHero;
