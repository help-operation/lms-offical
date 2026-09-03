"use client";

import { useMemo, useState } from "react";
import { Users, Clock, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import type { Student } from "@/features/students/types";
import type { SmsTemplate } from "@/features/sms-templates/types";
import type { EmailTemplate } from "@/features/email-templates/types";
import { type EnrollmentSummaryRow } from "./actions";
import { enrichStudent } from "./enrichment";
import { EMPTY_FILTERS, type EnrichedStudent, type Filters } from "./types";

import { StudentSummaryCards } from "./StudentSummaryCards";
import { StudentFilterBar } from "./StudentFilterBar";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { StudentTable } from "./StudentTable";
import { StudentDetailsDrawer } from "./StudentDetailsDrawer";
import { BulkActionBar } from "./BulkActionBar";
import { SendMessageModal } from "./SendMessageModal";
import { MessageHistoryTab } from "./MessageHistoryTab";
import { ScheduledMessagesTab } from "./ScheduledMessagesTab";
import { SendMessagePage } from "./SendMessagePage";

type ActiveTab = "students" | "history" | "scheduled" | "send";

export function StudentFiltersClient({
  initial,
  loadError,
  smsTemplates,
  emailTemplates,
  enrollmentByUserId,
}: {
  initial: Student[];
  loadError: string | null;
  smsTemplates: SmsTemplate[];
  emailTemplates: EmailTemplate[];
  enrollmentByUserId: Record<number, EnrollmentSummaryRow>;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeInput, setPageSizeInput] = useState("10");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<ActiveTab>("students");

  // Modal/drawer state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendModalChannel, setSendModalChannel] = useState<"sms" | "email" | "both">("both");
  const [drawerStudent, setDrawerStudent] = useState<EnrichedStudent | null>(null);

  const enriched = useMemo(
    () => initial.map((s) => enrichStudent(s, enrollmentByUserId[s.id])),
    [initial, enrollmentByUserId],
  );
  const filtered = useMemo(() => enriched.filter((s) => matches(s, filters)), [enriched, filters]);
  const allCourseNames = useMemo(
    () => Array.from(new Set(enriched.map((s) => s.courseName).filter((c) => c !== "No enrollment"))),
    [enriched],
  );
  const allBatchNames = useMemo(
    () => Array.from(new Set(enriched.map((s) => s.batchName).filter((b): b is string => !!b))),
    [enriched],
  );

  const allOnPageSelected = useMemo(() => {
    const showAll = pageSize === -1;
    const effectivePageSize = showAll ? Math.max(filtered.length, 1) : pageSize;
    const totalPages = showAll ? 1 : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
    const currentPage = Math.min(page, totalPages);
    const pageRows = showAll ? filtered : filtered.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);
    return pageRows.length > 0 && pageRows.every((s) => selected.has(s.id));
  }, [filtered, page, pageSize, selected]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function removeFilter(key: keyof Filters) {
    setFilters((f) => ({ ...f, [key]: EMPTY_FILTERS[key] }));
    setPage(1);
  }

  function handleFilterClick(key: string, value: string) {
    if (!key) { resetFilters(); return; }
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPageSizeInput(size === -1 ? "" : String(size));
    setPage(1);
  }

  function applyCustomPageSize() {
    const n = Math.floor(Number(pageSizeInput));
    if (!Number.isFinite(n) || n < 1) {
      setPageSizeInput(String(pageSize === -1 ? filtered.length || 1 : pageSize));
      return;
    }
    setPageSize(n);
    setPage(1);
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    const showAll = pageSize === -1;
    const effectivePageSize = showAll ? Math.max(filtered.length, 1) : pageSize;
    const totalPages = showAll ? 1 : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
    const currentPage = Math.min(page, totalPages);
    const pageRows = showAll ? filtered : filtered.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((s) => next.delete(s.id));
      else pageRows.forEach((s) => next.add(s.id));
      return next;
    });
  }

  function clearSelection() { setSelected(new Set()); }

  const selectedStudents = enriched.filter((s) => selected.has(s.id));

  function openSendModal(channel: "sms" | "email" | "both") {
    if (selected.size === 0) { toast.error("Select students first"); return; }
    setSendModalChannel(channel);
    setShowSendModal(true);
  }

  function openDrawerSendMessage(student: EnrichedStudent) {
    setSelected(new Set([student.id]));
    setSendModalChannel("both");
    setShowSendModal(true);
    setDrawerStudent(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/15">
            <Users size={18} weight="fill" className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Find students, view activity, and take action.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 dark:border-slate-800 dark:bg-slate-900">
        {([
          ["students", "Students", Users],
          ["send", "Send Message", PaperPlaneTilt],
          ["history", "Message History", Clock],
          ["scheduled", "Scheduled", Clock],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <Icon size={16} weight="fill" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "students" && (
        <>
          {loadError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-400">
              <WarningCircle size={16} weight="fill" /> Could not load students: {loadError}
            </div>
          )}

          {/* KPI cards */}
          <StudentSummaryCards students={enriched} onFilterClick={handleFilterClick} />

          {/* Filter bar */}
          <StudentFilterBar
            filters={filters}
            onFilter={updateFilter}
            onReset={resetFilters}
            allCourseNames={allCourseNames}
            allBatchNames={allBatchNames}
          />

          {/* Active filter chips */}
          <ActiveFilterChips filters={filters} onRemove={removeFilter} onClearAll={resetFilters} />

          {/* Results summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span> student{filtered.length !== 1 ? "s" : ""} found
              {selected.size > 0 && <span className="ml-2 text-brand-600 dark:text-brand-400">· {selected.size} selected</span>}
            </p>
          </div>

          {/* Table */}
          <StudentTable
            students={filtered}
            page={page}
            pageSize={pageSize}
            pageSizeInput={pageSizeInput}
            selected={selected}
            allOnPageSelected={allOnPageSelected}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
            onPageSizeInputChange={setPageSizeInput}
            onApplyCustomPageSize={applyCustomPageSize}
            onToggleOne={toggleOne}
            onToggleAllOnPage={toggleAllOnPage}
            onSelectRow={setDrawerStudent}
          />

          {/* Bulk action bar */}
          <BulkActionBar
            count={selected.size}
            onSendSms={() => openSendModal("sms")}
            onSendEmail={() => openSendModal("email")}
            onClear={clearSelection}
          />
        </>
      )}

      {activeTab === "history" && <MessageHistoryTab />}
      {activeTab === "scheduled" && <ScheduledMessagesTab />}
      {activeTab === "send" && (
        <SendMessagePage
          selectedStudents={selectedStudents}
          smsTemplates={smsTemplates}
          emailTemplates={emailTemplates}
          onRemoveStudent={(id) => setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; })}
        />
      )}

      {/* Student details drawer */}
      {drawerStudent && (
        <StudentDetailsDrawer
          student={drawerStudent}
          onClose={() => setDrawerStudent(null)}
          onSendMessage={openDrawerSendMessage}
        />
      )}

      {/* Send message modal */}
      {showSendModal && (
        <SendMessageModal
          students={selectedStudents}
          templates={smsTemplates}
          emailTemplates={emailTemplates}
          initialChannel={sendModalChannel}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </div>
  );
}

// ─── Filter matching (same logic as before) ──────────────────────────────────

function matches(s: EnrichedStudent, f: Filters) {
  if (f.search) {
    const q = f.search.toLowerCase();
    const haystack = `${s.firstName} ${s.lastName} ${s.phone ?? ""} ${s.email ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.courseName && s.courseName !== f.courseName) return false;
  if (f.batchName && s.batchName !== f.batchName) return false;
  if (f.courseType && s.courseType !== f.courseType) return false;
  if (f.paymentStatus && s.paymentStatus !== f.paymentStatus) return false;
  if (f.activeStatus && s.activeStatus !== f.activeStatus) return false;
  if (f.enrollmentStatus && s.enrollmentStatus !== f.enrollmentStatus) return false;
  const registeredAt = s.createdAt ?? "";
  if (f.registeredFrom && registeredAt < f.registeredFrom) return false;
  if (f.registeredTo && registeredAt > f.registeredTo) return false;
  if (f.lastLoginFrom === "__never__") {
    if (s.lastLoginAt) return false;
  } else {
    if (f.lastLoginFrom && (!s.lastLoginAt || s.lastLoginAt < f.lastLoginFrom)) return false;
  }
  if (f.lastLoginTo && (!s.lastLoginAt || s.lastLoginAt > f.lastLoginTo)) return false;
  return true;
}
