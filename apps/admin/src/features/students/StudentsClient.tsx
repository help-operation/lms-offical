"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchStudentsAction, fetchStudentsStatsAction } from "@/features/students/actions/students.actions";
import type { Student } from "./types";
import type { PaginatedResponse, TableQueryParams } from "@/features/admin/api";
import { DataTable, type Column, type TablePagination } from "@repo/ui/data-table";
import {
  Users, UserCheck, UserX, CalendarClock, Wifi, Eye, Trash2, Phone, Mail, Copy, Check,
} from "lucide-react";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props {
  initialData: PaginatedResponse<Student>;
  initialStats?: {
    total: number;
    active: number;
    suspended: number;
    newThisMonth: number;
    onlineNow: number;
  };
}

function getAllCols(formatDate: (value: Date | string | null | undefined) => string): ColDef<Student>[] {
  return [
    {
      key: "firstName", header: "Student", defaultVisible: true,
      exportFields: [
        { header: "First Name", getValue: (s) => s.firstName },
        { header: "Last Name", getValue: (s) => s.lastName },
        { header: "Profession", getValue: (s) => s.profession ?? "" },
      ],
    },
    {
      key: "email", header: "Contact", defaultVisible: true,
      exportFields: [
        { header: "Email", getValue: (s) => s.email ?? "" },
        { header: "Phone", getValue: (s) => s.phone ?? "" },
      ],
    },
    {
      key: "createdAt", header: "Joined", defaultVisible: true,
      exportFields: [{
        header: "Joined",
        getValue: (s) => s.createdAt ? formatDate(s.createdAt) : "",
      }],
    },
    {
      key: "status", header: "Status", defaultVisible: true,
      exportFields: [{ header: "Status", getValue: (s) => s.status }],
    },
  ];
}

const DEFAULT_VISIBLE = new Set(["firstName", "email", "createdAt", "status"]);

const avatarColors = [
  "bg-blue-400", "bg-violet-400", "bg-emerald-400",
  "bg-amber-400", "bg-rose-400", "bg-cyan-400",
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    suspended: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
      {status}
    </span>
  );
}

function CopyableField({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="group flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
      <Icon className="h-3 w-3 shrink-0" /> {value}
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy"}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand transition-opacity"
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

export function StudentsClient({ initialData, initialStats }: Props) {
  const { formatDate } = useLocalization();
  const ALL_COLS = getAllCols(formatDate);
  const [students, setStudents] = useState(initialData.data);
  const [pagination, setPagination] = useState<TablePagination>(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);
  const [stats, setStats] = useState(initialStats ?? { total: 0, active: 0, suspended: 0, newThisMonth: 0, onlineNow: 0 });

  useEffect(() => {
    fetchStudentsStatsAction().then((res) => {
      if (res.success && res.data) setStats(res.data);
    }).catch(() => {});
  }, []);

  async function fetchStudents(params: TableQueryParams) {
    setIsLoading(true);
    try {
      const res = await fetchStudentsAction(params);
      if (res.success && res.data) {
        setStudents(res.data.data);
        setPagination(res.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<Student[]> {
    const res = await fetchStudentsAction({ page: 1, per_page: 100000 });
    return res.success && res.data ? res.data.data : [];
  }

  const visibleColumns: Column<Student>[] = [
    ...(visibleCols.has("firstName")
      ? [
          {
            key: "firstName" as const,
            header: "Student",
            sortable: true,
            render: (s: Student, i: number) => (
              <div className="flex items-center gap-3">
                {s.avatar ? (
                  <img src={s.avatar} alt={s.firstName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}
                  >
                    {s.firstName[0]}
                  </div>
                )}
                <div>
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="text-sm font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand transition-colors"
                  >
                    {s.firstName} {s.lastName}
                  </Link>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">{s.profession ?? `#${s.id}`}</p>
                </div>
              </div>
            ),
          } as Column<Student>,
        ]
      : []),
    ...(visibleCols.has("email")
      ? [
          {
            key: "email" as const,
            header: "Contact",
            render: (s: Student) => (
              <div className="space-y-0.5">
                {s.email && <CopyableField icon={Mail} value={s.email} />}
                {s.phone && <CopyableField icon={Phone} value={s.phone} />}
                {!s.email && !s.phone && <span className="text-xs text-gray-300 dark:text-slate-600">—</span>}
              </div>
            ),
          } as Column<Student>,
        ]
      : []),
    ...(visibleCols.has("createdAt")
      ? [
          {
            key: "createdAt" as const,
            header: "Joined",
            sortable: true,
            render: (s: Student) => (
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {s.createdAt ? formatDate(s.createdAt) : "—"}
              </span>
            ),
          } as Column<Student>,
        ]
      : []),
    ...(visibleCols.has("status")
      ? [
          {
            key: "status" as const,
            header: "Status",
            render: (s: Student) => <StatusBadge status={s.status} />,
          } as Column<Student>,
        ]
      : []),
    {
      key: "id" as const,
      header: "Actions",
      render: (s: Student) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/students/${s.id}`}
            title="View"
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  const kpiCards = [
    { label: "Total Students", value: stats.total, icon: Users, iconBg: "bg-gradient-to-br from-brand-500 to-brand-600", cardBg: "bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-500/10 dark:to-slate-900" },
    { label: "Active", value: stats.active, icon: UserCheck, iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600", cardBg: "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900" },
    { label: "Suspended", value: stats.suspended, icon: UserX, iconBg: "bg-gradient-to-br from-red-500 to-red-600", cardBg: "bg-gradient-to-br from-red-50/80 to-white dark:from-red-500/10 dark:to-slate-900" },
    { label: "New This Month", value: stats.newThisMonth, icon: CalendarClock, iconBg: "bg-gradient-to-br from-blue-500 to-blue-600", cardBg: "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900" },
    { label: "Online Now", value: stats.onlineNow, icon: Wifi, iconBg: "bg-gradient-to-br from-amber-500 to-amber-600", cardBg: "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900" },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl ${card.cardBg} p-4 border border-white/60 dark:border-slate-800 shadow-sm flex items-center gap-3`}
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} shrink-0`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total === 0 && card.label === "Online Now" ? "0" : card.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Manage all student accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={students}
            fields={exportFields}
            fetchAll={fetchAllForExport}
            filename={`students-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Students Export"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Students</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={students}
            columns={visibleColumns}
            serverSide
            pagination={pagination}
            onQueryChange={fetchStudents}
            dateRangeKey="createdAt"
            portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
            isLoading={isLoading}
            searchable
            searchPlaceholder="Search by name, email or phone…"
            filters={[
              {
                key: "status",
                label: "All Status",
                options: [
                  { label: "Active", value: "active" },
                  { label: "Suspended", value: "suspended" },
                ],
              },
            ]}
            emptyMessage="No students found."
          />
        </div>
      </div>
    </div>
  );
}
