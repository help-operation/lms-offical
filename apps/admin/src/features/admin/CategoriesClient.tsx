"use client";

import { useState, useTransition } from "react";
import { Plus, ToggleLeft, ToggleRight, Trash2, X, FolderPlus, Pencil } from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { DataTable, type Column, type TablePagination, type TableQueryParams } from "@repo/ui/data-table";
import {
  fetchCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryAction,
  deleteCategoryAction,
} from "@/features/admin/actions/admin.actions";
import type { AdminCategory, PaginatedResponse } from "@/features/admin/api";
import { toast } from "@repo/ui/sonner";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";

interface Props { initialData: PaginatedResponse<AdminCategory> }

const ALL_COLS: ColDef<AdminCategory>[] = [
  {
    key: "name", header: "Name", defaultVisible: true,
    exportFields: [{ header: "Name", getValue: (c) => c.name }],
  },
  {
    key: "slug", header: "Slug", defaultVisible: true,
    exportFields: [{ header: "Slug", getValue: (c) => c.slug }],
  },
  {
    key: "description", header: "Description", defaultVisible: false,
    exportFields: [{ header: "Description", getValue: (c) => c.description ?? "" }],
  },
  {
    key: "isActive", header: "Status", defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (c) => c.isActive ? "Active" : "Inactive" }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.filter((c) => c.defaultVisible).map((c) => c.key));

export function CategoriesClient({ initialData }: Props) {
  const [categories, setCategories] = useState(initialData.data);
  const [pagination, setPagination] = useState<TablePagination>(initialData.pagination);
  const [isLoading, setIsLoading]   = useState(false);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [name, setName]             = useState("");
  const [description, setDescription] = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AdminCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);

  const isEditing = editingId !== null;

  function openModal()  { setEditingId(null); setName(""); setDescription(""); setError(null); setModalOpen(true); }
  function openEdit(cat: AdminCategory) { setEditingId(cat.id); setName(cat.name); setDescription(cat.description ?? ""); setError(null); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingId(null); setName(""); setDescription(""); setError(null); }

  async function fetchCategories(params: TableQueryParams) {
    setIsLoading(true);
    try {
      const res = await fetchCategoriesAction(params);
      if (res.success && res.data) {
        setCategories(res.data.data);
        setPagination(res.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleAdd() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createCategoryAction({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (res.success) {
        setCategories((prev) => [res.data, ...prev]);
        setPagination((p) => ({ ...p, total: p.total + 1 }));
        closeModal();
        toast.success("Category created");
      } else {
        setError(res.message ?? "Failed to create category");
      }
    });
  }

  function handleUpdate() {
    if (editingId === null || !name.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await updateCategoryAction(editingId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (res.success) {
        setCategories((prev) => prev.map((c) => c.id === editingId ? res.data : c));
        closeModal();
        toast.success("Category updated");
      } else {
        setError(res.message ?? "Failed to update category");
      }
    });
  }

  function handleToggle(cat: AdminCategory) {
    const nowActive = !cat.isActive;
    setToggleTarget(null);
    startTransition(async () => {
      const res = await toggleCategoryAction(cat.id);
      if (res.success) {
        setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, isActive: nowActive } : c));
        toast.success(nowActive ? "Category activated" : "Category deactivated");
      } else {
        toast.error(res.message ?? "Failed to update category");
      }
    });
  }

  function handleDelete(cat: AdminCategory) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await deleteCategoryAction(cat.id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
        toast.success("Category deleted");
      } else {
        toast.error(res.message ?? "Failed to delete category");
      }
    });
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<AdminCategory[]> {
    const res = await fetchCategoriesAction({ page: 1, per_page: 100000 });
    return res.success && res.data ? res.data.data : [];
  }

  const visibleColumns: Column<AdminCategory>[] = [
    ...(visibleCols.has("name") ? [{
      key: "name" as const, header: "Name", sortable: true,
      render: (cat: AdminCategory) => <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>,
    }] : []),
    ...(visibleCols.has("slug") ? [{
      key: "slug" as const, header: "Slug",
      render: (cat: AdminCategory) => <span className="font-mono text-xs text-gray-400 dark:text-slate-500">{cat.slug}</span>,
    }] : []),
    ...(visibleCols.has("description") ? [{
      key: "description" as const, header: "Description",
      render: (cat: AdminCategory) => <span className="text-xs text-gray-500 dark:text-slate-400">{cat.description ?? "—"}</span>,
    }] : []),
    ...(visibleCols.has("isActive") ? [{
      key: "isActive" as const, header: "Status",
      render: (cat: AdminCategory) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.isActive ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-slate-500/15 dark:text-slate-400"}`}>
          {cat.isActive ? "Active" : "Inactive"}
        </span>
      ),
    }] : []),
    {
      key: "id" as const, header: "Actions",
      render: (cat: AdminCategory) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEdit(cat)} disabled={isPending}
            title="Edit name"
            className="text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand transition-colors disabled:opacity-50">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setToggleTarget(cat)} disabled={isPending}
            title={cat.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
            className={`transition-colors disabled:opacity-50 ${
              cat.isActive
                ? "text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300"
                : "text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400"
            }`}>
            {cat.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
          </button>
          <button onClick={() => setDeleteTarget(cat)} disabled={isPending}
            className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage course categories shown on the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={categories}
            fields={exportFields}
            fetchAll={fetchAllForExport}
            filename={`categories-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Categories Export"
          />
          <button onClick={openModal}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand dark:hover:bg-brand/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm dark:shadow-none">
            <Plus className="h-4 w-4" /> New Category
          </button>
        </div>
      </div>

      {/* DataTable — server-side mode */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Categories</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
      <DataTable
        data={categories}
        columns={visibleColumns}
        serverSide
        pagination={pagination}
        onQueryChange={fetchCategories}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search categories…"
        emptyMessage="No categories yet. Click &quot;New Category&quot; to add one."
        filters={[
          {
            key: "isActive",
            label: "All Status",
            options: [
              { label: "Active",   value: "true"  },
              { label: "Inactive", value: "false" },
            ],
          },
        ]}
      />
        </div>
      </div>

      {/* Toggle category modal */}
      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.isActive ? "Deactivate Category" : "Activate Category"}
        message={
          toggleTarget?.isActive
            ? <>Deactivate <strong>{toggleTarget.name}</strong>? It will be hidden from the platform.</>
            : <>Activate <strong>{toggleTarget?.name}</strong>? It will become visible on the platform.</>
        }
        confirmLabel={toggleTarget?.isActive ? "Yes, Deactivate" : "Yes, Activate"}
        variant={toggleTarget?.isActive ? "warning" : "success"}
        isPending={isPending}
        onConfirm={() => toggleTarget && handleToggle(toggleTarget)}
        onClose={() => setToggleTarget(null)}
      />

      {/* Delete category modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Category"
        message={deleteTarget ? <>Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</> : ""}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-brand-50 dark:bg-brand/10 border-b border-brand-100 dark:border-brand/20">
              <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand/15 flex items-center justify-center">
                <FolderPlus className="w-4 h-4 text-brand-600 dark:text-brand" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{isEditing ? "Edit Category" : "New Category"}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {isEditing ? "Rename this course category" : "Add a new course category to the platform"}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <div className="bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-xl">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Category Name <span className="text-red-400">*</span></label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (isEditing ? handleUpdate() : handleAdd())}
                  placeholder="e.g. Web Development"
                  className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {isEditing && (
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">The URL slug updates automatically to match the new name.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Description <span className="text-gray-400 dark:text-slate-500 font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this category"
                  className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white transition-colors">Cancel</button>
              <button onClick={isEditing ? handleUpdate : handleAdd} disabled={isPending || !name.trim()}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand dark:hover:bg-brand/90 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                {isEditing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditing
                  ? (isPending ? "Saving…" : "Save Changes")
                  : (isPending ? "Creating…" : "Create Category")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
