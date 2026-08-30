import {
  Poppins,
  Inter,
  Roboto,
  Open_Sans,
  Lato,
  Montserrat,
  Nunito,
  Source_Sans_3,
  Work_Sans,
  Outfit,
  Roboto_Slab,
  Merriweather,
  Playfair_Display,
  Raleway,
  Hind_Siliguri,
  Noto_Sans_Bengali,
  Baloo_Da_2,
  Tiro_Bangla,
} from "next/font/google";

// ── Font Types ──────────────────────────────────────────────────────────────

export interface FontMetadata {
  family: string;
  category: string;
  weights: number[];
  subsets: string[];
  style: string;
  source: "google" | "custom";
  format?: string;
  filePath?: string;
  fileSize?: number;
  fileHash?: string;
  isActive?: boolean;
}

export interface FontOption {
  value: string;
  label: string;
  category: string;
  source: "google" | "custom";
}

// ── Static Font Imports (Fallback) ──────────────────────────────────────────

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-source-sans-3",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-work-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-roboto-slab",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-merriweather",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair-display",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});

const balooDa2 = Baloo_Da_2({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo-da-2",
  display: "swap",
});

const tiroBangla = Tiro_Bangla({
  subsets: ["bengali", "latin"],
  weight: ["400"],
  variable: "--font-tiro-bangla",
  display: "swap",
});

// ── Font Registry (Static Fallback) ─────────────────────────────────────────

export interface FontEntry {
  family: string;
  className: string;
  cssVarName: string;
  font: typeof poppins;
}

export const FONT_REGISTRY: Record<string, FontEntry> = {
  Poppins: { family: "Poppins", className: poppins.variable, cssVarName: "--font-poppins", font: poppins },
  Inter: { family: "Inter", className: inter.variable, cssVarName: "--font-inter", font: inter },
  Roboto: { family: "Roboto", className: roboto.variable, cssVarName: "--font-roboto", font: roboto },
  "Open Sans": { family: "Open Sans", className: openSans.variable, cssVarName: "--font-open-sans", font: openSans },
  Lato: { family: "Lato", className: lato.variable, cssVarName: "--font-lato", font: lato },
  Montserrat: { family: "Montserrat", className: montserrat.variable, cssVarName: "--font-montserrat", font: montserrat },
  Nunito: { family: "Nunito", className: nunito.variable, cssVarName: "--font-nunito", font: nunito },
  "Source Sans 3": { family: "Source Sans 3", className: sourceSans3.variable, cssVarName: "--font-source-sans-3", font: sourceSans3 },
  "Work Sans": { family: "Work Sans", className: workSans.variable, cssVarName: "--font-work-sans", font: workSans },
  Outfit: { family: "Outfit", className: outfit.variable, cssVarName: "--font-outfit", font: outfit },
  "Roboto Slab": { family: "Roboto Slab", className: robotoSlab.variable, cssVarName: "--font-roboto-slab", font: robotoSlab },
  Merriweather: { family: "Merriweather", className: merriweather.variable, cssVarName: "--font-merriweather", font: merriweather },
  "Playfair Display": { family: "Playfair Display", className: playfairDisplay.variable, cssVarName: "--font-playfair-display", font: playfairDisplay },
  Raleway: { family: "Raleway", className: raleway.variable, cssVarName: "--font-raleway", font: raleway },
  "Hind Siliguri": { family: "Hind Siliguri", className: hindSiliguri.variable, cssVarName: "--font-hind-siliguri", font: hindSiliguri },
  "Noto Sans Bengali": { family: "Noto Sans Bengali", className: notoSansBengali.variable, cssVarName: "--font-noto-sans-bengali", font: notoSansBengali },
  "Baloo Da 2": { family: "Baloo Da 2", className: balooDa2.variable, cssVarName: "--font-baloo-da-2", font: balooDa2 },
  "Tiro Bangla": { family: "Tiro Bangla", className: tiroBangla.variable, cssVarName: "--font-tiro-bangla", font: tiroBangla },
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
    // Check cache
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

    // Update cache
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

export function getFontClassName(fontName: string): string {
  return FONT_REGISTRY[fontName]?.className ?? "";
}

export function getFontCssVar(fontName: string): string {
  const entry = FONT_REGISTRY[fontName];
  return entry ? `var(${entry.cssVarName})` : "";
}

export function getGoogleFontsCssUrl(
  family: string,
  weights: number[] = [400, 500, 600, 700]
): string {
  const weightStr = weights.join(";");
  return `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@${weightStr}&display=swap`;
}

export function generatePreloadLinks(
  font: FontMetadata
): { rel: string; href: string; as?: string; type?: string; crossorigin?: boolean }[] {
  if (font.source === "custom" && font.filePath) {
    return [
      {
        rel: "preload",
        href: font.filePath,
        as: "font",
        type: `font/${font.format}`,
        crossorigin: true,
      },
    ];
  }

  // Google Fonts
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

// For backward compatibility - these will be populated on first use
export const ENGLISH_FONTS: FontOption[] = STATIC_ENGLISH_FONTS;
export const BANGLA_FONTS: FontOption[] = STATIC_BANGLA_FONTS;
