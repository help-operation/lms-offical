export interface RecordedTemplateDefinition {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  tags: string[];
  dbTemplate: "1" | "2";
  previewSections: Array<{ color: string; h: string }>;
}

export const RECORDED_TEMPLATES: RecordedTemplateDefinition[] = [
  {
    id: "elevate",
    dbTemplate: "1",
    name: "Elevate",
    description:
      "Premium, modern design — bold typography, refined spacing, elevated visual hierarchy. Perfect for high-value courses that need a polished look.",
    thumbnail: "",
    tags: ["Premium", "Modern"],
    previewSections: [
      { color: "bg-slate-900", h: "h-10" },
      { color: "bg-slate-700", h: "h-5" },
      { color: "bg-white border", h: "h-8" },
      { color: "bg-slate-50 border", h: "h-10" },
      { color: "bg-white border", h: "h-8" },
      { color: "bg-slate-100 border", h: "h-8" },
    ],
  },
  {
    id: "mastery",
    dbTemplate: "2",
    name: "Mastery",
    description:
      "A classic, mastery-focused design with a clean, academic feel. Focuses on clarity, readability, and structured content organization.",
    thumbnail: "",
    tags: ["Classic", "Academic"],
    previewSections: [
      { color: "bg-indigo-950", h: "h-10" },
      { color: "bg-indigo-800", h: "h-5" },
      { color: "bg-white border", h: "h-8" },
      { color: "bg-white border", h: "h-10" },
      { color: "bg-white border", h: "h-8" },
      { color: "bg-white border", h: "h-8" },
    ],
  },
];
