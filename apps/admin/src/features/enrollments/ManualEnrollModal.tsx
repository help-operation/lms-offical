"use client";

import { useEffect, useState, useTransition } from "react";
import { X, SpinnerGap, MagnifyingGlass, UserPlus, Check, Copy, CheckCircle } from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import {
  searchEnrollUsersAction,
  getRecordedCourseOptionsAction,
  getLiveCourseOptionsAction,
  getLiveBatchOptionsAction,
  createManualEnrollmentAction,
} from "./actions";
import type {
  EnrollUser,
  EnrollCourseOption,
  EnrollLiveOption,
  EnrollBatchOption,
  ManualEnrollPayload,
  EnrollLeadContext,
} from "./types";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

export function ManualEnrollModal({
  onClose,
  onEnrolled,
  lead,
  mode = "enroll",
}: {
  onClose: () => void;
  onEnrolled: () => void;
  lead?: EnrollLeadContext;
  mode?: "enroll" | "account";
}) {
  // Derived behaviour. account → provision account only (no course).
  // enroll on a paid checkout lead → fulfil its existing order (no course/payment).
  const accountOnly = mode === "account";
  const fulfillOrder = mode === "enroll" && !!lead?.orderPaid;
  const hideCourse = accountOnly || fulfillOrder;

  // ── User ──
  const [userMode, setUserMode] = useState<"search" | "new">(lead ? "new" : "search");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EnrollUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EnrollUser | null>(null);
  const [nu, setNu] = useState(() => ({
    fullName: (lead?.name ?? "").trim(),
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
  }));

  // ── Course ──
  const [courseType, setCourseType] = useState<"recorded" | "live">("recorded");
  const [recorded, setRecorded] = useState<EnrollCourseOption[]>([]);
  const [live, setLive] = useState<EnrollLiveOption[]>([]);
  const [batches, setBatches] = useState<EnrollBatchOption[]>([]);
  const [courseId, setCourseId] = useState<number | "">(
    lead?.courseIds && lead.courseIds.length > 0 ? lead.courseIds[0]! : "",
  );
  const [liveCourseId, setLiveCourseId] = useState<number | "">("");
  const [batchId, setBatchId] = useState<number | "">("");

  // ── Payment ──
  const [paid, setPaid] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [bkashTrxId, setBkashTrxId] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);

  // Set after a successful enrollment that created a NEW account.
  const [createdCreds, setCreatedCreds] = useState<{ loginId: string; password: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  const needEmailForLive = courseType === "live";

  // Load course options once.
  useEffect(() => {
    getRecordedCourseOptionsAction().then((r) => r.success && setRecorded(r.data));
    getLiveCourseOptionsAction().then((r) => r.success && setLive(r.data));
  }, []);

  // On mount: if lead has email/phone, check if an account already exists and
  // auto-switch to the Existing tab with that user pre-selected.
  // Search both email and phone independently — an account may have been
  // created with one identifier and the other added later from the dashboard.
  useEffect(() => {
    if (!lead) return;
    const { email, phone } = lead;
    if (!email && !phone) return;

    async function checkExisting() {
      const [emailResult, phoneResult] = await Promise.all([
        email ? searchEnrollUsersAction(email) : null,
        phone ? searchEnrollUsersAction(phone) : null,
      ]);

      for (const result of [emailResult, phoneResult]) {
        if (!result?.success) continue;
        const match = result.data.find(
          (u) =>
            (email && u.email === email) ||
            (phone && u.phone === phone),
        );
        if (match) {
          setUserMode("search");
          setSelectedUser(match);
          return;
        }
      }
    }

    checkExisting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced user search.
  useEffect(() => {
    if (userMode !== "search") return;
    let active = true;
    const t = setTimeout(async () => {
      setSearching(true);
      const r = await searchEnrollUsersAction(search);
      if (active && r.success) setResults(r.data);
      if (active) setSearching(false);
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [search, userMode]);

  // Load batches when a live course is chosen.
  useEffect(() => {
    setBatchId("");
    if (courseType === "live" && liveCourseId) {
      getLiveBatchOptionsAction(Number(liveCourseId)).then((r) => r.success && setBatches(r.data));
    } else {
      setBatches([]);
    }
  }, [liveCourseId, courseType]);

  function priceFor(): string {
    if (courseType === "recorded") {
      const c = recorded.find((x) => x.id === Number(courseId));
      if (!c) return "";
      return c.discountPrice && Number(c.discountPrice) > 0 ? c.discountPrice : c.price;
    }
    const c = live.find((x) => x.id === Number(liveCourseId));
    return c ? c.price : "";
  }

  // Prefill amount received with the full course fee when switching to Paid —
  // one click still means "fully paid" by default, but it's freely reducible.
  useEffect(() => {
    if (paid && !amountReceived) setAmountReceived(priceFor());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  const feeAmount = paid ? Number(priceFor() || 0) : 0;
  const receivedAmount = paid ? Math.max(0, Number(amountReceived || 0)) : 0;
  const dueAmount = Math.max(0, feeAmount - receivedAmount);
  const paymentStatus: "due" | "partial" | "paid" =
    receivedAmount <= 0 ? "due" : dueAmount <= 0 ? "paid" : "partial";

  function validate(): string | null {
    if (userMode === "search") {
      if (!selectedUser) return "Select a student";
      if (!hideCourse && needEmailForLive && !selectedUser.email)
        return "This user has no email — live courses require one";
    } else {
      if (!nu.fullName.trim()) return "Enter the student's name";
      if (!nu.phone.trim() && !nu.email.trim()) return "Enter a phone number or email";
      if (!hideCourse && needEmailForLive && !nu.email.trim()) return "Live courses require an email";
    }
    if (!hideCourse) {
      if (courseType === "recorded" && !courseId) return "Select a course";
      if (courseType === "live" && !liveCourseId) return "Select a live course";
      if (paid && feeAmount <= 0) return "Selected course has no price to charge — switch to Free";
    }
    return null;
  }

  function submit() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const payload: ManualEnrollPayload = {
      paid: !hideCourse && paid,
      notifyEmail,
      notifySms,
      ...(lead ? { leadId: lead.id } : {}),
      accountOnly,
      fulfillOrder,
      ...(!hideCourse && expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      ...(userMode === "search"
        ? { userId: selectedUser!.id }
        : (() => {
            const [first, ...rest] = nu.fullName.trim().split(/\s+/);
            return {
              newUser: {
                firstName: first ?? "",
                lastName: rest.length > 0 ? rest.join(" ") : undefined,
                phone: nu.phone.trim() || undefined,
                email: nu.email.trim() || undefined,
              },
            };
          })()),
      ...(hideCourse
        ? {}
        : {
            courseType,
            ...(courseType === "recorded"
              ? { courseId: Number(courseId) }
              : { liveCourseId: Number(liveCourseId), batchId: batchId ? Number(batchId) : undefined }),
            ...(paid
              ? {
                  feeAmount,
                  amountReceived: receivedAmount,
                  bkashTrxId: bkashTrxId.trim() || undefined,
                  payerPhone: payerPhone.trim() || undefined,
                }
              : {}),
          }),
    };

    startTransition(async () => {
      const res = await createManualEnrollmentAction(payload);
      if (res.success) {
        onEnrolled();
        if (accountOnly && res.data?.alreadyExisted) {
          toast.success("Existing account linked");
          onClose();
        } else if (res.data?.tempPassword) {
          // Brand-new account created → show credentials for the admin to relay.
          toast.success(accountOnly ? "Account created" : "Student enrolled");
          const loginId = (userMode === "new" ? nu.email || nu.phone : selectedUser?.email || selectedUser?.phone) ?? "";
          setCreatedCreds({ loginId, password: res.data.tempPassword });
        } else {
          toast.success(accountOnly ? "Account created" : "Student enrolled");
          onClose();
        }
      } else {
        toast.error(res.message ?? "Failed to enroll");
      }
    });
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Copy failed"),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {accountOnly ? "Create Account" : "Enroll a Student"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {accountOnly
                ? "Create a login account for this person — no course."
                : fulfillOrder
                  ? "Fulfil this paid lead — create the account and enroll into the courses they paid for."
                  : "Manually enroll someone into a recorded or live course."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition"
            aria-label="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {createdCreds ? (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15 mb-3">
                  <CheckCircle size={26} weight="fill" className="text-green-500 dark:text-green-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {accountOnly ? "Account created" : "Student enrolled"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  A new account was created. Share these login details with the student.
                </p>
              </div>
              <div className="rounded-xl border border-brand-100 dark:border-brand/30 bg-brand-50 dark:bg-brand/10 p-4 space-y-3">
                <CredRow label="Login ID" value={createdCreds.loginId} onCopy={copy} />
                <CredRow label="Temporary password" value={createdCreds.password} mono onCopy={copy} />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-3">
                The student should change this password after their first login.
                {notifyEmail && notifySms
                  ? " A copy was also sent via email and SMS."
                  : notifyEmail
                    ? " A copy was also emailed to them."
                    : notifySms
                      ? " A copy was also sent by SMS."
                      : ""}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand-hover text-white text-sm font-semibold px-5 py-2.5 transition"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ── Student ── */}
          <Section title="Student">
            <div className="flex gap-2 mb-3">
              <Tab active={userMode === "search"} onClick={() => setUserMode("search")}>
                Existing
              </Tab>
              <Tab active={userMode === "new"} onClick={() => setUserMode("new")}>
                <UserPlus size={13} weight="bold" /> New person
              </Tab>
            </div>

            {userMode === "search" ? (
              selectedUser ? (
                <div className="flex items-center justify-between rounded-xl border border-brand-200 dark:border-brand/30 bg-brand-50 dark:bg-brand/10 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {`${selectedUser.firstName} ${selectedUser.lastName}`.trim()}
                      <span className="ml-2 text-[10px] font-bold uppercase text-brand-600 dark:text-brand">
                        {selectedUser.role}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {selectedUser.email ?? selectedUser.phone ?? "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-xs font-semibold text-brand-600 dark:text-brand hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <MagnifyingGlass
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, email or phone"
                      className="input-base w-full pl-9"
                      autoFocus
                    />
                  </div>
                  <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-gray-100 dark:border-slate-800 divide-y divide-gray-50 dark:divide-slate-800">
                    {searching ? (
                      <p className="px-3 py-3 text-xs text-gray-400 dark:text-slate-500 flex items-center gap-2">
                        <SpinnerGap size={13} className="animate-spin" /> Searching…
                      </p>
                    ) : results.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-gray-400 dark:text-slate-500">
                        {search ? "No users found — try “New person”." : "Type to search users."}
                      </p>
                    ) : (
                      results.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition flex items-center justify-between gap-2"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                              {`${u.firstName} ${u.lastName}`.trim()}
                            </span>
                            <span className="block text-xs text-gray-400 dark:text-slate-500 truncate">
                              {u.email ?? u.phone ?? "—"}
                            </span>
                          </span>
                          <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 shrink-0">
                            {u.role}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <FieldInput label="Full name *" value={nu.fullName} onChange={(v) => setNu({ ...nu, fullName: v })} placeholder="e.g. Rahim Uddin" />
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Phone" value={nu.phone} onChange={(v) => setNu({ ...nu, phone: v })} placeholder="01XXXXXXXXX" />
                  <FieldInput label={needEmailForLive ? "Email *" : "Email"} value={nu.email} onChange={(v) => setNu({ ...nu, email: v })} placeholder="name@email.com" />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 -mt-1">
                  At least one of phone or email is required{needEmailForLive ? " — email is mandatory for live courses." : "."}
                </p>
              </div>
            )}
          </Section>

          {fulfillOrder && (
            <div className="rounded-xl border border-amber-100 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
              This lead already paid. We’ll create their account and enroll them into the
              course(s) on their existing invoice — no new charge.
            </div>
          )}

          {!hideCourse && (
          <>
          {/* ── Course ── */}
          <Section title="Course">
            <div className="flex gap-2 mb-3">
              <Tab active={courseType === "recorded"} onClick={() => setCourseType("recorded")}>
                Recorded
              </Tab>
              <Tab active={courseType === "live"} onClick={() => setCourseType("live")}>
                Live
              </Tab>
            </div>

            {courseType === "recorded" ? (
              <SearchSelect
                label="Recorded course *"
                value={courseId}
                onChange={(v) => setCourseId(v)}
                placeholder="Search a course…"
                options={recorded.map((c) => ({ value: c.id, label: c.title }))}
              />
            ) : (
              <div className="space-y-3">
                <SearchSelect
                  label="Live course *"
                  value={liveCourseId}
                  onChange={(v) => setLiveCourseId(v)}
                  placeholder="Search a live course…"
                  options={live.map((c) => ({ value: c.id, label: c.title }))}
                />
                <FieldSelect
                  label="Batch (optional)"
                  value={batchId}
                  onChange={(v) => setBatchId(v)}
                  placeholder={liveCourseId ? "No specific batch" : "Pick a live course first"}
                  options={batches.map((b) => ({
                    value: b.id,
                    label: `${b.batchName}${b.startDate ? ` — ${b.startDate}` : ""}`,
                  }))}
                />
              </div>
            )}
          </Section>

          {/* ── Payment ── */}
          <Section title="Enrollment type">
            <div className="flex gap-2 mb-3">
              <Tab active={!paid} onClick={() => setPaid(false)}>
                Free (no invoice)
              </Tab>
              <Tab active={paid} onClick={() => setPaid(true)}>
                Paid
              </Tab>
            </div>

            {paid && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Course fee (৳)</span>
                    <p className="input-base w-full flex items-center bg-gray-50 dark:bg-slate-800/60 text-gray-500 dark:text-slate-400">
                      {feeAmount > 0 ? feeAmount.toLocaleString() : "Select a course first"}
                    </p>
                  </div>
                  <FieldInput
                    label="Amount received (৳)"
                    value={amountReceived}
                    onChange={setAmountReceived}
                    type="number"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 px-3 py-2.5">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-500 dark:text-slate-400">
                      Total paid <span className="font-semibold text-gray-800 dark:text-white">৳{receivedAmount.toLocaleString()}</span>
                    </span>
                    <span className="text-gray-500 dark:text-slate-400">
                      Due <span className="font-semibold text-gray-800 dark:text-white">৳{dueAmount.toLocaleString()}</span>
                    </span>
                  </div>
                  <PaymentStatusBadge status={paymentStatus} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="bKash Trx ID" value={bkashTrxId} onChange={setBkashTrxId} placeholder="e.g. 8N7A6B5C4D" />
                  <FieldInput label="Payer phone" value={payerPhone} onChange={setPayerPhone} placeholder="bKash sender number" />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 -mt-1">
                  Payment status is calculated automatically from the fee and amount received. Leaving amount received
                  at 0 records the enrollment as Due — more payments can be added later from Manage Enrollment.
                </p>
              </div>
            )}
          </Section>
          </>
          )}

          {/* Access expiry (optional) */}
          {!hideCourse && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Access expiry <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="input-base"
              />
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                Leave blank for permanent access. If set, access will be revoked on this date.
              </p>
            </div>
          )}

          {/* Notify */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Notify the student</p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-brand-600 dark:text-brand focus:ring-brand-500 dark:focus:ring-brand/30"
                />
                Email
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={notifySms}
                  onChange={(e) => setNotifySms(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-brand-600 dark:text-brand focus:ring-brand-500 dark:focus:ring-brand/30"
                />
                SMS
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 transition"
          >
            {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <Check size={15} weight="bold" />}
            {accountOnly ? "Create Account" : "Enroll Student"}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function CredRow({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: (t: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">{label}</p>
        <p
          className={`text-sm truncate ${
            mono ? "font-mono font-bold text-brand-700 dark:text-brand" : "font-medium text-gray-900 dark:text-white"
          }`}
        >
          {value || "—"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-brand-200 dark:border-brand/30 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand hover:bg-brand-50 dark:hover:bg-brand/10 transition"
      >
        <Copy size={12} weight="bold" /> Copy
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-brand-600 dark:bg-brand text-white shadow-sm" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base w-full"
      />
    </label>
  );
}

function SearchSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder: string;
  options: { value: number; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.value === value) ?? null;

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  return (
    <div className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</span>
      <div className="relative">
        {selected && !open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setQuery("");
            }}
            className="input-base w-full text-left flex items-center justify-between gap-2"
          >
            <span className="truncate">{selected.label}</span>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand shrink-0">Change</span>
          </button>
        ) : (
          <>
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 z-10"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder={placeholder}
              className="input-base w-full pl-9"
              autoFocus={open}
            />
            {open && (
              <div className="absolute top-full left-0 z-20 mt-1 w-full max-h-44 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg divide-y divide-gray-50 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-400 dark:text-slate-500">No matches</p>
                ) : (
                  filtered.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 truncate"
                    >
                      {o.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder: string;
  options: { value: number; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        className="input-base w-full"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
