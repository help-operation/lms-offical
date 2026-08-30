"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, type Column } from "@repo/ui/data-table";
import type { CourseInterest, InterestsResponse } from "./api";
import type { EnrollCourseOption, EnrollLiveOption } from "@/features/enrollments/types";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props {
  initial: InterestsResponse;
  recordedCourses: EnrollCourseOption[];
  liveCourses: EnrollLiveOption[];
}

function fmtRelative(iso: string | null, formatDateLocalized: (value: Date | string | null | undefined) => string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return formatDateLocalized(iso);
}

function IntentBadge({ count }: { count: number }) {
  if (count >= 5) return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">🔥 {count} visits</span>;
  if (count >= 3) return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:text-orange-400">⚡ {count} visits</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-slate-500/15 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-slate-400">{count} visit{count !== 1 ? "s" : ""}</span>;
}

function CourseTypeBadge({ type }: { type: "recorded" | "live" }) {
  return type === "live"
    ? <span className="inline-flex items-center rounded-full bg-brand-100 dark:bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-400">Live</span>
    : <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">Recorded</span>;
}

function encodeFilter(type: "r" | "l", id: number) { return `${type}:${id}`; }

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<CourseInterest>[] = [
  {
    key: "user", header: "User", defaultVisible: true,
    exportFields: [
      { header: "Name",  getValue: (r) => r.userName          },
      { header: "Phone", getValue: (r) => r.userPhone ?? ""   },
      { header: "Email", getValue: (r) => r.userEmail ?? ""   },
    ],
  },
  {
    key: "course", header: "Course", defaultVisible: true,
    exportFields: [
      { header: "Course",      getValue: (r) => r.courseTitle },
      { header: "Course Type", getValue: (r) => r.courseType  },
    ],
  },
  {
    key: "firstSeen", header: "First Seen", defaultVisible: true,
    exportFields: [{ header: "First Seen", getValue: (r) => formatDate(r.firstSeenAt) }],
  },
  {
    key: "lastSeen", header: "Last Seen", defaultVisible: true,
    exportFields: [{ header: "Last Seen", getValue: (r) => formatDate(r.lastSeenAt) }],
  },
  {
    key: "visits", header: "Visits", defaultVisible: true,
    exportFields: [{ header: "Visit Count", getValue: (r) => String(r.visitCount) }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Main Component ───────────────────────────────────────────────────────────

export function InterestsClient({ initial, recordedCourses, liveCourses }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);
  const { formatDate: formatDateLocalized } = useLocalization();

  const currentFilter = sp.get("courseId")
    ? encodeFilter("r", parseInt(sp.get("courseId")!))
    : sp.get("liveCourseId")
      ? encodeFilter("l", parseInt(sp.get("liveCourseId")!))
      : "";
  const [filterVal, setFilterVal] = useState(currentFilter);

  const { data, pagination } = initial;

  function navigate(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp);
    Object.entries(updates).forEach(([k, v]) => { if (v) next.set(k, v); else next.delete(k); });
    next.delete("page");
    startTransition(() => router.push(`?${next.toString()}`));
  }

  function handleFilterChange(val: string) {
    setFilterVal(val);
    if (!val) navigate({ courseId: undefined, liveCourseId: undefined });
    else if (val.startsWith("r:")) navigate({ courseId: val.slice(2), liveCourseId: undefined });
    else if (val.startsWith("l:")) navigate({ liveCourseId: val.slice(2), courseId: undefined });
  }

  const hasFilters = sp.get("search") || sp.get("courseId") || sp.get("liveCourseId");

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  const visibleColumns: Column<CourseInterest>[] = [
    ...(visibleCols.has("user") ? [{
      key: "user" as const, header: "User",
      render: (row: CourseInterest) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.userName}</p>
          {row.userPhone && <p className="text-xs text-gray-500 dark:text-slate-400">{row.userPhone}</p>}
          {row.userEmail && <p className="text-xs text-gray-400 dark:text-slate-500">{row.userEmail}</p>}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("course") ? [{
      key: "course" as const, header: "Course",
      render: (row: CourseInterest) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white line-clamp-2">{row.courseTitle}</p>
          <div className="mt-0.5"><CourseTypeBadge type={row.courseType} /></div>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("firstSeen") ? [{
      key: "firstSeen" as const, header: "First Seen",
      render: (row: CourseInterest) => <span className="text-gray-600 dark:text-slate-300 whitespace-nowrap">{formatDateLocalized(row.firstSeenAt)}</span>,
    }] : []),
    ...(visibleCols.has("lastSeen") ? [{
      key: "lastSeen" as const, header: "Last Seen",
      render: (row: CourseInterest) => <span className="text-gray-600 dark:text-slate-300">{fmtRelative(row.lastSeenAt, formatDateLocalized)}</span>,
    }] : []),
    ...(visibleCols.has("visits") ? [{
      key: "visits" as const, header: "Visits",
      render: (row: CourseInterest) => <IntentBadge count={row.visitCount} />,
    }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Course filter */}
        <select
          value={filterVal}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-400 dark:focus:border-brand"
        >
          <option value="">All courses</option>
          {recordedCourses.length > 0 && (
            <optgroup label="Recorded">
              {recordedCourses.map((c) => (
                <option key={`r:${c.id}`} value={encodeFilter("r", c.id)}>{c.title}</option>
              ))}
            </optgroup>
          )}
          {liveCourses.length > 0 && (
            <optgroup label="Live">
              {liveCourses.map((c) => (
                <option key={`l:${c.id}`} value={encodeFilter("l", c.id)}>{c.title}</option>
              ))}
            </optgroup>
          )}
        </select>

        {hasFilters && (
          <button type="button" onClick={() => { setFilterVal(""); navigate({ search: undefined, courseId: undefined, liveCourseId: undefined }); }}
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400">
            Clear filters
          </button>
        )}

        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">
          {pagination.total.toLocaleString()} record{pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Export / Columns controls */}
      <div className="flex items-center justify-end gap-2">
        <ColumnsDropdown
          cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
          visible={visibleCols}
          onChange={setVisibleCols}
        />
        <ExportDropdown
          pageData={data}
          fields={exportFields}
          filename={`interests-${new Date().toISOString().slice(0, 10)}`}
          exportTitle="Course Interests Export"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Course Interests</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={data}
            columns={visibleColumns}
            serverSide
            pagination={{
              total: pagination.total,
              per_page: pagination.limit ?? 20,
              current_page: pagination.page,
              last_page: pagination.totalPages,
              from: (pagination.page - 1) * (pagination.limit ?? 20) + 1,
              to: Math.min(pagination.page * (pagination.limit ?? 20), pagination.total),
            }}
            searchable
            searchPlaceholder="Search user name, email, phone…"
            onQueryChange={(params) => {
              const next = new URLSearchParams(sp);
              if (params.search) next.set("search", params.search as string);
              else next.delete("search");
              next.set("page", String(params.page));
              startTransition(() => router.push(`?${next.toString()}`));
            }}
            emptyMessage="No interests recorded yet."
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
            showPageSizeSelector={false}
          />
        </div>
      </div>
    </div>
  );
}
