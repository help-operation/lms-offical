"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { MagnifyingGlass, SpinnerGap, CaretDown, Check } from "@phosphor-icons/react";
import {
  fetchFontsFromAPI,
  getFontClassName,
  getGoogleFontsCssUrl,
  type FontOption,
} from "@/shared/utils/font-registry";

interface FontPickerProps {
  value: string;
  onChange: (value: string) => void;
  type: "english" | "bangla";
  disabled?: boolean;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "sans-serif", label: "Sans Serif" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
  { id: "handwriting", label: "Handwriting" },
  { id: "monospace", label: "Monospace" },
];

const SAMPLE_TEXT = {
  english: "The quick brown fox jumps over the lazy dog",
  bangla: "আমি বাংলায় গান গাই",
};

export function FontPicker({ value, onChange, type, disabled }: FontPickerProps) {
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [hoveredFont, setHoveredFont] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadedFonts = useRef(new Set<string>());

  // Load fonts from API
  useEffect(() => {
    async function loadFonts() {
      setLoading(true);
      try {
        const { englishFonts, banglaFonts } = await fetchFontsFromAPI();
        setFonts(type === "english" ? englishFonts : banglaFonts);
      } catch (error) {
        console.error("Failed to load fonts:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFonts();
  }, [type]);

  // Load recently used from localStorage
  useEffect(() => {
    const key = `recentlyUsedFonts_${type}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setRecentlyUsed(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, [type]);

  // Save recently used to localStorage
  const trackRecentlyUsed = useCallback(
    (fontFamily: string) => {
      setRecentlyUsed((prev) => {
        const updated = [fontFamily, ...prev.filter((f) => f !== fontFamily)].slice(0, 10);
        localStorage.setItem(`recentlyUsedFonts_${type}`, JSON.stringify(updated));
        return updated;
      });
    },
    [type]
  );

  // Load font CSS for preview
  const loadFontForPreview = useCallback((fontFamily: string) => {
    if (loadedFonts.current.has(fontFamily)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = getGoogleFontsCssUrl(fontFamily, [400]);
    document.head.appendChild(link);
    loadedFonts.current.add(fontFamily);
  }, []);

  // Filter fonts
  const filteredFonts = useMemo(() => {
    let result = fonts;

    // Filter by category
    if (activeCategory !== "all") {
      result = result.filter((f) => f.category === activeCategory);
    }

    // Filter by search
    if (search) {
      const query = search.toLowerCase();
      result = result.filter((f) => f.label.toLowerCase().includes(query));
    }

    return result;
  }, [fonts, activeCategory, search]);

  // Recently used fonts that are in the current list
  const recentFonts = useMemo(() => {
    return recentlyUsed
      .filter((name) => fonts.some((f) => f.value === name))
      .map((name) => fonts.find((f) => f.value === name)!)
      .slice(0, 5);
  }, [recentlyUsed, fonts]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Load preview font when hovering
  useEffect(() => {
    if (hoveredFont) {
      loadFontForPreview(hoveredFont);
    }
  }, [hoveredFont, loadFontForPreview]);

  const handleSelect = (fontValue: string) => {
    onChange(fontValue);
    trackRecentlyUsed(fontValue);
    setIsOpen(false);
    setSearch("");
  };

  const previewFont = hoveredFont || value;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 transition hover:border-gray-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-600 dark:focus:border-brand-500 dark:focus:ring-brand-900/40"
      >
        <span
          className="flex-1 text-left truncate"
          style={{ fontFamily: value ? `'${value}', sans-serif` : undefined }}
        >
          {value || "Select font"}
        </span>
        <CaretDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {/* Search */}
          <div className="border-b border-gray-100 p-2 dark:border-slate-700">
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fonts..."
                className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-1 border-b border-gray-100 p-2 dark:border-slate-700">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                  activeCategory === cat.id
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
                <SpinnerGap size={16} className="animate-spin" />
                <span className="text-sm">Loading fonts...</span>
              </div>
            ) : filteredFonts.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No fonts found</div>
            ) : (
              <>
                {/* Recently used */}
                {recentFonts.length > 0 && !search && activeCategory === "all" && (
                  <div className="border-b border-gray-100 dark:border-slate-700">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500">
                      Recently Used
                    </div>
                    {recentFonts.map((font) => (
                      <FontItem
                        key={`recent-${font.value}`}
                        font={font}
                        isSelected={font.value === value}
                        onSelect={handleSelect}
                        onHover={setHoveredFont}
                        previewText={SAMPLE_TEXT[type]}
                      />
                    ))}
                  </div>
                )}

                {/* All fonts */}
                {!search && activeCategory === "all" && recentFonts.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500">
                    All Fonts
                  </div>
                )}
                {filteredFonts.map((font) => (
                  <FontItem
                    key={font.value}
                    font={font}
                    isSelected={font.value === value}
                    onSelect={handleSelect}
                    onHover={setHoveredFont}
                    previewText={SAMPLE_TEXT[type]}
                  />
                ))}
              </>
            )}
          </div>

          {/* Preview */}
          {previewFont && (
            <div className="border-t border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-[10px] font-semibold uppercase text-gray-400 dark:text-slate-500">
                Preview
              </div>
              <div
                className="mt-1 text-lg text-gray-900 dark:text-white"
                style={{ fontFamily: `'${previewFont}', sans-serif` }}
              >
                {SAMPLE_TEXT[type]}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Font Item ───────────────────────────────────────────────────────────────

function FontItem({
  font,
  isSelected,
  onSelect,
  onHover,
  previewText,
}: {
  font: FontOption;
  isSelected: boolean;
  onSelect: (value: string) => void;
  onHover: (font: string | null) => void;
  previewText: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(font.value)}
      onMouseEnter={() => onHover(font.value)}
      onMouseLeave={() => onHover(null)}
      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-slate-800 ${
        isSelected ? "bg-brand-50 dark:bg-brand-500/10" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium text-gray-900 dark:text-white"
            style={{ fontFamily: `'${font.value}', sans-serif` }}
          >
            {font.label}
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-slate-700 dark:text-slate-400">
            {font.category}
          </span>
        </div>
        <div
          className="mt-0.5 truncate text-xs text-gray-400 dark:text-slate-500"
          style={{ fontFamily: `'${font.value}', sans-serif` }}
        >
          {previewText}
        </div>
      </div>
      {isSelected && <Check size={14} className="shrink-0 text-brand-600 dark:text-brand-400" />}
    </button>
  );
}

