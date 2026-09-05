"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronLeft, Mail, Phone, Pencil, Trash2, ShieldOff, ShieldCheck,
  Shield, Info, Briefcase, Heart, CreditCard, MapPin, User, Lock,
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

const sectionColorMap = {
  blue:   { border: "border-blue-100 dark:border-blue-500/20", bg: "bg-blue-50/50 dark:bg-blue-500/5", iconBg: "bg-blue-100 dark:bg-blue-500/15", iconText: "text-blue-600 dark:text-blue-400" },
  green:  { border: "border-emerald-100 dark:border-emerald-500/20", bg: "bg-emerald-50/50 dark:bg-emerald-500/5", iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconText: "text-emerald-600 dark:text-emerald-400" },
  rose:   { border: "border-rose-100 dark:border-rose-500/20", bg: "bg-rose-50/50 dark:bg-rose-500/5", iconBg: "bg-rose-100 dark:bg-rose-500/15", iconText: "text-rose-600 dark:text-rose-400" },
  amber:  { border: "border-amber-100 dark:border-amber-500/20", bg: "bg-amber-50/50 dark:bg-amber-500/5", iconBg: "bg-amber-100 dark:bg-amber-500/15", iconText: "text-amber-600 dark:text-amber-400" },
  default:{ border: "border-gray-100 dark:border-slate-800", bg: "bg-white dark:bg-slate-900", iconBg: "bg-brand-50 dark:bg-brand/10", iconText: "text-brand-500" },
};

function SectionCard({ title, icon: Icon, color = "default" as keyof typeof sectionColorMap, children }: { title: string; icon: typeof Info; color?: keyof typeof sectionColorMap; children: React.ReactNode }) {
  const c = sectionColorMap[color];
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.iconBg} ${c.iconText}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">User Profile</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Account details & profile information</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowEdit(true)} disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button onClick={() => setShowToggle(true)} disabled={isPending}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                user.status === "active"
                  ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-500/15 dark:text-yellow-400"
                  : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/15 dark:text-green-400"
              }`}>
              {user.status === "active"
                ? <><ShieldOff className="h-3.5 w-3.5" /> Suspend</>
                : <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>}
            </button>
            <button onClick={() => setShowDelete(true)} disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 disabled:opacity-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Two Column: Left (Profile) + Right (Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left Column: Profile Card ── */}
          <div className="lg:col-span-1 space-y-5">
            {/* Profile Card */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-none text-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.firstName} className="h-24 w-24 rounded-2xl object-cover mx-auto" />
              ) : (
                <div className={`h-24 w-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto ${avatarColors[user.id % avatarColors.length]}`}>
                  {user.firstName?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">#{user.id}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
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
              <div className="mt-4 space-y-2">
                {user.email && (
                  <a href={`mailto:${user.email}`} className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand transition-colors break-all">
                    <Mail className="h-3 w-3 shrink-0" /> {user.email}
                  </a>
                )}
                {user.phone && (
                  <span className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                    <Phone className="h-3 w-3 shrink-0" /> {user.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <SectionCard title="Quick Info" icon={Info}>
              <InfoRow label="Employee ID" value={user.employeeId} mono />
              <InfoRow label="Department" value={user.department} />
              <InfoRow label="Designation" value={user.designation} />
              <InfoRow label="Employment" value={user.employmentType?.replace("_", " ")} />
              <InfoRow label="Joined" value={user.joiningDate ? formatDate(user.joiningDate) : null} />
            </SectionCard>
          </div>

          {/* ── Right Column: All Details ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Account & Security */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Account Info" icon={Info}>
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
              </SectionCard>

              <SectionCard title="Security" icon={Lock}>
                <InfoRow label="Last Login" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"} />
                <InfoRow label="Failed Attempts" value={user.failedLoginAttempts ?? 0} />
                <InfoRow label="Locked Until" value={user.lockedUntil ? formatDate(user.lockedUntil) : "Not locked"} />
                <InfoRow label="Account Created" value={user.createdAt ? formatDate(user.createdAt) : "—"} />
                <InfoRow label="Last Updated" value={user.updatedAt ? formatDate(user.updatedAt) : "—"} />
              </SectionCard>
            </div>

            {/* Role & Permissions */}
            {user.roleInfo && (
              <SectionCard title="Role & Permissions" icon={Shield}>
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
              </SectionCard>
            )}

            {/* ── Basic Info & Media ── */}
            <SectionCard title="Basic Info & Media" icon={User} color="blue">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <InfoRow label="First Name" value={user.firstName} />
                <InfoRow label="Last Name" value={user.lastName} />
                <InfoRow label="Gender" value={user.gender} />
                <InfoRow label="Date of Birth" value={user.dateOfBirth ? formatDate(user.dateOfBirth) : null} />
                <InfoRow label="National ID / Passport" value={user.nationalId} mono />
              </div>
            </SectionCard>

            {/* ── Employment Details ── */}
            <SectionCard title="Employment Details" icon={Briefcase} color="green">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <InfoRow label="Employee ID" value={user.employeeId} mono />
                <InfoRow label="Department" value={user.department} />
                <InfoRow label="Designation" value={user.designation} />
                <InfoRow label="Employment Type" value={user.employmentType?.replace("_", " ")} />
                <InfoRow label="Joining Date" value={user.joiningDate ? formatDate(user.joiningDate) : null} />
              </div>
            </SectionCard>

            {/* ── Emergency & Payroll ── */}
            <SectionCard title="Emergency & Payroll Info" icon={Heart} color="rose">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <InfoRow label="Emergency Contact" value={user.emergencyContactName} />
                <InfoRow label="Emergency Phone" value={user.emergencyContactPhone} />
                <InfoRow label="Salary" value={user.salary ? `৳${Number(user.salary).toLocaleString()}` : null} />
                <InfoRow label="Bank Name" value={user.bankName} />
                <InfoRow label="Account Number" value={user.bankAccountNumber} mono />
              </div>
            </SectionCard>

            {/* ── Address Details ── */}
            <SectionCard title="Address Details" icon={MapPin} color="amber">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <InfoRow label="Country" value={user.country} />
                <InfoRow label="City" value={user.city} />
                <InfoRow label="Present Address" value={user.presentAddress} />
                <InfoRow label="Permanent Address" value={user.permanentAddress} />
              </div>
            </SectionCard>
          </div>
        </div>
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
