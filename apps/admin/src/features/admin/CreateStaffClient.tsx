"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus, ArrowLeft, Save, Camera, X, ChevronDown,
  Briefcase, ShieldCheck, MapPin, CreditCard, Heart, User,
  CalendarDays, AlertCircle, Loader2,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { createUserAction } from "./actions/admin.actions";
import { bangladeshLocations, countries, type Division } from "@/shared/data/locations";
import { bangladeshBanks, mobileBankingProviders, type Bank } from "@/shared/data/banks";

/* ─── Constants ────────────────────────────────────────────────────────────── */

const STAFF_ROLES = [
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "MARKETING_OFFICER", label: "Marketing Officer" },
  { value: "ACCOUNTANT", label: "Accountant" },
];
const DEPARTMENTS = ["Administration", "Academics", "Marketing", "Finance", "IT", "HR", "Operations", "Support"];
const DESIGNATIONS = ["Manager", "Officer", "Executive", "Coordinator", "Assistant", "Director", "Lead", "Intern"];
const EMPLOYMENT_TYPES = [{ value: "full_time", label: "Full-Time" }, { value: "part_time", label: "Part-Time" }, { value: "contractual", label: "Contractual" }];
const GENDERS = [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }];
const RELATIONSHIPS = ["Father", "Mother", "Brother", "Sister", "Husband", "Wife", "Son", "Daughter", "Other"];
const NID_TYPES = [{ value: "nid", label: "National ID (NID)" }, { value: "passport", label: "Passport" }];
const NID_MAX_LENGTH = 17;
const PASSPORT_MAX_LENGTH = 9;

/* ─── Age Calculation ──────────────────────────────────────────────────────── */

function calculateAge(dob: string): { years: number; months: number; days: number } | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  if (birth > today) return null;
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  if (days < 0) { months--; const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0); days += prevMonth.getDate(); }
  if (months < 0) { years--; months += 12; }
  return { years, months, days };
}

/* ─── Bangladesh Phone Validation ──────────────────────────────────────────── */

function isValidBdPhone(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(phone);
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export function CreateStaffClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", gender: "",
    dateOfBirth: "", nationalId: "", nidType: "nid",
    role: "INSTRUCTOR", department: "", designation: "", employmentType: "full_time", joiningDate: "",
    emergencyContactRelationship: "", emergencyContactName: "", emergencyContactPhone: "",
    salary: "", bankingType: "", bankingProvider: "", bankName: "", bankBranch: "", bankAccountNumber: "",
    country: "Bangladesh", division: "", district: "", thana: "", unionName: "", postCode: "",
    presentAddress: "", permanentAddress: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Cascade resets for address
      if (field === "division") { next.district = ""; next.thana = ""; next.unionName = ""; next.postCode = ""; }
      if (field === "district") { next.thana = ""; next.unionName = ""; next.postCode = ""; }
      if (field === "thana") { next.unionName = ""; next.postCode = ""; }
      // Reset banking fields
      if (field === "bankingType") { next.bankingProvider = ""; next.bankName = ""; next.bankBranch = ""; next.bankAccountNumber = ""; }
      if (field === "bankName") { next.bankBranch = ""; }
      return next;
    });
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  const age = useMemo(() => calculateAge(form.dateOfBirth), [form.dateOfBirth]);

  // Derived location data
  const selectedDivision: Division | undefined = useMemo(
    () => bangladeshLocations.find((d) => d.name === form.division),
    [form.division],
  );
  const districts = useMemo(
    () => (selectedDivision ? selectedDivision.districts.map((d) => d.name) : []),
    [selectedDivision],
  );
  const selectedDistrict = useMemo(
    () => selectedDivision?.districts.find((d) => d.name === form.district),
    [selectedDivision, form.district],
  );
  const thanas = useMemo(
    () => (selectedDistrict ? selectedDistrict.thanas.map((t) => t.name) : []),
    [selectedDistrict],
  );
  const selectedThana = useMemo(
    () => selectedDistrict?.thanas.find((t) => t.name === form.thana),
    [selectedDistrict, form.thana],
  );
  const unions = useMemo(
    () => (selectedThana ? selectedThana.unions : []),
    [selectedThana],
  );
  const autoPostCode = selectedThana?.postCode ?? "";

  // Bank branches
  const selectedBank: Bank | undefined = useMemo(
    () => bangladeshBanks.find((b) => b.name === form.bankName),
    [form.bankName],
  );
  const bankBranches = useMemo(
    () => (selectedBank ? selectedBank.branches.map((b) => b.name) : []),
    [selectedBank],
  );

  function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    setPreviewUrl(URL.createObjectURL(file));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim() && !form.phone.trim()) e.email = "Email or phone is required";
    if (form.phone && !isValidBdPhone(form.phone)) e.phone = "Enter a valid BD mobile (01XXXXXXXXX)";
    if (form.password.length < 6) e.password = "Min. 6 characters";
    if (form.nationalId) {
      const maxLen = form.nidType === "passport" ? PASSPORT_MAX_LENGTH : NID_MAX_LENGTH;
      if (form.nationalId.length > maxLen) e.nationalId = `Max ${maxLen} characters`;
      if (form.nidType === "nid" && !/^\d{0,17}$/.test(form.nationalId)) e.nationalId = "NID must be digits only";
    }
    if (form.emergencyContactName && !form.emergencyContactPhone) e.emergencyContactPhone = "Phone is required";
    if (form.emergencyContactPhone && !isValidBdPhone(form.emergencyContactPhone)) e.emergencyContactPhone = "Enter a valid BD mobile";
    if (form.bankingType === "mobile_banking") {
      if (!form.bankingProvider) e.bankingProvider = "Provider is required";
      if (form.bankingProvider && !isValidBdPhone(form.bankingProvider === "Other" ? "" : (form.bankAccountNumber || ""))) {
        // Only validate number format if it looks like a phone number
      }
    }
    if (form.bankingType === "bank_account") {
      if (!form.bankName) e.bankName = "Bank is required";
      if (!form.bankBranch) e.bankBranch = "Branch is required";
      if (!form.bankAccountNumber) e.bankAccountNumber = "Account number is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) { toast.error("Please fix the errors"); return; }
    startTransition(async () => {
      const res = await createUserAction({
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        email: form.email.trim() || undefined, phone: form.phone.trim() || undefined,
        password: form.password, role: form.role, gender: form.gender || undefined,
        country: form.country || undefined, city: form.district || undefined,
        department: form.department || undefined, designation: form.designation || undefined,
        dateOfBirth: form.dateOfBirth || undefined, nationalId: form.nationalId || undefined,
        nidType: form.nidType || undefined,
        joiningDate: form.joiningDate || undefined, employmentType: form.employmentType || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        emergencyContactRelationship: form.emergencyContactRelationship || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        bankingType: form.bankingType || undefined,
        bankingProvider: form.bankingType === "mobile_banking" ? form.bankingProvider || undefined : undefined,
        bankName: form.bankingType === "bank_account" ? form.bankName || undefined : undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        presentAddress: form.presentAddress || undefined,
        permanentAddress: form.permanentAddress || undefined,
        division: form.division || undefined, district: form.district || undefined,
        thana: form.thana || undefined, unionName: form.unionName || undefined,
        postCode: form.postCode || autoPostCode || undefined,
      });
      if (res.success) { toast.success("Staff created successfully"); router.push("/admin/users"); }
      else { toast.error(res.message ?? "Failed to create staff"); }
    });
  }

  function fieldErr(key: string): string | undefined { return errors[key]; }
  function FieldError({ k }: { k: string }) {
    const msg = errors[k];
    return msg ? <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{msg}</p> : null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Add New Staff</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">Fill in the details to create a new staff account</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors disabled:opacity-60">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Creating..." : "Create Staff"}
        </button>
      </div>

      {/* ── Section 1: Basic Info & Media ── */}
      <SectionCard title="Basic Info & Media" icon={<Camera className="h-4 w-4" />} color="blue">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-28 w-28 rounded-full bg-white dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                {previewUrl ? <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-gray-300 dark:text-slate-600" />}
              </div>
              {previewUrl && <button onClick={() => { setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-medium text-brand-600 dark:text-brand hover:text-brand-700 transition-colors">{previewUrl ? "Change Photo" : "Upload Photo"}</button>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">JPG, PNG. Max 2 MB.</p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel label="First Name" required />
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Enter first name" className={inputCls} />
              <FieldError k="firstName" />
            </div>
            <div>
              <FieldLabel label="Last Name" required />
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Enter last name" className={inputCls} />
              <FieldError k="lastName" />
            </div>
            <div>
              <FieldLabel label="Email" />
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@email.com" className={inputCls} />
              <FieldError k="email" />
            </div>
            <div>
              <FieldLabel label="Phone" />
              <input value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="01XXXXXXXXX" className={inputCls} />
              <FieldError k="phone" />
            </div>
            <div>
              <FieldLabel label="Gender" />
              <Select value={form.gender} onChange={(v) => set("gender", v)} options={[{ value: "", label: "Select gender" }, ...GENDERS]} />
            </div>
            <div>
              <FieldLabel label="Password" required />
              <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 6 characters" className={inputCls} />
              <FieldError k="password" />
            </div>
            {/* Date of Birth + Age */}
            <div className="sm:col-span-2">
              <FieldLabel label="Date of Birth" />
              <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} max={new Date().toISOString().split("T")[0]} className={inputCls} />
              {age && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-500" />
                  <span>Age: <strong className="text-gray-700 dark:text-slate-200">{age.years} Years, {age.months} Months, {age.days} Days</strong></span>
                </div>
              )}
            </div>
            {/* NID / Passport */}
            <div className="sm:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <FieldLabel label="Document Type" />
                  <Select value={form.nidType} onChange={(v) => { set("nidType", v); set("nationalId", ""); }} options={NID_TYPES} />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel label={form.nidType === "passport" ? "Passport Number" : "National ID (NID)"} />
                  <input
                    value={form.nationalId}
                    onChange={(e) => {
                      const v = e.target.value;
                      const maxLen = form.nidType === "passport" ? PASSPORT_MAX_LENGTH : NID_MAX_LENGTH;
                      if (v.length <= maxLen) set("nationalId", form.nidType === "nid" ? v.replace(/\D/g, "") : v);
                    }}
                    maxLength={form.nidType === "passport" ? PASSPORT_MAX_LENGTH : NID_MAX_LENGTH}
                    placeholder={form.nidType === "passport" ? "e.g. A00000000" : "e.g. 1234567890123"}
                    className={inputCls}
                  />
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                    {form.nidType === "passport" ? `Max ${PASSPORT_MAX_LENGTH} characters` : `Max ${NID_MAX_LENGTH} digits`}
                  </p>
                  <FieldError k="nationalId" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Employment Details ── */}
      <SectionCard title="Employment Details" icon={<Briefcase className="h-4 w-4" />} color="green">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3.5">
            <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Employee ID</span>
            <p className="text-sm font-mono font-bold text-brand-600 dark:text-brand">Auto-generated</p>
          </div>
          <div>
            <FieldLabel label="Role" required />
            <Select value={form.role} onChange={(v) => set("role", v)} options={STAFF_ROLES.map((r) => ({ value: r.value, label: r.label }))} />
          </div>
          <div>
            <FieldLabel label="Department" />
            <Select value={form.department} onChange={(v) => set("department", v)} options={[{ value: "", label: "Select department" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]} />
          </div>
          <div>
            <FieldLabel label="Designation" />
            <Select value={form.designation} onChange={(v) => set("designation", v)} options={[{ value: "", label: "Select designation" }, ...DESIGNATIONS.map((d) => ({ value: d, label: d }))]} />
          </div>
          <div>
            <FieldLabel label="Employment Type" />
            <Select value={form.employmentType} onChange={(v) => set("employmentType", v)} options={EMPLOYMENT_TYPES} />
          </div>
          <div>
            <FieldLabel label="Joining Date" />
            <input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} className={inputCls} />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 3: Emergency Contact ── */}
      <SectionCard title="Emergency Contact" icon={<Heart className="h-4 w-4" />} color="rose">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Relationship" />
            <Select value={form.emergencyContactRelationship} onChange={(v) => set("emergencyContactRelationship", v)} options={[{ value: "", label: "Select relationship" }, ...RELATIONSHIPS.map((r) => ({ value: r.toLowerCase(), label: r }))]} />
          </div>
          <div>
            <FieldLabel label="Contact Person Name" />
            <input value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} placeholder="e.g. Abdul Karim" className={inputCls} />
          </div>
          <div>
            <FieldLabel label="Mobile Number" />
            <input value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="01XXXXXXXXX" className={inputCls} />
            <FieldError k="emergencyContactPhone" />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 4: Payroll & Banking ── */}
      <SectionCard title="Payroll & Banking" icon={<CreditCard className="h-4 w-4" />} color="green">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Salary (BDT)" />
            <input type="number" value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="e.g. 50000" className={inputCls} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <FieldLabel label="Banking Type" />
            <Select value={form.bankingType} onChange={(v) => set("bankingType", v)} options={[
              { value: "", label: "Select banking type" },
              { value: "mobile_banking", label: "Mobile Banking" },
              { value: "bank_account", label: "Bank / Online Account" },
            ]} />
          </div>

          {/* Mobile Banking */}
          {form.bankingType === "mobile_banking" && (
            <>
              <div>
                <FieldLabel label="Provider" />
                <Select value={form.bankingProvider} onChange={(v) => set("bankingProvider", v)} options={[{ value: "", label: "Select provider" }, ...mobileBankingProviders]} />
                <FieldError k="bankingProvider" />
              </div>
              <div>
                <FieldLabel label="Mobile Banking Number" />
                <input value={form.bankAccountNumber} onChange={(e) => set("bankAccountNumber", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="01XXXXXXXXX" className={inputCls} />
                <FieldError k="bankAccountNumber" />
              </div>
            </>
          )}

          {/* Bank Account */}
          {form.bankingType === "bank_account" && (
            <>
              <div>
                <FieldLabel label="Bank Name" />
                <Select value={form.bankName} onChange={(v) => set("bankName", v)} options={[{ value: "", label: "Select bank" }, ...bangladeshBanks.map((b) => ({ value: b.name, label: b.name }))]} />
                <FieldError k="bankName" />
              </div>
              <div>
                <FieldLabel label="Branch" />
                {form.bankName ? (
                  <Select value={form.bankBranch} onChange={(v) => set("bankBranch", v)} options={[{ value: "", label: "Select branch" }, ...bankBranches.map((b) => ({ value: b, label: b }))]} />
                ) : (
                  <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select bank first</option></select>
                )}
                <FieldError k="bankBranch" />
              </div>
              <div>
                <FieldLabel label="Account Number" />
                <input value={form.bankAccountNumber} onChange={(e) => set("bankAccountNumber", e.target.value)} placeholder="e.g. 1234567890" className={inputCls} />
                <FieldError k="bankAccountNumber" />
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {/* ── Section 5: Address Details ── */}
      <SectionCard title="Address Details" icon={<MapPin className="h-4 w-4" />} color="amber">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Country" />
            <Select value={form.country} onChange={(v) => set("country", v)} options={countries.map((c) => ({ value: c, label: c }))} />
          </div>
          <div>
            <FieldLabel label="Division" />
            <Select value={form.division} onChange={(v) => set("division", v)} options={[{ value: "", label: "Select division" }, ...bangladeshLocations.map((d) => ({ value: d.name, label: d.name }))]} />
          </div>
          <div>
            <FieldLabel label="District" />
            {form.division ? (
              <Select value={form.district} onChange={(v) => set("district", v)} options={[{ value: "", label: "Select district" }, ...districts.map((d) => ({ value: d, label: d }))]} />
            ) : <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select division first</option></select>}
          </div>
          <div>
            <FieldLabel label="Thana / Upazila" />
            {form.district ? (
              <Select value={form.thana} onChange={(v) => set("thana", v)} options={[{ value: "", label: "Select thana" }, ...thanas.map((t) => ({ value: t, label: t }))]} />
            ) : <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select district first</option></select>}
          </div>
          <div>
            <FieldLabel label="Union" />
            {form.thana ? (
              <Select value={form.unionName} onChange={(v) => set("unionName", v)} options={[{ value: "", label: "Select union" }, ...unions.map((u) => ({ value: u, label: u }))]} />
            ) : <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select thana first</option></select>}
          </div>
          <div>
            <FieldLabel label="Post Code" />
            <input value={form.postCode || autoPostCode} onChange={(e) => set("postCode", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={autoPostCode || "Auto-filled"} className={inputCls} readOnly={!!autoPostCode && !form.postCode} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <FieldLabel label="Present Address" />
            <textarea value={form.presentAddress} onChange={(e) => set("presentAddress", e.target.value)} placeholder="Street, area, zip code" rows={2} className={inputCls + " resize-none"} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <FieldLabel label="Permanent Address" />
            <textarea value={form.permanentAddress} onChange={(e) => set("permanentAddress", e.target.value)} placeholder="Street, area, zip code" rows={2} className={inputCls + " resize-none"} />
          </div>
        </div>
      </SectionCard>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 mt-6 flex items-center justify-end gap-3 py-4 bg-gradient-to-t from-white dark:from-slate-900 via-white dark:via-slate-900 to-transparent">
        <button onClick={() => router.back()} disabled={isPending} className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Cancel</button>
        <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors disabled:opacity-60">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {isPending ? "Creating Staff..." : "Create Staff Member"}
        </button>
      </div>
    </div>
  );
}

/* ─── Shared Styles ────────────────────────────────────────────────────────── */

const inputCls = "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600";

/* ─── Helper Components ────────────────────────────────────────────────────── */

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return <span className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>;
}

function SectionCard({ title, icon, color = "blue" as string, children }: { title: string; icon: React.ReactNode; color?: string; children: React.ReactNode }) {
  const colorMap: Record<string, { border: string; bg: string; iconBg: string; iconText: string }> = {
    blue: { border: "border-blue-100 dark:border-blue-500/20", bg: "bg-blue-50/40 dark:bg-blue-500/5", iconBg: "bg-blue-100 dark:bg-blue-500/15", iconText: "text-blue-600 dark:text-blue-400" },
    green: { border: "border-emerald-100 dark:border-emerald-500/20", bg: "bg-emerald-50/40 dark:bg-emerald-500/5", iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconText: "text-emerald-600 dark:text-emerald-400" },
    rose: { border: "border-rose-100 dark:border-rose-500/20", bg: "bg-rose-50/40 dark:bg-rose-500/5", iconBg: "bg-rose-100 dark:bg-rose-500/15", iconText: "text-rose-600 dark:text-rose-400" },
    amber: { border: "border-amber-100 dark:border-amber-500/20", bg: "bg-amber-50/40 dark:bg-amber-500/5", iconBg: "bg-amber-100 dark:bg-amber-500/15", iconText: "text-amber-600 dark:text-amber-400" },
  };
  const fallback = colorMap.blue!;
  const c = colorMap[color] ?? fallback;
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 mb-5`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.iconBg} ${c.iconText}`}>{icon}</div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + " appearance-none pr-8"}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
    </div>
  );
}
