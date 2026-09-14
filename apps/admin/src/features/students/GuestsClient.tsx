"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchGuestsAction,
  toggleStudentStatusAction,
  deleteStudentAction,
  bulkToggleStudentStatusAction,
  bulkDeleteStudentsAction,
} from "@/features/students/actions/students.actions";
import type { Student } from "@/features/students/types";
import type { PaginatedResponse, TableQueryParams } from "@/features/admin/api";
import { DataTable, type Column, type TablePagination } from "@repo/ui/data-table";
import {
  Users, UserCheck, UserX, CalendarClock, Calendar, Eye, Pencil, Trash2,
  Phone, Mail, Copy, Check, Square, CheckSquare, Shield, ShieldOff,
} from "lucide-react";
import { useLocalization } from "@/shared/context/LocalizationContext";
import { toast } from "@repo/ui/sonner";

const avatarColors = [
  "bg-blue-400", "bg-violet-400", "bg-emerald-400",
  "bg-amber-400", "bg-rose-400", "bg-cyan-400",
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    suspended: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
      {status}
    </span>
  );
}

function CopyableField({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="group flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
      <Icon className="h-3 w-3 shrink-0" /> {value}
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy"}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand transition-opacity"
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

interface Props {
  initialData: PaginatedResponse<Student>;
  initialStats?: {
    total: number;
    active: number;
    suspended: number;
    newThisMonth: number;
    newThisWeek: number;
  };
}

export function GuestsClient({ initialData, initialStats }: Props) {
  const { formatDate } = useLocalization();
  const [guests, setGuests] = useState<Student[]>(initialData.data);
  const [pagination, setPagination] = useState<TablePagination>(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(initialStats ?? { total: 0, active: 0, suspended: 0, newThisMonth: 0, newThisWeek: 0 });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  async function fetchGuests(params: TableQueryParams) {
    setIsLoading(true);
    try {
      const res = await fetchGuestsAction(params);
      if (res.success && res.data) {
        setGuests(res.data.data);
        setPagination(res.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === guests.length) return new Set();
      return new Set(guests.map((g) => g.id));
    });
  }, [guests]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  async function handleBulkAction(action: "activate" | "suspend" | "delete") {
    const ids = [...selected];
    if (ids.length === 0) return;

    const label = action === "delete" ? "Delete" : action === "activate" ? "Activate" : "Suspend";
    if (action === "delete" && !window.confirm(`Delete ${ids.length} guest(s)? This cannot be undone.`)) return;

    setBulkLoading(true);
    try {
      let res;
      if (action === "delete") {
        res = await bulkDeleteStudentsAction(ids);
      } else {
        res = await bulkToggleStudentStatusAction(ids, action === "activate" ? "active" : "suspended");
      }
      if (res.success) {
        const { succeeded, failed } = res.data;
        toast.success(`${label}d ${succeeded} guest(s)${failed ? ` (${failed} failed)` : ""}`);
        clearSelection();
        fetchGuests({ page: pagination.current_page, per_page: pagination.per_page });
      } else {
        toast.error(res.message ?? `Failed to ${label} guests`);
      }
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleSingleToggle(id: number) {
    const res = await toggleStudentStatusAction(id);
    if (res.success) {
      toast.success("Status updated");
      fetchGuests({ page: pagination.current_page, per_page: pagination.per_page });
    } else {
      toast.error(res.message ?? "Failed to update status");
    }
  }

  async function handleSingleDelete(id: number) {
    if (!window.confirm("Delete this guest? This cannot be undone.")) return;
    const res = await deleteStudentAction(id);
    if (res.success) {
      toast.success("Guest deleted");
      fetchGuests({ page: pagination.current_page, per_page: pagination.per_page });
    } else {
      toast.error(res.message ?? "Failed to delete guest");
    }
  }

  const columns: Column<Student>[] = [
    {
      key: "firstName" as const,
      header: "Guest",
      sortable: true,
      render: (s: Student, i: number) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleSelect(s.id); }}
            className="shrink-0 text-gray-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand transition-colors"
          >
            {selected.has(s.id)
              ? <CheckSquare className="h-4 w-4 text-brand-600" />
              : <Square className="h-4 w-4" />}
          </button>
          {s.avatar ? (
            <img src={s.avatar} alt={s.firstName} className="h-10 w-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
              {s.firstName[0]}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.firstName} {s.lastName}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">#{s.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email" as const,
      header: "Contact",
      render: (s: Student) => (
        <div className="space-y-0.5">
          {s.email && <CopyableField icon={Mail} value={s.email} />}
          {s.phone && <CopyableField icon={Phone} value={s.phone} />}
          {!s.email && !s.phone && <span className="text-xs text-gray-300 dark:text-slate-600">—</span>}
        </div>
      ),
    },
    {
      key: "createdAt" as const,
      header: "Joined",
      sortable: true,
      render: (s: Student) => (
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {s.createdAt ? formatDate(s.createdAt) : "—"}
        </span>
      ),
    },
    {
      key: "status" as const,
      header: "Status",
      render: (s: Student) => <StatusBadge status={s.status} />,
    },
    {
      key: "id" as const,
      header: "Actions",
      render: (s: Student) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/students/${s.id}`}
            title="View"
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/admin/students/${s.id}`}
            title="Edit"
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            title={s.status === "active" ? "Suspend" : "Activate"}
            onClick={() => handleSingleToggle(s.id)}
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
              s.status === "active"
                ? "bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                : "bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-green-500/10 dark:hover:text-green-400"
            }`}
          >
            {s.status === "active" ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => handleSingleDelete(s.id)}
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const kpiCards = [
    { label: "Total Guests", value: stats.total, icon: Users, iconBg: "bg-gradient-to-br from-gray-500 to-gray-600", cardBg: "bg-gradient-to-br from-gray-50/80 to-white dark:from-gray-500/10 dark:to-slate-900" },
    { label: "Active", value: stats.active, icon: UserCheck, iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600", cardBg: "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900" },
    { label: "Suspended", value: stats.suspended, icon: UserX, iconBg: "bg-gradient-to-br from-red-500 to-red-600", cardBg: "bg-gradient-to-br from-red-50/80 to-white dark:from-red-500/10 dark:to-slate-900" },
    { label: "New This Week", value: stats.newThisWeek, icon: Calendar, iconBg: "bg-gradient-to-br from-blue-500 to-blue-600", cardBg: "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900" },
    { label: "New This Month", value: stats.newThisMonth, icon: CalendarClock, iconBg: "bg-gradient-to-br from-amber-500 to-amber-600", cardBg: "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900" },
  ];

  const allSelected = selected.size === guests.length && guests.length > 0;

  return (
    <div className="space-y-5">
      {/* Single Header Row: Title + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Manage students and guests</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
            <a href="/admin/students?tab=students" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Students
            </a>
            <a href="/admin/students?tab=guests" className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm transition-colors">
              Guests
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl ${card.cardBg} p-4 border border-white/60 dark:border-slate-800 shadow-sm flex items-center gap-3`}
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} shrink-0`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkAction("activate")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              <Shield className="h-3.5 w-3.5" />
              Activate
            </button>
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkAction("suspend")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Suspend
            </button>
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkAction("delete")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="ml-1 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="px-6 pt-5 pb-6">
          {/* Select All Header */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-gray-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand transition-colors"
            >
              {allSelected
                ? <CheckSquare className="h-4 w-4 text-brand-600" />
                : <Square className="h-4 w-4" />}
            </button>
            <span className="text-xs text-gray-400 dark:text-slate-500">
              {selected.size > 0 ? `${selected.size} of ${guests.length} selected` : `Select all (${guests.length})`}
            </span>
          </div>

          <DataTable
            data={guests}
            columns={columns}
            serverSide
            pagination={pagination}
            onQueryChange={(params) => { clearSelection(); fetchGuests(params); }}
            dateRangeKey="createdAt"
            portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
            isLoading={isLoading}
            searchable
            searchPlaceholder="Search by name, email or phone…"
            filters={[
              {
                key: "status",
                label: "All Status",
                options: [
                  { label: "Active", value: "active" },
                  { label: "Suspended", value: "suspended" },
                ],
              },
            ]}
            emptyMessage="No guests found."
          />
        </div>
      </div>
    </div>
  );
}
