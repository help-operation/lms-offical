"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash, ToggleLeft, ToggleRight, Package } from "@phosphor-icons/react";
import { shopAdminBrowser, type ShopProduct } from "./browser";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { DataTable, type Column } from "@repo/ui/data-table";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";

interface PageData {
  data: ShopProduct[];
  pagination: { total: number; per_page: number; current_page: number; last_page: number };
}

interface Props { initialData: PageData }

const TYPE_COLORS: Record<string, string> = {
  physical: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  digital:  "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  bundle:   "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  tool:     "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
};

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<ShopProduct>[] = [
  {
    key: "product", header: "Product", defaultVisible: true,
    exportFields: [
      { header: "Title", getValue: (p) => p.title },
      { header: "Slug",  getValue: (p) => p.slug  },
    ],
  },
  {
    key: "type", header: "Type", defaultVisible: true,
    exportFields: [{ header: "Type", getValue: (p) => p.type }],
  },
  {
    key: "price", header: "Price", defaultVisible: true,
    exportFields: [
      { header: "Price",          getValue: (p) => `৳${parseFloat(p.price).toLocaleString()}` },
      { header: "Discount Price", getValue: (p) => p.discountPrice ? `৳${parseFloat(p.discountPrice).toLocaleString()}` : "" },
    ],
  },
  {
    key: "stock", header: "Stock", defaultVisible: true,
    exportFields: [{ header: "Stock", getValue: (p) => p.stock === null ? "Unlimited" : String(p.stock) }],
  },
  {
    key: "status", header: "Status", defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (p) => p.isActive ? "Active" : "Inactive" }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShopProductsPageClient({ initialData }: Props) {
  const [products,     setProducts]     = useState<ShopProduct[]>(initialData.data);
  const [total,        setTotal]        = useState(initialData.pagination.total);
  const [isPending,    startTransition] = useTransition();
  const [toggleTarget, setToggleTarget] = useState<ShopProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopProduct | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [visibleCols, setVisibleCols]   = useState<Set<string>>(DEFAULT_VISIBLE);

  function handleToggle(product: ShopProduct) {
    setToggleTarget(null);
    startTransition(async () => {
      try {
        const res = await shopAdminBrowser.toggleProduct(product.id);
        if (res.data) setProducts((prev) => prev.map((p) => (p.id === product.id ? res.data! : p)));
      } catch (e: unknown) {
        setError((e as { message?: string })?.message ?? "Failed to update");
      }
    });
  }

  function handleDelete(product: ShopProduct) {
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        await shopAdminBrowser.deleteProduct(product.id);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        setTotal((t) => t - 1);
      } catch (e: unknown) {
        setError((e as { message?: string })?.message ?? "Failed to delete");
      }
    });
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  const visibleColumns: Column<ShopProduct>[] = [
    ...(visibleCols.has("product") ? [{
      key: "product" as const, header: "Product",
      render: (product: ShopProduct) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 relative">
            {product.images?.[0] ? (
              <Image src={product.images[0]} alt={product.title} fill className="object-cover" sizes="48px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package size={20} className="text-gray-300 dark:text-slate-600" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{product.title}</p>
            <p className="text-gray-400 dark:text-slate-500 text-xs">{product.slug}</p>
          </div>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("type") ? [{
      key: "type" as const, header: "Type",
      render: (product: ShopProduct) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[product.type] ?? "bg-gray-100 text-gray-700 dark:bg-slate-500/15 dark:text-slate-400"}`}>
          {product.type}
        </span>
      ),
    }] : []),
    ...(visibleCols.has("price") ? [{
      key: "price" as const, header: "Price",
      render: (product: ShopProduct) => {
        const price = parseFloat(product.discountPrice ?? product.price);
        const hasDiscount = product.discountPrice !== null;
        return (
          <div>
            <span className="font-bold text-gray-900 dark:text-white">৳{price.toLocaleString("bn-BD")}</span>
            {hasDiscount && (
              <span className="text-gray-400 dark:text-slate-500 text-xs line-through ml-1.5">৳{parseFloat(product.price).toLocaleString("bn-BD")}</span>
            )}
          </div>
        );
      },
    }] : []),
    ...(visibleCols.has("stock") ? [{
      key: "stock" as const, header: "Stock",
      render: (product: ShopProduct) => product.stock === null ? (
        <span className="text-gray-400 dark:text-slate-500 text-xs">Unlimited</span>
      ) : product.stock === 0 ? (
        <span className="text-red-500 dark:text-red-400 font-semibold text-xs">Out of Stock</span>
      ) : (
        <span className={`font-semibold text-xs ${product.stock <= 5 ? "text-orange-500 dark:text-orange-400" : "text-gray-700 dark:text-slate-300"}`}>
          {product.stock} left
        </span>
      ),
    }] : []),
    ...(visibleCols.has("status") ? [{
      key: "status" as const, header: "Status",
      render: (product: ShopProduct) => (
        <button onClick={() => setToggleTarget(product)} disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-medium disabled:opacity-50">
          {product.isActive ? (
            <><ToggleRight size={20} className="text-green-500 dark:text-green-400" /> <span className="text-green-600 dark:text-green-400">Active</span></>
          ) : (
            <><ToggleLeft size={20} className="text-gray-400 dark:text-slate-500" /> <span className="text-gray-400 dark:text-slate-500">Inactive</span></>
          )}
        </button>
      ),
    }] : []),
    {
      key: "actions", header: "",
      render: (product: ShopProduct) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/shop/products/${product.id}/edit`}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand transition-colors">
            <Pencil size={15} />
          </Link>
          <button onClick={() => setDeleteTarget(product)} disabled={isPending}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50">
            <Trash size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.isActive ? "Deactivate Product" : "Activate Product"}
        message={toggleTarget?.isActive
          ? <><strong>{toggleTarget.title}</strong> will be hidden from the shop.</>
          : <><strong>{toggleTarget?.title}</strong> will become visible in the shop.</>}
        confirmLabel={toggleTarget?.isActive ? "Yes, Deactivate" : "Yes, Activate"}
        variant={toggleTarget?.isActive ? "warning" : "success"}
        isPending={isPending}
        onConfirm={() => toggleTarget && handleToggle(toggleTarget)}
        onClose={() => setToggleTarget(null)}
      />
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message={deleteTarget ? <>Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop Products</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{total} product{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={products}
            fields={exportFields}
            filename={`shop-products-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Shop Products Export"
          />
          <Link href="/admin/shop/products/new"
            className="flex items-center gap-2 bg-brand-600 dark:bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 dark:hover:bg-brand/90 transition-colors">
            <Plus size={18} weight="bold" /> Add Product
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Products</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={products}
            columns={visibleColumns}
            searchable
            searchKeys={["title", "slug"]}
            searchPlaceholder="Search products…"
            emptyMessage="No products yet"
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-500 dark:text-slate-400">
        <Link href="/admin/shop/orders" className="hover:text-brand-600 dark:hover:text-brand font-medium">View Orders →</Link>
        <Link href="/admin/shop/coupons" className="hover:text-brand-600 dark:hover:text-brand font-medium">Shop Coupons →</Link>
      </div>
    </div>
  );
}
