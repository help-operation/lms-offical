"use client";

import { useState, useTransition } from "react";
import { Plus, Trash, ToggleLeft, ToggleRight, Tag, X } from "@phosphor-icons/react";
import { shopAdminBrowser, type ShopCoupon } from "./browser";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { DataTable, type Column } from "@repo/ui/data-table";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { useLocalization } from "@/shared/context/LocalizationContext";
import { formatDate as formatDateExport } from "@/utils/table-export";

interface InitialData { coupons: ShopCoupon[]; total: number }
interface Props { initialData: InitialData }

interface NewCouponForm {
  code: string; type: "percentage" | "fixed"; value: string; maxUses: string; expiresAt: string;
}

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<ShopCoupon>[] = [
  {
    key: "code", header: "Code", defaultVisible: true,
    exportFields: [{ header: "Code", getValue: (c) => c.code }],
  },
  {
    key: "discount", header: "Discount", defaultVisible: true,
    exportFields: [{
      header: "Discount",
      getValue: (c) => c.type === "percentage"
        ? `${parseFloat(c.value)}% off`
        : `৳${parseFloat(c.value).toLocaleString()} off`,
    }],
  },
  {
    key: "uses", header: "Uses", defaultVisible: true,
    exportFields: [
      { header: "Used",     getValue: (c) => String(c.usedCount)     },
      { header: "Max Uses", getValue: (c) => c.maxUses != null ? String(c.maxUses) : "Unlimited" },
    ],
  },
  {
    key: "expires", header: "Expires", defaultVisible: true,
    exportFields: [{ header: "Expires", getValue: (c) => c.expiresAt ? formatDateExport(c.expiresAt) : "Never" }],
  },
  {
    key: "status", header: "Status", defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (c) => c.isActive ? "Active" : "Inactive" }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShopCouponsPageClient({ initialData }: Props) {
  const { formatDate } = useLocalization();
  const [coupons,      setCoupons]      = useState<ShopCoupon[]>(initialData.coupons);
  const [isPending,    startTransition] = useTransition();
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState<NewCouponForm>({ code: "", type: "percentage", value: "", maxUses: "", expiresAt: "" });
  const [error,        setError]        = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<ShopCoupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopCoupon | null>(null);
  const [visibleCols, setVisibleCols]   = useState<Set<string>>(DEFAULT_VISIBLE);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.value) { setError("Code and value are required"); return; }
    startTransition(async () => {
      try {
        const res = await shopAdminBrowser.createCoupon({
          code: form.code.toUpperCase(), type: form.type, value: form.value,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt || null, isActive: true,
        });
        if (res.data) {
          setCoupons((prev) => [res.data!, ...prev]);
          setShowForm(false);
          setForm({ code: "", type: "percentage", value: "", maxUses: "", expiresAt: "" });
          setError(null);
        }
      } catch (e: unknown) { setError((e as { message?: string })?.message ?? "Failed to create coupon"); }
    });
  }

  function handleToggle(coupon: ShopCoupon) {
    setToggleTarget(null);
    startTransition(async () => {
      try {
        const res = await shopAdminBrowser.toggleCoupon(coupon.id);
        if (res.data) setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? res.data! : c)));
      } catch {}
    });
  }

  function handleDelete(coupon: ShopCoupon) {
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        await shopAdminBrowser.deleteCoupon(coupon.id);
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      } catch {}
    });
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  const visibleColumns: Column<ShopCoupon>[] = [
    ...(visibleCols.has("code") ? [{
      key: "code" as const, header: "Code",
      render: (coupon: ShopCoupon) => <span className="font-mono font-bold text-gray-900 dark:text-white">{coupon.code}</span>,
    }] : []),
    ...(visibleCols.has("discount") ? [{
      key: "discount" as const, header: "Discount",
      render: (coupon: ShopCoupon) => (
        <span className="text-gray-700 dark:text-slate-300">
          {coupon.type === "percentage"
            ? `${parseFloat(coupon.value)}% off`
            : `৳${parseFloat(coupon.value).toLocaleString("bn-BD")} off`}
        </span>
      ),
    }] : []),
    ...(visibleCols.has("uses") ? [{
      key: "uses" as const, header: "Uses",
      render: (coupon: ShopCoupon) => (
        <span className="text-gray-600 dark:text-slate-300">{coupon.usedCount} / {coupon.maxUses ?? "∞"}</span>
      ),
    }] : []),
    ...(visibleCols.has("expires") ? [{
      key: "expires" as const, header: "Expires",
      render: (coupon: ShopCoupon) => (
        <span className="text-gray-500 dark:text-slate-400 text-xs">{coupon.expiresAt ? formatDate(coupon.expiresAt) : "Never"}</span>
      ),
    }] : []),
    ...(visibleCols.has("status") ? [{
      key: "status" as const, header: "Status",
      render: (coupon: ShopCoupon) => (
        <button onClick={() => setToggleTarget(coupon)} disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-medium disabled:opacity-50">
          {coupon.isActive
            ? <><ToggleRight size={20} className="text-green-500 dark:text-green-400" /> <span className="text-green-600 dark:text-green-400">Active</span></>
            : <><ToggleLeft size={20} className="text-gray-400 dark:text-slate-500" /> <span className="text-gray-400 dark:text-slate-500">Inactive</span></>}
        </button>
      ),
    }] : []),
    {
      key: "actions", header: "",
      render: (coupon: ShopCoupon) => (
        <div className="flex justify-end">
          <button onClick={() => setDeleteTarget(coupon)} disabled={isPending}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors disabled:opacity-50">
            <Trash size={14} />
          </button>
        </div>
      ),
    },
  ];

  const inputCls = "w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 dark:focus:border-brand focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand";
  const labelCls = "block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1";

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.isActive ? "Deactivate Coupon" : "Activate Coupon"}
        message={toggleTarget?.isActive
          ? <>Deactivate coupon <strong>{toggleTarget.code}</strong>? It will no longer be usable.</>
          : <>Activate coupon <strong>{toggleTarget?.code}</strong>? It will become usable immediately.</>}
        confirmLabel={toggleTarget?.isActive ? "Yes, Deactivate" : "Yes, Activate"}
        variant={toggleTarget?.isActive ? "warning" : "success"}
        isPending={isPending}
        onConfirm={() => toggleTarget && handleToggle(toggleTarget)}
        onClose={() => setToggleTarget(null)}
      />
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Coupon"
        message={deleteTarget ? <>Delete coupon <strong>{deleteTarget.code}</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop Coupons</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""}</p>
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
            filename={`shop-coupons-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Shop Coupons Export"
          />
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-brand-600 dark:bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 dark:hover:bg-brand/90 transition-colors">
            {showForm ? <X size={18} /> : <Plus size={18} weight="bold" />}
            {showForm ? "Cancel" : "New Coupon"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Create Coupon</h2>
          {error && <div className="text-red-500 dark:text-red-400 text-sm mb-3">{error}</div>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Code *</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className={inputCls} placeholder="SAVE20" required />
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "percentage" | "fixed" }))} className={inputCls}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (৳)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Value *</label>
              <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} className={inputCls} min="0" step="0.01" placeholder={form.type === "percentage" ? "20" : "100"} required />
            </div>
            <div>
              <label className={labelCls}>Max Uses</label>
              <input type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} className={inputCls} min="1" placeholder="Unlimited" />
            </div>
            <div>
              <label className={labelCls}>Expires At</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={isPending}
              className="bg-brand-600 dark:bg-brand text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 dark:hover:bg-brand/90 disabled:opacity-60 transition-colors">
              Create
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Coupons</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={coupons}
            columns={visibleColumns}
            searchable
            searchKeys={["code"]}
            searchPlaceholder="Search coupons…"
            emptyMessage="No coupons yet"
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
}
