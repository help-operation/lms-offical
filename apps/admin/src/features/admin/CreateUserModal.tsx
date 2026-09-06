"use client";

import { useState, useTransition } from "react";
import { X, UserPlus, ChevronDown } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { createUserAction } from "./actions/admin.actions";
import type { AdminUser } from "./api";

const ALL_ROLES = [
  { value: "GUEST", label: "Guest" },
  { value: "STUDENT", label: "Student" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "MARKETING_OFFICER", label: "Marketing Officer" },
  { value: "ACCOUNTANT", label: "Accountant" },
];

const DEPARTMENTS = [
  "Administration", "Academics", "Marketing", "Finance", "IT", "HR", "Operations", "Support",
];

const DESIGNATIONS = [
  "Manager", "Officer", "Executive", "Coordinator", "Assistant", "Director", "Lead", "Intern",
];

export function CreateUserModal({
  onClose,
  onCreated,
  defaultRole = "GUEST",
}: {
  onClose: () => void;
  onCreated: (user: AdminUser) => void;
  defaultRole?: string;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: defaultRole,
    gender: "",
    country: "",
    city: "",
    department: "",
    designation: "",
  });
  const [isPending, startTransition] = useTransition();

  const isStudentContext = defaultRole === "STUDENT";

  function handleCreate() {
    if (!form.firstName.trim()) { toast.error("First name is required"); return; }
    if (!form.email.trim() && !form.phone.trim()) { toast.error("Email or phone is required"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    startTransition(async () => {
      const res = await createUserAction({
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim()  || undefined,
        phone:     form.phone.trim()  || undefined,
        password:  form.password,
        role:      form.role,
        gender:    form.gender || undefined,
        country:   form.country || undefined,
        city:      form.city || undefined,
      });
      if (res.success) {
        toast.success(isStudentContext ? "Student created" : "User created");
        onCreated(res.data);
      } else {
        toast.error(res.message ?? "Failed to create user");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-none flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {isStudentContext ? "Add Student" : "Add Staff Member"}
            </h2>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
              Fill in the details to create a new {isStudentContext ? "student" : "staff"} account
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Personal Info */}
          <SectionTitle title="Personal Information" />
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Field label="First name *" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} placeholder="Enter first name" />
            <Field label="Last name *" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} placeholder="Enter last name" />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="name@email.com" type="email" />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="01XXXXXXXXX" />
            <SelectField label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} options={[
              { value: "", label: "Select gender" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]} />
            <Field label="Password *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" placeholder="Min. 6 characters" />
          </div>

          {/* Work Info */}
          {!isStudentContext && (
            <>
              <SectionTitle title="Work Information" />
              <div className="grid grid-cols-2 gap-3 mb-5">
                <SelectField label="Role *" value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ALL_ROLES.map((r) => ({ value: r.value, label: r.label }))} />
                <SelectField label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={[
                  { value: "", label: "Select department" },
                  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
                ]} />
                <SelectField label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} options={[
                  { value: "", label: "Select designation" },
                  ...DESIGNATIONS.map((d) => ({ value: d, label: d })),
                ]} />
              </div>
            </>
          )}

          {/* Location Info */}
          <SectionTitle title="Location" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} placeholder="e.g. Bangladesh" />
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="e.g. Dhaka" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" /> {isStudentContext ? "Create Student" : "Create Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h3>
      <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand transition-colors"
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
      <span className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand transition-colors pr-8"
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
