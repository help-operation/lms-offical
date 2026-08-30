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
import type { AdminCourse, PaginatedResponse } from "@/features/admin/api";
import type { Category } from "@/features/courses/api";
import { AdminCourseRowActions } from "@/features/courses/AdminCourseRowActions";
import { Star } from "lucide-react";
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

interface Props {
  initialData: PaginatedResponse<AdminCourse>;
  categories: Category[];
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

export function AdminCoursesClient({ initialData, categories }: Props) {
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
            {course.isUnlisted && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 shrink-0">Unlisted</span>}
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
    {
      key: "id" as const, header: "Actions",
      render: (course: AdminCourse) =>
        course.status === "trash" ? (
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setRestoreTarget(course)} disabled={isPending}
              className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium disabled:opacity-50">
              Restore
            </button>
            <button onClick={() => setPurgeTarget(course)} disabled={isPending}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50">
              Delete Forever
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <AdminCourseRowActions courseId={course.id} categories={categories} />
            {course.status === "published" ? (
              <button onClick={() => setUnpublishTarget(course)} disabled={isPending}
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium disabled:opacity-50">
                Unpublish
              </button>
            ) : (
              <button onClick={() => setApproveTarget(course)} disabled={isPending}
                className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium disabled:opacity-50">
                Publish
              </button>
            )}
            {course.status !== "published" && (
              <button onClick={() => setDeleteTarget(course)} disabled={isPending}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50">
                Delete
              </button>
            )}
            <button onClick={() => setFeatureTarget(course)} disabled={isPending}
              className={`text-xs font-medium disabled:opacity-50 ${course.isFeatured ? "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"}`}>
              {course.isFeatured ? "Unfeature" : "Feature"}
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
    <div className="flex items-center justify-end gap-2">
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
    </div>
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Courses</h2>
      </div>
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
      ]}
      emptyMessage="No courses found."
    />
      </div>
    </div>
    </>
  );
}
