import Image from "next/image";
import { Award as AwardIcon, Laptop, MonitorCheck, Activity, type LucideIcon } from "lucide-react";

export type CertificateContent = {
  title?: string;
  subtitle?: string;
  certificate_image?: string;
  features?: { title: string; desc: string }[];
};

type Props = { content?: CertificateContent };

const ICONS: LucideIcon[] = [AwardIcon, Laptop, MonitorCheck, Activity];

const DEFAULTS: CertificateContent = {
  title: "Let the goal be to become skilled",
  subtitle:
    "Learn easily, wherever you are — the treasure of knowledge is now in the palm of your hand.",
  certificate_image: "",
  features: [
    { title: "Recognition of your skills", desc: "The certificate earned after completing a course is recognition of your acquired knowledge and skills, which plays an important role in your career." },
    { title: "Valuable in the workplace", desc: "This certificate helps you move forward in your workplace and establishes you as a professional." },
    { title: "A symbol of trust", desc: "It is a symbol of trust that ensures the quality of your skills and training, and keeps you motivated." },
    { title: "Helps career development", desc: "This certificate helps open new horizons in your career, preparing you for new opportunities and challenges." },
  ],
};

const Certificate = () => (
  <div className="relative rounded-2xl bg-white p-3 shadow-xl">
    {/* Cream certificate body with decorative double border */}
    <div className="relative bg-surface-cream px-6 py-8 sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute inset-2 border-[3px] border-cream-frame" />
      <div className="pointer-events-none absolute inset-[14px] border border-cream-gold" />
      {/* Corner dots */}
      <span className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full border-2 border-cream-frame" />
      <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full border-2 border-cream-frame" />
      <span className="absolute bottom-4 left-4 h-2.5 w-2.5 rounded-full border-2 border-cream-frame" />
      <span className="absolute bottom-4 right-4 h-2.5 w-2.5 rounded-full border-2 border-cream-frame" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-sm font-extrabold text-white">
                b
              </span>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">
                ICT<span className="text-brand-600">BANGLA</span>
              </span>
            </div>
            <span className="mt-1 text-[8px] uppercase tracking-[0.2em] text-gray-400">
              Invest In Your Skills, Unlock Your Future
            </span>
          </div>
          <div className="text-right">
            <p className="font-serif text-3xl font-bold leading-none text-red-700">
              Certificate
            </p>
            <p className="mt-1 text-xs font-semibold tracking-[0.3em] text-gray-700">
              OF COMPLETION
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="mt-8 flex gap-6">
          {/* Left meta */}
          <div className="w-24 shrink-0 space-y-5 pt-2 text-[10px] text-gray-500">
            <div>
              <p className="font-semibold text-gray-600">ID NO.</p>
              <p className="tracking-widest text-gray-400">- - - - - -</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">DATE OF ISSUE</p>
              <p className="text-gray-400">DD MM YYYY</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">BATCH NO.</p>
              <p className="tracking-widest text-gray-400">- - - - - -</p>
            </div>
          </div>

          {/* Center text */}
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-600">This is to Certify that</p>
            <p className="mt-2 text-xl font-extrabold tracking-wide text-gray-900">
              STUDENT <span className="text-brand-600">NAME</span>
            </p>
            <p className="mt-2 text-xs text-gray-600">
              has successfully completed all the steps of the course
            </p>
            <p className="mt-3 text-sm font-bold text-gray-900">COURSE NAME</p>
            <p className="mt-1 text-[11px] text-gray-500">
              held on DD MM , YYYY to DD MM , YYYY at SkillKoro.com
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-end justify-between">
          {/* QR placeholder */}
          <div className="grid h-16 w-16 grid-cols-4 grid-rows-4 gap-px bg-gray-900 p-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className={(i * 7) % 3 === 0 ? "bg-white" : "bg-gray-900"}
              />
            ))}
          </div>

          {/* Seal */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 text-sm font-extrabold text-white shadow-md">
            b
          </div>

          {/* Signatures */}
          <div className="flex gap-8 text-center text-[9px] text-gray-500">
            <div>
              <div className="mb-1 border-t border-gray-400 pt-1 font-bold text-gray-700">
                MENTOR NAME
              </div>
              <p>Instructor, Course Name</p>
              <p>SkillKoro</p>
            </div>
            <div>
              <div className="mb-1 border-t border-gray-400 pt-1 font-bold text-gray-700">
                MAJADUR RAHAMAN ROBIN
              </div>
              <p>CEO, Founder</p>
              <p>SkillKoro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CertificateSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content } as Required<CertificateContent>;
  const features = (Array.isArray(d.features) && d.features.length > 0 ? d.features : DEFAULTS.features) ?? [];
  const certImage = (content as CertificateContent).certificate_image;

  return (
    <section className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      {/* Faint background circles */}
      <div className="pointer-events-none absolute right-10 top-40 h-72 w-72 rounded-full bg-gray-100/70 dark:bg-gray-800/70" />
      <div className="pointer-events-none absolute left-10 bottom-10 h-56 w-56 rounded-full bg-gray-100/60 dark:bg-gray-800/60" />

      <div className="container relative mx-auto px-4">
        {/* Heading */}
        <h2 className="text-center text-3xl md:text-[40px] font-bold text-brand-600">
          {d.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-gray-500 dark:text-gray-400">
          {d.subtitle}
        </p>

        {/* Content */}
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          {/* Certificate with top ring accent */}
          <div className="relative">
            <span className="absolute -top-7 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white dark:bg-gray-800 ring-2 ring-brand-300">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            {certImage ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={certImage}
                  alt="Certificate"
                  width={700}
                  height={500}
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              <Certificate />
            )}
          </div>

          {/* Features grid */}
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {features.map((f, i) => {
              const Icon = ICONS[i % ICONS.length] ?? AwardIcon;
              return (
                <div key={i}>
                  <Icon className="h-9 w-9 text-cream-frame" strokeWidth={1.5} />
                  <h3 className="mt-4 text-lg font-bold text-brand-600">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CertificateSection;
