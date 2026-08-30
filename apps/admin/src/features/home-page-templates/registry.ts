export interface HomeTemplateDefinition {
  /** Also the `page_sections.page` discriminator this template's sections live under. */
  id: string;
  name: string;
  description: string;
  /** Route to the section editor for this template. */
  editHref: string;
  tags: string[];
  /** Stacked wireframe bars used to mock a thumbnail preview — no images needed. */
  previewSections: Array<{ color: string; h: string }>;
  /** Tailwind bg class wrapping the wireframe preview. */
  previewBg: string;
  /** Tailwind classes driving the card's active-state border/ring/shadow, badge, and button. */
  accent: {
    border: string;
    ring: string;
    shadow: string;
    hoverBorder: string;
    badge: string;
    button: string;
    /** Hover classes for the outlined "Edit sections" button. */
    outlineHover: string;
    /** Hex used as the color-picker swatch when no custom color has been saved. */
    hex: string;
  };
}

const BRAND_ACCENT = {
  border: "border-brand-500 dark:border-brand-400",
  ring: "ring-brand-500/20 dark:ring-brand-400/20",
  shadow: "shadow-brand-500/10 dark:shadow-brand-400/10",
  hoverBorder: "hover:border-brand-300 dark:hover:border-brand-400/60",
  badge: "bg-brand-600 dark:bg-brand-500",
  button: "bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400",
  outlineHover: "hover:border-brand-300 hover:text-brand-700 dark:hover:border-brand-400/60 dark:hover:text-brand-300",
  hex: "#8d3fe6",
};

const BLUE_ACCENT = {
  border: "border-blue-500 dark:border-blue-400",
  ring: "ring-blue-500/20 dark:ring-blue-400/20",
  shadow: "shadow-blue-500/10 dark:shadow-blue-400/10",
  hoverBorder: "hover:border-blue-300 dark:hover:border-blue-400/60",
  badge: "bg-blue-600 dark:bg-blue-500",
  button: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400",
  outlineHover: "hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-400/60 dark:hover:text-blue-300",
  // Keep in sync with TEMPLATE_DEFAULT_COLORS in apps/web/src/app/layout.tsx —
  // that's the color the public site actually renders for this template.
  hex: "#2563eb",
};

export const HOME_TEMPLATES: HomeTemplateDefinition[] = [
  {
    id: "home",
    name: "Foundation",
    description:
      "The original section layout: hero, courses, testimonials, and community sections in the classic order.",
    editHref: "/admin/content/home",
    tags: ["Popular", "Full-featured"],
    previewBg: "bg-white",
    accent: BRAND_ACCENT,
    previewSections: [
      { color: "bg-brand-600", h: "h-10" },
      { color: "bg-brand-200", h: "h-5" },
      { color: "bg-gray-100 border", h: "h-8" },
      { color: "bg-gray-50 border", h: "h-10" },
      { color: "bg-gray-100 border", h: "h-8" },
      { color: "bg-brand-50 border", h: "h-8" },
    ],
  },
  {
    id: "home-v1",
    name: "Elevate",
    description:
      "A bold, blob-illustration hero with floating stat cards and an instructor avatar strip.",
    editHref: "/admin/content/home-v1",
    tags: ["New", "Custom"],
    previewBg: "bg-blue-50",
    accent: BLUE_ACCENT,
    previewSections: [
      { color: "bg-blue-500", h: "h-10" },
      { color: "bg-white border", h: "h-5" },
      { color: "bg-blue-100 border", h: "h-8" },
      { color: "bg-gray-100 border", h: "h-10" },
      { color: "bg-blue-50 border", h: "h-8" },
      { color: "bg-white border", h: "h-6" },
    ],
  },
];

export const DEFAULT_HOME_TEMPLATE_ID = HOME_TEMPLATES[0]!.id;

export function getHomeTemplate(id: string | undefined): HomeTemplateDefinition {
  return HOME_TEMPLATES.find((t) => t.id === id) ?? HOME_TEMPLATES[0]!;
}
