"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Globe, FileEdit, Eye, Copy, ChevronDown, BookOpen, FileText } from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  toggleLiveCoursePublishAction,
  deleteLiveCourseAction,
  duplicateLiveCourseAction,
  fetchLiveCoursesAction,
  restoreLiveCourseAction,
  purgeLiveCourseAction,
} from "@/features/live-courses/actions/live-courses.actions";
import type { LiveCourseListItem } from "@/features/live-courses/api";
import { DataTable, type Column } from "@repo/ui/data-table";
import { toast } from "@repo/ui/sonner";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { initialCourses: LiveCourseListItem[] }

function getAllCols(formatDate: (d: string | Date) => string): ColDef<LiveCourseListItem>[] {
  return [
    {
      key: "title", header: "Course", defaultVisible: true,
      exportFields: [
        { header: "Title", getValue: (c) => c.title },
        { header: "Slug",  getValue: (c) => c.slug  },
      ],
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
      exportFields: [{ header: "Created", getValue: (c) => formatDate(c.createdAt) }],
    },
  ];
}

const DEFAULT_VISIBLE = new Set(["title", "price", "status", "createdAt"]);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    draft:     "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
    inactive:  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    trash:     "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
      {status}
    </span>
  );
}

function DuplicateDropdown({ course }: { course: LiveCourseListItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current && !btnRef.current.contains(target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  function handleDuplicate(includeCurriculum: boolean) {
    setOpen(false);
    startTransition(async () => {
      const res = await duplicateLiveCourseAction(course.id, includeCurriculum);
      if (res.data) {
        toast.success(
          includeCurriculum ? "Course + curriculum duplicated" : "Course info duplicated",
          { description: "A draft copy has been created." }
        );
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to duplicate");
      }
    });
  }

  const dropdown = open && pos ? (
    <div
      style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-lg py-1.5 w-52"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
        Duplicate as Draft
      </p>
      <button
        onClick={() => handleDuplicate(false)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
        <div>
          <p className="font-medium">Course Info Only</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Settings, content, pricing</p>
        </div>
      </button>
      <button
        onClick={() => handleDuplicate(true)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <BookOpen className="h-4 w-4 text-brand-500 shrink-0" />
        <div>
          <p className="font-medium">Course + Curriculum</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Info + all modules & lessons</p>
        </div>
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        disabled={isPending}
        title="Duplicate"
        className="inline-flex items-center gap-0.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
      >
        {isPending
          ? <div className="h-3.5 w-3.5 border-2 border-gray-300 dark:border-slate-600 border-t-gray-600 dark:border-t-slate-300 rounded-full animate-spin" />
          : <Copy className="h-3.5 w-3.5" />}
        <ChevronDown className="h-3 w-3" />
      </button>
      {typeof window !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}

export function LiveCoursesClient({ initialCourses }: Props) {
  const router = useRouter();
  const [courses, setCourses]         = useState(initialCourses);
  const [isPending, startTransition]  = useTransition();
  const [isFiltering, setIsFiltering] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [toggleTarget, setToggleTarget] = useState<LiveCourseListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LiveCourseListItem | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<LiveCourseListItem | null>(null);
  const [purgeTarget, setPurgeTarget]     = useState<LiveCourseListItem | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);
  const { formatDate } = useLocalization();
  const ALL_COLS = getAllCols(formatDate);

  // Re-seed from the server whenever fresh data arrives (e.g. after a
  // router.refresh() following a create/edit) so the table never shows stale
  // rows. Local optimistic updates from toggle/delete still apply on top.
  // Skipped while a status filter is active — that fetch owns `courses` until
  // the filter is cleared, otherwise this effect would stomp it back to the
  // unfiltered (non-trash) default list.
  useEffect(() => { if (!statusFilter) setCourses(initialCourses); }, [initialCourses, statusFilter]);

  async function handleStatusFilterChange(status: string) {
    setStatusFilter(status);
    setIsFiltering(true);
    try {
      const res = await fetchLiveCoursesAction(status || undefined);
      if (res.data) setCourses(res.data);
    } finally {
      setIsFiltering(false);
    }
  }

  function handleTogglePublish(course: LiveCourseListItem) {
    setToggleTarget(null);
    startTransition(async () => {
      const res = await toggleLiveCoursePublishAction(course.id);
      if (res.data) {
        const status = res.data.status as "draft" | "published";
        setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, status } : c));
        toast.success(status === "published" ? "Live course published" : "Live course unpublished");
      } else {
        toast.error("Failed to update live course");
      }
    });
  }

  function handleDelete(course: LiveCourseListItem) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await deleteLiveCourseAction(course.id);
      if (res.data) {
        setCourses((prev) => prev.filter((c) => c.id !== course.id));
        toast.success("Live course moved to Trash");
      } else {
        toast.error("Failed to move live course to Trash");
      }
    });
  }

  function handleRestore(course: LiveCourseListItem) {
    setRestoreTarget(null);
    startTransition(async () => {
      const res = await restoreLiveCourseAction(course.id);
      if (res.data) {
        setCourses((prev) => prev.filter((c) => c.id !== course.id));
        toast.success("Live course restored to Draft");
      } else {
        toast.error(res.error ?? "Failed to restore live course");
      }
    });
  }

  function handlePurge(course: LiveCourseListItem) {
    setPurgeTarget(null);
    startTransition(async () => {
      const res = await purgeLiveCourseAction(course.id);
      if (res.data) {
        setCourses((prev) => prev.filter((c) => c.id !== course.id));
        toast.success("Live course permanently deleted");
      } else {
        toast.error(res.error ?? "Failed to delete live course");
      }
    });
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  const visibleColumns: Column<LiveCourseListItem>[] = [
    ...(visibleCols.has("title") ? [{
      key: "title" as const, header: "Course", sortable: true,
      render: (course: LiveCourseListItem) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{course.title}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-0.5">/{course.slug}</p>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("price") ? [{
      key: "price" as const, header: "Price", sortable: true,
      render: (course: LiveCourseListItem) => (
        <div>
          <p className="text-sm text-gray-700 dark:text-slate-300 font-medium">৳{Number(course.price).toLocaleString()}</p>
          {course.originalPrice && (
            <p className="text-xs text-gray-400 dark:text-slate-500 line-through">৳{Number(course.originalPrice).toLocaleString()}</p>
          )}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("status") ? [{
      key: "status" as const, header: "Status",
      render: (course: LiveCourseListItem) => <StatusBadge status={course.status} />,
    }] : []),
    ...(visibleCols.has("createdAt") ? [{
      key: "createdAt" as const, header: "Created", sortable: true,
      render: (course: LiveCourseListItem) => (
        <span className="text-xs text-gray-400 dark:text-slate-500">{formatDate(course.createdAt)}</span>
      ),
    }] : []),
    {
      key: "id" as const, header: "Actions",
      render: (course) =>
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
        <div className="flex items-center gap-3">
          {/* Edit */}
          <button
            onClick={() => router.push(`/admin/live-courses/${course.id}/edit`)}
            title="Edit"
            className="text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          {/* Publish / Unpublish */}
          <button
            onClick={() => setToggleTarget(course)}
            disabled={isPending}
            title={course.status === "published" ? "Unpublish" : "Publish"}
            className="text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand transition-colors disabled:opacity-50"
          >
            {course.status === "published"
              ? <Globe className="h-4 w-4 text-green-600 dark:text-green-400" />
              : <FileEdit className="h-4 w-4" />}
          </button>

          {/* Preview (public URL) */}
          {course.status === "published" && (
            <a
              href={`${process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3001"}/${course.slug}`}
              target="_blank"
              rel="noreferrer"
              title="Preview"
              className="text-gray-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
            </a>
          )}

          {/* Duplicate */}
          <DuplicateDropdown course={course} />

          {/* Delete */}
          <button
            onClick={() => setDeleteTarget(course)}
            disabled={isPending}
            title="Move to Trash"
            className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        ),
    },
  ];

  return (
    <>
      {/* Publish/Unpublish modal */}
      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.status === "published" ? "Unpublish Live Course" : "Publish Live Course"}
        message={
          toggleTarget?.status === "published"
            ? <>Unpublish <strong>{toggleTarget.title}</strong>? Students will no longer be able to enroll.</>
            : <>Publish <strong>{toggleTarget?.title}</strong>? It will become visible and open for enrollment.</>
        }
        confirmLabel={toggleTarget?.status === "published" ? "Yes, Unpublish" : "Yes, Publish"}
        variant={toggleTarget?.status === "published" ? "warning" : "success"}
        icon={toggleTarget?.status === "published" ? <FileEdit className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /> : <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />}
        isPending={isPending}
        onConfirm={() => toggleTarget && handleTogglePublish(toggleTarget)}
        onClose={() => setToggleTarget(null)}
      />

      {/* Delete (move to Trash) modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Move to Trash"
        message={deleteTarget ? <>Move <strong>{deleteTarget.title}</strong> to Trash? It will be hidden from students and can be restored later from the Trash filter.</> : ""}
        confirmLabel="Yes, Move to Trash"
        variant="danger"
        icon={<Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />}
        isPending={isPending}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Restore modal */}
      <ConfirmModal
        open={!!restoreTarget}
        title="Restore Live Course"
        message={restoreTarget ? <>Restore <strong>{restoreTarget.title}</strong> from Trash back to Draft?</> : ""}
        confirmLabel="Yes, Restore"
        variant="success"
        isPending={isPending}
        onConfirm={() => restoreTarget && handleRestore(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
      />

      {/* Permanently delete modal */}
      <ConfirmModal
        open={!!purgeTarget}
        title="Delete Forever"
        message={purgeTarget ? <>Permanently delete <strong>{purgeTarget.title}</strong>? This cannot be undone — all curriculum, batches, and content will be removed.</> : ""}
        confirmLabel="Yes, Delete Forever"
        variant="danger"
        isPending={isPending}
        onConfirm={() => purgeTarget && handlePurge(purgeTarget)}
        onClose={() => setPurgeTarget(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Courses</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Template-based landing page courses with enrollment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            disabled={isFiltering}
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm text-gray-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="inactive">Inactive</option>
            <option value="scheduled">Scheduled</option>
            <option value="trash">Trash</option>
          </select>
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={courses}
            fields={exportFields}
            filename={`live-courses-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Live Courses Export"
          />
          <button
            onClick={() => router.push("/admin/live-courses/new")}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand dark:hover:bg-brand/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm dark:shadow-none"
          >
            <Plus className="h-4 w-4" /> New Live Course
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Live Courses</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
      <DataTable
        data={courses}
        columns={visibleColumns}
        isLoading={isFiltering}
        searchable
        searchKeys={["title", "slug"]}
        searchPlaceholder="Search live courses…"
        emptyMessage={statusFilter ? "No live courses match this status." : "No live courses yet. Click &quot;New Live Course&quot; to create one."}
      />
        </div>
      </div>
    </>
  );
}
