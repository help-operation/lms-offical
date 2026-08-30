"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, UserPlus, GraduationCap } from "lucide-react";
import { DataTable, type Column } from "@repo/ui/data-table";
import type { Lead, LeadCounts, LeadSource, LeadStatus } from "@/features/leads/api";
import { ManualEnrollModal } from "@/features/enrollments/ManualEnrollModal";
import type { EnrollLeadContext } from "@/features/enrollments/types";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props {
  leads: Lead[];
  counts: LeadCounts;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUSES: { key: "all" | "pending" | "complete"; label: string; bg: string; text: string }[] = [
  { key: "all",      label: "All",      bg: "bg-gray-100 dark:bg-slate-500/15",  text: "text-gray-700 dark:text-slate-400"  },
  { key: "pending",  label: "Pending",  bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400" },
  { key: "complete", label: "Complete", bg: "bg-green-100 dark:bg-green-500/15", text: "text-green-700 dark:text-green-400" },
];

const SOURCES: { key: "all" | LeadSource; label: string; bg: string; text: string }[] = [
  { key: "all",                label: "All sources",    bg: "bg-gray-100 dark:bg-slate-500/15",    text: "text-gray-700 dark:text-slate-400"    },
  { key: "checkout",           label: "Checkout",       bg: "bg-blue-100 dark:bg-blue-500/15",    text: "text-blue-700 dark:text-blue-400"    },
  { key: "live_checkout",      label: "Live/Bundle",    bg: "bg-brand-100 dark:bg-brand/15",  text: "text-brand-700 dark:text-brand"  },
  { key: "abandoned_checkout", label: "Abandoned",      bg: "bg-yellow-100 dark:bg-yellow-500/15",  text: "text-yellow-700 dark:text-yellow-400"  },
  { key: "checkout_visit",     label: "Visit",          bg: "bg-sky-100 dark:bg-sky-500/15",     text: "text-sky-700 dark:text-sky-400"     },
  { key: "interest_box",       label: "Interest",       bg: "bg-fuchsia-100 dark:bg-fuchsia-500/15", text: "text-fuchsia-700 dark:text-fuchsia-400" },
  { key: "callback_widget",    label: "Callback",       bg: "bg-green-100 dark:bg-green-500/15",   text: "text-green-700 dark:text-green-400"   },
  { key: "manual",             label: "Manual",         bg: "bg-stone-100 dark:bg-stone-500/15",   text: "text-stone-700 dark:text-stone-400"   },
  { key: "failed_payment",     label: "Failed Payment", bg: "bg-red-100 dark:bg-red-500/15",     text: "text-red-700 dark:text-red-400"     },
];

function sourceLabel(src: LeadSource): string {
  return SOURCES.find((s) => s.key === src)?.label ?? src;
}

function StatusPill({ status }: { status: LeadStatus }) {
  const s = STATUSES.find((x) => x.key === status);
  if (!s) return <span className="text-xs text-gray-400 dark:text-slate-500">{status}</span>;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
}

function SourcePill({ source }: { source: LeadSource }) {
  const s = SOURCES.find((x) => x.key === source);
  if (!s) return <span className="text-xs text-gray-400 dark:text-slate-500">{source}</span>;
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
}

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<Lead>[] = [
  {
    key: "name", header: "Name", defaultVisible: true,
    exportFields: [
      { header: "Name",  getValue: (l) => l.name ?? "" },
      { header: "Lead ID", getValue: (l) => `#${l.id}` },
    ],
  },
  {
    key: "contact", header: "Contact", defaultVisible: true,
    exportFields: [
      { header: "Email", getValue: (l) => l.email ?? "" },
      { header: "Phone", getValue: (l) => l.phone ?? "" },
    ],
  },
  {
    key: "source", header: "Source", defaultVisible: true,
    exportFields: [{ header: "Source", getValue: (l) => sourceLabel(l.source) }],
  },
  {
    key: "courses", header: "Courses", defaultVisible: true,
    exportFields: [{ header: "Courses", getValue: (l) => l.courses.map((c) => c.title).join(", ") }],
  },
  {
    key: "amount", header: "Amount", defaultVisible: true,
    exportFields: [{ header: "Amount", getValue: (l) => `৳${Number(l.finalAmount).toLocaleString()}` }],
  },
  {
    key: "status", header: "Status", defaultVisible: true,
    exportFields: [
      { header: "Status",    getValue: (l) => l.status },
      { header: "Paid",      getValue: (l) => l.orderPaid ? "Yes" : "No" },
    ],
  },
  {
    key: "received", header: "Received", defaultVisible: true,
    exportFields: [{ header: "Received", getValue: (l) => formatDate(l.createdAt) }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Main Component ───────────────────────────────────────────────────────────

export function LeadsListClient({ leads, counts, pagination }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const { formatDateTime } = useLocalization();
  const [, startTransition] = useTransition();
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);

  const activeStatus = (sp.get("status") ?? "all") as "all" | "pending" | "complete";
  const activeSource = (sp.get("source") ?? "all") as "all" | LeadSource;
  const [enroll, setEnroll] = useState<{ lead: EnrollLeadContext; mode: "enroll" | "account" } | null>(null);

  function openEnroll(l: Lead, mode: "enroll" | "account") {
    setEnroll({
      lead: { id: l.id, name: l.name, email: l.email, phone: l.phone, orderPaid: l.orderPaid, courseIds: l.courseIds },
      mode,
    });
  }

  function navigate(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (updates.status !== undefined || updates.source !== undefined || updates.search !== undefined) {
      next.delete("page");
    }
    startTransition(() => router.push(`/admin/leads?${next.toString()}`));
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  const countFor = (key: "all" | "pending" | "complete") => {
    if (key === "all") return counts.total;
    return counts[key] ?? 0;
  };

  const visibleColumns: Column<Lead>[] = [
    ...(visibleCols.has("name") ? [{
      key: "name" as const, header: "Name",
      render: (l: Lead) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{l.name ?? <span className="italic text-gray-400 dark:text-slate-500">Anonymous</span>}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">#{l.id}</p>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("contact") ? [{
      key: "contact" as const, header: "Contact",
      render: (l: Lead) => (
        <div>
          {l.email ? <p className="text-gray-700 dark:text-slate-300">{l.email}</p> : <p className="text-xs italic text-gray-400 dark:text-slate-500">(no email)</p>}
          {l.phone && <p className="text-xs text-gray-500 dark:text-slate-400">{l.phone}</p>}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("source") ? [{
      key: "source" as const, header: "Source",
      render: (l: Lead) => <SourcePill source={l.source} />,
    }] : []),
    ...(visibleCols.has("courses") ? [{
      key: "courses" as const, header: "Courses",
      render: (l: Lead) => l.courses.length === 0 ? (
        <span className="text-xs text-gray-400 dark:text-slate-500">No courses</span>
      ) : (
        <div>
          <p className="line-clamp-1 text-gray-700 dark:text-slate-300">{l.courses[0]?.title}</p>
          {l.courses.length > 1 && <p className="text-xs text-gray-400 dark:text-slate-500">+ {l.courses.length - 1} more</p>}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("amount") ? [{
      key: "amount" as const, header: "Amount",
      render: (l: Lead) => (
        <span className="text-gray-700 dark:text-slate-300 font-semibold">Tk {Number(l.finalAmount).toLocaleString()}</span>
      ),
    }] : []),
    ...(visibleCols.has("status") ? [{
      key: "status" as const, header: "Status",
      render: (l: Lead) => (
        <div className="flex items-center gap-1.5">
          <StatusPill status={l.status} />
          {l.orderPaid && (
            <span className="inline-flex rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Paid</span>
          )}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("received") ? [{
      key: "received" as const, header: "Received",
      render: (l: Lead) => <span className="text-xs text-gray-500 dark:text-slate-400">{l.createdAt ? formatDateTime(l.createdAt) : "—"}</span>,
    }] : []),
    {
      key: "actions", header: "Actions",
      render: (l: Lead) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => openEnroll(l, "enroll")}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-600 dark:bg-brand text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-brand-700 dark:hover:bg-brand/90">
            <GraduationCap size={12} /> Enroll
          </button>
          <button onClick={() => openEnroll(l, "account")}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800">
            <UserPlus size={12} /> Account
          </button>
          <Link href={`/admin/leads/${l.id}`}
            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-semibold px-1">
            View <ExternalLink size={11} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUSES.map((s) => (
          <button key={s.key} onClick={() => navigate({ status: s.key === "all" ? undefined : s.key })}
            className={`rounded-2xl border p-4 text-left transition-colors ${activeStatus === s.key ? "border-indigo-300 dark:border-indigo-500/50 ring-2 ring-indigo-100 dark:ring-indigo-500/20" : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"}`}>
            <p className={`text-xs font-semibold ${s.text}`}>{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{countFor(s.key)}</p>
          </button>
        ))}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 text-left">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Paid — to fulfil</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{counts.paid ?? 0}</p>
        </div>
      </div>

      {/* Source filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 mr-1">Source:</span>
        {SOURCES.map((s) => {
          const active = activeSource === s.key;
          return (
            <button key={s.key} onClick={() => navigate({ source: s.key === "all" ? undefined : s.key })}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${active ? `${s.bg} ${s.text} ring-2 ring-offset-1 dark:ring-offset-slate-950 ring-indigo-200 dark:ring-indigo-500/30` : `${s.bg} ${s.text} opacity-60 hover:opacity-100`}`}>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Leads</h1>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={leads}
            fields={exportFields}
            filename={`leads-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Leads Export"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Leads</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={leads}
            columns={visibleColumns}
            serverSide
            dateRangeKey="createdAt"
            portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
            pagination={{
              total: pagination.total,
              per_page: pagination.limit,
              current_page: pagination.page,
              last_page: pagination.totalPages,
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
            }}
            searchable
            searchPlaceholder="Search by name, email or phone…"
            onQueryChange={(params) => {
              const next = new URLSearchParams(sp);
              if (params.search)    next.set("search",    params.search as string);
              else next.delete("search");
              if (params.date_from) next.set("date_from", params.date_from as string);
              else next.delete("date_from");
              if (params.date_to)   next.set("date_to",   params.date_to as string);
              else next.delete("date_to");
              next.set("page", String(params.page));
              startTransition(() => router.push(`/admin/leads?${next.toString()}`));
            }}
            filters={[
              {
                key: "status",
                label: "All Statuses",
                options: [
                  { label: "Pending",  value: "pending"  },
                  { label: "Complete", value: "complete"  },
                ],
              },
            ]}
            emptyMessage="No leads match your filters yet."
            pageSize={pagination.limit}
            pageSizeOptions={[10, 20, 50, 100]}
            showPageSizeSelector={false}
          />
        </div>
      </div>

      {enroll && (
        <ManualEnrollModal
          lead={enroll.lead}
          mode={enroll.mode}
          onClose={() => setEnroll(null)}
          onEnrolled={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
