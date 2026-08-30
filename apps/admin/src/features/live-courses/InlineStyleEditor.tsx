"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X, RotateCcw } from "lucide-react";
import {
  TYPOGRAPHY_FONTS, TYPOGRAPHY_WEIGHTS,
  computeStyleSelector, applyTextRanges,
  type StyleOverrides, type ElementStyle, type TextRangeStyle,
} from "@repo/ui/template-style-overrides";

interface Props {
  overrides: StyleOverrides;
  onChange: (next: StyleOverrides) => void;
  children: ReactNode;
}

interface Rect { top: number; left: number; width: number; height: number; }

interface PendingRange {
  selector: string;
  start: number;
  end: number;
  text: string;
}

function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Converts a (node, offsetInNode) position into a flat char offset within el's text content. */
function getCharOffset(el: Element, targetNode: Node, offsetInNode: number): number {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let count = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node === targetNode) return count + offsetInNode;
    count += node.textContent?.length ?? 0;
  }
  return count;
}

/**
 * Editor-only overlay: hover highlights any element in the rendered template,
 * clicking selects it and opens a floating popover to style just that element.
 * Drag-selecting text before clicking opens the popover in text-range mode,
 * applying styles only to the selected substring.
 */
export function InlineStyleEditor({ overrides, onChange, children }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled]         = useState(false);
  const [hoverRect, setHoverRect]     = useState<Rect | null>(null);
  const [selected, setSelected]       = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [isTextEditable, setIsTextEditable] = useState<boolean>(true);
  const [isImageUpload, setIsImageUpload] = useState<boolean>(false);
  const [selRect, setSelRect]         = useState<Rect | null>(null);
  const [pendingRange, setPendingRange] = useState<PendingRange | null>(null);

  // Captures the browser text selection on mouseup (before click fires and clears it).
  const pendingRangeRef = useRef<PendingRange | null>(null);

  const getRoot = useCallback(
    () => wrapperRef.current?.querySelector("[data-style-root]") as HTMLElement | null,
    [],
  );

  const isStylable = (root: HTMLElement, target: HTMLElement) =>
    root.contains(target) && target !== root && target.tagName !== "STYLE" && !target.closest("[data-topbar]") && !target.closest("[data-bottombar]");

  /** Returns true if the element is a container (has child elements but no meaningful direct text). */
  const isContainerElement = (el: HTMLElement): boolean => {
    if (el.childElementCount === 0) return false;
    // Gather only direct text nodes (not inside child elements).
    let directText = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) directText += node.textContent;
    }
    return directText.trim().length === 0;
  };

  const exitStyleMode = () => {
    setEnabled(false);
    setSelected(null);
    setHoverRect(null);
    setPendingRange(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!enabled) return;
    const root = getRoot();
    const target = e.target as HTMLElement;
    if (!root || !isStylable(root, target) || (target as HTMLElement).closest("[data-topbar]") || (target as HTMLElement).closest("[data-bottombar]")) { setHoverRect(null); return; }
    setHoverRect(rectOf(target));
  };

  // Clear stale pending range on each new mousedown so the ref is fresh for mouseup.
  const onMouseDown = () => { pendingRangeRef.current = null; };

  // Capture any active text selection before the click event fires and discards it.
  const onMouseUp = () => {
    if (!enabled) { pendingRangeRef.current = null; return; }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      pendingRangeRef.current = null; return;
    }
    const range = sel.getRangeAt(0);
    const root  = getRoot();
    if (!root) { pendingRangeRef.current = null; return; }

    // Resolve to an element — text nodes aren't stylable directly.
    const ancestor = range.commonAncestorContainer;
    const el: HTMLElement | null =
      ancestor.nodeType === Node.TEXT_NODE
        ? (ancestor as Text).parentElement
        : (ancestor as HTMLElement);

    if (!el || !isStylable(root, el) || el.closest("[data-topbar]") || el.closest("[data-bottombar]")) { pendingRangeRef.current = null; return; }

    const styleSel = computeStyleSelector(root, el);
    if (!styleSel) { pendingRangeRef.current = null; return; }

    const start = getCharOffset(el, range.startContainer, range.startOffset);
    const end   = getCharOffset(el, range.endContainer,   range.endOffset);
    if (start >= end) { pendingRangeRef.current = null; return; }

    pendingRangeRef.current = { selector: styleSel, start, end, text: sel.toString() };
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (!enabled) return;
    const root   = getRoot();
    const target = e.target as HTMLElement;
    if (!root || !isStylable(root, target) || target.closest("[data-topbar]") || target.closest("[data-bottombar]")) return;
    e.preventDefault();
    e.stopPropagation();

    const sel     = computeStyleSelector(root, target);
    if (!sel) return;
    if (sel === "[data-topbar]" || sel.startsWith("[data-topbar]") || sel === "[data-bottombar]" || sel.startsWith("[data-bottombar]")) return;

    // Consume the pending range (captured on mouseup) if it belongs to this element.
    const pending = pendingRangeRef.current;
    pendingRangeRef.current = null;

    const isContainer = isContainerElement(target);

    setSelected(sel);
    setSelectedText(target.textContent?.trim() ?? "");
    setIsTextEditable(!target.hasAttribute("data-no-text-edit") && !isContainer);
    setIsImageUpload(target.hasAttribute("data-image-upload"));
    setSelRect(rectOf(target));
    setHoverRect(null);
    setPendingRange(pending?.selector === sel ? pending : null);
  };

  // Re-resolve the selected element's rect after re-renders (overrides change).
  useLayoutEffect(() => {
    if (!selected) { setSelRect(null); return; }
    const root = getRoot();
    const el   = root?.querySelector(`:scope > ${selected}`) as HTMLElement | null;
    setSelRect(el ? rectOf(el) : null);
    // Always re-read the element's current text for the textarea
    if (el) setSelectedText(el.textContent?.trim() ?? "");
  }, [selected, overrides, getRoot]);

  // Keep the rect aligned while the preview scrolls / window resizes.
  useEffect(() => {
    if (!selected) return;
    const reposition = () => {
      const root = getRoot();
      const el   = root?.querySelector(`:scope > ${selected}`);
      setSelRect(el ? rectOf(el) : null);
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [selected, getRoot]);

  // Re-apply text-range spans whenever overrides change (e.g., after undo/redo).
  useEffect(() => {
    const root = getRoot();
    if (!root) return;
    applyTextRanges(root, overrides);
  }, [overrides, getRoot]);

  const current: ElementStyle = (selected && overrides[selected]) || {};

  // When in text-range mode, the popover value reflects the saved range style.
  const currentRangeStyle: ElementStyle | null = pendingRange
    ? (overrides[pendingRange.selector]?.ranges?.find(
        (r) => r.start === pendingRange.start && r.end === pendingRange.end,
      ) ?? null)
    : null;

  const popoverValue: ElementStyle = currentRangeStyle ?? current;

  const update = (patch: Partial<ElementStyle>) => {
    if (!selected) return;

    if (pendingRange) {
      // Text-range mode: merge patch into the matching TextRangeStyle entry.
      const elementStyle   = overrides[selected] ?? {};
      const existingRanges = elementStyle.ranges ?? [];
      const idx = existingRanges.findIndex(
        (r) => r.start === pendingRange.start && r.end === pendingRange.end,
      );
      const base: TextRangeStyle =
        (idx >= 0 ? existingRanges[idx] : undefined) ??
        { start: pendingRange.start, end: pendingRange.end, text: pendingRange.text };

      const merged: TextRangeStyle = { ...base, ...patch };
      // Clean up undefined / empty style fields (keep positional fields).
      (["fontFamily", "fontSize", "fontWeight", "color", "backgroundColor", "customText"] as const).forEach((k) => {
        const v = merged[k];
        if (v === undefined || v === "") delete merged[k];
      });

      const newRanges =
        idx >= 0
          ? existingRanges.map((r, i) => (i === idx ? merged : r))
          : [...existingRanges, merged];

      onChange({ ...overrides, [selected]: { ...elementStyle, ranges: newRanges } });
    } else {
      // Element mode: update element-level styles; preserve any saved ranges.
      const merged: ElementStyle = { ...current, ...patch };
      (Object.keys(merged) as (keyof ElementStyle)[]).forEach((k) => {
        if (k === "ranges") return;
        const v = merged[k];
        if (v === undefined || v === "") delete merged[k];
      });
      const next = { ...overrides };
      const hasStyles = Object.keys(merged).some((k) => k !== "ranges");
      if (hasStyles || merged.ranges?.length) next[selected] = merged;
      else delete next[selected];
      onChange(next);
    }
  };

  const resetEl = () => {
    if (!selected) return;
    const next = { ...overrides };

    if (pendingRange) {
      // Remove only this range entry; leave the element-level style untouched.
      const existing = next[selected];
      const newRanges = (existing?.ranges ?? []).filter(
        (r) => !(r.start === pendingRange.start && r.end === pendingRange.end),
      );
      const { ranges: _r, ...restStyle } = existing ?? {};
      const merged: ElementStyle = {
        ...restStyle,
        ...(newRanges.length ? { ranges: newRanges } : {}),
      };
      if (Object.keys(merged).length) next[selected] = merged;
      else delete next[selected];
    } else {
      // Reset element-level styles; preserve any saved text ranges.
      const existing = next[selected];
      if (existing?.ranges?.length) next[selected] = { ranges: existing.ranges };
      else delete next[selected];
    }

    onChange(next);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setHoverRect(null)}
      onClickCapture={onClickCapture}
    >
      {/* Mode toggle toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
        <span className="text-[11px] text-gray-500">
          {enabled
            ? "Click any element to style it — page interactions are paused."
            : "Preview is interactive. Turn on Style mode to edit element styles."}
        </span>
        <button
          type="button"
          onClick={() => (enabled ? exitStyleMode() : setEnabled(true))}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
            enabled ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${enabled ? "bg-white" : "bg-gray-400"}`} />
          Style mode {enabled ? "On" : "Off"}
        </button>
      </div>

      {children}

      {/* hover highlight */}
      {hoverRect && (
        <div
          className="pointer-events-none fixed z-[60] rounded-sm border-2 border-brand-400/70 bg-brand-400/10"
          style={{ top: hoverRect.top, left: hoverRect.left, width: hoverRect.width, height: hoverRect.height }}
        />
      )}

      {/* selected outline */}
      {selRect && (
        <div
          className="pointer-events-none fixed z-[60] rounded-sm border-2 border-brand-600"
          style={{ top: selRect.top, left: selRect.left, width: selRect.width, height: selRect.height }}
        />
      )}

      {/* style popover */}
      {selected && selRect && (
        <StylePopover
          rect={selRect}
          value={popoverValue}
          rangeInfo={pendingRange}
          originalText={selectedText}
          isTextEditable={isTextEditable}
          isImageUpload={isImageUpload}
          onChange={update}
          onReset={resetEl}
          onClose={() => { setSelected(null); setPendingRange(null); }}
        />
      )}
    </div>
  );
}

// ─── Popover ────────────────────────────────────────────────────────────────────

interface PopoverProps {
  rect: Rect;
  value: ElementStyle;
  rangeInfo: PendingRange | null;
  originalText: string;
  isTextEditable: boolean;
  isImageUpload: boolean;
  onChange: (patch: Partial<ElementStyle>) => void;
  onReset: () => void;
  onClose: () => void;
}

const POPOVER_W = 264;
const POPOVER_H = 360;

function StylePopover({ rect, value, rangeInfo, originalText, isTextEditable, isImageUpload, onChange, onReset, onClose }: PopoverProps) {
  let left = rect.left + rect.width + 10;
  if (left + POPOVER_W > window.innerWidth - 8) left = rect.left - POPOVER_W - 10;
  if (left < 8) left = 8;
  let top = Math.min(rect.top, window.innerHeight - POPOVER_H - 8);
  if (top < 8) top = 8;

  const fieldCls = "w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-brand-400 focus:outline-none";

  const previewText = rangeInfo
    ? rangeInfo.text.length > 30
      ? `${rangeInfo.text.slice(0, 30)}…`
      : rangeInfo.text
    : null;

  return (
    <div
      className="fixed z-[70] w-[264px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      style={{ top, left }}
      onMouseMove={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Edit element style</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onReset}
            title={rangeInfo ? "Clear this text-range style" : "Reset this element to template default"}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <RotateCcw className="h-3.5 w-3.5" />
            {rangeInfo ? "Clear range" : "Reset"}
          </button>
          <button type="button" onClick={onClose} title="Close"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Text-range badge */}
      {previewText && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          <span className="truncate text-[11px] text-brand-700">
            Styling: &ldquo;{previewText}&rdquo; ({rangeInfo!.end - rangeInfo!.start} chars)
          </span>
        </div>
      )}

      <div className="space-y-2">
        {!isTextEditable && !isImageUpload ? (
          /* Container / section element — only show Background Color */
          <ColorRow label="Background color" value={value.backgroundColor} onPick={(c) => onChange({ backgroundColor: c })} />
        ) : isImageUpload ? (
          <ImageUploadField value={value.imageSrc} onChange={(src) => onChange({ imageSrc: src })} />
        ) : (
          <>
            <div>
              <label className="mb-0.5 block text-[11px] font-medium text-gray-500">Font</label>
              <select
                value={value.fontFamily ?? ""}
                onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}
                className={fieldCls}
              >
                <option value="">Default</option>
                {TYPOGRAPHY_FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-0.5 block text-[11px] font-medium text-gray-500">Size (px)</label>
                <input
                  type="number" min={6} max={160}
                  value={value.fontSize ?? ""}
                  onChange={(e) => onChange({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Auto" className={fieldCls}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-medium text-gray-500">Weight</label>
                <select
                  value={value.fontWeight ?? ""}
                  onChange={(e) => onChange({ fontWeight: e.target.value ? Number(e.target.value) : undefined })}
                  className={fieldCls}
                >
                  <option value="">Auto</option>
                  {TYPOGRAPHY_WEIGHTS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <ColorRow label="Text color"        value={value.color}           onPick={(c) => onChange({ color: c })} />
            <ColorRow label="Background color"  value={value.backgroundColor} onPick={(c) => onChange({ backgroundColor: c })} />
          </>
        )}
      </div>
    </div>
  );
}

function ColorRow({ label, value, onPick }: { label: string; value?: string; onPick: (c: string | undefined) => void }) {
  return (
    <div>
      <label className="mb-0.5 block text-[11px] font-medium text-gray-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value ?? "#000000"}
          onChange={(e) => onPick(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded border border-gray-200 p-0.5"
        />
        <span className="flex-1 truncate text-xs text-gray-500">{value ?? "Default"}</span>
        {value && (
          <button type="button" onClick={() => onPick(undefined)}
            className="text-[11px] text-gray-400 hover:text-red-500">clear</button>
        )}
      </div>
    </div>
  );
}

function ImageUploadField({ value, onChange }: { value?: string; onChange: (src: string | undefined) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") onChange(result);
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected.
    e.target.value = "";
  };

  return (
    <div>
      <label className="mb-0.5 block text-[11px] font-medium text-gray-500">Image</label>
      {value ? (
        <div className="space-y-1.5">
          <img src={value} alt="Preview" className="h-20 w-full rounded-lg border border-gray-200 object-cover" />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-3 py-4 text-xs text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload image
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
