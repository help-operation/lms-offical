"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Search, Grid3X3, List, File, Image as ImageIcon, Film, Music, FileText,
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "all",      label: "All Files",  icon: File      },
  { value: "image",    label: "Images",     icon: ImageIcon },
  { value: "video",    label: "Videos",     icon: Film      },
  { value: "audio",    label: "Audio",      icon: Music     },
  { value: "document", label: "Documents",  icon: FileText  },
] as const;

const SORT_OPTIONS = [
  { value: "created_at", label: "Newest first" },
  { value: "filename",   label: "Name A→Z"     },
  { value: "size",       label: "Largest first" },
  { value: "type",       label: "By type"       },
] as const;

const PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

export function MediaFilters({
  search,
  type,
  sort,
  view,
  perPage,
}: {
  search: string;
  type: string;
  sort: string;
  view: string;
  perPage: string;
}) {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();

  const push = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v); else next.delete(k);
      });
      next.delete("page"); // reset to page 1 on filter change
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search files…"
          defaultValue={search}
          onChange={(e) => push({ search: e.target.value })}
          className="w-56 rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Type filter */}
      <div className="flex gap-1 flex-wrap">
        {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => push({ type: value === "all" ? "" : value })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              (type || "all") === value
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={sort || "created_at"}
        onChange={(e) => push({ sort: e.target.value })}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400"
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* Page size */}
      <select
        value={perPage}
        onChange={(e) => push({ per_page: e.target.value })}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400"
        aria-label="Items per page"
      >
        {PER_PAGE_OPTIONS.map((n) => (
          <option key={n} value={String(n)}>{n} / page</option>
        ))}
      </select>

      {/* View toggle */}
      <div className="flex overflow-hidden rounded-lg border border-gray-200">
        <button
          onClick={() => push({ view: "grid" })}
          className={`flex h-9 w-9 items-center justify-center transition-colors ${
            view !== "list" ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
          aria-label="Grid view"
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => push({ view: "list" })}
          className={`flex h-9 w-9 items-center justify-center transition-colors ${
            view === "list" ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
