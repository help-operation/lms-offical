export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  tags: string[];
  dbTemplate: "1" | "2" | "3" | "4" | "5" | "6";   // value stored in DB template column
  previewSections: Array<{ color: string; h: string }>;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "mastery",
    dbTemplate: "1",
    name: "Mastery Style",
    description:
      "Bold Bangladeshi-style landing page — hero countdown, curriculum accordion, instructor cards, value breakdown. Inspired by 10 Minute School / CodersTrust.",
    thumbnail: "",
    tags: ["Popular", "Full-featured"],
    previewSections: [
      { color: "bg-indigo-900", h: "h-10" },
      { color: "bg-indigo-500", h: "h-5" },
      { color: "bg-white border", h: "h-8" },
      { color: "bg-gray-50 border", h: "h-10" },
      { color: "bg-white border", h: "h-8" },
      { color: "bg-indigo-50 border", h: "h-8" },
    ],
  },
  {
    id: "sales",
    dbTemplate: "2",
    name: "Sales Style",
    description:
      "High-converting red sales page — hero video, countdown timer, comparison table, phase timeline, FAQ accordion, PC requirements, testimonials carousel. Inspired by Computer School BD.",
    thumbnail: "",
    tags: ["New", "High-converting"],
    previewSections: [
      { color: "bg-white border", h: "h-10" },
      { color: "bg-gray-100 border", h: "h-14" },
      { color: "bg-white border", h: "h-10" },
      { color: "bg-gray-50 border", h: "h-8" },
      { color: "bg-red-600", h: "h-6" },
      { color: "bg-white border", h: "h-8" },
    ],
  },
  {
    id: "membership",
    dbTemplate: "3",
    name: "Membership Style",
    description:
      "Dark navy membership/community landing page — marquee ticker, stats bar, why-join grid, 3×3 features, level roadmap, member review slider, success stories, video grid, 2-col FAQ. Inspired by OTA-style community programs.",
    thumbnail: "",
    tags: ["Community", "Membership"],
    previewSections: [
      { color: "bg-slate-900", h: "h-10" },
      { color: "bg-slate-800 border", h: "h-8" },
      { color: "bg-slate-900", h: "h-6" },
      { color: "bg-slate-800 border", h: "h-10" },
      { color: "bg-slate-900", h: "h-8" },
      { color: "bg-amber-500", h: "h-5" },
    ],
  },
  {
    id: "nexemy",
    dbTemplate: "4",
    name: "Nexemy Style",
    description:
      "Light/white + deep purple Nexemy-inspired page — question-headed hero, flat emoji curriculum, student progress gallery, for-whom cards, instructor bio+video, dark module grid, value cards, pricing card, support section, countdown banner.",
    thumbnail: "",
    tags: ["Modern", "High-contrast"],
    previewSections: [
      { color: "bg-white border", h: "h-12" },
      { color: "bg-brand-50 border", h: "h-8" },
      { color: "bg-white border", h: "h-10" },
      { color: "bg-brand-900", h: "h-8" },
      { color: "bg-white border", h: "h-6" },
      { color: "bg-brand-800", h: "h-8" },
    ],
  },
  {
    id: "masterclass",
    dbTemplate: "5",
    name: "Masterclass Style",
    description:
      "Green Bangladeshi masterclass landing page — offer countdown strip, hero with 5 stat cards + batch bar + sticky purchase card, tools, demo video, lead instructors, what-you-get grid, who-it's-for, real-life projects, grouped curriculum accordion, zig-zag roadmap timeline, certificate, FAQ, and sticky enrol bar. Inspired by SkillKoro.",
    thumbnail: "",
    tags: ["New", "Full-featured"],
    previewSections: [
      { color: "bg-green-600", h: "h-5" },
      { color: "bg-white border", h: "h-12" },
      { color: "bg-green-50 border", h: "h-8" },
      { color: "bg-white border", h: "h-10" },
      { color: "bg-green-50 border", h: "h-8" },
      { color: "bg-green-600", h: "h-6" },
    ],
  },
  {
    id: "medical",
    dbTemplate: "6",
    name: "Medical Style",
    description:
      "Clean medical/healthcare landing page — professional blue-white palette, hero with credentials, course modules grid, clinical case studies, instructor bio, certification section, FAQ, and enrollment CTA.",
    thumbnail: "",
    tags: ["Medical", "Professional"],
    previewSections: [
      { color: "bg-blue-800", h: "h-10" },
      { color: "bg-white border", h: "h-8" },
      { color: "bg-blue-50 border", h: "h-10" },
      { color: "bg-white border", h: "h-8" },
      { color: "bg-blue-600", h: "h-6" },
      { color: "bg-white border", h: "h-8" },
    ],
  },
];
