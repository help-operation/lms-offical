"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronLeft, Mail, Phone, Pencil, Trash2, ShieldOff, ShieldCheck,
  Calendar, Clock, KeyRound, Lock, Activity, Shield, Info,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  deleteUserAction,
  suspendUserAction,
  activateUserAction,
  updateUserAction,
  resetUserPasswordAction,
} from "./actions/admin.actions";
import { EditPersonModal } from "@/shared/components/EditPersonModal";
import type { AdminUser } from "./api";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { user: AdminUser }

const avatarColors = [
  "bg-pink-400", "bg-violet-400", "bg-blue-400", "bg-amber-400", "bg-emerald-400", "bg-rose-400",
];

const roleBadgeMap: Record<string, string> = {
  SUPER_ADMIN:       "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  INSTRUCTOR:        "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  EDITOR:            "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  MARKETING_OFFICER: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
  ACCOUNTANT:        "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
  STUDENT:           "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  GUEST:             "bg-gray-100 text-gray-500 dark:bg-slate-500/15 dark:text-slate-400",
};

const roleLabelMap: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", INSTRUCTOR: "Instructor", EDITOR: "Editor",
  MARKETING_OFFICER: "Marketing Officer", ACCOUNTANT: "Accountant",
  STUDENT: "Student", GUEST: "Guest",
};

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Info; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-50 dark:border-slate-800">
        <Icon className="h-4 w-4 text-brand-500" />
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-slate-800/50 last:border-0">
      <span className="text-xs text-gray-400 dark:text-slate-500">{label}</span>
      <span className={`text-xs text-gray-700 dark:text-slate-200 text-right ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

export function UserDetailClient({ user: initial }: Props) {
  const router = useRouter();
  const { formatDate } = useLocalization();
  const [user, setUser]             = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [showEdit, setShowEdit]     = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showToggle, setShowToggle] = useState(false);

  function handleToggleStatus() {
    setShowToggle(false);
    startTransition(async () => {
      const res = user.status === "active"
        ? await suspendUserAction(user.id)
        : await activateUserAction(user.id);
      if (res.success && res.data) {
        setUser((p) => ({ ...p, status: res.data!.status }));
        toast.success("Status updated");
      } else {
        toast.error((res as any).message ?? "Failed to update status");
      }
    });
  }

  function confirmDelete() {
    setShowDelete(false);
    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (res.success) {
        toast.success("User deleted");
        router.push("/admin/users");
      } else {
        toast.error(res.message ?? "Failed to delete");
      }
    });
  }

  return (
    <>
      <div className="space-y-5 max-w-4xl">
        {/* Back + Actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link href="/admin/users" className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Users
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowEdit(true)} disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button onClick={() => setShowToggle(true)} disabled={isPending}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                user.status === "active"
                  ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-500/15 dark:text-yellow-400"
                  : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/15 dark:text-green-400"
              }`}>
              {user.status === "active"
                ? <><ShieldOff className="h-3.5 w-3.5" /> Suspend</>
                : <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>}
            </button>
            <button onClick={() => setShowDelete(true)} disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 disabled:opacity-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-none">
          <div className="flex items-start gap-5 flex-wrap">
            {user.avatar ? (
              <img src={user.avatar} alt={user.firstName} className="h-20 w-20 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className={`h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0 ${avatarColors[user.id % avatarColors.length]}`}>
                {user.firstName?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</h1>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${roleBadgeMap[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                  {roleLabelMap[user.role] ?? user.role}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize ${
                  user.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                    : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                }`}>
                  {user.status}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 mt-3 sm:flex-row sm:items-center sm:gap-4 flex-wrap">
                {user.email && (
                  <a href={`mailto:${user.email}`} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand transition-colors break-all">
                    <Mail className="h-3 w-3 shrink-0" /> {user.email}
                  </a>
                )}
                {user.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                    <Phone className="h-3 w-3 shrink-0" /> {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Account Info */}
          <Card title="Account Info" icon={Info}>
            <InfoRow label="Full Name" value={`${user.firstName} ${user.lastName}`} />
            <InfoRow label="Email" value={
              user.email ? <a href={`mailto:${user.email}`} className="text-brand-600 dark:text-brand hover:underline break-all">{user.email}</a> : null
            } />
            <InfoRow label="Phone" value={user.phone} />
            <InfoRow label="Role" value={
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${roleBadgeMap[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                {roleLabelMap[user.role] ?? user.role}
              </span>
            } />
            <InfoRow label="Status" value={
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg capitalize ${
                user.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
              }`}>{user.status}</span>
            } />
          </Card>

          {/* Security */}
          <Card title="Security" icon={Shield}>
            <InfoRow label="Last Login" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"} />
            <InfoRow label="Failed Attempts" value={user.failedLoginAttempts ?? 0} />
            <InfoRow label="Locked Until" value={user.lockedUntil ? formatDate(user.lockedUntil) : "Not locked"} />
            <InfoRow label="Account Created" value={user.createdAt ? formatDate(user.createdAt) : "—"} />
            <InfoRow label="Last Updated" value={user.updatedAt ? formatDate(user.updatedAt) : "—"} />
          </Card>
        </div>

        {/* Role & Permissions */}
        {user.roleInfo && (
          <Card title="Role & Permissions" icon={Shield}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${roleBadgeMap[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                  {user.roleInfo.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-500">({user.roleInfo.slug})</span>
              </div>
              {user.roleInfo.description && (
                <p className="text-xs text-gray-500 dark:text-slate-400">{user.roleInfo.description}</p>
              )}
              {user.permissions && user.permissions.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-2">Permissions ({user.permissions.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.permissions.map((slug) => (
                      <span key={slug} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 font-mono">
                        {slug}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(!user.permissions || user.permissions.length === 0) && (
                <p className="text-xs text-gray-400 dark:text-slate-500 italic">No permissions assigned</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showEdit && (
        <EditPersonModal
          entityLabel="User"
          person={user}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setUser((p) => ({ ...p, ...updated })); }}
          updateAction={updateUserAction}
          suspendAction={suspendUserAction}
          activateAction={activateUserAction}
          resetPasswordAction={resetUserPasswordAction}
        />
      )}

      <ConfirmModal
        open={showToggle}
        title={user.status === "active" ? "Suspend User" : "Activate User"}
        message={
          user.status === "active"
            ? <>Suspend <strong>{user.firstName} {user.lastName}</strong>? They will lose access to the platform.</>
            : <>Activate <strong>{user.firstName} {user.lastName}</strong>? They will regain access to the platform.</>
        }
        confirmLabel={user.status === "active" ? "Yes, Suspend" : "Yes, Activate"}
        variant={user.status === "active" ? "warning" : "success"}
        icon={user.status === "active" ? <ShieldOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /> : <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />}
        isPending={isPending}
        onConfirm={handleToggleStatus}
        onClose={() => setShowToggle(false)}
      />

      <ConfirmModal
        open={showDelete}
        title="Delete User"
        message={<>Delete <strong>{user.firstName} {user.lastName}</strong>? This cannot be undone.</>}
        confirmLabel="Yes, Delete"
        variant="danger"
        icon={<Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />}
        isPending={isPending}
        onConfirm={confirmDelete}
        onClose={() => setShowDelete(false)}
      />
    </>
  );
}
