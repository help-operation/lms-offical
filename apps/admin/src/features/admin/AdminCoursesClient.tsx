"use client";

import { useState, useTransition } from "react";
import {
  fetchCoursesAction,
  approveCourseAction,
  featureCourseAction,
} from "@/features/admin/actions/admin.actions";
import {
  unpublishCourseAction,
  deleteCourseAction,
  restoreCourseAction,
  purgeCourseAction,
} from "@/features/courses/actions/courses.actions";
import type { AdminCourse, PaginatedResponse, PlatformStats } from "@/features/admin/api";
import type { Category } from "@/features/courses/api";
import { Star, Pencil, Eye, EyeOff, Trash2, Heart, RotateCcw, Trash, BookOpen, Users, GraduationCap, DollarSign, TrendingUp, Award } from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  DataTable,
  type Column,
  type TablePagination,
  type TableQueryParams,
} from "@repo/ui/data-table";
import { toast } from "@repo/ui/sonner";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { RECORDED_TEMPLATES } from "@/features/courses/recorded-templates";
import { InstructorProfileModal } from "@/features/instructor/InstructorProfileModal";
import Link from "next/link";
import { Plus } from "lucide-react";

interface Props {
  initialData: PaginatedResponse<AdminCourse>;
  categories: Category[];
  stats: PlatformStats | null;
}

const ALL_COLS: ColDef<AdminCourse>[] = [
  {
    key: "title", header: "Course", defaultVisible: true,
    exportFields: [
      { header: "Title",    getValue: (c) => c.title },
      { header: "Students", getValue: (c) => String(c.totalStudents) },
    ],
  },
  {
    key: "instructorFirstName", header: "Instructor", defaultVisible: true,
    exportFields: [{
      header: "Instructor",
      getValue: (c) => [c.instructorFirstName, c.instructorLastName].filter(Boolean).join(" "),
    }],
  },
  {
    key: "categoryName", header: "Category", defaultVisible: true,
    exportFields: [{ header: "Category", getValue: (c) => c.categoryName ?? "" }],
  },
  {
    key: "template", header: "Template", defaultVisible: true,
    exportFields: [{ header: "Template", getValue: (c) => RECORDED_TEMPLATES.find(t => t.dbTemplate === c.template)?.name ?? c.template }],
  },
  {
    key: "price", header: "Price", defaultVisible: true,
    exportFields: [{ header: "Price", getValue: (c) => `৳${Number(c.price).toLocaleString()}` }],
  },
  {
    key: "status", header: "Status", defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (c) => c.status }],
  },
  {
    key: "createdAt", header: "Created", defaultVisible: true,
    exportFields: [{ header: "Created", getValue: (c) => c.createdAt ?? "" }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    draft:     "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
    inactive:  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    trash:     "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    archived:  "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
      {status}
    </span>
  );
}

export function AdminCoursesClient({ initialData, categories, stats }: Props) {
  const [courses, setCourses]         = useState(initialData.data);
  const [pagination, setPagination]   = useState<TablePagination>(initialData.pagination);
  const [isLoading, setIsLoading]     = useState(false);
  const [isPending, startTransition]  = useTransition();
  const [approveTarget, setApproveTarget] = useState<AdminCourse | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<AdminCourse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);
  const [featureTarget, setFeatureTarget] = useState<AdminCourse | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AdminCourse | null>(null);
  const [purgeTarget, setPurgeTarget]     = useState<AdminCourse | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);

  async function fetchCourses(params: TableQueryParams) {
    setIsLoading(true);
    try {
      const res = await fetchCoursesAction(params);
      if (res.success && res.data) {
        setCourses(res.data.data);
        setPagination(res.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleApprove(course: AdminCourse) {
    setApproveTarget(null);
    startTransition(async () => {
      const res = await approveCourseAction(course.id);
      if (res.success) {
        setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, status: "published" } : c));
        toast.success("Course approved & published");
      } else {
        toast.error(res.message ?? "Failed to approve course");
      }
    });
  }

  function handleUnpublish(course: AdminCourse) {
    setUnpublishTarget(null);
    startTransition(async () => {
      const res = await unpublishCourseAction(course.id);
      if (res.success) {
        setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, status: "draft" } : c));
        toast.success("Course unpublished");
      } else {
        toast.error(res.message ?? "Failed to unpublish course");
      }
    });
  }

  function handleDelete(course: AdminCourse) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await deleteCourseAction(course.id);
      if (res.success) {
        setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, status: "trash" } : c));
        toast.success("Course moved to Trash");
      } else {
        toast.error(res.message ?? "Failed to delete course");
      }
    });
  }

  function handleRestore(course: AdminCourse) {
    setRestoreTarget(null);
    startTransition(async () => {
      const res = await restoreCourseAction(course.id);
      if (res.success) {
        setCourses((prev) => prev.filter((c) => c.id !== course.id));
        toast.success("Course restored to Draft");
      } else {
        toast.error(res.message ?? "Failed to restore course");
      }
    });
  }

  function handlePurge(course: AdminCourse) {
    setPurgeTarget(null);
    startTransition(async () => {
      const res = await purgeCourseAction(course.id);
      if (res.success) {
        setCourses((prev) => prev.filter((c) => c.id !== course.id));
        toast.success("Course permanently deleted");
      } else {
        toast.error(res.message ?? "Failed to delete course");
      }
    });
  }

  function handleFeature(course: AdminCourse) {
    const nowFeatured = !course.isFeatured;
    setFeatureTarget(null);
    startTransition(async () => {
      const res = await featureCourseAction(course.id);
      if (res.success) {
        setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, isFeatured: nowFeatured } : c));
        toast.success(nowFeatured ? "Course featured" : "Course unfeatured");
      } else {
        toast.error(res.message ?? "Failed to update course");
      }
    });
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<AdminCourse[]> {
    const res = await fetchCoursesAction({ page: 1, per_page: 100000 });
    return res.success && res.data ? res.data.data : [];
  }

  const visibleColumns: Column<AdminCourse>[] = [
    ...(visibleCols.has("title") ? [{
      key: "title" as const, header: "Course", sortable: true,
      render: (course: AdminCourse) => (
        <div>
          <div className="flex items-center gap-2">
            {course.isFeatured && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{course.title}</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{course.totalStudents} students</p>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("instructorFirstName") ? [{
      key: "instructorFirstName" as const, header: "Instructor",
      render: (course: AdminCourse) => {
        const name = [course.instructorFirstName, course.instructorLastName].filter(Boolean).join(" ");
        return <span className="text-gray-600 dark:text-slate-300">{name || "—"}</span>;
      },
    }] : []),
    ...(visibleCols.has("categoryName") ? [{
      key: "categoryName" as const, header: "Category",
      render: (course: AdminCourse) => <span className="text-gray-500 dark:text-slate-400">{course.categoryName ?? "—"}</span>,
    }] : []),
    ...(visibleCols.has("template") ? [{
      key: "template" as const, header: "Template",
      render: (course: AdminCourse) => {
        const tplName = RECORDED_TEMPLATES.find(t => t.dbTemplate === course.template)?.name ?? course.template;
        return (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
            {tplName}
          </span>
        );
      },
    }] : []),
    ...(visibleCols.has("price") ? [{
      key: "price" as const, header: "Price", sortable: true,
      render: (course: AdminCourse) => <span className="text-gray-600 dark:text-slate-300">৳{Number(course.price).toLocaleString()}</span>,
    }] : []),
    ...(visibleCols.has("status") ? [{
      key: "status" as const, header: "Status",
      render: (course: AdminCourse) => <StatusBadge status={course.status} />,
    }] : []),
    ...(visibleCols.has("createdAt") ? [{
      key: "createdAt" as const, header: "Created",
      render: (course: AdminCourse) => {
        if (!course.createdAt) return <span className="text-gray-400 dark:text-slate-500">—</span>;
        const d = new Date(course.createdAt);
        return (
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        );
      },
    }] : []),
    {
      key: "id" as const, header: "Actions",
      render: (course: AdminCourse) =>
        course.status === "trash" ? (
          <div className="flex items-center gap-1">
            <button onClick={() => setRestoreTarget(course)} disabled={isPending}
              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 dark:hover:text-green-400 transition-colors disabled:opacity-50"
              title="Restore">
              <RotateCcw size={14} />
            </button>
            <button onClick={() => setPurgeTarget(course)} disabled={isPending}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              title="Delete forever">
              <Trash size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Link
              href={`/course-builder/${course.id}`}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </Link>
            {course.status === "published" ? (
              <button onClick={() => setUnpublishTarget(course)} disabled={isPending}
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
                title="Unpublish">
                <EyeOff size={14} />
              </button>
            ) : (
              <button onClick={() => setApproveTarget(course)} disabled={isPending}
                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                title="Publish">
                <Eye size={14} />
              </button>
            )}
            <button onClick={() => setDeleteTarget(course)} disabled={isPending}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              title="Delete">
              <Trash2 size={14} />
            </button>
            <button onClick={() => setFeatureTarget(course)} disabled={isPending}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                course.isFeatured
                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                  : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              }`}
              title={course.isFeatured ? "Unfeature" : "Feature"}>
              <Heart size={14} className={course.isFeatured ? "fill-current" : ""} />
            </button>
          </div>
        ),
    },
  ];

  return (
    <>
    <ConfirmModal
      open={!!approveTarget}
      title="Publish Course"
      message={approveTarget ? <>Publish <strong>{approveTarget.title}</strong>? It will become visible to all students.</> : ""}
      confirmLabel="Yes, Publish"
      variant="success"
      isPending={isPending}
      onConfirm={() => approveTarget && handleApprove(approveTarget)}
      onClose={() => setApproveTarget(null)}
    />
    <ConfirmModal
      open={!!unpublishTarget}
      title="Unpublish Course"
      message={unpublishTarget ? <>Unpublish <strong>{unpublishTarget.title}</strong>? Students will no longer be able to enroll.</> : ""}
      confirmLabel="Yes, Unpublish"
      variant="warning"
      isPending={isPending}
      onConfirm={() => unpublishTarget && handleUnpublish(unpublishTarget)}
      onClose={() => setUnpublishTarget(null)}
    />
    <ConfirmModal
      open={!!deleteTarget}
      title="Move to Trash"
      message={deleteTarget ? <>Move <strong>{deleteTarget.title}</strong> to Trash? It will be hidden from students and can be restored later.</> : ""}
      confirmLabel="Yes, Move to Trash"
      variant="danger"
      isPending={isPending}
      onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      onClose={() => setDeleteTarget(null)}
    />
    <ConfirmModal
      open={!!restoreTarget}
      title="Restore Course"
      message={restoreTarget ? <>Restore <strong>{restoreTarget.title}</strong> from Trash back to Draft?</> : ""}
      confirmLabel="Yes, Restore"
      variant="success"
      isPending={isPending}
      onConfirm={() => restoreTarget && handleRestore(restoreTarget)}
      onClose={() => setRestoreTarget(null)}
    />
    <ConfirmModal
      open={!!purgeTarget}
      title="Delete Forever"
      message={purgeTarget ? <>Permanently delete <strong>{purgeTarget.title}</strong>? This cannot be undone — all curriculum, lessons, and videos will be removed.</> : ""}
      confirmLabel="Yes, Delete Forever"
      variant="danger"
      isPending={isPending}
      onConfirm={() => purgeTarget && handlePurge(purgeTarget)}
      onClose={() => setPurgeTarget(null)}
    />
    <ConfirmModal
      open={!!featureTarget}
      title={featureTarget?.isFeatured ? "Unfeature Course" : "Feature Course"}
      message={
        featureTarget?.isFeatured
          ? <>Remove <strong>{featureTarget.title}</strong> from featured courses?</>
          : <>Feature <strong>{featureTarget?.title}</strong>? It will be highlighted on the platform.</>
      }
      confirmLabel={featureTarget?.isFeatured ? "Yes, Unfeature" : "Yes, Feature"}
      variant={featureTarget?.isFeatured ? "warning" : "success"}
      isPending={isPending}
      onConfirm={() => featureTarget && handleFeature(featureTarget)}
      onClose={() => setFeatureTarget(null)}
    />
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Recorded Courses</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{pagination.total} courses total</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <ColumnsDropdown
          cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
          visible={visibleCols}
          onChange={setVisibleCols}
        />
        <ExportDropdown
          pageData={courses}
          fields={exportFields}
          fetchAll={fetchAllForExport}
          filename={`courses-${new Date().toISOString().slice(0, 10)}`}
          exportTitle="Courses Export"
        />
        <InstructorProfileModal />
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>
    </div>

    {stats && (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-500/10 dark:to-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[10px] font-semibold">+12%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recorded.courses}</p>
          <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 font-medium mt-0.5">Total Courses</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-500/10 dark:to-green-500/5 rounded-xl border border-green-100 dark:border-green-500/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[10px] font-semibold">+8%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.publishedCourses}</p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70 font-medium mt-0.5">Published</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[10px] font-semibold">+24%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recorded.students.toLocaleString()}</p>
          <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium mt-0.5">Students</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 rounded-xl border border-amber-100 dark:border-amber-500/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20">
              <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[10px] font-semibold">+18%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">৳{Number(stats.recorded.revenue).toLocaleString()}</p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium mt-0.5">Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-500/10 dark:to-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-500/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/20">
              <Award className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[10px] font-semibold">+32%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recorded.enrollments.toLocaleString()}</p>
          <p className="text-xs text-rose-600/70 dark:text-rose-400/70 font-medium mt-0.5">Enrollments</p>
        </div>
      </div>
    )}

    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-6 pt-5 pb-6">
    <DataTable
      data={courses}
      columns={visibleColumns}
      serverSide
      pagination={pagination}
      onQueryChange={fetchCourses}
      dateRangeKey="createdAt"
      portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
      isLoading={isLoading}
      searchable
      searchPlaceholder="Search courses…"
      filters={[
        {
          key: "status",
          label: "All Status",
          options: [
            { label: "Draft",     value: "draft"     },
            { label: "Published", value: "published" },
            { label: "Inactive",  value: "inactive"  },
            { label: "Scheduled", value: "scheduled" },
            { label: "Trash",     value: "trash"     },
          ],
        },
        {
          key: "category",
          label: "All Categories",
          options: categories.map((c) => ({ label: c.name, value: c.name })),
        },
        {
          key: "template",
          label: "All Templates",
          options: RECORDED_TEMPLATES.map((t) => ({ label: t.name, value: t.dbTemplate })),
        },
      ]}
      emptyMessage="No courses found."
    />
      </div>
    </div>
    </>
  );
}
