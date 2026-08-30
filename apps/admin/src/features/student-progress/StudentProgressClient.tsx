"use client";

import { useState, useTransition, useCallback } from "react";
import {
  ChartBar, Warning, CheckCircle, Users, Fire, BookOpen, Clock,
} from "@phosphor-icons/react";
import { DataTable, type Column } from "@repo/ui/data-table";
import { getStudentProgressAction } from "./actions";
import type { ProgressResponse, StudentProgressRow } from "./types";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";
import { useLocalization } from "@/shared/context/LocalizationContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct === 0    ? "bg-gray-200 dark:bg-slate-700"
    : pct >= 100 ? "bg-green-500"
    : pct >= 75  ? "bg-blue-500"
    : pct >= 25  ? "bg-brand-500 dark:bg-brand"
                 : "bg-amber-500";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 w-8 text-right shrink-0">{pct}%</span>
    </div>
  );
}

function getStatusInfo(row: StudentProgressRow, pct: number): { label: string; className: string } {
  if (row.enrollmentStatus === "completed" || pct >= 100)
    return { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" };
  const daysSinceEnroll   = row.enrolledAt   ? Math.floor((Date.now() - new Date(row.enrolledAt).getTime())  / 86400000) : 0;
  const daysSinceActivity = row.lastActivity ? Math.floor((Date.now() - new Date(row.lastActivity).getTime()) / 86400000) : daysSinceEnroll;
  if (pct === 0 && daysSinceEnroll >= 7)   return { label: "At Risk",     className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"    };
  if (pct >= 75)                            return { label: "Almost Done", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"  };
  if (pct > 0 && daysSinceActivity > 14)   return { label: "Stalled",     className: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" };
  if (pct > 0)                              return { label: "In Progress", className: "bg-brand-100 text-brand-700 dark:bg-brand/15 dark:text-brand" };
  return { label: "Not Started", className: "bg-gray-100 text-gray-500 dark:bg-slate-500/15 dark:text-slate-400" };
}

function relativeDate(dateStr: string | null, formatDateLocalized: (d: string | Date) => string): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)   return `${days}d ago`;
  if (days < 30)  return `${Math.floor(days / 7)}w ago`;
  return formatDateLocalized(dateStr);
}

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<StudentProgressRow>[] = [
  {
    key: "student", header: "Student", defaultVisible: true,
    exportFields: [
      { header: "First Name", getValue: (r) => r.userFirstName },
      { header: "Last Name",  getValue: (r) => r.userLastName  },
      { header: "Email",      getValue: (r) => r.userEmail ?? "" },
    ],
  },
  {
    key: "course", header: "Course", defaultVisible: true,
    exportFields: [{ header: "Course", getValue: (r) => r.courseTitle }],
  },
  {
    key: "progress", header: "Progress", defaultVisible: true,
    exportFields: [{
      header: "Progress %",
      getValue: (r) => r.totalLessons > 0
        ? `${Math.round((r.completedLessons / r.totalLessons) * 100)}%`
        : "0%",
    }],
  },
  {
    key: "lessons", header: "Lessons", defaultVisible: true,
    exportFields: [
      { header: "Completed Lessons", getValue: (r) => String(r.completedLessons) },
      { header: "Total Lessons",     getValue: (r) => String(r.totalLessons)     },
    ],
  },
  {
    key: "lastActivity", header: "Last Active", defaultVisible: true,
    exportFields: [{ header: "Last Active", getValue: (r) => formatDate(r.lastActivity) }],
  },
  {
    key: "statusLabel", header: "Status", defaultVisible: true,
    exportFields: [{
      header: "Status",
      getValue: (r) => {
        const pct = r.totalLessons > 0 ? Math.round((r.completedLessons / r.totalLessons) * 100) : 0;
        return getStatusInfo(r, pct).label;
      },
    }],
  },
  {
    key: "enrolledAt", header: "Enrolled", defaultVisible: true,
    exportFields: [{ header: "Enrolled Date", getValue: (r) => formatDate(r.enrolledAt) }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Main Client ──────────────────────────────────────────────────────────────

export function StudentProgressClient({ initial }: { initial: ProgressResponse }) {
  const [data,      setData]      = useState(initial);
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("");
  const [page,      setPage]      = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);
  const [, startTransition] = useTransition();
  const { formatDate: formatDateLocalized } = useLocalization();

  const { data: rows, pagination, stats } = data;

  const load = useCallback((s: string, st: string, p: number) => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const res = await getStudentProgressAction({ search: s, status: st, page: p, per_page: 15 });
        if (res.success) { setData(res.data); setPage(p); }
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<StudentProgressRow[]> {
    const res = await getStudentProgressAction({ search, status, page: 1, per_page: 100000 });
    return res.success ? res.data.data : [];
  }

  const visibleColumns: Column<StudentProgressRow>[] = [
    ...(visibleCols.has("student") ? [{
      key: "student" as const, header: "Student",
      render: (row: StudentProgressRow) => {
        const initials = `${row.userFirstName[0] ?? ""}${row.userLastName[0] ?? ""}`.toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            {row.userAvatar ? (
              <img src={row.userAvatar} alt={row.userFirstName} className="h-8 w-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand/15 shrink-0">
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{row.userFirstName} {row.userLastName}</p>
              {row.userEmail && <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{row.userEmail}</p>}
            </div>
          </div>
        );
      },
    }] : []),
    ...(visibleCols.has("course") ? [{
      key: "course" as const, header: "Course",
      render: (row: StudentProgressRow) => (
        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 max-w-[180px] truncate">{row.courseTitle}</p>
      ),
    }] : []),
    ...(visibleCols.has("progress") ? [{
      key: "progress" as const, header: "Progress", className: "min-w-[160px]",
      render: (row: StudentProgressRow) => {
        const pct = row.totalLessons > 0 ? Math.round((row.completedLessons / row.totalLessons) * 100) : 0;
        return <ProgressBar pct={pct} />;
      },
    }] : []),
    ...(visibleCols.has("lessons") ? [{
      key: "lessons" as const, header: "Lessons",
      render: (row: StudentProgressRow) => (
        <span className="text-sm text-gray-600 dark:text-slate-300">
          <span className="font-semibold text-gray-900 dark:text-white">{row.completedLessons}</span>
          <span className="text-gray-400 dark:text-slate-500">/{row.totalLessons}</span>
        </span>
      ),
    }] : []),
    ...(visibleCols.has("lastActivity") ? [{
      key: "lastActivity" as const, header: "Last Active",
      render: (row: StudentProgressRow) => (
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-gray-400 dark:text-slate-500 shrink-0" />
          <span className="text-sm text-gray-500 dark:text-slate-400">{relativeDate(row.lastActivity, formatDateLocalized)}</span>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("statusLabel") ? [{
      key: "statusLabel" as const, header: "Status",
      render: (row: StudentProgressRow) => {
        const pct = row.totalLessons > 0 ? Math.round((row.completedLessons / row.totalLessons) * 100) : 0;
        const { label, className } = getStatusInfo(row, pct);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${className}`}>
            {label}
          </span>
        );
      },
    }] : []),
    ...(visibleCols.has("enrolledAt") ? [{
      key: "enrolledAt" as const, header: "Enrolled",
      render: (row: StudentProgressRow) => (
        <span className="text-xs text-gray-500 dark:text-slate-400">{formatDate(row.enrolledAt)}</span>
      ),
    }] : []),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Progress</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Retention tracking and course completion rates</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={rows}
            fields={exportFields}
            fetchAll={fetchAllForExport}
            filename={`student-progress-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Student Progress Export"
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand/15">
            <ChartBar size={20} weight="fill" className="text-brand-600 dark:text-brand" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Enrollments",  value: stats.active,    icon: Users,       color: "bg-brand-500" },
          { label: "Completed",           value: stats.completed,  icon: CheckCircle, color: "bg-green-500"  },
          { label: "At Risk (7d inact.)", value: stats.atRisk,     icon: Warning,     color: "bg-red-500"    },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} shrink-0`}>
              <Icon size={22} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Student Progress</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={rows}
            columns={visibleColumns}
            serverSide
            pagination={{
              total: pagination.total,
              per_page: 15,
              current_page: page,
              last_page: pagination.last_page,
              from: pagination.from,
              to: pagination.to,
            }}
            isLoading={isLoading}
            searchable
            searchPlaceholder="Search by student or course…"
            filters={[
              {
                key: "status",
                label: "All Statuses",
                options: [
                  { label: "Active",    value: "active"    },
                  { label: "Completed", value: "completed" },
                ],
              },
            ]}
            onQueryChange={(params) => {
              const s  = (params.search as string | undefined) ?? search;
              const st = (params.status as string | undefined) ?? status;
              setSearch(s); setStatus(st);
              load(s, st, params.page);
            }}
            emptyMessage="No progress records found."
            pageSize={10}
            pageSizeOptions={[10, 20, 50, 100]}
            showPageSizeSelector={false}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Not Started", color: "bg-gray-200 dark:bg-slate-700"   },
          { label: "In Progress", color: "bg-brand-500 dark:bg-brand" },
          { label: "Stalled",     color: "bg-orange-400" },
          { label: "Almost Done", color: "bg-blue-500"   },
          { label: "Completed",   color: "bg-green-500"  },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
          <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 text-[10px] font-bold">At Risk</span>
          <span>= enrolled &gt;7d with 0 lessons</span>
        </div>
      </div>
    </div>
  );
}
