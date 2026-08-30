import { Star } from "lucide-react";

export type CourseFacilitiesContent = {
  watermark?: string;
  items?: string[];
};

type Props = { content?: CourseFacilitiesContent };

const DEFAULTS: CourseFacilitiesContent = {
  watermark: "Course Facilities",
  items: [
    "Review Class",
    "Weekly Live Support Class",
    "Job Placement",
    "Class Record",
    "Community Group",
    "One 2 One Support",
    "Certificate",
    "Internship",
    "Freelancing Class",
    "Course Material",
  ],
};

const CourseFacilitiesSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content } as Required<CourseFacilitiesContent>;
  const items = Array.isArray(d.items) && d.items.length > 0 ? d.items : DEFAULTS.items ?? [];
  // Duplicate the list so the marquee can loop seamlessly (translateX -50%)
  const loop = [...items, ...items];

  return (
    <section className="relative hidden overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-24 md:block">
      {/* Faded watermark behind the band */}
      <p className="pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap text-[12vw] font-extrabold text-gray-100 dark:text-gray-800 select-none">
        {d.watermark}
      </p>

      {/* Rotated green marquee band */}
      <div className="relative -rotate-2">
        <div className="bg-gradient-to-r from-brand-from to-brand-to py-5 shadow-lg">
          <div className="flex w-max animate-marquee items-center gap-12 whitespace-nowrap">
            {loop.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-3 text-lg font-bold text-white"
              >
                <Star className="h-4 w-4 fill-white text-white" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseFacilitiesSection;
