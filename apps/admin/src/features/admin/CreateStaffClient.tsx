"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus, ArrowLeft, Save, Camera, X, ChevronDown,
  Briefcase, ShieldCheck, MapPin, CreditCard, Heart, User,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { createUserAction } from "./actions/admin.actions";

const STAFF_ROLES = [
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "MARKETING_OFFICER", label: "Marketing Officer" },
  { value: "ACCOUNTANT", label: "Accountant" },
];

const DEPARTMENTS = [
  "Administration", "Academics", "Marketing", "Finance", "IT",
  "HR", "Operations", "Support",
];

const DESIGNATIONS = [
  "Manager", "Officer", "Executive", "Coordinator", "Assistant",
  "Director", "Lead", "Intern",
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "contractual", label: "Contractual" },
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function CreateStaffClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    dateOfBirth: "",
    nationalId: "",
    role: "INSTRUCTOR",
    department: "",
    designation: "",
    employmentType: "full_time",
    joiningDate: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    salary: "",
    bankName: "",
    bankAccountNumber: "",
    country: "",
    city: "",
    presentAddress: "",
    permanentAddress: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemovePicture() {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit() {
    if (!form.firstName.trim()) { toast.error("First name is required"); return; }
    if (!form.lastName.trim()) { toast.error("Last name is required"); return; }
    if (!form.email.trim() && !form.phone.trim()) { toast.error("Email or phone is required"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    startTransition(async () => {
      const res = await createUserAction({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: form.role,
        gender: form.gender || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        department: form.department || undefined,
        designation: form.designation || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        nationalId: form.nationalId || undefined,
        joiningDate: form.joiningDate || undefined,
        employmentType: form.employmentType || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        bankName: form.bankName || undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        presentAddress: form.presentAddress || undefined,
        permanentAddress: form.permanentAddress || undefined,
      });
      if (res.success) {
        toast.success("Staff member created successfully");
        router.push("/admin/users");
      } else {
        toast.error(res.message ?? "Failed to create staff");
      }
    });
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Add New Staff</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">Fill in the details to create a new staff account</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? "Creating..." : "Create Staff"}
        </button>
      </div>

      {/* ── Section 1: Basic Info & Media ── */}
      <SectionCard
        title="Basic Info & Media"
        icon={<Camera className="h-4 w-4" />}
        color="blue"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-28 w-28 rounded-full bg-white dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-gray-300 dark:text-slate-600" />
                )}
              </div>
              {previewUrl && (
                <button
                  onClick={handleRemovePicture}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePictureChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-brand-600 dark:text-brand hover:text-brand-700 dark:hover:text-brand-hover transition-colors"
            >
              {previewUrl ? "Change Photo" : "Upload Photo"}
            </button>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">JPG, PNG. Max 2 MB.</p>
          </div>

          {/* Personal Fields */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name *" value={form.firstName} onChange={(v) => set("firstName", v)} placeholder="Enter first name" />
            <Field label="Last Name *" value={form.lastName} onChange={(v) => set("lastName", v)} placeholder="Enter last name" />
            <Field label="Email" value={form.email} onChange={(v) => set("email", v)} placeholder="name@email.com" type="email" />
            <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="01XXXXXXXXX" />
            <SelectField label="Gender" value={form.gender} onChange={(v) => set("gender", v)} options={[{ value: "", label: "Select gender" }, ...GENDERS]} />
            <Field label="Date of Birth" value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} type="date" />
            <Field label="National ID / Passport" value={form.nationalId} onChange={(v) => set("nationalId", v)} placeholder="e.g. 1234567890" />
            <Field label="Password *" value={form.password} onChange={(v) => set("password", v)} type="password" placeholder="Min. 6 characters" />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Employment Details ── */}
      <SectionCard
        title="Employment Details"
        icon={<Briefcase className="h-4 w-4" />}
        color="green"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3.5">
            <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Employee ID</span>
            <p className="text-sm font-mono font-bold text-brand-600 dark:text-brand">Auto-generated</p>
          </div>
          <SelectField label="Role *" value={form.role} onChange={(v) => set("role", v)} options={STAFF_ROLES.map((r) => ({ value: r.value, label: r.label }))} />
          <SelectField label="Department" value={form.department} onChange={(v) => set("department", v)} options={[{ value: "", label: "Select department" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]} />
          <SelectField label="Designation" value={form.designation} onChange={(v) => set("designation", v)} options={[{ value: "", label: "Select designation" }, ...DESIGNATIONS.map((d) => ({ value: d, label: d }))]} />
          <SelectField label="Employment Type" value={form.employmentType} onChange={(v) => set("employmentType", v)} options={EMPLOYMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
          <Field label="Joining Date" value={form.joiningDate} onChange={(v) => set("joiningDate", v)} type="date" />
        </div>
      </SectionCard>

      {/* ── Section 3: Emergency & Payroll ── */}
      <SectionCard
        title="Emergency & Payroll Info"
        icon={<Heart className="h-4 w-4" />}
        color="rose"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Emergency Contact Person" value={form.emergencyContactName} onChange={(v) => set("emergencyContactName", v)} placeholder="e.g. John Doe" />
          <Field label="Emergency Contact Phone" value={form.emergencyContactPhone} onChange={(v) => set("emergencyContactPhone", v)} placeholder="01XXXXXXXXX" />
          <Field label="Salary / Compensation (৳)" value={form.salary} onChange={(v) => set("salary", v)} placeholder="e.g. 50000" type="number" />
          <Field label="Bank Name" value={form.bankName} onChange={(v) => set("bankName", v)} placeholder="e.g. BRAC Bank" />
          <Field label="Bank Account Number" value={form.bankAccountNumber} onChange={(v) => set("bankAccountNumber", v)} placeholder="e.g. 1234 5678 9012" />
        </div>
      </SectionCard>

      {/* ── Section 4: Address Details ── */}
      <SectionCard
        title="Address Details"
        icon={<MapPin className="h-4 w-4" />}
        color="amber"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Country" value={form.country} onChange={(v) => set("country", v)} placeholder="e.g. Bangladesh" />
          <Field label="City" value={form.city} onChange={(v) => set("city", v)} placeholder="e.g. Dhaka" />
          <div className="sm:col-span-2">
            <TextAreaField label="Present Address" value={form.presentAddress} onChange={(v) => set("presentAddress", v)} placeholder="Street, area, zip code" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField label="Permanent Address" value={form.permanentAddress} onChange={(v) => set("permanentAddress", v)} placeholder="Street, area, zip code" rows={2} />
          </div>
        </div>
      </SectionCard>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 mt-6 flex items-center justify-end gap-3 py-4 bg-gradient-to-t from-white dark:from-slate-900 via-white dark:via-slate-900 to-transparent">
        <button
          onClick={() => router.back()}
          disabled={isPending}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {isPending ? "Creating Staff..." : "Create Staff Member"}
        </button>
      </div>
    </div>
  );
}

/* ─── Section Card with Color Themes ──────────────────────────────────────── */

const colorMap = {
  blue: {
    border: "border-blue-100 dark:border-blue-500/20",
    bg: "bg-blue-50/40 dark:bg-blue-500/5",
    iconBg: "bg-blue-100 dark:bg-blue-500/15",
    iconText: "text-blue-600 dark:text-blue-400",
  },
  green: {
    border: "border-emerald-100 dark:border-emerald-500/20",
    bg: "bg-emerald-50/40 dark:bg-emerald-500/5",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconText: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    border: "border-rose-100 dark:border-rose-500/20",
    bg: "bg-rose-50/40 dark:bg-rose-500/5",
    iconBg: "bg-rose-100 dark:bg-rose-500/15",
    iconText: "text-rose-600 dark:text-rose-400",
  },
  amber: {
    border: "border-amber-100 dark:border-amber-500/20",
    bg: "bg-amber-50/40 dark:bg-amber-500/5",
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-400",
  },
};

function SectionCard({
  title, icon, color = "blue", children,
}: {
  title: string; icon: React.ReactNode; color?: keyof typeof colorMap; children: React.ReactNode;
}) {
  const c = colorMap[color];
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 mb-5`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.iconBg} ${c.iconText}`}>
          {icon}
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─── Field Helpers ────────────────────────────────────────────────────────── */

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1.5">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand transition-colors pr-8"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
      </div>
    </label>
  );
}

function TextAreaField({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1.5">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600 resize-none"
      />
    </label>
  );
}
