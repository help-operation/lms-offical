"use client";

import { useState } from "react";
import Link from "next/link";
import {
  fetchUsersAction,
  fetchAllUsersForExportAction,
} from "@/features/admin/actions/admin.actions";
import type { AdminUser, PaginatedResponse, TableQueryParams } from "@/features/admin/api";
import { Eye, UserPlus } from "lucide-react";
import { DataTable, type Column, type TablePagination } from "@repo/ui/data-table";
import { formatUserDate } from "./utils/export-users";
import { CreateUserModal } from "./CreateUserModal";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import type { ExportField } from "@/utils/table-export";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { initialData: PaginatedResponse<AdminUser> }

const avatarColors = [
  "bg-pink-400", "bg-violet-400", "bg-blue-400",
  "bg-amber-400", "bg-green-400", "bg-rose-400",
];

const ROLES = ["GUEST", "STUDENT", "INSTRUCTOR", "SUPER_ADMIN"];

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<AdminUser>[] = [
  {
    key: "id",
    header: "ID",
    defaultVisible: false,
    exportFields: [{ header: "ID", getValue: (u) => String(u.id), flex: 0.4 }],
  },
  {
    key: "name",
    header: "Name",
    defaultVisible: true,
    exportFields: [
      { header: "First Name", getValue: (u) => u.firstName ?? "", flex: 1.2 },
      { header: "Last Name",  getValue: (u) => u.lastName  ?? "", flex: 1.2 },
    ],
  },
  {
    key: "email",
    header: "Email",
    defaultVisible: true,
    exportFields: [{ header: "Email", getValue: (u) => u.email ?? "", flex: 2.0 }],
  },
  {
    key: "phone",
    header: "Phone",
    defaultVisible: false,
    exportFields: [{ header: "Phone", getValue: (u) => u.phone ?? "", flex: 1.2 }],
  },
  {
    key: "role",
    header: "Role",
    defaultVisible: true,
    exportFields: [{ header: "Role", getValue: (u) => u.role, flex: 0.8 }],
  },
  {
    key: "createdAt",
    header: "Join Date",
    defaultVisible: true,
    exportFields: [{ header: "Join Date", getValue: (u) => formatUserDate(u.createdAt), flex: 1.2 }],
  },
  {
    key: "status",
    header: "Status",
    defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (u) => u.status, flex: 0.8 }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.filter((c) => c.defaultVisible).map((c) => c.key));

// ─── Badges ───────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    SUPER_ADMIN: "bg-violet-100 text-violet-700 dark:bg-brand/15 dark:text-brand",
    INSTRUCTOR:  "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    STUDENT:     "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    GUEST:       "bg-gray-100 text-gray-500 dark:bg-slate-500/15 dark:text-slate-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${map[role] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    suspended: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
      {status}
    </span>
  );
}

/**
 * Route to the richer Student detail page when this row really is a student
 * (Student.id is the same users.id, confirmed by the students API). There is
 * no equivalent shortcut for INSTRUCTOR: Teachers live in the separate
 * admin_users table with an unrelated id sequence, so a users.id can't be
 * used to look up a teacher record — those fall through to the generic page.
 */
function viewHref(user: AdminUser): string {
  if (user.role === "STUDENT") return `/admin/students/${user.id}`;
  return `/admin/users/${user.id}`;
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function UsersClient({ initialData }: Props) {
  const { formatDate } = useLocalization();
  const [users, setUsers]             = useState(initialData.data);
  const [pagination, setPagination]   = useState<TablePagination>(initialData.pagination);
  const [isLoading, setIsLoading]     = useState(false);
  const [currentParams, setCurrentParams] = useState<TableQueryParams>({
    page: 1,
    per_page: initialData.pagination.per_page,
  });
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(DEFAULT_VISIBLE));
  const [showCreate, setShowCreate] = useState(false);

  // Derive export fields from visible columns (preserves ALL_COLS order)
  const exportFields: ExportField<AdminUser>[] = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<AdminUser[]> {
    const res = await fetchAllUsersForExportAction(currentParams);
    return res.success ? (res.data as AdminUser[]) : [];
  }

  async function fetchUsers(params: TableQueryParams) {
    setCurrentParams(params);
    setIsLoading(true);
    try {
      const res = await fetchUsersAction(params);
      if (res.success && res.data) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Build table columns dynamically based on visibleCols (preserves order)
  const columns: Column<AdminUser>[] = [
    ...ALL_COLS.filter((c) => visibleCols.has(c.key)).map((col, _, arr) => {
      const isFirst = arr[0]?.key === col.key;
      if (col.key === "id") return {
        key: "id" as keyof AdminUser,
        header: "ID",
        render: (u: AdminUser) => <span className="text-xs text-gray-500 dark:text-slate-400">#{u.id}</span>,
      };
      if (col.key === "name") return {
        key: "firstName" as keyof AdminUser,
        header: "Name",
        sortable: true,
        render: (user: AdminUser, i: number) => (
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
              {user.firstName?.[0] ?? "U"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">#{user.id}</p>
            </div>
          </div>
        ),
      };
      if (col.key === "email") return {
        key: "email" as keyof AdminUser,
        header: "Email",
        sortable: true,
        render: (u: AdminUser) => <span className="text-xs text-gray-500 dark:text-slate-400">{u.email ?? "—"}</span>,
      };
      if (col.key === "phone") return {
        key: "phone" as keyof AdminUser,
        header: "Phone",
        render: (u: AdminUser) => <span className="text-xs text-gray-500 dark:text-slate-400">{u.phone ?? "—"}</span>,
      };
      if (col.key === "role") return {
        key: "role" as keyof AdminUser,
        header: "Role",
        render: (u: AdminUser) => <RoleBadge role={u.role} />,
      };
      if (col.key === "createdAt") return {
        key: "createdAt" as keyof AdminUser,
        header: "Join Date",
        sortable: true,
        render: (u: AdminUser) => (
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {u.createdAt ? formatDate(u.createdAt) : "—"}
          </span>
        ),
      };
      if (col.key === "status") return {
        key: "status" as keyof AdminUser,
        header: "Status",
        render: (u: AdminUser) => <StatusBadge status={u.status} />,
      };
      return { key: col.key as keyof AdminUser, header: col.header };
    }),
    // Action column always last, never exported
    {
      key: "actions",
      header: "Actions",
      render: (user: AdminUser) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={viewHref(user)}
            title="View"
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Let&apos;s check your update today</p>
        </div>
        <div className="flex items-center gap-2.5">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={users}
            fields={exportFields}
            fetchAll={fetchAllForExport}
            filename={`users-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Users Export"
          />
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand dark:hover:bg-brand/90 text-white text-sm font-medium transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={(user) => {
            setUsers((prev) => [user, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Users</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={users}
            columns={columns}
            serverSide
            pagination={pagination}
            onQueryChange={fetchUsers}
            dateRangeKey="createdAt"
            portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
            isLoading={isLoading}
            searchable
            searchPlaceholder="Search by name, email…"
            filters={[
              {
                key: "role",
                label: "All Roles",
                options: ROLES.map((r) => ({ label: r, value: r })),
              },
              {
                key: "status",
                label: "All Status",
                options: [
                  { label: "Active",    value: "active"    },
                  { label: "Suspended", value: "suspended" },
                  { label: "Pending",   value: "pending"   },
                ],
              },
            ]}
            emptyMessage="No users found."
          />
        </div>
      </div>
    </div>
  );
}
