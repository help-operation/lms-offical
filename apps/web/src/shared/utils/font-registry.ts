// ─── Font Metadata (no next/font/google — loaded via CDN links) ──────────────

export interface FontMetadata {
  family: string;
  category: string;
  weights: number[];
  subsets: string[];
  source: "google" | "custom";
}

export interface FontOption {
  value: string;
  label: string;
  category: string;
  source: "google" | "custom";
}

// ── Font Registry ────────────────────────────────────────────────────────────

export interface FontEntry {
  family: string;
  cssVarName: string;
}

export const FONT_REGISTRY: Record<string, FontEntry> = {
  Poppins:            { family: "Poppins",            cssVarName: "--font-poppins" },
  Inter:              { family: "Inter",              cssVarName: "--font-inter" },
  Roboto:             { family: "Roboto",             cssVarName: "--font-roboto" },
  "Open Sans":        { family: "Open Sans",          cssVarName: "--font-open-sans" },
  Lato:               { family: "Lato",               cssVarName: "--font-lato" },
  Montserrat:         { family: "Montserrat",         cssVarName: "--font-montserrat" },
  Nunito:             { family: "Nunito",             cssVarName: "--font-nunito" },
  "Source Sans 3":    { family: "Source Sans 3",      cssVarName: "--font-source-sans-3" },
  "Work Sans":        { family: "Work Sans",          cssVarName: "--font-work-sans" },
  Outfit:             { family: "Outfit",             cssVarName: "--font-outfit" },
  "Roboto Slab":      { family: "Roboto Slab",        cssVarName: "--font-roboto-slab" },
  Merriweather:       { family: "Merriweather",       cssVarName: "--font-merriweather" },
  "Playfair Display": { family: "Playfair Display",   cssVarName: "--font-playfair-display" },
  Raleway:            { family: "Raleway",            cssVarName: "--font-raleway" },
  "Hind Siliguri":    { family: "Hind Siliguri",      cssVarName: "--font-hind-siliguri" },
  "Noto Sans Bengali":{ family: "Noto Sans Bengali",  cssVarName: "--font-noto-sans-bengali" },
  "Baloo Da 2":       { family: "Baloo Da 2",         cssVarName: "--font-baloo-da-2" },
  "Tiro Bangla":      { family: "Tiro Bangla",        cssVarName: "--font-tiro-bangla" },
};

// ── Static Fallback Lists ───────────────────────────────────────────────────

const STATIC_ENGLISH_FONTS: FontOption[] = [
  { value: "Poppins", label: "Poppins", category: "sans-serif", source: "google" },
  { value: "Inter", label: "Inter", category: "sans-serif", source: "google" },
  { value: "Roboto", label: "Roboto", category: "sans-serif", source: "google" },
  { value: "Open Sans", label: "Open Sans", category: "sans-serif", source: "google" },
  { value: "Lato", label: "Lato", category: "sans-serif", source: "google" },
  { value: "Montserrat", label: "Montserrat", category: "sans-serif", source: "google" },
  { value: "Nunito", label: "Nunito", category: "sans-serif", source: "google" },
  { value: "Source Sans 3", label: "Source Sans 3", category: "sans-serif", source: "google" },
  { value: "Work Sans", label: "Work Sans", category: "sans-serif", source: "google" },
  { value: "Outfit", label: "Outfit", category: "sans-serif", source: "google" },
  { value: "Roboto Slab", label: "Roboto Slab", category: "serif", source: "google" },
  { value: "Merriweather", label: "Merriweather", category: "serif", source: "google" },
  { value: "Playfair Display", label: "Playfair Display", category: "serif", source: "google" },
  { value: "Raleway", label: "Raleway", category: "sans-serif", source: "google" },
];

const STATIC_BANGLA_FONTS: FontOption[] = [
  { value: "Hind Siliguri", label: "Hind Siliguri", category: "sans-serif", source: "google" },
  { value: "Noto Sans Bengali", label: "Noto Sans Bengali", category: "sans-serif", source: "google" },
  { value: "Baloo Da 2", label: "Baloo Da 2", category: "sans-serif", source: "google" },
  { value: "Tiro Bangla", label: "Tiro Bangla", category: "serif", source: "google" },
];

// ── Cache ───────────────────────────────────────────────────────────────────

let fontCache: FontMetadata[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ── API Functions ───────────────────────────────────────────────────────────

export async function fetchFontsFromAPI(): Promise<{
  englishFonts: FontOption[];
  banglaFonts: FontOption[];
}> {
  try {
    if (fontCache && Date.now() - cacheTimestamp < CACHE_TTL) {
      return formatFontsFromCache(fontCache);
    }

    const [latinRes, bengaliRes] = await Promise.all([
      fetch("/api/fonts?script=latin"),
      fetch("/api/fonts?script=bengali"),
    ]);

    if (!latinRes.ok || !bengaliRes.ok) {
      throw new Error("Failed to fetch fonts");
    }

    const latinFonts: FontMetadata[] = await latinRes.json();
    const bengaliFonts: FontMetadata[] = await bengaliRes.json();

    fontCache = [...latinFonts, ...bengaliFonts];
    cacheTimestamp = Date.now();

    return {
      englishFonts: latinFonts.map((f) => ({
        value: f.family,
        label: f.family,
        category: f.category,
        source: f.source,
      })),
      banglaFonts: bengaliFonts.map((f) => ({
        value: f.family,
        label: f.family,
        category: f.category,
        source: f.source,
      })),
    };
  } catch (error) {
    console.warn("Failed to fetch fonts from API, using static fallback:", error);
    return {
      englishFonts: STATIC_ENGLISH_FONTS,
      banglaFonts: STATIC_BANGLA_FONTS,
    };
  }
}

function formatFontsFromCache(cache: FontMetadata[]): {
  englishFonts: FontOption[];
  banglaFonts: FontOption[];
} {
  const latinFonts = cache.filter(
    (f) => f.subsets.includes("latin") && !f.subsets.includes("bengali")
  );
  const bengaliFonts = cache.filter((f) => f.subsets.includes("bengali"));

  return {
    englishFonts: latinFonts.map((f) => ({
      value: f.family,
      label: f.family,
      category: f.category,
      source: f.source,
    })),
    banglaFonts: bengaliFonts.map((f) => ({
      value: f.family,
      label: f.family,
      category: f.category,
      source: f.source,
    })),
  };
}

// ── Helper Functions ────────────────────────────────────────────────────────

export function getFontClassName(_fontName: string): string {
  return "";
}

export function getFontCssVar(fontName: string): string {
  const entry = FONT_REGISTRY[fontName];
  return entry ? `var(${entry.cssVarName})` : "";
}

export function getGoogleFontsCssUrl(
  family: string,
  weights: number[] = [300, 400, 500, 600, 700]
): string {
  const weightStr = weights.join(";");
  return `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@${weightStr}&display=swap`;
}

/**
 * Build the Google Fonts CSS link URLs for the two active fonts (English + Bangla).
 * Used by layout.tsx to inject <link rel="stylesheet"> in <head>.
 */
export function buildFontLinks(englishFont: string, banglaFont: string): string[] {
  const families = new Set<string>([englishFont, banglaFont]);
  return Array.from(families).map((f) => getGoogleFontsCssUrl(f));
}

export function generatePreloadLinks(
  font: FontMetadata
): { rel: string; href: string; as?: string; type?: string; crossorigin?: boolean }[] {
  if (font.source === "custom" && "filePath" in font && (font as any).filePath) {
    return [
      {
        rel: "preload",
        href: (font as any).filePath,
        as: "font",
        type: `font/${(font as any).format ?? "woff2"}`,
        crossorigin: true,
      },
    ];
  }

  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
  ];
}

// ── Lazy-loaded Lists (Backward Compatibility) ──────────────────────────────

let cachedEnglishFonts: FontOption[] | null = null;
let cachedBanglaFonts: FontOption[] | null = null;

export async function getEnglishFonts(): Promise<FontOption[]> {
  if (cachedEnglishFonts) return cachedEnglishFonts;
  const { englishFonts } = await fetchFontsFromAPI();
  cachedEnglishFonts = englishFonts;
  return englishFonts;
}

export async function getBanglaFonts(): Promise<FontOption[]> {
  if (cachedBanglaFonts) return cachedBanglaFonts;
  const { banglaFonts } = await fetchFontsFromAPI();
  cachedBanglaFonts = banglaFonts;
  return banglaFonts;
}

// For backward compatibility
export const ENGLISH_FONTS: FontOption[] = STATIC_ENGLISH_FONTS;
export const BANGLA_FONTS: FontOption[] = STATIC_BANGLA_FONTS;
