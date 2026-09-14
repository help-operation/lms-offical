"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FloppyDisk, SpinnerGap, CheckCircle, Info, WarningCircle, Star,
  Eye, EyeSlash, LockKey, LinkSimple, SlidersHorizontal, CaretDown,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { Switch } from "@repo/ui/switch";
import { ImagePickerField } from "@/shared/components/ImagePickerField";
import type { AdminGatewayField, AdminGatewayView } from "./api";
import { getGatewayMeta } from "./gateway-meta";
import { updatePaymentGatewayAction, activatePaymentGatewayAction } from "./actions";
import { getCheckoutPaymentImageAction, updateCheckoutPaymentImageAction } from "./checkout-image.actions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function fieldCount(gateway: AdminGatewayView) {
  const set = gateway.fields.filter((f) => (f.secret ? f.isSet : f.value?.trim())).length;
  return { set, total: gateway.fields.length, percent: Math.round((set / gateway.fields.length) * 100) };
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  initial: AdminGatewayView[];
}

export function PaymentGatewaysPage({ initial }: Props) {
  const [gateways, setGateways] = useState(initial);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const g of initial) m[g.id] = false;
    return m;
  });

  const activeGateway = gateways.find((g) => g.isActive);

  function handleGatewaySaved(updated: AdminGatewayView[]) {
    setGateways(updated);
  }

  function toggle(id: string) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  // ── Checkout Payment Image state ─────────────────────────────────────────
  const [checkoutImage, setCheckoutImage] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(true);
  const [checkoutSaving, setCheckoutSaving] = useState(false);

  useEffect(() => {
    getCheckoutPaymentImageAction()
      .then((url) => setCheckoutImage(url))
      .catch(() => {})
      .finally(() => setCheckoutLoading(false));
  }, []);

  async function handleSaveCheckoutImage() {
    setCheckoutSaving(true);
    try {
      await updateCheckoutPaymentImageAction(checkoutImage);
      toast.success("Checkout image saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setCheckoutSaving(false);
    }
  }

  async function handleClearCheckoutImage() {
    setCheckoutSaving(true);
    try {
      await updateCheckoutPaymentImageAction("");
      setCheckoutImage("");
      toast.success("Checkout image removed");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setCheckoutSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Info size={16} weight="fill" className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-300" />
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-200">
            <strong>Keep these credentials private.</strong> They authorize real payment processing.
            Secret fields are encrypted and never shown once saved — leaving one blank keeps its current value.
          </p>
        </div>
        {activeGateway && (
          <div className="flex shrink-0 items-center gap-2 self-start rounded-lg border border-amber-200/70 bg-white/60 px-3 py-1.5 dark:border-amber-500/20 dark:bg-slate-900/40 sm:self-auto">
            <Star size={13} weight="fill" className="text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {activeGateway.name} is charging customers
            </span>
          </div>
        )}
      </div>

      {/* Gateway sections */}
      {gateways.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <WarningCircle size={22} weight="fill" className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Couldn&apos;t load payment gateways</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Refresh the page, or check your connection to the server.</p>
          </div>
        </div>
      ) : (
        gateways.map((gateway, idx) => (
          <GatewaySection
            key={gateway.id}
            gateway={gateway}
            index={idx}
            isOpen={expanded[gateway.id] ?? false}
            onToggle={() => toggle(gateway.id)}
            onSaved={handleGatewaySaved}
          />
        ))
      )}

      {/* Checkout Payment Image — collapsible */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: gateways.length * 0.03, ease: "easeOut" }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <button
          onClick={() => setExpanded((p) => ({ ...p, _checkout: !p._checkout }))}
          className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 shadow-sm ring-1 ring-black/5 dark:bg-slate-800 dark:text-gray-300 dark:ring-white/10">
            <ImageIcon size={18} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Checkout Payment Image</h3>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">Image shown in Checkout → Payment Method card</p>
          </div>
          <CaretDown
            size={16}
            weight="bold"
            className={`shrink-0 text-gray-400 transition-transform duration-200 dark:text-slate-500 ${expanded._checkout ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {expanded._checkout && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="border-t border-gray-100 px-5 py-5 dark:border-slate-800">
                {checkoutLoading ? (
                  <p className="text-xs text-gray-400">Loading...</p>
                ) : (
                  <>
                    <ImagePickerField
                      value={checkoutImage}
                      onChange={setCheckoutImage}
                      placeholder="Select payment image or leave blank to hide"
                      previewClassName="hidden"
                    />
                    {checkoutImage && (
                      <div className="mt-3 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1.5 dark:border-slate-600 dark:bg-slate-900">
                        <img src={checkoutImage} alt="Checkout preview" className="max-h-16 w-auto rounded object-contain" />
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-slate-800">
                      {checkoutImage && (
                        <button
                          onClick={handleClearCheckoutImage}
                          disabled={checkoutSaving}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        onClick={handleSaveCheckoutImage}
                        disabled={checkoutSaving}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
                      >
                        {checkoutSaving ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
                        {checkoutSaving ? "Saving..." : "Save Image"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Per-gateway inline section ──────────────────────────────────────────────

// Need ImageIcon for checkout section
import { Image as ImageIcon } from "@phosphor-icons/react";

function GatewaySection({
  gateway,
  index,
  isOpen,
  onToggle,
  onSaved,
}: {
  gateway: AdminGatewayView;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onSaved: (updated: AdminGatewayView[]) => void;
}) {
  const meta = getGatewayMeta(gateway.id);
  const Icon = meta.icon;
  const stats = fieldCount(gateway);

  const initialValues = useMemo(() => {
    const out: Record<string, string> = {};
    for (const f of gateway.fields) out[f.key] = f.secret ? "" : (f.value ?? "");
    return out;
  }, [gateway.id, gateway.fields]);

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

  function handleSave() {
    if (!isDirty) return;
    startTransition(async () => {
      const credentials: Record<string, string> = {};
      for (const key of touched) credentials[key] = values[key] ?? "";
      const res = await updatePaymentGatewayAction(gateway.id, { credentials });
      if (res.success) {
        onSaved(res.data);
        setTouched(new Set());
        toast.success(`${gateway.name} credentials saved`);
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  function handleReset() {
    setValues(initialValues);
    setTouched(new Set());
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${meta.color.bg} ${meta.color.text} ${meta.color.darkBg} ${meta.color.darkText}`}
        >
          <Icon size={18} weight="fill" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{gateway.name}</h3>
            {gateway.isActive && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-100 bg-green-50 px-1.5 py-0.5 text-[9px] font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                <Star size={8} weight="fill" /> Active
              </span>
            )}
            {isDirty && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unsaved
              </span>
            )}
          </div>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{meta.description}</p>
        </div>

        {/* Enabled dot + progress */}
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${gateway.enabled ? "bg-green-500" : "bg-gray-300 dark:bg-slate-600"}`} />
            <span className="text-gray-400 dark:text-slate-500">
              {gateway.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500">
              {stats.set}/{stats.total}
            </span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.percent === 100 ? "bg-green-500 dark:bg-green-400" : "bg-brand-500 dark:bg-brand-400"
                }`}
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        </div>

        <CaretDown
          size={16}
          weight="bold"
          className={`shrink-0 text-gray-400 transition-transform duration-200 dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-gray-100 px-5 py-5 dark:border-slate-800">
              {/* Controls bar */}
              <div className="mb-5 flex flex-wrap items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2" aria-label={gateway.enabled ? `Disable ${gateway.name}` : `Enable ${gateway.name}`}>
                  <Switch
                    checked={gateway.enabled}
                    onCheckedChange={handleToggleEnabled}
                    disabled={isBusy}
                    className="data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-slate-700 focus-visible:ring-brand-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Enabled</span>
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
              </div>

              {/* Grouped credential fields */}
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
                                A value is already saved and is hidden for security. Type a new value to replace it, or leave blank to keep what&apos;s saved.
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

              {/* Save bar */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-slate-800">
                {isDirty && (
                  <button
                    onClick={handleReset}
                    disabled={isPending}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isPending || !isDirty}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
                >
                  {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
                  {isPending ? "Saving..." : isDirty ? "Save" : "No changes"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
