import { ExternalLink } from "lucide-react";
import Link from "next/link";

export type AboutIntroContent = {
  title?: string;
  intro_lead?: string;
  intro_link_text?: string;
  intro_link_url?: string;
  intro_paragraph?: string;
  subsections?: { title: string; paragraphs: string[] }[];
};

type Props = { content?: AboutIntroContent };

const DEFAULTS: Required<AboutIntroContent> = {
  title: "About Us",
  intro_lead: "One of today's most popular online learning platforms — ",
  intro_link_text: "SkillKoro.com",
  intro_link_url: "/",
  intro_paragraph:
    "SkillKoro.com's journey began in 2018. Although it started primarily with domain-hosting and bulk SMS marketing, in 2024 — under the leadership of Majadur Rahaman Robin — SkillKoro was re-established with a single goal: to make IT education simple and accessible for everyone worldwide and to help them develop their careers.",
  subsections: [
    {
      title: "Our Founders",
      paragraphs: [
        "Founded by angel investor and entrepreneur Mr. Rafid Ahsan Noor, alongside co-founder Mr. Arif M Rajon who joined in June 2024, SkillKoro.com formally began its journey with government approval and has steadily moved forward, earning growing trust. Through modern skill-development courses, real-life projects and industry-expert mentors, we are preparing the next generation for tomorrow's job and freelancing markets.",
      ],
    },
    {
      title: "Our Belief & Goal",
      paragraphs: [
        "With the right guidance, skills and opportunity, anyone can move forward toward success.",
        "Smart learning to build your future — with us. Through skill development we make you job-ready. On this online platform you get practical, industry-ready courses built under experienced mentors. After every course you also get job-placement support, so learning is never the end of the road.",
      ],
    },
    {
      title: "Interested in a job or freelancing?",
      paragraphs: ["Then our courses are made for you!"],
    },
  ],
};

const AboutIntro = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };
  const subsections = Array.isArray(d.subsections) && d.subsections.length > 0
    ? d.subsections
    : DEFAULTS.subsections;

  return (
    <section className="relative overflow-hidden bg-white py-16 transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 lg:py-20">
      <span className="absolute right-8 top-28 hidden h-9 w-9 items-center justify-center rounded-full bg-white ring-2 ring-brand-300 dark:bg-gray-900 dark:ring-brand-500/40 lg:flex">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-600 dark:bg-brand-400" />
      </span>

      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="text-3xl md:text-[40px] font-bold text-brand-600 dark:text-brand-400">{d.title}</h1>

        <p className="mt-5 text-base leading-relaxed text-ink-soft dark:text-gray-400">
          {d.intro_lead}
          <Link
            href={d.intro_link_url}
            className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {d.intro_link_text} <ExternalLink className="h-4 w-4" />
          </Link>
        </p>

        <p className="mt-4 text-base leading-relaxed text-ink-soft dark:text-gray-400">{d.intro_paragraph}</p>

        <div className="mt-12 space-y-10">
          {subsections.map((s, i) => (
            <div key={i}>
              <h2 className="text-xl font-bold text-brand-600 dark:text-brand-400">{s.title}</h2>
              {(s.paragraphs ?? []).map((p, j) => (
                <p key={j} className="mt-3 text-base leading-relaxed text-ink-soft dark:text-gray-400">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutIntro;
