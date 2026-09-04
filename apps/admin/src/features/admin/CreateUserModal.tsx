"use client";

import { useState, useTransition } from "react";
import { X, UserPlus } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { createUserAction } from "./actions/admin.actions";
import type { AdminUser } from "./api";

export function CreateUserModal({
  onClose,
  onCreated,
  defaultRole = "GUEST",
}: {
  onClose: () => void;
  onCreated: (user: AdminUser) => void;
  defaultRole?: string;
}) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [isPending, startTransition] = useTransition();

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
        role:      defaultRole,
      });
      if (res.success) {
        toast.success(defaultRole === "STUDENT" ? "Student created" : "User created");
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
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-none flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            {defaultRole === "STUDENT" ? "Add Student" : "Add User"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Field label="Last name"    value={form.lastName}  onChange={(v) => setForm({ ...form, lastName: v })} />
          </div>
          <Field label="Email"    value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="name@email.com" autoComplete="off" />
          <Field label="Phone"    value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="01XXXXXXXXX" autoComplete="off" />
          <Field label="Password *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" placeholder="Min. 6 characters" autoComplete="new-password" />
          <p className="text-[11px] text-gray-400 dark:text-slate-500">
            {defaultRole === "STUDENT"
              ? "New student will be created with the Student role."
              : "New users are created with the Guest role and can be promoted later."}
          </p>
        </div>

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
            <UserPlus className="h-4 w-4" /> {defaultRole === "STUDENT" ? "Create Student" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", autoComplete = "off",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand"
      />
    </label>
  );
}
