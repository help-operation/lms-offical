/** Generate a Tailwind-style 50–950 shade scale from a single base hex color. */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function mix(hex: string, target: [number, number, number], ratio: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [tr, tg, tb] = target;
  return rgbToHex(r + (tr - r) * ratio, g + (tg - g) * ratio, b + (tb - b) * ratio);
}

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

export interface BrandScale {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
}

export function generateBrandScale(base: string): BrandScale {
  return {
    50: mix(base, WHITE, 0.94),
    100: mix(base, WHITE, 0.86),
    200: mix(base, WHITE, 0.7),
    300: mix(base, WHITE, 0.5),
    400: mix(base, WHITE, 0.25),
    500: base,
    600: mix(base, BLACK, 0.12),
    700: mix(base, BLACK, 0.24),
    800: mix(base, BLACK, 0.36),
    900: mix(base, BLACK, 0.48),
    950: mix(base, BLACK, 0.62),
  };
}

/** Is `value` a well-formed #rgb or #rrggbb hex color? */
export function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

/** Inline CSS custom properties overriding the site's brand palette tokens. */
export function brandScaleToCssVars(scale: BrandScale): Record<string, string> {
  return {
    "--color-brand": scale[500],
    "--color-brand-from": scale[500],
    "--color-brand-to": scale[400],
    "--color-brand-solid": scale[500],
    "--color-brand-hover": scale[600],
    "--color-brand-shadow": scale[700],
    "--color-brand-ring": scale[300],
    "--color-brand-tint": scale[100],
    "--color-brand-50": scale[50],
    "--color-brand-100": scale[100],
    "--color-brand-200": scale[200],
    "--color-brand-300": scale[300],
    "--color-brand-400": scale[400],
    "--color-brand-500": scale[500],
    "--color-brand-600": scale[600],
    "--color-brand-700": scale[700],
    "--color-brand-800": scale[800],
    "--color-brand-900": scale[900],
    "--color-brand-950": scale[950],
    "--color-surface-hero": scale[100],
    "--color-surface-cta": scale[900],
    "--color-surface-cta-mid": scale[800],
    "--color-map-dot": scale[200],
  };
}
