"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  UserPlus,
  ShieldCheck,
  ShieldStar,
  X,
  Trash,
  ArrowLeft,
  ArrowRight,
  FunnelSimple,
  Eye,
  EyeSlash,
  Users,
  PencilSimple,
  Plus,
  GraduationCap,
  ListChecks,
} from "@phosphor-icons/react";
import type {
  AdminUser,
  AdminUsersResponse,
  Role,
} from "./types";
import { ROLE_META } from "./types";
import {
  getAdminUsersAction,
  createAdminUserAction,
  updateAdminRoleAction,
  updateAdminUserAction,
  resetAdminPasswordAction,
  toggleAdminStatusAction,
  deleteAdminUserAction,
} from "./actions";
import { hasAnyPermission } from "@/features/auth/permissions";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

/** First non-super role, used as the default selection when adding an admin. */
function defaultRoleId(roles: Role[]): number {
  const preferred = roles.find((r) => r.slug !== "super-admin") ?? roles[0];
  return preferred?.id ?? 0;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(u: AdminUser) {
  return `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase();
}

const ROLE_CARD_COLORS: Record<string, { border: string; bg: string; iconBg: string; iconText: string }> = {
  "super-admin": {
    border: "border-purple-200 dark:border-purple-500/20",
    bg: "bg-purple-50/50 dark:bg-purple-500/5",
    iconBg: "bg-purple-100 dark:bg-purple-500/15",
    iconText: "text-purple-600 dark:text-purple-400",
  },
  instructor: {
    border: "border-blue-200 dark:border-blue-500/20",
    bg: "bg-blue-50/50 dark:bg-blue-500/5",
    iconBg: "bg-blue-100 dark:bg-blue-500/15",
    iconText: "text-blue-600 dark:text-blue-400",
  },
  default: {
    border: "border-gray-200 dark:border-slate-700",
    bg: "bg-gray-50/50 dark:bg-slate-800/50",
    iconBg: "bg-gray-100 dark:bg-slate-700",
    iconText: "text-gray-600 dark:text-slate-400",
  },
};

function getRoleCardColor(slug: string) {
  return ROLE_CARD_COLORS[slug] ?? ROLE_CARD_COLORS.default;
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  roles,
  onClose,
  onCreate,
}: {
  roles: Role[];
  onClose: () => void;
  onCreate: () => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName:  "",
    email:     "",
    password:  "",
    roleId:    defaultRoleId(roles),
  });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [isPending, start]    = useTransition();

  function submit() {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    start(async () => {
      const res = await createAdminUserAction(form);
      if (res.success) {
        onCreate();
        onClose();
        toast.success("Admin user created");
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Add Admin User</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-slate-300">First name</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-slate-300">Last name</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">Email</label>
            <input
              type="email"
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">Password</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
              >
                {showPw ? <EyeSlash size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">Role</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
              value={form.roleId}
              onChange={e => setForm(f => ({ ...f, roleId: Number(e.target.value) }))}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={isPending}
            className="flex-1 rounded-xl bg-brand-600 dark:bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover disabled:opacity-60"
          >
            {isPending ? "Creating…" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onEdit,
  onToggle,
  onRoleChange,
  onDelete,
}: {
  user:         AdminUser;
  onEdit:       (u: AdminUser) => void;
  onToggle:     (u: AdminUser) => void;
  onRoleChange: (u: AdminUser) => void;
  onDelete:     (u: AdminUser) => void;
}) {
  const meta   = ROLE_META[user.role];
  const active = user.status === "active";

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand/15 text-brand-700 dark:text-brand flex items-center justify-center text-sm font-semibold shrink-0">
        {initials(user)}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user.email}</p>
      </div>

      {/* Role badge */}
      <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
        {user.role === "SUPER_ADMIN"
          ? <ShieldStar size={11} weight="fill" />
          : <ShieldCheck size={11} weight="fill" />
        }
        {user.roleName ?? meta.label}
      </span>

      {/* Status */}
      <span className={`hidden md:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        active ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
      }`}>
        {active ? "Active" : "Suspended"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(user)}
          title="Edit details / reset password"
          className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand/15 hover:text-brand-600 dark:hover:text-brand flex items-center justify-center text-gray-500 dark:text-slate-400 transition-colors"
        >
          <PencilSimple size={14} />
        </button>
        <button
          onClick={() => onRoleChange(user)}
          title="Change role"
          className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand/15 hover:text-brand-600 dark:hover:text-brand flex items-center justify-center text-gray-500 dark:text-slate-400 transition-colors"
        >
          <ShieldCheck size={14} />
        </button>
        <button
          onClick={() => onToggle(user)}
          title={active ? "Suspend" : "Activate"}
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
            active
              ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25"
              : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25"
          }`}
        >
          {active ? <EyeSlash size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={() => onDelete(user)}
          title="Delete"
          className="h-7 w-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 flex items-center justify-center transition-colors"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Change Role Modal ────────────────────────────────────────────────────────

function ChangeRoleModal({
  user,
  roles,
  onClose,
  onChanged,
}: {
  user:      AdminUser;
  roles:     Role[];
  onClose:   () => void;
  onChanged: (updated: AdminUser) => void;
}) {
  const [roleId, setRoleId]   = useState<number>(user.roleId ?? defaultRoleId(roles));
  const [isPending, start]    = useTransition();
  const [error, setError]     = useState("");

  function submit() {
    start(async () => {
      const res = await updateAdminRoleAction(user.id, roleId);
      if (res.success) {
        const picked = roles.find((r) => r.id === res.data.roleId);
        onChanged({
          ...user,
          role: res.data.role,
          roleId: res.data.roleId,
          roleName: picked?.name ?? user.roleName,
        });
        onClose();
        toast.success("Role updated");
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Change Role</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Update role for <strong>{user.firstName} {user.lastName}</strong>
          </p>
          <select
            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
            value={roleId}
            onChange={e => setRoleId(Number(e.target.value))}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={submit} disabled={isPending} className="flex-1 rounded-xl bg-brand-600 dark:bg-brand py-2.5 text-sm text-white hover:bg-brand-700 dark:hover:bg-brand-hover disabled:opacity-60">
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Admin Modal ─────────────────────────────────────────────────────────

function EditAdminModal({
  user,
  onClose,
  onUpdated,
}: {
  user:      AdminUser;
  onClose:   () => void;
  onUpdated: (updated: AdminUser) => void;
}) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName:  user.lastName,
    email:     user.email,
    password:  "",
  });
  const [showPw, setShowPw]  = useState(false);
  const [isPending, start]   = useTransition();
  const [error, setError]    = useState("");

  function submit() {
    if (!form.firstName || !form.lastName || !form.email) {
      setError("Name and email are required");
      return;
    }
    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    start(async () => {
      const res = await updateAdminUserAction(user.id, {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
      });
      if (!res.success) {
        setError(res.message);
        return;
      }
      if (form.password) {
        const pw = await resetAdminPasswordAction(user.id, form.password);
        if (!pw.success) {
          setError(pw.message);
          return;
        }
      }
      onUpdated({
        ...user,
        firstName: res.data.firstName,
        lastName:  res.data.lastName,
        email:     res.data.email,
      });
      onClose();
      toast.success(form.password ? "Admin updated & password reset" : "Admin updated");
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Edit Admin</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-slate-300">First name</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-slate-300">Last name</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">Email</label>
            <input
              type="email"
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">New password</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Leave blank to keep current"
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
              >
                {showPw ? <EyeSlash size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={submit} disabled={isPending} className="flex-1 rounded-xl bg-brand-600 dark:bg-brand py-2.5 text-sm text-white hover:bg-brand-700 dark:hover:bg-brand-hover disabled:opacity-60">
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

interface Props {
  initial:   AdminUsersResponse;
  roles:     Role[];
  permissions: string[];
}

export function RolesClient({ initial, roles: initialRoles, permissions }: Props) {
  const canManageAdmins = hasAnyPermission(permissions, [
    "create_admins",
    "update_admins",
    "delete_admins",
  ]);
  const canManageRoles = hasAnyPermission(permissions, [
    "create_roles",
    "update_roles",
    "delete_roles",
  ]);

  const [roles]                  = useState(initialRoles);
  const [data, setData]         = useState(initial);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage]         = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [changeRoleUser, setChangeRoleUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: users, pagination, stats } = data;

  const roleStats = useMemo(() => {
    const map = new Map<number, { role: Role; count: number }>();
    for (const r of roles) map.set(r.id, { role: r, count: 0 });
    for (const u of users) {
      if (u.roleId) {
        const entry = map.get(u.roleId);
        if (entry) entry.count++;
      }
    }
    return [...map.values()];
  }, [roles, users]);

  function reload(opts: { search?: string; role?: string; page?: number }) {
    startTransition(async () => {
      const s = opts.search ?? search;
      const r = opts.role   ?? roleFilter;
      const p = opts.page   ?? page;
      const res = await getAdminUsersAction({ search: s, role: r, page: p });
      if (res.success) setData(res.data);
    });
  }

  function handleSearch(value: string) {
    setSearch(value); setPage(1);
    reload({ search: value, page: 1 });
  }

  function handleRoleFilter(value: string) {
    setRoleFilter(value); setPage(1);
    reload({ role: value, page: 1 });
  }

  function handleToggle(user: AdminUser) {
    setToggleTarget(null);
    startTransition(async () => {
      const res = await toggleAdminStatusAction(user.id);
      if (res.success) {
        setData(d => ({
          ...d,
          data: d.data.map(u => u.id === user.id ? { ...u, status: res.data.status } : u),
        }));
        toast.success(res.data.status === "active" ? "Admin activated" : "Admin suspended");
      } else {
        toast.error(res.message ?? "Failed to update admin status");
      }
    });
  }

  function handleDelete(user: AdminUser) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await deleteAdminUserAction(user.id);
      if (res.success) {
        setData(d => ({
          ...d,
          data: d.data.filter(u => u.id !== user.id),
          stats: { ...d.stats, total: d.stats.total - 1 },
        }));
        toast.success("Admin user deleted");
      } else {
        toast.error(res.message ?? "Failed to delete admin user");
      }
    });
  }

  function handleCreated() {
    setPage(1);
    reload({ page: 1 });
  }

  function handleRoleChanged(updated: AdminUser) {
    setData(d => ({
      ...d,
      data: d.data.map(u => u.id === updated.id ? updated : u),
    }));
  }

  function handleUpdated(updated: AdminUser) {
    setData(d => ({
      ...d,
      data: d.data.map(u => u.id === updated.id ? updated : u),
    }));
  }

  return (
    <div className="space-y-6">
      {/* ─── Top Row: Title + Button ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Manage roles, permissions, and admin accounts
          </p>
        </div>
        {canManageRoles && (
          <Link
            href="/admin/roles/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand-hover text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} weight="bold" />
            Create Role
          </Link>
        )}
      </div>

      {/* ─── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Roles",
            value: roles.length,
            icon: <ListChecks size={18} weight="fill" />,
            style: { background: "linear-gradient(135deg, #ede9fe, #f3e8ff)", color: "#7c3aed" },
          },
          {
            label: "Total Admins",
            value: stats.total,
            icon: <Users size={18} weight="fill" />,
            style: { background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", color: "#4f46e5" },
          },
          {
            label: "Super Admins",
            value: stats.superAdmins,
            icon: <ShieldStar size={18} weight="fill" />,
            style: { background: "linear-gradient(135deg, #fce7f3, #fdf2f8)", color: "#db2777" },
          },
          {
            label: "Instructors",
            value: stats.instructors,
            icon: <GraduationCap size={18} weight="fill" />,
            style: { background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", color: "#059669" },
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5"
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={s.style}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {s.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Role Cards ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Roles
        </h2>
        {roles.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 text-center">
            <ShieldCheck size={36} className="mx-auto mb-3 text-gray-200 dark:text-slate-700" />
            <p className="text-gray-400 dark:text-slate-500 text-sm mb-4">No roles created yet</p>
            {canManageRoles && (
              <Link
                href="/admin/roles/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 dark:bg-brand text-white text-sm font-medium hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors"
              >
                <Plus size={14} weight="bold" />
                Create your first role
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {roles.map((role) => {
              const colors = getRoleCardColor(role.slug)!;
              return (
                <div
                  key={role.id}
                  className={`rounded-xl border ${colors.border} ${colors.bg} px-3 py-2.5`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-6 w-6 rounded-md flex items-center justify-center ${colors.iconBg} ${colors.iconText} shrink-0`}
                      >
                        <ShieldCheck size={12} weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                          {role.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-slate-500">
                          <span className="font-mono">{role.slug}</span>
                          <span>·</span>
                          <span>{role.permissionIds?.length ?? 0} perms</span>
                          <span>·</span>
                          <span>{roleStats.find((s) => s.role.id === role.id)?.count ?? 0} users</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/admin/roles/${role.id}/edit`}
                      className="h-6 w-6 rounded-md hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand transition-colors shrink-0"
                    >
                      <PencilSimple size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Admin Users Section ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Admin Users
          </h2>
          {canManageAdmins && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 dark:text-brand hover:bg-brand-50 dark:hover:bg-brand/10 transition-colors"
            >
              <UserPlus size={14} weight="bold" />
              Add Admin
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="search"
              name="admin-search"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <FunnelSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <select
              className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40 appearance-none"
              value={roleFilter}
              onChange={e => handleRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.slug.toUpperCase()}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          {isPending ? (
            <div className="py-16 text-center text-sm text-gray-400 dark:text-slate-500">Loading…</div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={36} className="mx-auto mb-3 text-gray-200 dark:text-slate-700" />
              <p className="text-gray-400 dark:text-slate-500 text-sm">No admin users found</p>
            </div>
          ) : (
            users.map(u => (
              <UserRow
                key={u.id}
                user={u}
                onEdit={u => setEditUser(u)}
                onToggle={u => setToggleTarget(u)}
                onRoleChange={u => setChangeRoleUser(u)}
                onDelete={u => setDeleteTarget(u)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400 mt-3">
            <span>Showing {pagination.from}–{pagination.to} of {pagination.total}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); reload({ page: page - 1 }); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40">
                <ArrowLeft size={13} /> Prev
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand/15 text-brand-700 dark:text-brand font-medium">{page} / {pagination.last_page}</span>
              <button disabled={page >= pagination.last_page} onClick={() => { setPage(p => p + 1); reload({ page: page + 1 }); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40">
                Next <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.status === "active" ? "Suspend Admin" : "Activate Admin"}
        message={
          toggleTarget?.status === "active"
            ? <>Suspend <strong>{toggleTarget.firstName} {toggleTarget.lastName}</strong>? They will lose access to the admin panel.</>
            : <>Activate <strong>{toggleTarget?.firstName} {toggleTarget?.lastName}</strong>? They will regain access to the admin panel.</>
        }
        confirmLabel={toggleTarget?.status === "active" ? "Yes, Suspend" : "Yes, Activate"}
        variant={toggleTarget?.status === "active" ? "warning" : "success"}
        isPending={isPending}
        onConfirm={() => toggleTarget && handleToggle(toggleTarget)}
        onClose={() => setToggleTarget(null)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Admin User"
        message={deleteTarget ? <>Delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {showCreate && (
        <CreateModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}
      {changeRoleUser && (
        <ChangeRoleModal
          user={changeRoleUser}
          roles={roles}
          onClose={() => setChangeRoleUser(null)}
          onChanged={handleRoleChanged}
        />
      )}
      {editUser && (
        <EditAdminModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
