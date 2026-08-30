"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, X, Tag, Search } from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  fetchCouponsAction,
  createCouponAction,
  toggleCouponAction,
  deleteCouponAction,
  fetchCouponPickerCoursesAction,
  fetchCouponPickerLiveCoursesAction,
} from "@/features/admin/actions/admin.actions";
import type {
  Coupon,
  CouponScope,
  PaginatedResponse,
  PickerCourse,
  TableQueryParams,
} from "@/features/admin/api";
import { DataTable, type Column, type TablePagination } from "@repo/ui/data-table";
import { toast } from "@repo/ui/sonner";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { initialData: PaginatedResponse<Coupon> }

function getAllCols(formatDate: (value: Date | string | null | undefined) => string): ColDef<Coupon>[] {
  return [
  {
    key: "code", header: "Code", defaultVisible: true,
    exportFields: [{ header: "Code", getValue: (c) => c.code }],
  },
  {
    key: "value", header: "Discount", defaultVisible: true,
    exportFields: [{
      header: "Discount",
      getValue: (c) => c.type === "percentage" ? `${c.value}%` : `৳${Number(c.value).toLocaleString()}`,
    }],
  },
  {
    key: "scope", header: "Applies To", defaultVisible: true,
    exportFields: [{ header: "Scope", getValue: (c) => SCOPE_LABELS[c.scope] }],
  },
  {
    key: "usedCount", header: "Uses", defaultVisible: true,
    exportFields: [
      { header: "Used", getValue: (c) => String(c.usedCount) },
      { header: "Max Uses", getValue: (c) => c.maxUses ? String(c.maxUses) : "Unlimited" },
    ],
  },
  {
    key: "expiresAt", header: "Expires", defaultVisible: true,
    exportFields: [{ header: "Expires", getValue: (c) => c.expiresAt ? formatDate(c.expiresAt) : "Never" }],
  },
  {
    key: "isActive", header: "Status", defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (c) => c.isActive ? "Active" : "Inactive" }],
  },
  ];
}

const DEFAULT_VISIBLE = new Set(["code", "value", "scope", "usedCount", "expiresAt", "isActive"]);

const SCOPE_LABELS: Record<CouponScope, string> = {
  all:               "All Courses",
  all_recorded:      "All Recorded Courses",
  specific_recorded: "Specific Recorded Courses",
  all_live:          "All Live Courses",
  specific_live:     "Specific Live Courses",
};

const SCOPE_COLORS: Record<CouponScope, string> = {
  all:               "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
  all_recorded:      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  specific_recorded: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  all_live:          "bg-violet-100 text-violet-700 dark:bg-brand/15 dark:text-brand",
  specific_live:     "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
};

const EMPTY_FORM = {
  code:          "",
  type:          "percentage" as "percentage" | "fixed",
  value:         "",
  maxUses:       "",
  expiresAt:     "",
  scope:         "all" as CouponScope,
  courseIds:     [] as number[],
  liveCourseIds: [] as number[],
};

// ─── Multi-select course picker ───────────────────────────────────────────────

function CoursePicker({
  courses,
  selected,
  onChange,
  placeholder,
}: {
  courses: PickerCourse[];
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: number) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    );
  }

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-2 text-xs border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
        />
      </div>
      <div className="max-h-44 overflow-y-auto bg-white dark:bg-slate-800">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">No courses found</p>
        ) : (
          filtered.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="accent-brand-600 dark:accent-brand"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300 leading-tight">{c.title}</span>
            </label>
          ))
        )}
      </div>
      {selected.length > 0 && (
        <div className="px-3 py-1.5 bg-brand-50 dark:bg-brand/10 border-t border-brand-100 dark:border-brand/20 text-xs text-brand-700 dark:text-brand font-medium">
          {selected.length} selected
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CouponsClient({ initialData }: Props) {
  const { formatDate } = useLocalization();
  const ALL_COLS = getAllCols(formatDate);
  const [coupons, setCoupons]        = useState(initialData.data);
  const [pagination, setPagination]  = useState<TablePagination>(initialData.pagination);
  const [isLoading, setIsLoading]    = useState(false);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen]    = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [form, setForm]              = useState(EMPTY_FORM);
  const [toggleTarget, setToggleTarget] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);

  // Picker data
  const [pickerCourses, setPickerCourses]         = useState<PickerCourse[]>([]);
  const [pickerLiveCourses, setPickerLiveCourses] = useState<PickerCourse[]>([]);
  const [pickerLoading, setPickerLoading]         = useState(false);

  function openModal() {
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setError(null); }
  function setField<K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Load picker data when modal opens (lazy)
  useEffect(() => {
    if (!modalOpen || pickerCourses.length > 0) return;
    setPickerLoading(true);
    Promise.all([
      fetchCouponPickerCoursesAction(),
      fetchCouponPickerLiveCoursesAction(),
    ]).then(([rc, lc]) => {
      if (rc.success && rc.data) setPickerCourses(rc.data);
      if (lc.success && lc.data) setPickerLiveCourses(lc.data);
    }).finally(() => setPickerLoading(false));
  }, [modalOpen]);

  async function fetchCoupons(params: TableQueryParams) {
    setIsLoading(true);
    try {
      const res = await fetchCouponsAction(params);
      if (res.success && res.data) {
        setCoupons(res.data.data);
        setPagination(res.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleAdd() {
    if (!form.code.trim() || !form.value) return;
    if (form.scope === "specific_recorded" && form.courseIds.length === 0) {
      setError("Please select at least one recorded course");
      return;
    }
    if (form.scope === "specific_live" && form.liveCourseIds.length === 0) {
      setError("Please select at least one live course");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createCouponAction({
        code:          form.code.trim().toUpperCase(),
        type:          form.type,
        value:         Number(form.value),
        maxUses:       form.maxUses   ? Number(form.maxUses)   : undefined,
        expiresAt:     form.expiresAt ? form.expiresAt + ":00Z" : undefined,
        scope:         form.scope,
        courseIds:     form.scope === "specific_recorded" ? form.courseIds     : undefined,
        liveCourseIds: form.scope === "specific_live"     ? form.liveCourseIds : undefined,
      });
      if (res.success) {
        setCoupons((prev) => [res.data, ...prev]);
        setPagination((p) => ({ ...p, total: p.total + 1 }));
        closeModal();
        toast.success("Coupon created");
      } else {
        setError(res.message ?? "Failed to create coupon");
      }
    });
  }

  function handleToggle(coupon: Coupon) {
    const nowActive = !coupon.isActive;
    setToggleTarget(null);
    startTransition(async () => {
      const res = await toggleCouponAction(coupon.id);
      if (res.success) {
        setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, isActive: nowActive } : c));
        toast.success(nowActive ? "Coupon enabled" : "Coupon disabled");
      } else {
        toast.error(res.message ?? "Failed to update coupon");
      }
    });
  }

  function handleDelete(coupon: Coupon) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await deleteCouponAction(coupon.id);
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
        toast.success("Coupon deleted");
      } else {
        toast.error(res.message ?? "Failed to delete coupon");
      }
    });
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<Coupon[]> {
    const res = await fetchCouponsAction({ page: 1, per_page: 100000 });
    return res.success && res.data ? res.data.data : [];
  }

  const visibleColumns: Column<Coupon>[] = [
    ...(visibleCols.has("code") ? [{
      key: "code" as const, header: "Code", sortable: true,
      render: (c: Coupon) => <span className="font-mono font-semibold text-gray-900 dark:text-white">{c.code}</span>,
    }] : []),
    ...(visibleCols.has("value") ? [{
      key: "value" as const, header: "Discount", sortable: true,
      render: (c: Coupon) => (
        <span className="text-gray-600 dark:text-slate-300">
          {c.type === "percentage" ? `${c.value}%` : `৳${Number(c.value).toLocaleString()}`}
        </span>
      ),
    }] : []),
    ...(visibleCols.has("scope") ? [{
      key: "scope" as const, header: "Applies To",
      render: (c: Coupon) => (
        <div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SCOPE_COLORS[c.scope]}`}>
            {SCOPE_LABELS[c.scope]}
          </span>
          {c.scope === "specific_recorded" && c.scopeCourses.length > 0 && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500 truncate max-w-[180px]">
              {c.scopeCourses.slice(0, 2).map((x) => x.title).join(", ")}
              {c.scopeCourses.length > 2 && ` +${c.scopeCourses.length - 2} more`}
            </p>
          )}
          {c.scope === "specific_live" && c.scopeLiveCourses.length > 0 && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500 truncate max-w-[180px]">
              {c.scopeLiveCourses.slice(0, 2).map((x) => x.title).join(", ")}
              {c.scopeLiveCourses.length > 2 && ` +${c.scopeLiveCourses.length - 2} more`}
            </p>
          )}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("usedCount") ? [{
      key: "usedCount" as const, header: "Uses",
      render: (c: Coupon) => (
        <span className="text-gray-500 dark:text-slate-400">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</span>
      ),
    }] : []),
    ...(visibleCols.has("expiresAt") ? [{
      key: "expiresAt" as const, header: "Expires", sortable: true,
      render: (c: Coupon) => (
        <span className="text-xs text-gray-400 dark:text-slate-500">
          {c.expiresAt ? formatDate(c.expiresAt) : "Never"}
        </span>
      ),
    }] : []),
    ...(visibleCols.has("isActive") ? [{
      key: "isActive" as const, header: "Status",
      render: (c: Coupon) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-slate-500/15 dark:text-slate-400"}`}>
          {c.isActive ? "Active" : "Inactive"}
        </span>
      ),
    }] : []),
    {
      key: "id" as const, header: "Actions",
      render: (c: Coupon) => (
        <div className="flex items-center gap-3">
          <button onClick={() => setToggleTarget(c)} disabled={isPending}
            title={c.isActive ? "Deactivate" : "Activate"}
            className="text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand transition-colors disabled:opacity-50">
            {c.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
          <button onClick={() => setDeleteTarget(c)} disabled={isPending}
            className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const needsRecordedPicker = form.scope === "specific_recorded";
  const needsLivePicker     = form.scope === "specific_live";

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Create and manage discount coupons for courses.</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={coupons}
            fields={exportFields}
            fetchAll={fetchAllForExport}
            filename={`coupons-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Coupons Export"
          />
          <button onClick={openModal}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand dark:hover:bg-brand/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm dark:shadow-none">
            <Plus className="h-4 w-4" /> Add Coupon
          </button>
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Coupons</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
      <DataTable
        data={coupons}
        columns={visibleColumns}
        serverSide
        pagination={pagination}
        onQueryChange={fetchCoupons}
        dateRangeKey="createdAt"
        portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search coupon code…"
        filters={[
          {
            key: "type",
            label: "All Types",
            options: [
              { label: "Percentage", value: "percentage" },
              { label: "Fixed",      value: "fixed"      },
            ],
          },
          {
            key: "scope",
            label: "All Scopes",
            options: (Object.entries(SCOPE_LABELS) as [CouponScope, string][]).map(
              ([value, label]) => ({ label, value })
            ),
          },
          {
            key: "isActive",
            label: "All Status",
            options: [
              { label: "Active",   value: "true"  },
              { label: "Inactive", value: "false" },
            ],
          },
        ]}
        emptyMessage='No coupons yet. Click "Add Coupon" to create one.'
      />
        </div>
      </div>

      {/* Toggle coupon modal */}
      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.isActive ? "Disable Coupon" : "Enable Coupon"}
        message={
          toggleTarget?.isActive
            ? <>Disable coupon <strong>{toggleTarget.code}</strong>? Students will no longer be able to use it.</>
            : <>Enable coupon <strong>{toggleTarget?.code}</strong>? Students will be able to use it.</>
        }
        confirmLabel={toggleTarget?.isActive ? "Yes, Disable" : "Yes, Enable"}
        variant={toggleTarget?.isActive ? "warning" : "success"}
        isPending={isPending}
        onConfirm={() => toggleTarget && handleToggle(toggleTarget)}
        onClose={() => setToggleTarget(null)}
      />

      {/* Delete coupon modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Coupon"
        message={deleteTarget ? <>Delete coupon <strong>{deleteTarget.code}</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        icon={<Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />}
        isPending={isPending}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-brand-50 dark:bg-brand/10 border-b border-brand-100 dark:border-brand/20 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand/15 flex items-center justify-center">
                <Tag className="w-4 h-4 text-brand-600 dark:text-brand" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">New Coupon</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">Create a discount coupon for your courses</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                    Coupon Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    autoFocus
                    value={form.code}
                    onChange={(e) => setField("code", e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20"
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Discount Type <span className="text-red-400">*</span></label>
                  <select
                    value={form.type}
                    onChange={(e) => setField("type", e.target.value as "percentage" | "fixed")}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                    Value <span className="text-red-400">*</span>
                    <span className="text-gray-400 dark:text-slate-500 font-normal ml-1">
                      {form.type === "percentage" ? "(1 – 100)" : "(৳)"}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.value}
                    onChange={(e) => setField("value", e.target.value)}
                    placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 500"}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                    Max Uses <span className="text-gray-400 dark:text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUses}
                    onChange={(e) => setField("maxUses", e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Expires At */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                    Expires At <span className="text-gray-400 dark:text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setField("expiresAt", e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Scope */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                    Applies To <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.scope}
                    onChange={(e) => {
                      setField("scope", e.target.value as CouponScope);
                      setField("courseIds", []);
                      setField("liveCourseIds", []);
                    }}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {(Object.entries(SCOPE_LABELS) as [CouponScope, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Specific recorded course picker */}
                {needsRecordedPicker && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                      Select Recorded Courses <span className="text-red-400">*</span>
                    </label>
                    {pickerLoading ? (
                      <div className="text-xs text-gray-400 dark:text-slate-500 py-3 text-center">Loading courses…</div>
                    ) : (
                      <CoursePicker
                        courses={pickerCourses}
                        selected={form.courseIds}
                        onChange={(ids) => setField("courseIds", ids)}
                        placeholder="Search recorded courses…"
                      />
                    )}
                  </div>
                )}

                {/* Specific live course picker */}
                {needsLivePicker && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                      Select Live Courses <span className="text-red-400">*</span>
                    </label>
                    {pickerLoading ? (
                      <div className="text-xs text-gray-400 dark:text-slate-500 py-3 text-center">Loading live courses…</div>
                    ) : (
                      <CoursePicker
                        courses={pickerLiveCourses}
                        selected={form.liveCourseIds}
                        onChange={(ids) => setField("liveCourseIds", ids)}
                        placeholder="Search live courses…"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isPending || !form.code.trim() || !form.value}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand dark:hover:bg-brand/90 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                {isPending ? "Creating…" : "Create Coupon"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
