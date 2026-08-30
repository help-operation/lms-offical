"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
} from "lucide-react";
import { cn } from "../utils";
import { DateRangePicker } from "./date-range-picker";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T extends object = object> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

/** Matches PHP HandleTableQuery `formatPaginatedResponse` shape */
export interface TablePagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

/** Matches PHP HandleTableQuery `applyTableQuery` input params */
export interface TableQueryParams {
  page: number;
  per_page: number;
  search?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  date_from?: string;
  date_to?: string;
  [key: string]: unknown; // dynamic filter keys
}

export interface FilterConfig {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface DataTableProps<T extends object> {
  data: T[];
  columns: Column<T>[];

  // ── Server-side ──────────────────────────────────────────────────────────
  /** Enable server-side search / sort / filter / pagination */
  serverSide?: boolean;
  /** Pagination meta returned from the server */
  pagination?: TablePagination;
  /** Called whenever page / search / sort / filter changes */
  onQueryChange?: (params: TableQueryParams) => void;

  // ── UI ────────────────────────────────────────────────────────────────────
  isLoading?: boolean;
  /** Number of skeleton rows shown while loading */
  loadingRows?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Keys used for client-side search (ignored in server-side mode) */
  searchKeys?: (keyof T)[];
  pageSize?: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  filters?: FilterConfig[];
  /** Optional expandable row content rendered below the row when expanded */
  expandRow?: (item: T) => React.ReactNode;
  /** Show a from/to date picker. For client-side: pass the key of the date field on your row object. For server-side: just pass any truthy string — date_from/date_to are sent via onQueryChange. */
  dateRangeKey?: string;
  /** Passed through to the date-range picker's popover portal (see DateRangePickerProps.portalContainer). */
  portalContainer?: HTMLElement | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValue<T>(item: T, key: keyof T | string): unknown {
  return (item as Record<string, unknown>)[key as string];
}

// ─── FilterDropdown ───────────────────────────────────────────────────────────

function FilterDropdown({
  filter,
  value,
  onChange,
  disabled,
}: {
  filter: FilterConfig;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value === "__all__"
    ? null
    : filter.options.find((o) => o.value === value);

  const label = selected ? selected.label : filter.label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
          selected && "border-violet-300 text-violet-700 dark:border-violet-500 dark:text-violet-400",
        )}
      >
        <span>{label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform dark:text-slate-500", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[10rem] w-max max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {/* "All" option */}
          <button
            type="button"
            onClick={() => { onChange("__all__"); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors", value === "__all__" ? "border-violet-600 bg-violet-600" : "border-gray-300 dark:border-slate-600")}>
              {value === "__all__" && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            </span>
            {filter.label}
          </button>

          {filter.options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors", value === o.value ? "border-violet-600 bg-violet-600" : "border-gray-300 dark:border-slate-600")}>
                {value === o.value && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  data,
  columns,
  serverSide = false,
  pagination,
  onQueryChange,
  isLoading = false,
  loadingRows = 5,
  searchable = true,
  searchPlaceholder = "Search…",
  searchKeys,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  className,
  emptyMessage = "No results found.",
  onRowClick,
  filters = [],
  expandRow,
  dateRangeKey,
  portalContainer,
}: DataTableProps<T>) {
  const [expandedId, setExpandedId] = useState<React.Key | null>(null);
  const [searchTerm, setSearchTerm]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const [pageSize, setPageSize]               = useState(initialPageSize);
  const [sortField, setSortField]             = useState<string | null>(null);
  const [sortDirection, setSortDirection]     = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters]     = useState<Record<string, string>>({});
  const [dateFrom, setDateFrom]               = useState("");
  const [dateTo, setDateTo]                   = useState("");

  // Keep onQueryChange in a ref so it never appears in the effect dependency array.
  // Without this, every parent re-render creates a new fetchXxx function identity,
  // which re-triggers the query effect even after the initial skip is consumed.
  const onQueryChangeRef = useRef(onQueryChange);
  useEffect(() => { onQueryChangeRef.current = onQueryChange; }); // sync on every render

  // skipFirstRef: skip the initial onQueryChange call so SSR data isn't replaced.
  // Reset on every mount/unmount cycle to correctly handle React Strict Mode
  // (which runs effects twice — the cleanup resets the flag before the second run).
  const skipFirstRef = useRef(true);
  useEffect(() => {
    skipFirstRef.current = true;
    return () => { skipFirstRef.current = true; };
  }, []);

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (serverSide) setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, serverSide]);

  // ── Notify parent on query change (server-side) ────────────────────────────
  // onQueryChange is intentionally excluded from deps — we read it via ref so that
  // a new function identity on the parent (no useCallback) never re-triggers this.
  useEffect(() => {
    if (!serverSide || !onQueryChangeRef.current) return;

    // Skip the very first run — parent already has SSR data.
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }

    const params: TableQueryParams = { page: currentPage, per_page: pageSize };
    if (debouncedSearch) params.search        = debouncedSearch;
    if (sortField)       params.sort_field     = sortField;
    if (sortField)       params.sort_direction = sortDirection;
    if (dateFrom)        params.date_from      = dateFrom;
    if (dateTo)          params.date_to        = dateTo;

    Object.entries(activeFilters).forEach(([k, v]) => { params[k] = v; });

    onQueryChangeRef.current(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSide, currentPage, pageSize, debouncedSearch, sortField, sortDirection, activeFilters, dateFrom, dateTo]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = useCallback((field: string) => {
    setSortField((prev) => {
      if (prev === field) { setSortDirection((d) => d === "asc" ? "desc" : "asc"); return field; }
      setSortDirection("asc");
      return field;
    });
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setActiveFilters((prev) => {
      if (value === "__all__") { const { [key]: _, ...rest } = prev; return rest; }
      return { ...prev, [key]: value };
    });
    setCurrentPage(1);
  }, []);

  const handleDateFrom = useCallback((v: string) => { setDateFrom(v); setCurrentPage(1); }, []);
  const handleDateTo   = useCallback((v: string) => { setDateTo(v);   setCurrentPage(1); }, []);
  const clearDates     = useCallback(() => { setDateFrom(""); setDateTo(""); setCurrentPage(1); }, []);

  const handlePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // ── Client-side data processing ────────────────────────────────────────────
  const processedData = useMemo(() => {
    if (serverSide) return data;

    let result = [...data];

    // Search
    if (debouncedSearch && searchKeys?.length) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((item) =>
        searchKeys.some((k) => String(getValue(item, k) ?? "").toLowerCase().includes(q)),
      );
    }

    // Filters
    Object.entries(activeFilters).forEach(([k, v]) => {
      if (v) result = result.filter((item) => String(getValue(item, k) ?? "") === v);
    });

    // Date range
    if (dateRangeKey) {
      if (dateFrom) {
        const from = new Date(dateFrom);
        result = result.filter((item) => {
          const v = (item as Record<string, unknown>)[dateRangeKey];
          return v ? new Date(String(v)) >= from : false;
        });
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        result = result.filter((item) => {
          const v = (item as Record<string, unknown>)[dateRangeKey];
          return v ? new Date(String(v)) <= to : false;
        });
      }
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const av = String(getValue(a, sortField) ?? "");
        const bv = String(getValue(b, sortField) ?? "");
        return sortDirection === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    return result;
  }, [data, serverSide, debouncedSearch, searchKeys, activeFilters, sortField, sortDirection]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalItems  = serverSide && pagination ? pagination.total     : processedData.length;
  const totalPages  = serverSide && pagination ? pagination.last_page : Math.ceil(processedData.length / pageSize);
  const displayFrom = serverSide && pagination ? pagination.from      : Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const displayTo   = serverSide && pagination ? pagination.to        : Math.min(currentPage * pageSize, totalItems);

  const pagedData = useMemo(() => {
    if (serverSide) return processedData;
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, serverSide, currentPage, pageSize]);

  // ── Pagination buttons ─────────────────────────────────────────────────────
  const pageButtons = useMemo(() => {
    const pages: (number | "…")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, "…", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "…", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "…", currentPage, "…", totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  // ── Sort icon ──────────────────────────────────────────────────────────────
  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
    return sortDirection === "asc"
      ? <ArrowUp   className="ml-1 h-3.5 w-3.5 text-violet-600" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 text-violet-600" />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-5", className)}>

      {/* Search + Filters + Date range */}
      {(searchable || filters.length > 0 || dateRangeKey) && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {searchable && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand dark:focus:ring-brand/20"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {filters.map((f) => (
                <FilterDropdown
                  key={f.key}
                  filter={f}
                  value={activeFilters[f.key] ?? "__all__"}
                  onChange={(v) => handleFilterChange(f.key, v)}
                  disabled={isLoading}
                />
              ))}

              {dateRangeKey && (
                <DateRangePicker
                  disabled={isLoading}
                  value={dateFrom && dateTo ? { from: dateFrom, to: dateTo } : null}
                  onChange={(range) => {
                    if (range) {
                      handleDateFrom(range.from);
                      handleDateTo(range.to);
                    } else {
                      clearDates();
                    }
                  }}
                  portalContainer={portalContainer}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="relative border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        {/* Refetch spinner — shown over existing rows in server-side mode */}
        {serverSide && isLoading && pagedData.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] dark:bg-slate-900/60">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left dark:border-slate-800 dark:bg-slate-800/60">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                    className={cn(
                      "whitespace-nowrap px-6 py-3 font-medium text-gray-500 dark:text-slate-400",
                      col.sortable && "cursor-pointer select-none hover:text-gray-800 dark:hover:text-slate-200",
                      col.headerClassName,
                    )}
                  >
                    <div className="flex items-center">
                      {col.header}
                      {col.sortable && <SortIcon field={String(col.key)} />}
                    </div>
                  </th>
                ))}
                {expandRow && <th className="w-8 px-3 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {/* Skeletons: only when truly no data yet (e.g. client-side isLoading or empty server data) */}
              {isLoading && pagedData.length === 0 ? (
                Array.from({ length: loadingRows }).map((_, ri) => (
                  <tr key={ri} className="animate-pulse">
                    {columns.map((_, ci) => (
                      <td key={ci} className="px-6 py-4">
                        <div className={cn("h-4 rounded bg-gray-200 dark:bg-slate-700", ci === 0 ? "w-36" : ci === columns.length - 1 ? "w-16" : "w-24")} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pagedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-14 text-center text-sm text-gray-400 dark:text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pagedData.map((item, i) => {
                  const rowKey = (((item as Record<string, unknown>).id) ?? i) as React.Key;
                  const isExpanded = expandedId === rowKey;
                  return (
                    <Fragment key={rowKey}>
                      <tr
                        onClick={() => {
                          if (expandRow) { setExpandedId(isExpanded ? null : rowKey); return; }
                          onRowClick?.(item);
                        }}
                        className={cn(
                          "transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60",
                          (onRowClick || expandRow) && "cursor-pointer",
                        )}
                      >
                        {columns.map((col) => (
                          <td key={String(col.key)} className={cn("whitespace-nowrap px-6 py-3 text-gray-700 dark:text-slate-300", col.className)}>
                            {col.render
                              ? col.render(item, i)
                              : String(getValue(item, col.key) ?? "")}
                          </td>
                        ))}
                        {expandRow && (
                          <td className="w-8 px-3 py-3 text-right">
                            <ChevronDown
                              className={cn("h-4 w-4 text-gray-400 transition-transform dark:text-slate-500", isExpanded && "rotate-180")}
                            />
                          </td>
                        )}
                      </tr>
                      {expandRow && isExpanded && (
                        <tr key={`${String(rowKey)}-expand`} className="bg-gray-50/80 dark:bg-slate-800/40">
                          <td colSpan={columns.length + 1} className="px-6 py-4">
                            {expandRow(item)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-gray-500 dark:text-slate-400 sm:flex-row">

          {/* Left: showing X–Y of Z + page size */}
          <div className="flex items-center gap-2">
            {totalItems > 0 && (
              <span>
                Showing {displayFrom}–{displayTo} of {totalItems} results
              </span>
            )}
            {showPageSizeSelector && (
              <select
                value={pageSize}
                onChange={(e) => handlePageSize(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>{s} / page</option>
                ))}
              </select>
            )}
          </div>

          {/* Right: page buttons */}
          <div className="flex items-center gap-1">
            {/* First */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            {/* Prev */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Page numbers */}
            {pageButtons.map((pg, idx) =>
              pg === "…" ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 dark:text-slate-500">…</span>
              ) : (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors",
                    currentPage === pg
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
                  )}
                >
                  {pg}
                </button>
              ),
            )}

            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {/* Last */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
