"use client";

import { useState, useTransition, useCallback } from "react";
import {
  GraduationCap, CheckCircle, CalendarBlank,
  Plus, Sliders, CurrencyCircleDollar, BookOpen, Eye,
} from "@phosphor-icons/react";
import { DataTable, type Column, type TablePagination, type TableQueryParams } from "@repo/ui/data-table";
import { getEnrollmentsAction } from "./actions";
import { ManualEnrollModal } from "./ManualEnrollModal";
import { ManageEnrollmentModal } from "./ManageEnrollmentModal";
import { StudentCoursesModal } from "./StudentCoursesModal";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";
import type { AdminEnrollment, AdminEnrollmentCourse, EnrollmentStats, EnrollmentsResponse } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  suspended: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

const PAYMENT_LABEL: Record<string, string> = {
  paystation: "PayStation",
  bkash:      "bKash",
  free:       "Free",
};

const avatarColors = ["bg-violet-400","bg-blue-400","bg-pink-400","bg-amber-400","bg-teal-400","bg-rose-400"];

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// The most recently joined course for this student — used to fill the
// single-value Status/Payment/Amount/Completed columns in the summary row.
function latestCourse(e: AdminEnrollment): AdminEnrollmentCourse | undefined {
  return [...e.courses].sort((a, b) => (b.enrolledAt ?? "").localeCompare(a.enrolledAt ?? ""))[0];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg, hint }: {
  label: string; value: number; icon: React.ElementType; color: string; bg: string; hint?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5" title={hint}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} mb-3`}>
        <Icon size={20} weight="fill" className={color} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<AdminEnrollment>[] = [
  {
    key: "student", header: "Student", defaultVisible: true,
    exportFields: [
      { header: "First Name", getValue: (e) => e.userFirstName },
      { header: "Last Name",  getValue: (e) => e.userLastName },
      { header: "Email",      getValue: (e) => e.userEmail ?? "" },
    ],
  },
  {
    key: "course", header: "Course", defaultVisible: true,
    exportFields: [{ header: "Courses Joined", getValue: (e) => String(e.courseCount) }],
  },
  {
    key: "status", header: "Status", defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (e) => latestCourse(e)?.status ?? "" }],
  },
  {
    key: "paymentMethod", header: "Payment", defaultVisible: true,
    exportFields: [{ header: "Payment Method", getValue: (e) => {
      const m = latestCourse(e)?.paymentMethod ?? "";
      return PAYMENT_LABEL[m] ?? m;
    } }],
  },
  {
    key: "amount", header: "Amount", defaultVisible: true,
    exportFields: [{ header: "Amount", getValue: (e) => {
      const a = latestCourse(e)?.amount;
      return a ? `${Number(a).toLocaleString()}` : "";
    } }],
  },
  {
    key: "enrolledAt", header: "Enrolled", defaultVisible: true,
    exportFields: [{ header: "Enrolled Date", getValue: (e) => formatDate(e.lastEnrolledAt) }],
  },
  {
    key: "completedAt", header: "Completed", defaultVisible: true,
    exportFields: [{ header: "Completed Date", getValue: (e) => formatDate(latestCourse(e)?.completedAt ?? null) }],
  },
  {
    key: "view", header: "View", defaultVisible: true,
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { initial: EnrollmentsResponse }

export function EnrollmentsClient({ initial }: Props) {
  const [data,       setData]       = useState<AdminEnrollment[]>(initial.data);
  const [stats,      setStats]      = useState<EnrollmentStats>(initial.stats);
  const [pagination, setPagination] = useState<TablePagination>(initial.pagination as unknown as TablePagination);
  const [isLoading,  setIsLoading]  = useState(false);
  const [courseType, setCourseType] = useState<"all" | "recorded" | "live">("all");
  const [currentParams, setCurrentParams] = useState<TableQueryParams>({ page: 1, per_page: 20 });
  const [showEnroll, setShowEnroll] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminEnrollment | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);
  const [, startTransition] = useTransition();

  const load = useCallback(
    (params: TableQueryParams, ct: "all" | "recorded" | "live") => {
      setCurrentParams(params);
      setIsLoading(true);
      startTransition(async () => {
        try {
          const res = await getEnrollmentsAction({
            page:     params.page,
            per_page: params.per_page,
            search:   params.search as string | undefined,
            status:   params.status as string | undefined,
            type:     ct === "all" ? undefined : ct,
          });
          if (res.success) {
            setData(res.data.data);
            setStats(res.data.stats);
            setPagination(res.data.pagination as unknown as TablePagination);
          }
        } finally {
          setIsLoading(false);
        }
      });
    },
    [],
  );

  function handleCourseType(val: "all" | "recorded" | "live") {
    setCourseType(val);
    load({ ...currentParams, page: 1 }, val);
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<AdminEnrollment[]> {
    const res = await getEnrollmentsAction({
      page: 1, per_page: 100000,
      search: currentParams.search as string | undefined,
      status: currentParams.status as string | undefined,
      type:   courseType === "all" ? undefined : courseType,
    });
    return res.success ? res.data.data : [];
  }

  const visibleColumns: Column<AdminEnrollment>[] = [
    ...(visibleCols.has("student") ? [{
      key: "student" as const,
      header: "Student",
      render: (e: AdminEnrollment, i: number) => (
        <div className="flex items-center gap-2.5">
          {e.userAvatar ? (
            <img src={e.userAvatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
              {initials(e.userFirstName, e.userLastName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{e.userFirstName} {e.userLastName}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{e.userEmail ?? e.userPhone ?? "—"}</p>
          </div>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("course") ? [{
      key: "course" as const,
      header: "Course",
      className: "max-w-[240px]",
      render: (e: AdminEnrollment) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200">
          <BookOpen size={13} weight="fill" className="text-gray-400 dark:text-slate-500" />
          {e.courseCount} {e.courseCount === 1 ? "course" : "courses"}
        </span>
      ),
    }] : []),
    ...(visibleCols.has("status") ? [{
      key: "status" as const,
      header: "Status",
      render: (e: AdminEnrollment) => {
        const status = latestCourse(e)?.status;
        return status ? (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
            {status}
          </span>
        ) : <span className="text-xs text-gray-400 dark:text-slate-500">—</span>;
      },
    }] : []),
    ...(visibleCols.has("paymentMethod") ? [{
      key: "paymentMethod" as const,
      header: "Payment",
      render: (e: AdminEnrollment) => {
        const method = latestCourse(e)?.paymentMethod;
        return method ? (
          <span className="inline-flex items-center gap-1 text-xs text-gray-700 dark:text-slate-300">
            <CurrencyCircleDollar size={13} weight="fill" className="text-gray-400 dark:text-slate-500" />
            {PAYMENT_LABEL[method] ?? method}
          </span>
        ) : <span className="text-xs text-gray-400 dark:text-slate-500">—</span>;
      },
    }] : []),
    ...(visibleCols.has("amount") ? [{
      key: "amount" as const,
      header: "Amount",
      render: (e: AdminEnrollment) => {
        const amount = latestCourse(e)?.amount;
        return (
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            {amount ? `৳${Number(amount).toLocaleString()}` : "—"}
          </span>
        );
      },
    }] : []),
    ...(visibleCols.has("enrolledAt") ? [{
      key: "enrolledAt" as const,
      header: "Enrolled",
      render: (e: AdminEnrollment) => (
        <span className="text-[11px] text-gray-500 dark:text-slate-400 whitespace-nowrap">{formatDate(e.lastEnrolledAt)}</span>
      ),
    }] : []),
    ...(visibleCols.has("completedAt") ? [{
      key: "completedAt" as const,
      header: "Completed",
      render: (e: AdminEnrollment) => {
        const completedAt = latestCourse(e)?.completedAt ?? null;
        return completedAt ? (
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-[11px]">
            <CheckCircle size={12} weight="fill" /> {formatDate(completedAt)}
          </span>
        ) : <span className="text-gray-300 dark:text-slate-600 text-[11px]">—</span>;
      },
    }] : []),
    ...(visibleCols.has("view") ? [{
      key: "view" as const,
      header: "View",
      render: (e: AdminEnrollment) => (
        <button
          type="button"
          onClick={(ev) => { ev.stopPropagation(); setSelectedStudent(e); }}
          className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand hover:bg-brand-50 dark:hover:bg-brand/10 transition"
          title="View enrolled courses"
        >
          <Eye size={15} weight="bold" />
        </button>
      ),
    }] : []),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Enrollments</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">All student–course enrollments across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={data}
            fields={exportFields}
            fetchAll={fetchAllForExport}
            filename={`enrollments-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Enrollments Export"
          />
          <button
            onClick={() => setShowManage(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm font-semibold px-4 py-2.5 transition shadow-sm dark:shadow-none"
          >
            <Sliders size={16} weight="bold" /> Manage Enrollment
          </button>
          <button
            onClick={() => setShowEnroll(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand/90 text-white text-sm font-semibold px-4 py-2.5 transition shadow-sm dark:shadow-none"
          >
            <Plus size={16} weight="bold" /> Enroll Student
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Enrollments" value={stats.total}     icon={GraduationCap} color="text-brand-600 dark:text-brand" bg="bg-brand-100 dark:bg-brand/15" hint="Counts every course enrollment, not students — one student joining 2 courses counts as 2." />
        <StatCard label="Active"            value={stats.active}    icon={CheckCircle}   color="text-green-600 dark:text-green-400"  bg="bg-green-100 dark:bg-green-500/15"  hint="Counts active course enrollments, not students." />
        <StatCard label="Completed"         value={stats.completed} icon={BookOpen}      color="text-blue-600 dark:text-blue-400"   bg="bg-blue-100 dark:bg-blue-500/15"   hint="Counts completed course enrollments, not students." />
        <StatCard label="This Month"        value={stats.thisMonth} icon={CalendarBlank} color="text-amber-600 dark:text-amber-400"  bg="bg-amber-100 dark:bg-amber-500/15"  hint="Counts course enrollments made this month, not students." />
      </div>

      {/* Course type tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-fit">
        {(["all", "recorded", "live"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleCourseType(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${
              courseType === t ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm dark:shadow-none" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
          >
            {t === "all" ? "All" : t === "recorded" ? "Recorded" : "Live"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Enrollments</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={data}
            columns={visibleColumns}
            serverSide
            pagination={pagination}
            isLoading={isLoading}
            dateRangeKey="lastEnrolledAt"
            portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
            searchable
            searchPlaceholder="Search by student name, email or course…"
            filters={[
              {
                key: "status",
                label: "All Statuses",
                options: [
                  { label: "Active",    value: "active"    },
                  { label: "Completed", value: "completed" },
                  { label: "Suspended", value: "suspended" },
                ],
              },
            ]}
            onQueryChange={(params) => load(params, courseType)}
            onRowClick={(e) => setSelectedStudent(e)}
            emptyMessage="No enrollments found"
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>

      {selectedStudent && (
        <StudentCoursesModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {showEnroll && (
        <ManualEnrollModal
          onClose={() => setShowEnroll(false)}
          onEnrolled={() => load(currentParams, courseType)}
        />
      )}
      {showManage && (
        <ManageEnrollmentModal
          onClose={() => setShowManage(false)}
          onChanged={() => load(currentParams, courseType)}
        />
      )}
    </div>
  );
}
