"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronLeft, Mail, Phone, Pencil, Trash2, ShieldOff, ShieldCheck,
  Shield, Info, Briefcase, Heart, CreditCard, MapPin, User, Lock,
  GraduationCap, BriefcaseBusiness, Wrench, FileText,
  DollarSign, Receipt, Gift, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/tabs";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { EditPersonModal } from "@/shared/components/EditPersonModal";
import {
  deleteUserAction,
  suspendUserAction,
  activateUserAction,
  updateUserAction,
  resetUserPasswordAction,
} from "./actions/admin.actions";
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
  violet: { border: "border-violet-100 dark:border-violet-500/20", bg: "bg-violet-50/50 dark:bg-violet-500/5", iconBg: "bg-violet-100 dark:bg-violet-500/15", iconText: "text-violet-600 dark:text-violet-400" },
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

function EmptyState({ icon: Icon, label }: { icon: typeof Info; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-gray-300 dark:text-slate-600" />
      </div>
      <p className="text-sm text-gray-400 dark:text-slate-500">{label}</p>
    </div>
  );
}

function maskId(value: string | null | undefined): string {
  if (!value) return "—";
  const str = String(value);
  if (str.length <= 4) return str;
  return "****" + str.slice(-4);
}

function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize ${
      isActive
        ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
        : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
    }`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${roleBadgeMap[role] ?? "bg-gray-100 text-gray-600"}`}>
      {roleLabelMap[role] ?? role}
    </span>
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

  const age = calcAge(user.dateOfBirth);

  return (
    <>
      <div className="space-y-5">
        {/* ── Header ── */}
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
            <button onClick={() => router.push(`/admin/users/${user.id}/edit`)} disabled={isPending}
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

        {/* ── Profile Banner ── */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-none">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {user.avatar ? (
              <img src={user.avatar} alt={user.firstName} className="h-20 w-20 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className={`h-20 w-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shrink-0 ${avatarColors[user.id % avatarColors.length]}`}>
                {user.firstName?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</h2>
                <div className="flex items-center gap-2">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.status} />
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">User ID: #{user.id}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
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

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-1 h-auto p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg text-xs px-3 py-2 shrink-0">Overview</TabsTrigger>
            <TabsTrigger value="personal" className="rounded-lg text-xs px-3 py-2 shrink-0">Personal Info</TabsTrigger>
            <TabsTrigger value="address" className="rounded-lg text-xs px-3 py-2 shrink-0">Address</TabsTrigger>
            <TabsTrigger value="payroll" className="rounded-lg text-xs px-3 py-2 shrink-0">Payroll & Banking</TabsTrigger>
            <TabsTrigger value="education" className="rounded-lg text-xs px-3 py-2 shrink-0">Education</TabsTrigger>
            <TabsTrigger value="experience" className="rounded-lg text-xs px-3 py-2 shrink-0">Experience</TabsTrigger>
            <TabsTrigger value="skills" className="rounded-lg text-xs px-3 py-2 shrink-0">Skills</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg text-xs px-3 py-2 shrink-0">Documents</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Overview ── */}
          <TabsContent value="overview" className="mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Account Info" icon={Info}>
                <InfoRow label="Full Name" value={`${user.firstName} ${user.lastName}`} />
                <InfoRow label="Email" value={
                  user.email ? <a href={`mailto:${user.email}`} className="text-brand-600 dark:text-brand hover:underline break-all">{user.email}</a> : null
                } />
                <InfoRow label="Phone" value={user.phone} />
                <InfoRow label="Role" value={<RoleBadge role={user.role} />} />
                <InfoRow label="Status" value={<StatusBadge status={user.status} />} />
              </SectionCard>

              <SectionCard title="Security" icon={Lock}>
                <InfoRow label="Last Login" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"} />
                <InfoRow label="Failed Attempts" value={user.failedLoginAttempts ?? 0} />
                <InfoRow label="Locked Until" value={user.lockedUntil ? formatDate(user.lockedUntil) : "Not locked"} />
                <InfoRow label="Account Created" value={user.createdAt ? formatDate(user.createdAt) : "—"} />
                <InfoRow label="Last Updated" value={user.updatedAt ? formatDate(user.updatedAt) : "—"} />
              </SectionCard>
            </div>

            {user.roleInfo && (
              <SectionCard title="Role & Permissions" icon={Shield} color="violet">
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

            <SectionCard title="Quick Info" icon={Briefcase} color="green">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <InfoRow label="Employee ID" value={user.employeeId} mono />
                <InfoRow label="Department" value={user.department} />
                <InfoRow label="Designation" value={user.designation} />
                <InfoRow label="Employment" value={user.employmentType?.replace("_", " ")} />
                <InfoRow label="Joined" value={user.joiningDate ? formatDate(user.joiningDate) : null} />
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Tab 2: Personal Info ── */}
          <TabsContent value="personal" className="mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Basic Information" icon={User} color="blue">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  <InfoRow label="First Name" value={user.firstName} />
                  <InfoRow label="Last Name" value={user.lastName} />
                  <InfoRow label="Gender" value={user.gender} />
                  <InfoRow label="Date of Birth" value={
                    user.dateOfBirth ? (
                      <span>
                        {formatDate(user.dateOfBirth)}
                        {age !== null && <span className="ml-1 text-gray-400 dark:text-slate-500">({age} yrs)</span>}
                      </span>
                    ) : null
                  } />
                  <InfoRow label="NID Type" value={user.nidType} />
                  <InfoRow label="NID Number" value={maskId(user.nationalId)} mono />
                </div>
              </SectionCard>

              <div className="space-y-5">
                <SectionCard title="Parents" icon={Heart} color="rose">
                  <InfoRow label="Father's Name" value={user.fatherName} />
                  <InfoRow label="Mother's Name" value={user.motherName} />
                </SectionCard>

                <SectionCard title="Emergency Contact" icon={AlertCircle} color="amber">
                  <InfoRow label="Relationship" value={user.emergencyContactRelationship} />
                  <InfoRow label="Contact Name" value={user.emergencyContactName} />
                  <InfoRow label="Contact Phone" value={user.emergencyContactPhone} />
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 3: Address ── */}
          <TabsContent value="address" className="mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Permanent Address" icon={MapPin} color="amber">
                <InfoRow label="Country" value={user.country} />
                <InfoRow label="Division" value={user.division} />
                <InfoRow label="District" value={user.district} />
                <InfoRow label="Thana" value={user.thana} />
                <InfoRow label="Union" value={user.unionName} />
                <InfoRow label="Post Code" value={user.postCode} />
                <InfoRow label="Full Address" value={user.permanentAddress} />
              </SectionCard>

              <SectionCard title="Present Address" icon={MapPin} color="blue">
                {user.sameAsPermanent ? (
                  <div className="flex items-center gap-2 py-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-gray-600 dark:text-slate-300">Same as permanent address</span>
                  </div>
                ) : (
                  <div className="space-y-0">
                    <InfoRow label="Country" value={user.presentCountry} />
                    <InfoRow label="Division" value={user.presentDivision} />
                    <InfoRow label="District" value={user.presentDistrict} />
                    <InfoRow label="Thana" value={user.presentThana} />
                    <InfoRow label="Union" value={user.presentUnion} />
                    <InfoRow label="Post Code" value={user.presentPostCode} />
                    <InfoRow label="Full Address" value={user.presentAddress} />
                  </div>
                )}
              </SectionCard>
            </div>
          </TabsContent>

          {/* ── Tab 4: Payroll & Banking ── */}
          <TabsContent value="payroll" className="mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Employment" icon={Briefcase} color="green">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  <InfoRow label="Employee ID" value={user.employeeId} mono />
                  <InfoRow label="Department" value={user.department} />
                  <InfoRow label="Designation" value={user.designation} />
                  <InfoRow label="Employment Type" value={user.employmentType?.replace("_", " ")} />
                  <InfoRow label="Joining Date" value={user.joiningDate ? formatDate(user.joiningDate) : null} />
                </div>
              </SectionCard>

              <SectionCard title="Salary Breakdown" icon={DollarSign} color="green">
                <InfoRow label="Basic Salary" value={user.salary ? "\u09F3" + Number(user.salary).toLocaleString() : null} />
                <InfoRow label="House Rent" value={user.houseRent ? "\u09F3" + Number(user.houseRent).toLocaleString() : null} />
                <InfoRow label="Medical" value={user.medicalAllowance ? "\u09F3" + Number(user.medicalAllowance).toLocaleString() : null} />
                <InfoRow label="Transport" value={user.transportAllowance ? "\u09F3" + Number(user.transportAllowance).toLocaleString() : null} />
                <InfoRow label="Other Allowances" value={user.otherAllowance ? "\u09F3" + Number(user.otherAllowance).toLocaleString() : null} />
                <InfoRow label="Gross Salary" value={user.grossSalary ? "\u09F3" + Number(user.grossSalary).toLocaleString() : null} />
              </SectionCard>

              <SectionCard title="Deductions" icon={Receipt} color="rose">
                <InfoRow label="Tax Deduction" value={user.taxDeduction ? "\u09F3" + Number(user.taxDeduction).toLocaleString() : null} />
                <InfoRow label="Provident Fund" value={user.providentFund ? "\u09F3" + Number(user.providentFund).toLocaleString() : null} />
                <InfoRow label="Other Deductions" value={user.otherDeduction ? "\u09F3" + Number(user.otherDeduction).toLocaleString() : null} />
                <div className="border-t border-gray-100 dark:border-slate-800 mt-2 pt-2">
                  <InfoRow label="Net Salary" value={user.netSalary ? "\u09F3" + Number(user.netSalary).toLocaleString() : null} />
                </div>
              </SectionCard>

              <div className="space-y-5">
                <SectionCard title="Bonus" icon={Gift} color="violet">
                  <InfoRow label="Bonus Type" value={user.bonusType} />
                  <InfoRow label="Calculation Type" value={user.bonusCalculationType} />
                  <InfoRow label="Amount" value={user.bonusAmount ? "\u09F3" + Number(user.bonusAmount).toLocaleString() : null} />
                  <InfoRow label="Frequency" value={user.bonusFrequency} />
                  <InfoRow label="Eligibility" value={user.bonusEligibility} />
                  {user.bonusNotes && <InfoRow label="Notes" value={user.bonusNotes} />}
                </SectionCard>

                <SectionCard title="Banking" icon={CreditCard} color="blue">
                  <InfoRow label="Account Type" value={user.bankingType} />
                  <InfoRow label="Provider / Bank" value={user.bankingProvider || user.bankName} />
                  <InfoRow label="Account Number" value={maskId(user.bankAccountNumber)} mono />
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 5: Education ── */}
          <TabsContent value="education" className="mt-5">
            <SectionCard title="Education Records" icon={GraduationCap} color="blue">
              {user.education && user.education.length > 0 ? (
                <div className="overflow-x-auto -mx-5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800">
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Degree</th>
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Institution</th>
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Subject</th>
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Year</th>
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.education.map((edu, i) => (
                        <tr key={edu.id ?? i} className="border-b border-gray-50 dark:border-slate-800/50 last:border-0">
                          <td className="py-2.5 px-5 text-gray-700 dark:text-slate-200">{edu.degree || "—"}</td>
                          <td className="py-2.5 px-5 text-gray-700 dark:text-slate-200">{edu.institution || "—"}</td>
                          <td className="py-2.5 px-5 text-gray-700 dark:text-slate-200">{edu.subject || "—"}</td>
                          <td className="py-2.5 px-5 text-gray-700 dark:text-slate-200">{edu.passingYear || "—"}</td>
                          <td className="py-2.5 px-5 text-gray-700 dark:text-slate-200">{edu.result || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={GraduationCap} label="No education records" />
              )}
            </SectionCard>
          </TabsContent>

          {/* ── Tab 6: Experience ── */}
          <TabsContent value="experience" className="mt-5">
            <SectionCard title="Work Experience" icon={BriefcaseBusiness} color="green">
              {user.experience && user.experience.length > 0 ? (
                <div className="space-y-4">
                  {user.experience.map((exp, i) => (
                    <div key={exp.id ?? i} className="rounded-xl border border-gray-100 dark:border-slate-800 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{exp.company || "Unknown Company"}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{exp.designation || "—"}</p>
                        </div>
                        {exp.currentlyWorking && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                            Currently Working
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-3">
                        <InfoRow label="Department" value={exp.department} />
                        <InfoRow label="Start Date" value={exp.startDate ? formatDate(exp.startDate) : null} />
                        <InfoRow label="End Date" value={exp.currentlyWorking ? "Present" : (exp.endDate ? formatDate(exp.endDate) : null)} />
                      </div>
                      {exp.responsibilities && (
                        <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-800/50">
                          <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 mb-1">Responsibilities</p>
                          <p className="text-xs text-gray-600 dark:text-slate-300 whitespace-pre-line">{exp.responsibilities}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={BriefcaseBusiness} label="No experience records" />
              )}
            </SectionCard>
          </TabsContent>

          {/* ── Tab 7: Skills ── */}
          <TabsContent value="skills" className="mt-5">
            <SectionCard title="Skills" icon={Wrench} color="violet">
              {user.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, i) => {
                    const levelColors: Record<string, string> = {
                      beginner:     "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
                      intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
                      advanced:     "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
                      expert:       "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
                    };
                    const lvl = skill.level?.toLowerCase() ?? "";
                    const colorClass = levelColors[lvl] ?? "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400";
                    return (
                      <div key={skill.id ?? i} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5">
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-200">{skill.skillName}</span>
                        {skill.level && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${colorClass}`}>
                            {skill.level}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Wrench} label="No skills listed" />
              )}
            </SectionCard>
          </TabsContent>

          {/* ── Tab 8: Documents ── */}
          <TabsContent value="documents" className="mt-5">
            <SectionCard title="Documents" icon={FileText} color="amber">
              {user.documents && user.documents.length > 0 ? (
                <div className="overflow-x-auto -mx-5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800">
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Type</th>
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Name</th>
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Upload Date</th>
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Expiry</th>
                        <th className="text-left py-2.5 px-5 font-semibold text-gray-500 dark:text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.documents.map((doc, i) => (
                        <tr key={doc.id ?? i} className="border-b border-gray-50 dark:border-slate-800/50 last:border-0">
                          <td className="py-2.5 px-5 text-gray-700 dark:text-slate-200">{doc.documentType || "—"}</td>
                          <td className="py-2.5 px-5 text-gray-700 dark:text-slate-200">{doc.documentName || "—"}</td>
                          <td className="py-2.5 px-5 text-gray-700 dark:text-slate-200">{doc.uploadDate ? formatDate(doc.uploadDate) : "—"}</td>
                          <td className="py-2.5 px-5 text-gray-700 dark:text-slate-200">{doc.expiryDate ? formatDate(doc.expiryDate) : "—"}</td>
                          <td className="py-2.5 px-5">
                            {doc.status && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                                doc.status === "active" || doc.status === "verified"
                                  ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                                  : doc.status === "expired"
                                    ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}>
                                {doc.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={FileText} label="No documents uploaded" />
              )}
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Modals ── */}
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
