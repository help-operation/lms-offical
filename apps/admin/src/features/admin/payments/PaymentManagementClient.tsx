"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import {
  Search, Filter, X, Download, Printer, RefreshCw,
  MoreVertical, Eye, Receipt, RotateCcw, User, Calendar,
  TrendingUp, DollarSign, AlertCircle,
  ArrowUpDown, Columns3, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useRevenueSocket, type RevenueUpdateEvent } from "@/hooks/use-revenue-socket";
import type { PaymentStats, PaymentDetail, StudentPaymentHistory, PaginatedPayments } from "./api";
import { paymentsApiBrowser as api } from "./api-browser";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_COLUMNS = [
  { key: "invoice", label: "Invoice #", default: true },
  { key: "student", label: "Student", default: true },
  { key: "course", label: "Course(s)", default: true },
  { key: "amount", label: "Amount", default: true },
  { key: "method", label: "Method", default: true },
  { key: "status", label: "Status", default: true },
  { key: "date", label: "Date", default: true },
  { key: "action", label: "Action", default: true },
] as const;

const STATUS_TABS = ["all", "completed", "pending", "failed", "refunded"] as const;

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  failed: "bg-red-50 text-red-700 border border-red-200",
  refunded: "bg-purple-50 text-purple-700 border border-purple-200",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border border-amber-200",
  due: "bg-red-50 text-red-700 border border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-500",
  paid: "bg-emerald-500",
  pending: "bg-amber-500",
  failed: "bg-red-500",
  refunded: "bg-purple-500",
  partial: "bg-amber-500",
  due: "bg-red-500",
};

const METHOD_COLORS: Record<string, string> = {
  bKash: "bg-pink-50 text-pink-700 border border-pink-200",
  bkash: "bg-pink-50 text-pink-700 border border-pink-200",
  Nagad: "bg-orange-50 text-orange-700 border border-orange-200",
  nagad: "bg-orange-50 text-orange-700 border border-orange-200",
  Rocket: "bg-purple-50 text-purple-700 border border-purple-200",
  rocket: "bg-purple-50 text-purple-700 border border-purple-200",
  paystation: "bg-blue-50 text-blue-700 border border-blue-200",
  card: "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

type ViewMode = "payments" | "reports" | "analytics";

interface Props {
  initialStats: PaymentStats | null;
  courseList: { id: number; title: string }[];
}

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentManagementClient({ initialStats, courseList }: Props) {
  const [stats, setStats] = useState<PaymentStats | null>(initialStats);
  const [view, setView] = useState<ViewMode>("payments");
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState<number | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [paymentsData, setPaymentsData] = useState<PaginatedPayments | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PaymentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentHistory, setStudentHistory] = useState<StudentPaymentHistory | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((c) => (map[c.key] = c.default));
    return map;
  });
  const [showColPicker, setShowColPicker] = useState(false);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const [refundConfirm, setRefundConfirm] = useState<number | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [dateShortcuts, setDateShortcuts] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const colPickerRef = useRef<HTMLDivElement>(null);

  // ── Fetch payments ──────────────────────────────────────────────────────

  const fetchPayments = useCallback(() => {
    startTransition(async () => {
      setFetchError(null);
      const params: Record<string, unknown> = { page, per_page: perPage, sort_field: sortField, sort_direction: sortDir };
      if (tab !== "all") params.status = tab;
      if (search) params.search = search;
      if (methodFilter) params.method = methodFilter;
      if (courseFilter !== "") params.course_id = courseFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      try {
        const res = await api.list(params);
        setPaymentsData(res.data);
      } catch (e: any) {
        setFetchError(e?.message ?? "Failed to load payments");
        setPaymentsData({ data: [], pagination: { total: 0, per_page: perPage, current_page: 1, last_page: 0, from: 0, to: 0 } });
      }
    });
  }, [page, perPage, tab, search, methodFilter, courseFilter, dateFrom, dateTo, sortField, sortDir]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const refreshStats = useCallback(async () => {
    try {
      const res = await api.stats();
      setStats(res.data);
    } catch { /* ignore */ }
  }, []);

  // ── Real-time WebSocket ─────────────────────────────────────────────────

  const handleRevenueUpdate = useCallback(() => {
    fetchPayments();
    refreshStats();
  }, [fetchPayments, refreshStats]);

  useRevenueSocket({ onRevenueUpdate: handleRevenueUpdate as any });

  // ── Search debounce ─────────────────────────────────────────────────────

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Details ─────────────────────────────────────────────────────────────

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailId(id);
    try { const res = await api.detail(id); setDetail(res.data); } catch { setDetail(null); } finally { setDetailLoading(false); }
  };

  const openStudent = async (userId: number) => {
    setStudentLoading(true);
    setStudentId(userId);
    try { const res = await api.studentHistory(userId); setStudentHistory(res.data); } catch { setStudentHistory(null); } finally { setStudentLoading(false); }
  };

  // ── Refund ──────────────────────────────────────────────────────────────

  const handleRefund = async (id: number) => {
    setRefundLoading(true);
    try { await api.refund(id); setRefundConfirm(null); fetchPayments(); refreshStats(); } catch { /* ignore */ }
    setRefundLoading(false);
  };

  // ── Sort ────────────────────────────────────────────────────────────────

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  };

  // ── Date shortcuts ──────────────────────────────────────────────────────

  const applyDateShortcut = (shortcut: string) => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    let from = ""; let to = fmt(today);
    if (shortcut === "today") from = fmt(today);
    else if (shortcut === "yesterday") { const y = new Date(today); y.setDate(y.getDate() - 1); from = fmt(y); to = fmt(y); }
    else if (shortcut === "week") { const w = new Date(today); w.setDate(w.getDate() - 7); from = fmt(w); }
    else if (shortcut === "month") from = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
    else if (shortcut === "last_month") { const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1); const lme = new Date(today.getFullYear(), today.getMonth(), 0); from = fmt(lm); to = fmt(lme); }
    setDateFrom(from); setDateTo(to); setPage(1); setDateShortcuts(false);
  };

  // ── Export CSV ──────────────────────────────────────────────────────────

  const exportCSV = () => {
    if (!paymentsData?.data.length) return;
    const headers = ["Invoice", "Student", "Email", "Course", "Amount", "Method", "Status", "Date"];
    const rows = paymentsData.data.map((r) => [
      r.invoiceNumber ?? `INV-${String(r.id).padStart(6, "0")}`,
      `${r.userFirstName ?? ""} ${r.userLastName ?? ""}`.trim(),
      r.userEmail ?? "", r.courseTitles ?? "", r.amount, r.method, r.status,
      r.paidAt ?? r.createdAt ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `payments-${tab}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  // ── Close dropdowns on outside click ────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false);
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setShowColPicker(false);
      setActionMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Pagination helpers ──────────────────────────────────────────────────

  const totalPages = paymentsData?.pagination.last_page ?? 1;
  const currentPage = paymentsData?.pagination.current_page ?? page;
  const totalItems = paymentsData?.pagination.total ?? 0;

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">Track, manage and report on all payments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
            {(["payments", "reports", "analytics"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${view === v ? "bg-white dark:bg-slate-700 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-slate-400"}`}>{v}</button>
            ))}
          </div>
          <button onClick={() => { fetchPayments(); refreshStats(); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* ─── KPI Cards (soft pastel style matching Revenue page) ──────────── */}
      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="group relative rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 p-3.5 overflow-hidden bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-white/10"><DollarSign className="h-4 w-4 text-emerald-600 dark:text-slate-300" /></div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Total Revenue</p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">৳{Number(stats.totalRevenue).toLocaleString()}</p>
          </div>
          <div className="group relative rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 p-3.5 overflow-hidden bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-white/10"><TrendingUp className="h-4 w-4 text-blue-600 dark:text-slate-300" /></div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">This Month</p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">৳{Number(stats.monthRevenue).toLocaleString()}</p>
          </div>
          <div className="group relative rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 p-3.5 overflow-hidden bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-500/10 dark:to-slate-900">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-white/10"><Calendar className="h-4 w-4 text-violet-600 dark:text-slate-300" /></div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Today</p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">৳{Number(stats.todayRevenue).toLocaleString()}</p>
          </div>
          <div className="group relative rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 p-3.5 overflow-hidden bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-white/10"><AlertCircle className="h-4 w-4 text-amber-600 dark:text-slate-300" /></div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Outstanding</p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">৳{Number(stats.dueAmount).toLocaleString()}</p>
          </div>
        </div>
      )}

      {view === "payments" && (
        <>
          {/* ─── Tabs ─────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {STATUS_TABS.map((t) => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${tab === t ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-400"}`}>
                {t}
                {stats?.tabCounts && <span className={`ml-1.5 text-xs ${tab === t ? "opacity-70" : "text-gray-400"}`}>{t === "all" ? stats.tabCounts.all : (stats.tabCounts as any)[t] ?? 0}</span>}
              </button>
            ))}
          </div>

          {/* ─── Search & Toolbar ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by student, invoice, transaction ID, course..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 bg-white dark:bg-slate-900 dark:text-white" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative" ref={filterRef}>
                <button onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 dark:text-white">
                  <Filter size={13} /> Filters
                  {(methodFilter || courseFilter !== "" || dateFrom || dateTo) && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </button>
                {showFilters && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-4 z-50 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                      <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white">
                        <option value="">All Methods</option>
                        <option value="bKash">bKash</option><option value="Nagad">Nagad</option><option value="Rocket">Rocket</option><option value="paystation">PayStation</option><option value="card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
                      <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value ? +e.target.value : ""); setPage(1); }}
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white">
                        <option value="">All Courses</option>
                        {courseList.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Date Range
                        <button type="button" onClick={() => setDateShortcuts(!dateShortcuts)} className="ml-2 text-blue-600 hover:underline">Shortcuts</button>
                      </label>
                      {dateShortcuts && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {["today", "yesterday", "week", "month", "last_month"].map((s) => (
                            <button key={s} type="button" onClick={() => applyDateShortcut(s)}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-800 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 capitalize">{s.replace("_", " ")}</button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800 dark:text-white" />
                        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800 dark:text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setMethodFilter(""); setCourseFilter(""); setDateFrom(""); setDateTo(""); setPage(1); setShowFilters(false); }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Clear</button>
                      <button type="button" onClick={() => setShowFilters(false)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">Apply</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={colPickerRef}>
                <button onClick={() => setShowColPicker(!showColPicker)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 dark:text-white">
                  <Columns3 size={13} /> Columns
                </button>
                {showColPicker && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3 z-50">
                    {ALL_COLUMNS.map((c) => (
                      <label key={c.key} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer dark:text-white">
                        <input type="checkbox" checked={visibleCols[c.key]} onChange={(e) => setVisibleCols((p) => ({ ...p, [c.key]: e.target.checked }))} className="rounded border-gray-300" />
                        {c.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 dark:text-white">
                <Download size={13} /> Export
              </button>
              <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 dark:text-white">
                <Printer size={13} /> Print
              </button>
            </div>
          </div>

          {/* ─── Error State ──────────────────────────────────────────────── */}
          {fetchError && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400 flex-1">{fetchError}</p>
              <button onClick={fetchPayments} className="text-xs text-red-600 hover:underline font-medium">Retry</button>
            </div>
          )}

          {/* ─── Table ───────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    {visibleCols.invoice && <Th label="Invoice #" field="invoice" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />}
                    {visibleCols.student && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>}
                    {visibleCols.course && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Course(s)</th>}
                    {visibleCols.amount && <Th label="Amount" field="amount" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />}
                    {visibleCols.method && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Method</th>}
                    {visibleCols.status && <Th label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />}
                    {visibleCols.date && <Th label="Date" field="createdAt" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />}
                    {visibleCols.action && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {loading && !paymentsData ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={8} className="px-4 py-4">
                        <div className="flex items-center gap-3 animate-pulse">
                          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24" />
                          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-32" />
                          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded flex-1" />
                        </div>
                      </td></tr>
                    ))
                  ) : paymentsData?.data.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Receipt size={40} strokeWidth={1} />
                        <p className="font-medium text-gray-500">No payments found</p>
                        <p className="text-xs">{search ? "Try a different search term" : "Payments will appear here once orders are processed"}</p>
                      </div>
                    </td></tr>
                  ) : (
                    paymentsData?.data.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        {visibleCols.invoice && (
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-xs">
                            {p.invoiceNumber ?? `INV-${String(p.id).padStart(6, "0")}`}
                          </td>
                        )}
                        {visibleCols.student && (
                          <td className="px-4 py-3">
                            <button onClick={() => openStudent(p.userId)} className="text-left hover:underline">
                              <div className="font-medium text-gray-900 dark:text-white text-xs">{p.userFirstName} {p.userLastName}</div>
                              <div className="text-[11px] text-gray-400">{p.userEmail}</div>
                            </button>
                          </td>
                        )}
                        {visibleCols.course && (
                          <td className="px-4 py-3 text-gray-600 dark:text-slate-400 max-w-[200px] truncate text-xs" title={p.courseTitles ?? ""}>{p.courseTitles ?? "-"}</td>
                        )}
                        {visibleCols.amount && (
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white text-xs">৳{Number(p.amount).toLocaleString()}</td>
                        )}
                        {visibleCols.method && (
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${METHOD_COLORS[p.method] ?? "bg-gray-50 text-gray-700 border border-gray-200"}`}>{p.method}</span>
                          </td>
                        )}
                        {visibleCols.status && (
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full ${STATUS_COLORS[p.status] ?? "bg-gray-50 text-gray-700 border border-gray-200"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[p.status] ?? "bg-gray-400"}`} />
                              {p.status}
                            </span>
                          </td>
                        )}
                        {visibleCols.date && (
                          <td className="px-4 py-3 text-gray-500 dark:text-slate-400 whitespace-nowrap text-xs">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-BD") : p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-BD") : "-"}
                          </td>
                        )}
                        {visibleCols.action && (
                          <td className="px-4 py-3 relative">
                            <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === p.id ? null : p.id); }}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"><MoreVertical size={15} className="text-gray-400" /></button>
                            {actionMenu === p.id && (
                              <div className="absolute right-4 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50">
                                <button onClick={() => { openDetail(p.id); setActionMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"><Eye size={14} /> View Details</button>
                                <button onClick={() => { openStudent(p.userId); setActionMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"><User size={14} /> Payment History</button>
                                {p.status === "completed" && (
                                  <>
                                    <button onClick={() => { setActionMenu(null); handlePrint(); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"><Receipt size={14} /> Print Receipt</button>
                                    <button onClick={() => { setRefundConfirm(p.id); setActionMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><RotateCcw size={14} /> Refund</button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── Pagination ───────────────────────────────────────────────── */}
            {paymentsData && totalItems > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <span>Show</span>
                  <select value={perPage} onChange={(e) => { setPerPage(+e.target.value); setPage(1); }}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-800 dark:text-white">
                    {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span>of {totalItems} payments</span>
                </div>
                <div className="flex items-center gap-1">
                  <button disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
                  {getPageNumbers().map((n, i) =>
                    n === "..." ? <span key={`e${i}`} className="px-1 text-gray-400">...</span> :
                    <button key={n} onClick={() => setPage(n)}
                      className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${currentPage === n ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400"}`}>{n}</button>
                  )}
                  <button disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Reports View ────────────────────────────────────────────────── */}
      {view === "reports" && <ReportsView />}

      {/* ─── Analytics View ──────────────────────────────────────────────── */}
      {view === "analytics" && <AnalyticsView />}

      {/* ─── Payment Details Drawer ──────────────────────────────────────── */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setDetailId(null); setDetail(null); }} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
            {detailLoading ? (
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-48" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32" />
                <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded" />
              </div>
            ) : detail ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Details</h2>
                  <button onClick={() => { setDetailId(null); setDetail(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"><X size={18} /></button>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                  <Row label="Invoice" value={detail.invoiceNumber ?? `INV-${String(detail.id).padStart(6, "0")}`} />
                  <Row label="Student" value={`${detail.userFirstName} ${detail.userLastName}`} />
                  <Row label="Email" value={detail.userEmail ?? "-"} />
                  <Row label="Phone" value={detail.userPhone ?? "-"} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-slate-300">Courses</h3>
                  {detail.items.map((item) => (
                    <div key={item.courseId} className="flex justify-between text-sm bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2">
                      <span className="text-gray-800 dark:text-white">{item.courseTitle}</span>
                      <span className="font-medium">৳{Number(item.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
                  <Row label="Total Fee" value={`৳${Number(detail.totalAmount).toLocaleString()}`} />
                  <Row label="Discount" value={`-৳${Number(detail.discountAmount).toLocaleString()}`} />
                  <Row label="Final Amount" value={`৳${Number(detail.finalAmount).toLocaleString()}`} bold />
                  <div className="border-t border-gray-200 dark:border-slate-700 pt-2" />
                  <Row label="Paid" value={`৳${Number(detail.totalPaid).toLocaleString()}`} valueClass="text-emerald-600" bold />
                  <Row label="Due" value={`৳${Number(detail.dueAmount).toLocaleString()}`} valueClass={Number(detail.dueAmount) > 0 ? "text-red-600" : "text-emerald-600"} bold />
                  <Row label="Status" value={detail.paymentStatus} badge />
                </div>
                {detail.allPayments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-slate-300">Transaction History</h3>
                    {detail.allPayments.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[t.status] ?? ""}`}>{t.status}</span>
                          <span className="text-gray-600 dark:text-slate-400">{t.method}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">৳{Number(t.amount).toLocaleString()}</div>
                          <div className="text-[11px] text-gray-400">{t.paidAt ? new Date(t.paidAt).toLocaleDateString("en-BD") : "-"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-1 text-sm">
                  <Row label="Method" value={detail.paystationMethod ?? detail.method} />
                  {detail.paystationTrxId && <Row label="Gateway TRX ID" value={detail.paystationTrxId} />}
                  {detail.bkashTrxId && <Row label="bKash TRX ID" value={detail.bkashTrxId} />}
                  {detail.payerPhone && <Row label="Payer Phone" value={detail.payerPhone} />}
                  <Row label="Paid At" value={detail.paidAt ? new Date(detail.paidAt).toLocaleString("en-BD") : "-"} />
                </div>
                {detail.status === "completed" && (
                  <div className="flex gap-2">
                    <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-700"><Printer size={14} /> Print Receipt</button>
                    <button onClick={() => setRefundConfirm(detail.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-500/20"><RotateCcw size={14} /> Refund</button>
                  </div>
                )}
              </div>
            ) : <div className="p-6 text-center text-gray-400">Payment not found</div>}
          </div>
        </div>
      )}

      {/* ─── Student History Drawer ──────────────────────────────────────── */}
      {studentId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setStudentId(null); setStudentHistory(null); }} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
            {studentLoading ? (
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-48" />
                <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded" />
              </div>
            ) : studentHistory ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment History</h2>
                  <button onClick={() => { setStudentId(null); setStudentHistory(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"><X size={18} /></button>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                  <div className="font-semibold text-gray-900 dark:text-white">{studentHistory.student.firstName} {studentHistory.student.lastName}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">{studentHistory.student.email} &middot; {studentHistory.student.phone}</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-800">
                    <div className="text-[11px] text-blue-600 font-medium">Total Fees</div>
                    <div className="font-bold text-blue-800 dark:text-blue-300">৳{Number(studentHistory.summary.totalFees).toLocaleString()}</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-800">
                    <div className="text-[11px] text-emerald-600 font-medium">Total Paid</div>
                    <div className="font-bold text-emerald-800 dark:text-emerald-300">৳{Number(studentHistory.summary.totalPaid).toLocaleString()}</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 text-center border border-red-100 dark:border-red-800">
                    <div className="text-[11px] text-red-600 font-medium">Total Due</div>
                    <div className="font-bold text-red-800 dark:text-red-300">৳{Number(studentHistory.summary.totalDue).toLocaleString()}</div>
                  </div>
                </div>
                {studentHistory.orderPayments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-slate-300">Recorded Course Payments</h3>
                    {studentHistory.orderPayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[p.status] ?? ""}`}>{p.status}</span>
                          <span className="text-gray-600 dark:text-slate-400">{p.method}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">৳{Number(p.amount).toLocaleString()}</div>
                          <div className="text-[11px] text-gray-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-BD") : "-"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {studentHistory.liveEnrollments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-slate-300">Live Course Payments</h3>
                    {studentHistory.liveEnrollments.map((e) => (
                      <div key={e.id} className="flex items-center justify-between border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[e.status] ?? ""}`}>{e.status}</span>
                          <span className="text-gray-600 dark:text-slate-400">{e.courseTitle}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">৳{Number(e.amount).toLocaleString()}</div>
                          <div className="text-[11px] text-gray-400">{e.paidAt ? new Date(e.paidAt).toLocaleDateString("en-BD") : "-"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <div className="p-6 text-center text-gray-400">Student not found</div>}
          </div>
        </div>
      )}

      {/* ─── Refund Confirm Modal ──────────────────────────────────────── */}
      {refundConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setRefundConfirm(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Confirm Refund</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Are you sure you want to refund this payment? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setRefundConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={() => handleRefund(refundConfirm)} disabled={refundLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">{refundLoading ? "Processing..." : "Refund"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Th({ label, field, sortField, sortDir, onSort }: { label: string; field: string; sortField: string; sortDir: string; onSort: (f: string) => void }) {
  const active = sortField === field;
  return (
    <th className="px-4 py-3 text-left">
      <button onClick={() => onSort(field)} className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-white">
        {label} <ArrowUpDown size={11} className={active ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-slate-600"} />
      </button>
    </th>
  );
}

function Row({ label, value, bold, valueClass, badge }: { label: string; value: string; bold?: boolean; valueClass?: string; badge?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-slate-400">{label}</span>
      {badge ? (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[value] ?? "bg-gray-100 text-gray-700"}`}>{value}</span>
      ) : (
        <span className={`${bold ? "font-bold" : "font-medium"} ${valueClass ?? "text-gray-900 dark:text-white"}`}>{value}</span>
      )}
    </div>
  );
}

// ─── Reports View ─────────────────────────────────────────────────────────────

function ReportsView() {
  const [reportType, setReportType] = useState<"daily" | "monthly" | "courses">("daily");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [courseData, setCourseData] = useState<any[]>([]);
  const [loading, startTransition] = useTransition();

  const fetchReport = useCallback(() => {
    startTransition(async () => {
      try {
        if (reportType === "daily") { const res = await api.dailyReport(reportDate); setDailyData(res.data); }
        else if (reportType === "monthly") { const res = await api.monthlyReport(reportYear, reportMonth); setMonthlyData(res.data); }
        else { const res = await api.courseReport(); setCourseData(res.data); }
      } catch { /* ignore */ }
    });
  }, [reportType, reportDate, reportYear, reportMonth]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const printReport = () => window.print();

  const exportReportCSV = (rows: any[], filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers, ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`))].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const reportRows = reportType === "daily" ? (dailyData?.payments ?? []) : reportType === "monthly" ? (monthlyData?.payments ?? []) : courseData;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reports</h2>
        <div className="flex gap-2">
          <button onClick={printReport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 dark:text-white"><Printer size={14} /> Print</button>
          <button onClick={() => exportReportCSV(reportRows, `report-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 dark:text-white"><Download size={14} /> CSV</button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(["daily", "monthly", "courses"] as const).map((t) => (
          <button key={t} onClick={() => setReportType(t)}
            className={`px-4 py-2 text-sm rounded-lg capitalize ${reportType === t ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"}`}>{t}</button>
        ))}
      </div>
      <div className="flex gap-3 items-center">
        {reportType === "daily" && <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white" />}
        {reportType === "monthly" && (<>
          <select value={reportYear} onChange={(e) => setReportYear(+e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={reportMonth} onChange={(e) => setReportMonth(+e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString("en", { month: "long" })}</option>)}
          </select>
        </>)}
      </div>
      {(dailyData || monthlyData) && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 flex items-center gap-6 border border-emerald-100 dark:border-emerald-800">
          <div><div className="text-sm text-emerald-600">Total Collected</div><div className="text-xl font-bold text-emerald-800 dark:text-emerald-300">৳{Number(dailyData?.totalCollected ?? monthlyData?.totalCollected ?? 0).toLocaleString()}</div></div>
          <div><div className="text-sm text-emerald-600">Transactions</div><div className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{dailyData?.totalCount ?? monthlyData?.totalCount ?? 0}</div></div>
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{reportType === "courses" ? "Revenue" : "Amount"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{reportType === "courses" ? "Payments" : "Status"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              : reportRows.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No data</td></tr>
              : reportType === "courses" ? courseData.map((r: any) => (
                <tr key={r.courseId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-xs">{r.courseId}</td>
                  <td className="px-4 py-3 text-xs">{r.courseTitle}</td>
                  <td className="px-4 py-3 font-semibold text-xs">৳{Number(r.totalRevenue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">{r.completedPayments}/{r.totalPayments}</td>
                  <td className="px-4 py-3 text-xs">-</td>
                </tr>
              )) : reportRows.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-xs">{r.invoiceNumber ?? `INV-${String(r.id).padStart(6, "0")}`}</td>
                  <td className="px-4 py-3 text-xs">{r.userFirstName} {r.userLastName}</td>
                  <td className="px-4 py-3 font-semibold text-xs">৳{Number(r.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[11px] rounded-full ${STATUS_COLORS[r.status] ?? ""}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-xs">{r.method}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────

function AnalyticsView() {
  const [period, setPeriod] = useState("30d");
  const [chartData, setChartData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const [chartRes, statsRes] = await Promise.all([api.revenueChart(period), api.stats()]);
        setChartData(chartRes.data); setStatsData(statsRes.data);
      } catch { /* ignore */ }
    });
  }, [period]);

  const maxRevenue = Math.max(...chartData.map((d) => Number(d.revenue)), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Analytics</h2>
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
          {(["7d", "30d", "6m", "1y"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-700"}`}>
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "6m" ? "6 Months" : "1 Year"}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-slate-300 mb-4">Revenue Trend</h3>
        {loading ? <div className="h-48 flex items-center justify-center text-gray-400">Loading...</div>
          : chartData.length === 0 ? <div className="h-48 flex items-center justify-center text-gray-400">No data</div>
          : (
            <div className="flex items-end gap-1 h-48">
              {chartData.slice(-30).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-gray-500">৳{Number(d.revenue).toLocaleString()}</div>
                  <div className="w-full bg-blue-500/80 rounded-t-sm transition-all hover:bg-blue-600" style={{ height: `${(Number(d.revenue) / maxRevenue) * 140}px`, minHeight: "2px" }} />
                  <div className="text-[9px] text-gray-400 truncate w-full text-center" title={d.date}>{d.date.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {statsData?.methodBreakdown && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-slate-300 mb-4">Payment Methods</h3>
            <div className="space-y-3">
              {statsData.methodBreakdown.map((m: any) => (
                <div key={m.method} className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-[11px] rounded-full min-w-[60px] text-center ${METHOD_COLORS[m.method] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}>{m.method}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-2.5"><div className="bg-blue-500/80 h-2.5 rounded-full" style={{ width: `${(Number(m.total) / Number(statsData.totalRevenue || 1)) * 100}%` }} /></div>
                  <span className="text-sm font-medium dark:text-white">৳{Number(m.total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {statsData?.topCourses && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-slate-300 mb-4">Top Courses by Revenue</h3>
            <div className="space-y-3">
              {statsData.topCourses.slice(0, 5).map((c: any) => (
                <div key={c.courseId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/80 to-purple-600/80 flex items-center justify-center text-white text-xs font-bold">{c.title.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.title}</div>
                    <div className="text-[11px] text-gray-400">{c.count} payments</div>
                  </div>
                  <span className="text-sm font-semibold dark:text-white">৳{Number(c.revenue).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
