"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchTeachersAction } from "@/features/teachers/actions/teachers.actions";
import type { Teacher } from "./types";
import type { PaginatedResponse, TableQueryParams } from "@/features/admin/api";
import { DataTable, type Column, type TablePagination } from "@repo/ui/data-table";
import { BookOpen, GraduationCap, Star, Eye } from "lucide-react";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { initialData: PaginatedResponse<Teacher> }

function getAllCols(formatDate: (value: Date | string | null | undefined) => string): ColDef<Teacher>[] {
  return [
  {
    key: "firstName", header: "Teacher", defaultVisible: true,
    exportFields: [
      { header: "Display Name", getValue: (t) => t.displayName || `${t.firstName} ${t.lastName}` },
      { header: "Email",        getValue: (t) => t.email ?? "" },
    ],
  },
  {
    key: "expertise", header: "Expertise", defaultVisible: true,
    exportFields: [{ header: "Expertise", getValue: (t) => t.expertise ?? "" }],
  },
  {
    key: "totalCourses", header: "Courses", defaultVisible: true,
    exportFields: [{ header: "Courses", getValue: (t) => String(t.totalCourses) }],
  },
  {
    key: "totalStudents", header: "Students", defaultVisible: true,
    exportFields: [{ header: "Students", getValue: (t) => String(t.totalStudents ?? 0) }],
  },
  {
    key: "rating", header: "Rating", defaultVisible: true,
    exportFields: [{ header: "Rating", getValue: (t) => t.rating ? parseFloat(t.rating).toFixed(1) : "" }],
  },
  {
    key: "createdAt", header: "Joined", defaultVisible: true,
    exportFields: [{
      header: "Joined",
      getValue: (t) => t.createdAt ? formatDate(t.createdAt) : "",
    }],
  },
  {
    key: "status", header: "Status", defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (t) => t.status }],
  },
  ];
}

const DEFAULT_VISIBLE = new Set(["firstName", "expertise", "totalCourses", "totalStudents", "rating", "createdAt", "status"]);

const avatarColors = [
  "bg-violet-400", "bg-blue-400", "bg-emerald-400",
  "bg-amber-400", "bg-rose-400", "bg-cyan-400",
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    suspended: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
      {status}
    </span>
  );
}

export function TeachersClient({ initialData }: Props) {
  const { formatDate } = useLocalization();
  const [teachers, setTeachers]       = useState(initialData.data);
  const [pagination, setPagination]   = useState<TablePagination>(initialData.pagination);
  const [isLoading, setIsLoading]     = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);
  const ALL_COLS = getAllCols(formatDate);

  async function fetchTeachers(params: TableQueryParams) {
    setIsLoading(true);
    try {
      const res = await fetchTeachersAction(params);
      if (res.success && res.data) {
        setTeachers(res.data.data);
        setPagination(res.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<Teacher[]> {
    const res = await fetchTeachersAction({ page: 1, per_page: 100000 });
    return res.success && res.data ? res.data.data : [];
  }

  const visibleColumns: Column<Teacher>[] = [
    ...(visibleCols.has("firstName") ? [{
      key: "firstName" as const, header: "Teacher", sortable: true,
      render: (t: Teacher, i: number) => (
        <div className="flex items-center gap-3">
          {t.displayAvatar || t.avatar ? (
            <img
              src={(t.displayAvatar || t.avatar)!}
              alt={t.firstName}
              className="h-10 w-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
              {t.firstName[0]}
            </div>
          )}
          <div>
            <Link
              href={`/admin/teachers/${t.id}`}
              className="text-sm font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand transition-colors"
            >
              {t.displayName || `${t.firstName} ${t.lastName}`}
            </Link>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">{t.email ?? "—"}</p>
          </div>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("expertise") ? [{
      key: "expertise" as const, header: "Expertise",
      render: (t: Teacher) => <span className="text-xs text-gray-500 dark:text-slate-400">{t.expertise || "—"}</span>,
    }] : []),
    ...(visibleCols.has("totalCourses") ? [{
      key: "totalCourses" as const, header: "Courses",
      render: (t: Teacher) => (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300">
          <BookOpen className="h-3.5 w-3.5 text-brand-400 dark:text-brand" />
          {t.totalCourses}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("totalStudents") ? [{
      key: "totalStudents" as const, header: "Students",
      render: (t: Teacher) => (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300">
          <GraduationCap className="h-3.5 w-3.5 text-blue-400 dark:text-blue-400" />
          {(t.totalStudents ?? 0).toLocaleString()}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("rating") ? [{
      key: "rating" as const, header: "Rating",
      render: (t: Teacher) => (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300">
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          {t.rating ? parseFloat(t.rating).toFixed(1) : "—"}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("createdAt") ? [{
      key: "createdAt" as const, header: "Joined", sortable: true,
      render: (t: Teacher) => (
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {t.createdAt ? formatDate(t.createdAt) : "—"}
        </span>
      ),
    }] : []),
    ...(visibleCols.has("status") ? [{
      key: "status" as const, header: "Status",
      render: (t: Teacher) => <StatusBadge status={t.status} />,
    }] : []),
    {
      key: "id" as const, header: "Actions",
      render: (t: Teacher) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/teachers/${t.id}`}
            title="View"
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h1>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Manage all instructor accounts</p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnsDropdown
              cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
              visible={visibleCols}
              onChange={setVisibleCols}
            />
            <ExportDropdown
              pageData={teachers}
              fields={exportFields}
              fetchAll={fetchAllForExport}
              filename={`teachers-${new Date().toISOString().slice(0, 10)}`}
              exportTitle="Teachers Export"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Teachers</h2>
          </div>
          <div className="px-6 pt-5 pb-6">
            <DataTable
              data={teachers}
              columns={visibleColumns}
              serverSide
              pagination={pagination}
              onQueryChange={fetchTeachers}
              isLoading={isLoading}
              searchable
              searchPlaceholder="Search by name or email…"
              filters={[
                {
                  key: "status",
                  label: "All Status",
                  options: [
                    { label: "Active",    value: "active"    },
                    { label: "Suspended", value: "suspended" },
                  ],
                },
              ]}
              emptyMessage="No teachers found."
            />
          </div>
        </div>
      </div>
  );
}
