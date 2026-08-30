import Link from "next/link";

export type ComingSoonCardContent = {
  message?: string;
  subtext_lead?: string;
  subtext_link_text?: string;
  subtext_link_url?: string;
  subtext_trail?: string;
  cta_label?: string;
  cta_link?: string;
};

type Props = { content?: ComingSoonCardContent };

const DEFAULTS: Required<ComingSoonCardContent> = {
  message:           "🎓 Don't worry! New free courses are being added soon — stay tuned!",
  subtext_lead:      "For deeper learning, take a look at our ",
  subtext_link_text: "premium courses",
  subtext_link_url:  "/courses",
  subtext_trail:     ".",
  cta_label:         "Browse premium courses",
  cta_link:          "/courses",
};

const ComingSoonCard = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
        <p className="text-base font-semibold text-gray-800">{d.message}</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
          {d.subtext_lead}
          <Link
            href={d.subtext_link_url}
            className="font-semibold text-brand-600 hover:underline"
          >
            {d.subtext_link_text}
          </Link>
          {d.subtext_trail}
        </p>
        <Link
          href={d.cta_link}
          className="mt-6 inline-flex rounded-md bg-gradient-to-r from-brand-from to-brand-to px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
        >
          {d.cta_label}
        </Link>
      </div>
    </div>
  );
};

export default ComingSoonCard;
