"use client";

import { useState, useTransition } from "react";
import { X, Check, Lock, Loader2, Mail as MailIcon, ShieldCheck } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { useLocalization } from "@/shared/context/LocalizationContext";

type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; message?: string };

export interface EditPersonModalProps {
  entityLabel: string; // "User" | "Student" | "Teacher"
  person: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone?: string | null;
    status: string;
    avatar?: string | null;
    createdAt?: string | null;
  };
  /** Set to false to hide the Phone field entirely (e.g. Teachers have no phone column). */
  showPhone?: boolean;
  onClose: () => void;
  onSaved: (updated: { firstName: string; lastName: string; email: string | null; phone?: string | null; status?: string }) => void;
  updateAction: (id: number, data: { firstName?: string; lastName?: string; email?: string; phone?: string }) => Promise<ActionResult<any>>;
  suspendAction: (id: number) => Promise<ActionResult<{ status: string }>>;
  activateAction: (id: number) => Promise<ActionResult<{ status: string }>>;
  resetPasswordAction: (id: number, password: string) => Promise<ActionResult>;
}

export function EditPersonModal({
  entityLabel,
  person,
  showPhone = true,
  onClose,
  onSaved,
  updateAction,
  suspendAction,
  activateAction,
  resetPasswordAction,
}: EditPersonModalProps) {
  const { formatDate } = useLocalization();
  const [form, setForm] = useState({
    firstName: person.firstName ?? "",
    lastName:  person.lastName  ?? "",
    email:     person.email     ?? "",
    phone:     person.phone     ?? "",
  });
  const [status, setStatus] = useState(person.status);
  const [password, setPassword]         = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [statusAction, setStatusAction] = useState<"suspend" | "activate" | null>(null);
  const [infoP,   startInfoT]   = useTransition();
  const [pwP,     startPwT]     = useTransition();
  const [statusP, startStatusT] = useTransition();

  const infoChanged =
    form.firstName !== (person.firstName ?? "") ||
    form.lastName  !== (person.lastName  ?? "") ||
    form.email     !== (person.email     ?? "") ||
    (showPhone && form.phone !== (person.phone ?? ""));

  function saveInfo() {
    if (!form.firstName.trim()) { toast.error("First name is required"); return; }
    startInfoT(async () => {
      const res = await updateAction(person.id, {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim()  || undefined,
        email:     form.email.trim()     || undefined,
        ...(showPhone ? { phone: form.phone.trim() || undefined } : {}),
      });
      if (res.success) {
        toast.success(`${entityLabel} info saved`);
        onSaved({ firstName: form.firstName, lastName: form.lastName, email: form.email || null, phone: form.phone || null });
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  function savePassword() {
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPw) { toast.error("Passwords do not match"); return; }
    startPwT(async () => {
      const res = await resetPasswordAction(person.id, password);
      if (res.success) {
        toast.success("Password updated");
        setPassword("");
        setConfirmPw("");
      } else {
        toast.error(res.message ?? "Failed to update password");
      }
    });
  }

  function handleSuspend() {
    setStatusAction(null);
    startStatusT(async () => {
      const res = await suspendAction(person.id);
      if (res.success) {
        toast.success(`${entityLabel} suspended`);
        setStatus("suspended");
        onSaved({ ...form, email: form.email || null, status: "suspended" });
      } else {
        toast.error(res.message ?? "Failed to suspend");
      }
    });
  }

  function handleActivate() {
    setStatusAction(null);
    startStatusT(async () => {
      const res = await activateAction(person.id);
      if (res.success) {
        toast.success(`${entityLabel} activated`);
        setStatus("active");
        onSaved({ ...form, email: form.email || null, status: "active" });
      } else {
        toast.error(res.message ?? "Failed to activate");
      }
    });
  }

  const isPending = infoP || pwP || statusP;

  return (
    <>
      <ConfirmModal
        open={!!statusAction}
        title={statusAction === "suspend" ? `Suspend ${entityLabel}` : `Activate ${entityLabel}`}
        message={
          statusAction === "suspend"
            ? <>Suspend <strong>{person.firstName} {person.lastName}</strong>? They will lose access to the platform.</>
            : <>Activate <strong>{person.firstName} {person.lastName}</strong>? They will regain access to the platform.</>
        }
        confirmLabel={statusAction === "suspend" ? "Yes, Suspend" : "Yes, Activate"}
        variant={statusAction === "suspend" ? "warning" : "success"}
        isPending={statusP}
        onConfirm={statusAction === "suspend" ? handleSuspend : handleActivate}
        onClose={() => setStatusAction(null)}
      />

      <style>{`
        .epm-scroll::-webkit-scrollbar { width: 5px; }
        .epm-scroll::-webkit-scrollbar-track { background: transparent; }
        .epm-scroll::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.35); border-radius: 9999px; }
        .epm-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.55); }
        .epm-scroll { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.35) transparent; }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col max-h-[88vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative shrink-0 bg-gradient-to-br from-brand-600 to-brand-500 dark:from-brand dark:to-brand/70 px-6 pt-6 pb-8">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3.5">
              {person.avatar ? (
                <img src={person.avatar} alt={person.firstName} className="h-14 w-14 rounded-2xl object-cover shrink-0 ring-2 ring-white/40 shadow-lg" />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-bold text-lg shrink-0 ring-2 ring-white/40 shadow-lg">
                  {person.firstName?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white truncate">
                  {person.firstName} {person.lastName}
                </h2>
                <p className="text-xs text-brand-100 dark:text-white/70 mt-0.5">
                  {entityLabel} #{person.id}
                  {person.createdAt && (
                    <span> · Joined {formatDate(person.createdAt)}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="epm-scroll flex-1 overflow-y-auto px-6 py-5 space-y-3 -mt-4">
            {/* Basic Info */}
            <section className="rounded-2xl bg-gray-50 dark:bg-slate-800/50 p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3">Basic Info</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name *" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
                  <Field label="Last name"    value={form.lastName}  onChange={(v) => setForm({ ...form, lastName: v })} />
                </div>
                <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="name@email.com" icon={<MailIcon className="h-3.5 w-3.5" />} />
                {showPhone && (
                  <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="01XXXXXXXXX" />
                )}
              </div>
              <button
                onClick={saveInfo}
                disabled={!infoChanged || infoP}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 shadow-sm shadow-brand-600/30 dark:shadow-none transition-colors"
              >
                {infoP ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save Info
              </button>
            </section>

            {/* Account Status */}
            <section className="rounded-2xl bg-gray-50 dark:bg-slate-800/50 p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" /> Account Status
              </h3>
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-semibold capitalize ${
                  status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                    : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                }`}>
                  {status}
                </span>
                {status === "suspended" ? (
                  <button
                    onClick={() => setStatusAction("activate")}
                    disabled={statusP}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 shadow-sm shadow-green-600/30 dark:shadow-none transition-colors"
                  >
                    {statusP ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Activate {entityLabel}
                  </button>
                ) : (
                  <button
                    onClick={() => setStatusAction("suspend")}
                    disabled={statusP}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 shadow-sm shadow-amber-500/30 dark:shadow-none transition-colors"
                  >
                    {statusP && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Suspend {entityLabel}
                  </button>
                )}
              </div>
            </section>

            {/* Password Reset */}
            <section className="rounded-2xl bg-gray-50 dark:bg-slate-800/50 p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Reset Password
              </h3>
              <div className="space-y-3">
                <Field label="New password" value={password} onChange={setPassword} type="password" placeholder="Min. 6 characters" autoComplete="new-password" />
                <Field label="Confirm password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Repeat password" autoComplete="new-password" />
              </div>
              <button
                onClick={savePassword}
                disabled={!password || !confirmPw || pwP}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-gray-800 dark:bg-slate-700 hover:bg-gray-900 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 shadow-sm transition-colors"
              >
                {pwP ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                Update Password
              </button>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
            <button
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", icon, autoComplete = "off",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: React.ReactNode; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{label}</span>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand/20 transition-colors ${icon ? "pl-9 pr-3" : "px-3"}`}
        />
      </div>
    </label>
  );
}
