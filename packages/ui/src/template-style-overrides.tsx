"use client";

import { useId, useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface TextRangeStyle {
  start: number;
  end: number;
  /** Original selected text — used for display in the editor popover. */
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  /** Custom text content to replace the original range text. */
  customText?: string;
}

export interface ElementStyle {
  fontFamily?: string;
  /** px */
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  /** Custom text content to replace the element's entire text. */
  text?: string;
  /** Image URL for elements with data-image-upload. */
  imageSrc?: string;
  /** Inline styles scoped to a sub-element text range. */
  ranges?: TextRangeStyle[];
}

/**
 * Per-element style overrides for a live-course template.
 * Keyed by a structural selector path (relative to the template root) such as
 * `section:nth-child(3) > div:nth-child(1) > h1:nth-child(1)`.
 */
export type StyleOverrides = Record<string, ElementStyle>;

// ─── Font registry (reused by the inline editor's font picker) ──────────────────

export interface FontOption {
  value: string;
  label: string;
  stack: string;
  /** Google Fonts family spec, e.g. "Hind+Siliguri:wght@400;500;600;700" */
  googleFont?: string;
}

export const TYPOGRAPHY_FONTS: FontOption[] = [
  { value: "system", label: "System Sans", stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { value: "hind-siliguri", label: "Hind Siliguri (Bangla)", stack: '"Hind Siliguri", sans-serif', googleFont: "Hind+Siliguri:wght@300;400;500;600;700" },
  { value: "noto-sans-bengali", label: "Noto Sans Bengali", stack: '"Noto Sans Bengali", sans-serif', googleFont: "Noto+Sans+Bengali:wght@400;500;600;700;800" },
  { value: "anek-bangla", label: "Anek Bangla", stack: '"Anek Bangla", sans-serif', googleFont: "Anek+Bangla:wght@400;500;600;700;800" },
  { value: "baloo-da-2", label: "Baloo Da 2 (Bangla)", stack: '"Baloo Da 2", system-ui, sans-serif', googleFont: "Baloo+Da+2:wght@400;500;600;700;800" },
  { value: "tiro-bangla", label: "Tiro Bangla (serif)", stack: '"Tiro Bangla", serif', googleFont: "Tiro+Bangla:ital@0;1" },
  { value: "inter", label: "Inter", stack: '"Inter", sans-serif', googleFont: "Inter:wght@400;500;600;700;800" },
  { value: "poppins", label: "Poppins", stack: '"Poppins", sans-serif', googleFont: "Poppins:wght@400;500;600;700;800" },
  { value: "merriweather", label: "Merriweather (serif)", stack: '"Merriweather", serif', googleFont: "Merriweather:wght@400;700;900" },
];

export const TYPOGRAPHY_WEIGHTS: { value: number; label: string }[] = [
  { value: 300, label: "Light (300)" },
  { value: 400, label: "Regular (400)" },
  { value: 500, label: "Medium (500)" },
  { value: 600, label: "Semibold (600)" },
  { value: 700, label: "Bold (700)" },
  { value: 800, label: "Extrabold (800)" },
  { value: 900, label: "Black (900)" },
];

export function resolveFontStack(value?: string): FontOption | undefined {
  if (!value) return undefined;
  return TYPOGRAPHY_FONTS.find((f) => f.value === value);
}

// ─── Selector path ──────────────────────────────────────────────────────────────
// Builds a stable `:nth-child` chain from `root` (exclusive) down to `el`.
// Counts element children only, which matches CSS :nth-child semantics. The
// injected <style> tag below is ALWAYS rendered as the root's first child so the
// index offset stays constant whether or not any overrides exist.

export function computeStyleSelector(root: Element, el: Element): string | null {
  if (el === root || !root.contains(el)) return null;
  // Top/bottom bars are editor-only — Style mode disabled. Colors come from
  // Top/Bottom Bar — Separate per-element editors (topbar*/bottombar*).
  if (el.hasAttribute("data-topbar") || (el as HTMLElement).closest("[data-topbar]")) return null;
  if (el.hasAttribute("data-bottombar") || (el as HTMLElement).closest("[data-bottombar]")) return null;
  const bottombarAncestor = (el as HTMLElement).closest("[data-bottombar]") as Element | null;
  if (bottombarAncestor && root.contains(bottombarAncestor)) {
    const parts: string[] = [];
    let cur: Element | null = el;
    while (cur && cur !== bottombarAncestor) {
      const parent: Element | null = cur.parentElement;
      if (!parent) break;
      const idx = Array.prototype.indexOf.call(parent.children, cur) + 1;
      parts.unshift(`*:nth-child(${idx})`);
      cur = parent;
    }
    if (parts.length) return `[data-bottombar] > ${parts.join(" > ")}`;
    return "[data-bottombar]";
  }
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== root) {
    const parent: Element | null = cur.parentElement;
    if (!parent) return null;
    const idx = Array.prototype.indexOf.call(parent.children, cur) + 1;
    parts.unshift(`*:nth-child(${idx})`);
    cur = parent;
  }
  return parts.length ? parts.join(" > ") : null;
}

// ─── CSS builder ────────────────────────────────────────────────────────────────

function buildCss(scope: string, overrides: StyleOverrides | undefined): { css: string; fonts: FontOption[] } {
  const fonts: FontOption[] = [];
  if (!overrides) return { css: "", fonts };
  const rules: string[] = [];

  for (const [sel, st] of Object.entries(overrides)) {
    if (!st) continue;
    const decls: string[] = [];
    if (st.fontFamily) {
      const f = resolveFontStack(st.fontFamily);
      if (f) {
        decls.push(`font-family: ${f.stack} !important;`);
        if (f.googleFont && !fonts.includes(f)) fonts.push(f);
      }
    }
    if (typeof st.fontSize === "number")   decls.push(`font-size: ${st.fontSize}px !important;`);
    if (typeof st.fontWeight === "number") decls.push(`font-weight: ${st.fontWeight} !important;`);
    if (st.color)           decls.push(`color: ${st.color} !important;`);
    if (st.backgroundColor) decls.push(`background-color: ${st.backgroundColor} !important; background-image: none !important;`);
    if (st.imageSrc) decls.push(`background-image: url("${st.imageSrc}") !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important;`);
    // `!important` + element-path specificity is required to beat both Tailwind
    // utilities and inline `style={{ background }}` used in some templates.
    if (decls.length) rules.push(`.${scope} > ${sel} { ${decls.join(" ")} }`);
  }
  return { css: rules.join("\n"), fonts };
}

// ─── Text-range DOM patcher ─────────────────────────────────────────────────────
// Walks the element's text nodes and converts a flat character offset into the
// node + in-node offset needed by document.createRange().

function getNodeAndOffset(el: Element, charOffset: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let count = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.textContent?.length ?? 0;
    if (count + len >= charOffset) return { node, offset: charOffset - count };
    count += len;
  }
  return null;
}

/**
 * Post-render DOM patch: replaces text content of elements that have a custom
 * `text` override, and wraps each saved text range with a `<span data-trs>`
 * carrying inline styles. Call from a useEffect / useLayoutEffect after render.
 * Idempotent — previous spans are unwrapped before re-applying.
 */
export function applyTextRanges(root: HTMLElement, overrides: StyleOverrides | undefined): void {
  // Remove previously injected spans, restoring original text nodes.
  root.querySelectorAll("[data-trs]").forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, parent);
    parent.removeChild(span);
  });

  // Restore any previously replaced text (stored in data-original-text).
  root.querySelectorAll("[data-custom-text]").forEach((el) => {
    const original = el.getAttribute("data-original-text");
    if (original !== null) {
      el.textContent = original;
      el.removeAttribute("data-original-text");
    }
  });

  // Restore any previously set imageSrc (stored in data-original-image).
  root.querySelectorAll("[data-custom-image]").forEach((el) => {
    const original = el.getAttribute("data-original-image");
    if (original !== null) {
      if (el.tagName === "IMG") {
        (el as HTMLImageElement).src = original;
      } else {
        (el as HTMLElement).style.backgroundImage = original ? `url("${original}")` : "";
      }
      el.removeAttribute("data-original-image");
      el.removeAttribute("data-custom-image");
    }
  });

  if (!overrides) return;

  // Apply custom text overrides (element-level).
  for (const [sel, style] of Object.entries(overrides)) {
    if (!style?.text) continue;
    const el = root.querySelector(`:scope > ${sel}`) as HTMLElement | null;
    if (!el) continue;
    // Store original text on first apply so we can restore it later.
    if (!el.hasAttribute("data-custom-text")) {
      el.setAttribute("data-original-text", el.textContent ?? "");
    }
    el.setAttribute("data-custom-text", "");
    el.textContent = style.text;
  }

  for (const [sel, style] of Object.entries(overrides)) {
    if (!style?.ranges?.length) continue;
    const el = root.querySelector(`:scope > ${sel}`) as HTMLElement | null;
    if (!el) continue;

    // Process end→start so earlier offsets remain valid after each wrap.
    const sorted = [...style.ranges].sort((a, b) => b.start - a.start);

    for (const rng of sorted) {
      const startPos = getNodeAndOffset(el, rng.start);
      const endPos   = getNodeAndOffset(el, rng.end);
      if (!startPos || !endPos) continue;

      try {
        const domRange = document.createRange();
        domRange.setStart(startPos.node, startPos.offset);
        domRange.setEnd(endPos.node,   endPos.offset);

        const span = document.createElement("span");
        span.setAttribute("data-trs", "");

        const decls: string[] = [];
        if (rng.fontFamily) {
          const f = resolveFontStack(rng.fontFamily);
          if (f) decls.push(`font-family: ${f.stack}`);
        }
        if (typeof rng.fontSize   === "number") decls.push(`font-size: ${rng.fontSize}px`);
        if (typeof rng.fontWeight === "number") decls.push(`font-weight: ${rng.fontWeight}`);
        if (rng.color)           decls.push(`color: ${rng.color}`);
        if (rng.backgroundColor) decls.push(`background-color: ${rng.backgroundColor}`);

        span.style.cssText = decls.join("; ");
        domRange.surroundContents(span);

        // Replace text content if customText is provided.
        if (rng.customText) {
          span.textContent = rng.customText;
        }
      } catch {
        // surroundContents throws when the range crosses an element boundary; skip.
      }
    }
  }

  // Apply imageSrc overrides.
  for (const [sel, style] of Object.entries(overrides)) {
    if (!style?.imageSrc) continue;
    const el = root.querySelector(`:scope > ${sel}`) as HTMLElement | null;
    if (!el) continue;
    // Store original image on first apply so we can restore it later.
    if (!el.hasAttribute("data-custom-image")) {
      const orig = el.tagName === "IMG" ? (el as HTMLImageElement).src : el.style.backgroundImage;
      el.setAttribute("data-original-image", orig);
    }
    el.setAttribute("data-custom-image", "");
    if (el.tagName === "IMG") {
      (el as HTMLImageElement).src = style.imageSrc;
    } else {
      el.style.backgroundImage = `url("${style.imageSrc}")`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";
    }
  }
}

// ─── Scope wrapper ──────────────────────────────────────────────────────────────
// Drop-in replacement for a template's root <div>. Renders an always-present
// <style> (its first child) that applies the per-element overrides, and marks
// itself with `data-style-root` so the editor overlay can locate it.

interface ScopeProps {
  overrides?: StyleOverrides;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function TemplateStyleScope({ overrides, className = "", style, children }: ScopeProps) {
  const rawId = useId();
  const scope = `lct-s-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const { css, fonts } = buildCss(scope, overrides);
  const imports = fonts
    .map((f) => `@import url("https://fonts.googleapis.com/css2?family=${f.googleFont}&display=swap");`)
    .join("\n");
  const full = imports + (imports && css ? "\n" : "") + css;

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    applyTextRanges(rootRef.current, overrides);
  }, [overrides]);

  return (
    <div ref={rootRef} className={`${scope} ${className}`} data-style-root="" style={style}>
      {/* Always rendered (first child) so :nth-child indices are stable. */}
      <style dangerouslySetInnerHTML={{ __html: full }} />
      {children}
    </div>
  );
}
