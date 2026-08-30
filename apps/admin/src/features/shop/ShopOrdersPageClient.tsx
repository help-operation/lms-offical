"use client";

import { useState, useTransition } from "react";
import { Package } from "@phosphor-icons/react";
import { shopAdminBrowser, type ShopOrder } from "./browser";
import { DataTable, type Column } from "@repo/ui/data-table";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";
import { useLocalization } from "@/shared/context/LocalizationContext";

function fmtAmt(s: string) {
  return `৳${parseFloat(s).toLocaleString("bn-BD")}`;
}

interface InitialData { orders: ShopOrder[]; total: number; page: number; limit: number }
interface Props { initialData: InitialData }

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  paid:      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

const FULFILLMENT_COLORS: Record<string, string> = {
  pending:    "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  shipped:    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  delivered:  "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  cancelled:  "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

const FULFILLMENT_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<ShopOrder>[] = [
  {
    key: "order", header: "Order #", defaultVisible: true,
    exportFields: [{ header: "Order #", getValue: (o) => `#${o.id}` }],
  },
  {
    key: "customer", header: "Customer", defaultVisible: true,
    exportFields: [
      { header: "Name",  getValue: (o) => o.name  },
      { header: "Phone", getValue: (o) => o.phone },
      { header: "Email", getValue: (o) => o.email },
    ],
  },
  {
    key: "amount", header: "Amount", defaultVisible: true,
    exportFields: [{ header: "Amount", getValue: (o) => fmtAmt(o.finalAmount) }],
  },
  {
    key: "payment", header: "Payment", defaultVisible: true,
    exportFields: [{ header: "Payment Status", getValue: (o) => o.status }],
  },
  {
    key: "fulfillment", header: "Fulfillment", defaultVisible: true,
    exportFields: [{ header: "Fulfillment", getValue: (o) => o.fulfillmentStatus }],
  },
  {
    key: "date", header: "Date", defaultVisible: true,
    exportFields: [{ header: "Date", getValue: (o) => formatDate(o.createdAt) }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Expand row render ────────────────────────────────────────────────────────

function OrderExpandPanel({ order }: { order: ShopOrder }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 text-sm">
      <div>
        <p className="font-semibold text-gray-700 dark:text-slate-300 mb-2">Contact Details</p>
        <p className="text-gray-600 dark:text-slate-300"><span className="text-gray-400 dark:text-slate-500">Email:</span> {order.email}</p>
        <p className="text-gray-600 dark:text-slate-300"><span className="text-gray-400 dark:text-slate-500">Phone:</span> {order.phone}</p>
        {order.address && <p className="text-gray-600 dark:text-slate-300"><span className="text-gray-400 dark:text-slate-500">Address:</span> {order.address}</p>}
      </div>
      <div>
        <p className="font-semibold text-gray-700 dark:text-slate-300 mb-2">Payment</p>
        <p className="text-gray-600 dark:text-slate-300"><span className="text-gray-400 dark:text-slate-500">Method:</span> {order.paystationMethod ?? order.paymentMethod ?? "—"}</p>
        <p className="text-gray-600 dark:text-slate-300"><span className="text-gray-400 dark:text-slate-500">Total:</span> {fmtAmt(order.totalAmount)}</p>
        {parseFloat(order.discountAmount) > 0 && (
          <p className="text-gray-600 dark:text-slate-300"><span className="text-gray-400 dark:text-slate-500">Discount:</span> -{fmtAmt(order.discountAmount)}</p>
        )}
        <p className="text-gray-900 dark:text-white font-bold"><span className="text-gray-400 dark:text-slate-500 font-normal">Final:</span> {fmtAmt(order.finalAmount)}</p>
      </div>
      {order.notes && (
        <div className="sm:col-span-2 border-t border-brand-200 dark:border-brand/30 pt-3 mt-1">
          <p className="text-xs text-gray-500 dark:text-slate-400"><span className="font-medium">Notes:</span> {order.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShopOrdersPageClient({ initialData }: Props) {
  const { formatDate: formatDateLocal } = useLocalization();
  const [orders,    setOrders]    = useState<ShopOrder[]>(initialData.orders);
  const [total]                   = useState(initialData.total);
  const [isPending, startTransition] = useTransition();
  const [error,     setError]     = useState<string | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);

  function updateFulfillment(orderId: number, status: ShopOrder["fulfillmentStatus"]) {
    startTransition(async () => {
      try {
        const res = await shopAdminBrowser.updateFulfillment(orderId, status);
        if (res.data) setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...res.data! } : o)));
      } catch (e: unknown) {
        setError((e as { message?: string })?.message ?? "Update failed");
      }
    });
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  const visibleColumns: Column<ShopOrder>[] = [
    ...(visibleCols.has("order") ? [{
      key: "order" as const, header: "Order #",
      render: (o: ShopOrder) => <span className="font-mono text-xs text-gray-500 dark:text-slate-400">#{o.id}</span>,
    }] : []),
    ...(visibleCols.has("customer") ? [{
      key: "customer" as const, header: "Customer",
      render: (o: ShopOrder) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{o.name}</p>
          <p className="text-gray-400 dark:text-slate-500 text-xs">{o.phone}</p>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("amount") ? [{
      key: "amount" as const, header: "Amount",
      render: (o: ShopOrder) => <span className="font-bold text-gray-900 dark:text-white">{fmtAmt(o.finalAmount)}</span>,
    }] : []),
    ...(visibleCols.has("payment") ? [{
      key: "payment" as const, header: "Payment",
      render: (o: ShopOrder) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
          {o.status}
        </span>
      ),
    }] : []),
    ...(visibleCols.has("fulfillment") ? [{
      key: "fulfillment" as const, header: "Fulfillment",
      render: (o: ShopOrder) => (
        <select
          value={o.fulfillmentStatus}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => updateFulfillment(o.id, e.target.value as ShopOrder["fulfillmentStatus"])}
          disabled={isPending}
          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${FULFILLMENT_COLORS[o.fulfillmentStatus] ?? ""}`}
        >
          {FULFILLMENT_OPTIONS.map((op) => <option key={op} value={op}>{op}</option>)}
        </select>
      ),
    }] : []),
    ...(visibleCols.has("date") ? [{
      key: "date" as const, header: "Date",
      render: (o: ShopOrder) => <span className="text-gray-500 dark:text-slate-400 text-xs">{formatDateLocal(o.createdAt)}</span>,
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop Orders</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{total} order{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={orders}
            fields={exportFields}
            filename={`shop-orders-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Shop Orders Export"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Table with expandable rows */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Orders</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={orders}
            columns={visibleColumns}
            expandRow={(order) => <OrderExpandPanel order={order} />}
            searchable
            searchKeys={["name", "email", "phone"]}
            searchPlaceholder="Search orders…"
            emptyMessage="No orders yet"
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
}
