"use client";

import { useMemo, useState, useTransition } from "react";
import {
  FloppyDisk, SpinnerGap, CheckCircle, X, Eye, EyeSlash, Star,
  LockKey, LinkSimple, SlidersHorizontal,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { Switch } from "@repo/ui/switch";
import { updatePaymentGatewayAction, activatePaymentGatewayAction } from "./actions";
import type { AdminGatewayField, AdminGatewayView } from "./api";
import { getGatewayMeta } from "./gateway-meta";

interface Props {
  gateway: AdminGatewayView;
  onClose: () => void;
  onSaved: (updated: AdminGatewayView[]) => void;
}

const GROUP_ICON: Record<string, typeof LockKey> = {
  Credentials: LockKey,
  Authentication: LockKey,
  "API Endpoints": LinkSimple,
  Advanced: SlidersHorizontal,
};

function groupFields(fields: AdminGatewayField[]) {
  const groups: { name: string; fields: AdminGatewayField[] }[] = [];
  for (const field of fields) {
    const name = field.group ?? "Credentials";
    let group = groups.find((g) => g.name === name);
    if (!group) {
      group = { name, fields: [] };
      groups.push(group);
    }
    group.fields.push(field);
  }
  return groups;
}

export function GatewayModal({ gateway, onClose, onSaved }: Props) {
  const meta = getGatewayMeta(gateway.id);
  const Icon = meta.icon;

  // Only non-secret fields carry an editable `value` from the server; secret
  // fields are represented purely by `isSet` — we never receive their real
  // value, so the local form starts blank for them (typing = "change it",
  // leaving blank = "leave it alone").
  const initialValues = useMemo(() => {
    const out: Record<string, string> = {};
    for (const f of gateway.fields) out[f.key] = f.secret ? "" : (f.value ?? "");
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway.id]);

  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [isTogglingEnabled, startEnabledTransition] = useTransition();
  const [isActivating, startActivateTransition] = useTransition();

  const isDirty = touched.size > 0;
  const isBusy = isPending || isTogglingEnabled || isActivating;
  const groups = useMemo(() => groupFields(gateway.fields), [gateway.fields]);

  function handleChange(key: string, value: string) {
    setValues((p) => ({ ...p, [key]: value }));
    setTouched((p) => new Set(p).add(key));
  }

  function toggleReveal(key: string) {
    setRevealed((p) => {
      const next = new Set(p);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleClose() {
    if (isDirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    onClose();
  }

  function handleSave() {
    if (!isDirty) { onClose(); return; }
    startTransition(async () => {
      const credentials: Record<string, string> = {};
      for (const key of touched) credentials[key] = values[key] ?? "";

      const res = await updatePaymentGatewayAction(gateway.id, { credentials });
      if (res.success) {
        onSaved(res.data);
        toast.success(`${gateway.name} credentials saved`);
        onClose();
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  function handleToggleEnabled() {
    startEnabledTransition(async () => {
      const res = await updatePaymentGatewayAction(gateway.id, { enabled: !gateway.enabled });
      if (res.success) {
        onSaved(res.data);
        toast.success(gateway.enabled ? `${gateway.name} disabled` : `${gateway.name} enabled`);
      } else {
        toast.error(res.message ?? "Failed to update");
      }
    });
  }

  function handleActivate() {
    startActivateTransition(async () => {
      const res = await activatePaymentGatewayAction(gateway.id);
      if (res.success) {
        onSaved(res.data);
        toast.success(`${gateway.name} is now the active gateway`);
      } else {
        toast.error(res.message ?? "Failed to activate");
      }
    });
  }

  return (
    <div
      className="modal-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 backdrop-blur-sm dark:bg-black/60 sm:p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel-in flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-3xl sm:rounded-lg"
      >
        {/* Header */}
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${meta.color.bg} ${meta.color.text} ${meta.color.darkBg} ${meta.color.darkText}`}>
            <Icon size={19} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-bold text-gray-900 dark:text-white">{gateway.name}</h2>
              {gateway.isActive && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                  <Star size={9} weight="fill" /> Active
                </span>
              )}
              {isDirty && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{meta.description}</p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2" aria-label={gateway.enabled ? `Disable ${gateway.name}` : `Enable ${gateway.name}`}>
              <Switch
                checked={gateway.enabled}
                onCheckedChange={handleToggleEnabled}
                disabled={isBusy}
                className="data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-slate-700 focus-visible:ring-brand-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              />
            </label>
            <button
              onClick={handleActivate}
              disabled={isBusy || gateway.isActive || !gateway.enabled}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none dark:focus-visible:ring-offset-slate-950 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
              title={!gateway.enabled ? "Enable this gateway first" : undefined}
            >
              {isActivating ? <SpinnerGap size={13} className="animate-spin" /> : <Star size={13} weight="bold" />}
              {gateway.isActive ? "Active" : "Set Active"}
            </button>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body — credential fields, grouped into sections */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {groups.map((group, gi) => {
            const GroupIcon = GROUP_ICON[group.name] ?? LockKey;
            return (
              <div key={group.name} className={gi > 0 ? "mt-6" : ""}>
                <div className="mb-3.5 flex items-center gap-2">
                  <GroupIcon size={13} weight="bold" className="text-gray-400 dark:text-slate-500" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">{group.name}</p>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  {group.fields.map((field) => {
                    const isRevealed = revealed.has(field.key);
                    const alreadySaved = field.secret && field.isSet && !touched.has(field.key);
                    return (
                      <div key={field.key} className={field.secret ? "" : "sm:col-span-2"}>
                        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{field.label}</label>
                          {alreadySaved && (
                            <span
                              title="A value is already saved in the database for this field."
                              className="inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300"
                            >
                              <CheckCircle size={9} weight="fill" /> Already saved
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={field.secret && !isRevealed ? "password" : "text"}
                            value={values[field.key] ?? ""}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={alreadySaved ? "Leave blank to keep the saved value" : field.placeholder}
                            disabled={isPending}
                            spellCheck={false}
                            className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-10 text-gray-900 placeholder:text-gray-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40 ${
                              field.monospace ? "font-mono text-[13px] tracking-tight" : "text-sm"
                            }`}
                          />
                          {field.secret && (
                            <button
                              type="button"
                              onClick={() => toggleReveal(field.key)}
                              aria-label={isRevealed ? "Hide value" : "Show value"}
                              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                            >
                              {isRevealed ? <EyeSlash size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                        {alreadySaved ? (
                          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                            A value is already saved for this field and is hidden for security. Type a new value to replace it, or leave it blank to keep what&apos;s saved.
                          </p>
                        ) : field.helpText ? (
                          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{field.helpText}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            onClick={handleClose}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-slate-800 sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !isDirty}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
          >
            {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
            {isPending ? "Saving…" : isDirty ? "Save Changes" : "No changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
