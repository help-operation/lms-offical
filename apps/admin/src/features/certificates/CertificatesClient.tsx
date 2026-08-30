"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import {
  Medal, MagnifyingGlass, SpinnerGap, Certificate,
  User, BookBookmark, CalendarBlank, ArrowSquareOut, Copy, CheckCircle, Plus, X,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { DataTable, type Column } from "@repo/ui/data-table";
import type { CertificatesResponse } from "./types";
import {
  getCertificatesAction,
  issueCertificateManuallyAction,
  searchUsersAction,
  searchCoursesAction,
} from "./actions";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CertRow = CertificatesResponse["data"][number];

// ─── Async picker ─────────────────────────────────────────────────────────────

interface Option { id: number; label: string; sublabel?: string | null; avatar?: string | null }

function AsyncSearchSelect({ label, placeholder, selected, onSelect, fetcher }: {
  label: string; placeholder: string; selected: Option | null;
  onSelect: (o: Option | null) => void;
  fetcher: (query: string) => Promise<Option[]>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const data = await fetcher(query);
      if (active) { setResults(data); setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [query, open, fetcher]);

  return (
    <div ref={boxRef} className="relative">
      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-200 dark:border-brand/30 bg-brand-50 dark:bg-brand/10 px-3.5 py-2.5">
          <span className="min-w-0 truncate text-sm font-medium text-brand-900 dark:text-brand">
            {selected.label}
            {selected.sublabel && <span className="ml-1.5 text-xs font-normal text-brand-500 dark:text-brand/70">{selected.sublabel}</span>}
          </span>
          <button type="button" onClick={() => { onSelect(null); setQuery(""); setOpen(true); }}
            className="flex-shrink-0 rounded-lg p-1 text-brand-400 dark:text-brand/70 hover:bg-brand-100 dark:hover:bg-brand/20 hover:text-brand-700 dark:hover:text-brand">
            <X size={14} weight="bold" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white pl-9 pr-3 py-2.5 text-sm focus:border-brand-400 dark:focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand/20 transition"
          />
        </div>
      )}
      {open && !selected && (
        <div className="absolute z-10 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-400 dark:text-slate-500">
              <SpinnerGap size={14} className="animate-spin" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="py-4 text-center text-xs text-gray-400 dark:text-slate-500">No matches found.</div>
          ) : results.map((o) => (
            <button key={o.id} type="button" onClick={() => { onSelect(o); setOpen(false); setQuery(""); }}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-slate-800">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-800 dark:text-slate-200">{o.label}</span>
                {o.sublabel && <span className="block truncate text-xs text-gray-400 dark:text-slate-500">{o.sublabel}</span>}
              </span>
              <span className="text-[10px] font-mono text-gray-300 dark:text-slate-600">#{o.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Issue Modal ──────────────────────────────────────────────────────────────

function IssueModal({ onClose, onIssued }: { onClose: () => void; onIssued: () => void }) {
  const [user,   setUser]   = useState<Option | null>(null);
  const [course, setCourse] = useState<Option | null>(null);
  const [isPending, start]  = useTransition();

  const userFetcher = useCallback(async (query: string): Promise<Option[]> => {
    const res = await searchUsersAction(query);
    return res.data.map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName}`.trim() || `User #${u.id}`, sublabel: u.email, avatar: u.avatar }));
  }, []);

  const courseFetcher = useCallback(async (query: string): Promise<Option[]> => {
    const res = await searchCoursesAction(query);
    return res.data.map((c) => ({ id: c.id, label: c.title }));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !course) { toast.error("Select a student and a course"); return; }
    start(async () => {
      const res = await issueCertificateManuallyAction(user.id, course.id);
      if (res.success) { toast.success(`Certificate issued — code: ${res.data.certificateCode}`); onIssued(); onClose(); }
      else toast.error(res.message ?? "Failed");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-none p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Issue Certificate Manually</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">Bypasses completion check — admin override.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AsyncSearchSelect label="Student" placeholder="Search by name or email…" selected={user} onSelect={setUser} fetcher={userFetcher} />
          <AsyncSearchSelect label="Course" placeholder="Search by course title…" selected={course} onSelect={setCourse} fetcher={courseFetcher} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={isPending || !user || !course}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand/90 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition">
              {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <Certificate size={15} weight="fill" />}
              Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Copy Code ────────────────────────────────────────────────────────────────

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <button onClick={handleCopy} title="Copy code"
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-mono text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
      <span>{code}</span>
      {copied ? <CheckCircle size={12} className="text-green-500 dark:text-green-400" /> : <Copy size={12} className="text-gray-400 dark:text-slate-500" />}
    </button>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "https://skillkoro.com";

const ALL_COLS: ColDef<CertRow>[] = [
  {
    key: "student", header: "Student", defaultVisible: true,
    exportFields: [
      { header: "First Name", getValue: (c) => c.userFirstName },
      { header: "Last Name",  getValue: (c) => c.userLastName  },
      { header: "Email",      getValue: (c) => c.userEmail ?? "" },
    ],
  },
  {
    key: "course", header: "Course", defaultVisible: true,
    exportFields: [{ header: "Course", getValue: (c) => c.courseTitle }],
  },
  {
    key: "code", header: "Certificate Code", defaultVisible: true,
    exportFields: [{ header: "Certificate Code", getValue: (c) => c.certificateCode }],
  },
  {
    key: "issuedAt", header: "Issued", defaultVisible: true,
    exportFields: [{ header: "Issued Date", getValue: (c) => formatDate(c.issuedAt) }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Main Client ──────────────────────────────────────────────────────────────

export function CertificatesClient({ initial }: { initial: CertificatesResponse }) {
  const [data,      setData]      = useState(initial);
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [showIssue, setShowIssue] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);

  const { data: certs, pagination, stats } = data;

  const load = useCallback(async (s: string, p: number, dateFrom?: string, dateTo?: string) => {
    startTransition(async () => {
      const res = await getCertificatesAction({ search: s, page: p, perPage: 15, date_from: dateFrom, date_to: dateTo });
      if (res.success) { setData(res.data); setPage(p); }
    });
  }, []);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSearch(v);
    load(v, 1);
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<CertRow[]> {
    const res = await getCertificatesAction({ search, page: 1, perPage: 100000 });
    return res.success ? res.data.data : [];
  }

  const visibleColumns: Column<CertRow>[] = [
    ...(visibleCols.has("student") ? [{
      key: "student" as const, header: "Student",
      render: (cert: CertRow) => {
        const initials = `${cert.userFirstName[0] ?? ""}${cert.userLastName[0] ?? ""}`.toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            {cert.userAvatar ? (
              <img src={cert.userAvatar} alt={cert.userFirstName} className="h-8 w-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand/15 shrink-0">
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand">{initials}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{cert.userFirstName} {cert.userLastName}</p>
              {cert.userEmail && <p className="text-xs text-gray-400 dark:text-slate-500">{cert.userEmail}</p>}
            </div>
          </div>
        );
      },
    }] : []),
    ...(visibleCols.has("course") ? [{
      key: "course" as const, header: "Course",
      render: (cert: CertRow) => (
        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 max-w-[200px] truncate">{cert.courseTitle}</p>
      ),
    }] : []),
    ...(visibleCols.has("code") ? [{
      key: "code" as const, header: "Certificate Code",
      render: (cert: CertRow) => <CopyCode code={cert.certificateCode} />,
    }] : []),
    ...(visibleCols.has("issuedAt") ? [{
      key: "issuedAt" as const, header: "Issued",
      render: (cert: CertRow) => (
        <span className="text-sm text-gray-600 dark:text-slate-300">{formatDate(cert.issuedAt)}</span>
      ),
    }] : []),
    {
      key: "actions", header: "Actions",
      render: (cert: CertRow) => (
        <a href={`${WEB_URL}/certificate/${cert.certificateCode}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
          <ArrowSquareOut size={12} weight="bold" /> Verify
        </a>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Certificates</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Issued course completion certificates</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={certs}
            fields={exportFields}
            fetchAll={fetchAllForExport}
            filename={`certificates-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Certificates Export"
          />
          <button onClick={() => setShowIssue(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand/90 text-white text-sm font-semibold px-4 py-2.5 transition">
            <Plus size={15} weight="bold" /> Issue Manually
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Total Issued", value: stats.total,    icon: Certificate,   color: "bg-brand-500" },
          { label: "This Month",   value: stats.thisMonth, icon: CalendarBlank, color: "bg-emerald-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} shrink-0`}>
              <Icon size={22} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Issued Certificates</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={certs}
            columns={visibleColumns}
            serverSide
            dateRangeKey="issuedAt"
            portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
            pagination={{
              total: pagination.total,
              per_page: 15,
              current_page: page,
              last_page: pagination.totalPages,
              from: (page - 1) * 15 + 1,
              to: Math.min(page * 15, pagination.total),
            }}
            isLoading={isPending}
            searchable
            searchPlaceholder="Search by student, course, or certificate code…"
            onQueryChange={(params) => {
              if (params.search !== undefined) setSearch(params.search as string);
              load(
                (params.search as string | undefined) ?? search,
                params.page,
                params.date_from as string | undefined,
                params.date_to   as string | undefined,
              );
            }}
            emptyMessage="No certificates issued yet."
            pageSize={10}
            pageSizeOptions={[10, 20, 50, 100]}
            showPageSizeSelector={false}
          />
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-brand-50 dark:bg-brand/10 border border-brand-100 dark:border-brand/20 px-5 py-4">
        <Certificate size={18} weight="fill" className="text-brand-600 dark:text-brand shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-800 dark:text-brand">Public verification enabled</p>
          <p className="text-xs text-brand-700 dark:text-brand/80 mt-0.5 leading-relaxed">
            Each certificate has a unique code. Anyone can verify at <code className="bg-brand-100 dark:bg-brand/15 px-1 rounded">/certificate/[code]</code> on the web.
          </p>
        </div>
      </div>

      {showIssue && <IssueModal onClose={() => setShowIssue(false)} onIssued={() => load(search, page)} />}
    </div>
  );
}
