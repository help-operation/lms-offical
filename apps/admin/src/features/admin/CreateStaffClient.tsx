"use client";

import { useState, useTransition, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus, ArrowLeft, Save, Camera, X, ChevronDown,
  Briefcase, ShieldCheck, MapPin, CreditCard, Heart, User,
  CalendarDays, AlertCircle, Loader2, Plus, Trash2,
  FileText, GraduationCap, BriefcaseBusiness, Sparkles,
  BadgeCheck, Award, Building2, CheckCircle2,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { createUserAction } from "./actions/admin.actions";
import { bangladeshLocations, countries, type Division } from "@/shared/data/locations";
import { bangladeshBanks, mobileBankingProviders, type Bank } from "@/shared/data/banks";
import { PasswordInput } from "@/shared/components/PasswordInput";
import { ImageCropModal } from "@/shared/components/ImageCropModal";

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
const RELATIONSHIPS = ["Father", "Mother", "Brother", "Sister", "Husband", "Wife", "Son", "Daughter", "Other"];
const NID_TYPES = [
  { value: "nid", label: "National ID (NID)" },
  { value: "passport", label: "Passport" },
];
const NID_MAX_LENGTH = 17;
const PASSPORT_MAX_LENGTH = 9;

const BONUS_TYPES = [
  { value: "Performance", label: "Performance" },
  { value: "Attendance", label: "Attendance" },
  { value: "Festival", label: "Festival" },
  { value: "Eid", label: "Eid" },
  { value: "Annual", label: "Annual" },
  { value: "Sales-Target", label: "Sales-Target" },
  { value: "Joining", label: "Joining" },
  { value: "Special", label: "Special" },
  { value: "Other", label: "Other" },
];
const BONUS_CALC_TYPES = [
  { value: "fixed", label: "Fixed Amount" },
  { value: "percentage", label: "Percentage" },
];
const BONUS_FREQUENCIES = [
  { value: "one_time", label: "One Time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half-Yearly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
];
const BONUS_ELIGIBILITY = [
  { value: "eligible", label: "Eligible" },
  { value: "not_eligible", label: "Not Eligible" },
];
const SKILL_LEVELS = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Expert", label: "Expert" },
];
const DOCUMENT_TYPES = [
  { value: "nid_copy", label: "NID Copy" },
  { value: "passport_copy", label: "Passport Copy" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "educational_certificate", label: "Educational Certificate" },
  { value: "academic_transcript", label: "Academic Transcript" },
  { value: "training_certificate", label: "Training Certificate" },
  { value: "experience_certificate", label: "Experience Certificate" },
  { value: "appointment_letter", label: "Appointment Letter" },
  { value: "joining_letter", label: "Joining Letter" },
  { value: "cv_resume", label: "CV-Resume" },
  { value: "photograph", label: "Photograph" },
  { value: "other", label: "Other" },
];
const DOC_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/* ─── Age Calculation ──────────────────────────────────────────────────────── */

function calculateAge(dob: string): { years: number; months: number; days: number } | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  if (birth > today) return null;
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

/* ─── Bangladesh Phone Validation ──────────────────────────────────────────── */

function isValidBdPhone(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(phone);
}

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface Education {
  id: string;
  degree: string;
  institution: string;
  subject: string;
  passingYear: string;
  result: string;
}

interface Experience {
  id: string;
  company: string;
  designation: string;
  department: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  responsibilities: string;
}

interface Skill {
  id: string;
  name: string;
  level: string;
}

interface StaffDocument {
  id: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  expiryDate: string;
  notes: string;
  status: string;
}

interface AddressFields {
  country: string;
  division: string;
  district: string;
  thana: string;
  unionName: string;
  postCode: string;
  addressDetails: string;
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export function CreateStaffClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", gender: "",
    dateOfBirth: "",
    fatherName: "", motherName: "",
    nidType: "nid", nationalId: "",

    role: "INSTRUCTOR", department: "", designation: "", employmentType: "full_time", joiningDate: "",

    emergencyContactRelationship: "", emergencyContactName: "", emergencyContactPhone: "",

    basicSalary: "", houseRent: "", medicalAllowance: "", transportAllowance: "", otherAllowance: "",
    overtimeRate: "", taxDeduction: "", providentFund: "", otherDeduction: "",

    bonusType: "", bonusCalcType: "fixed", bonusAmount: "", bonusFrequency: "",
    bonusEligibility: "eligible", bonusNotes: "",

    bankingType: "", bankingProvider: "", bankName: "", bankBranch: "", bankAccountNumber: "",

    permCountry: "Bangladesh", permDivision: "", permDistrict: "", permThana: "", permUnion: "", permPostCode: "", permAddress: "",
    sameAsPresent: true,
    presCountry: "Bangladesh", presDivision: "", presDistrict: "", presThana: "", presUnion: "", presPostCode: "", presAddress: "",
  });

  const [roles, setRoles] = useState<string[]>(["INSTRUCTOR"]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [staffDocuments, setStaffDocuments] = useState<StaffDocument[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("Beginner");

  /* ─── Completion Progress ─────────────────────────────────────────────────── */
  const completionPct = useMemo(() => {
    let filled = 0, total = 0;
    // Required (weight 2 each)
    const req: [string, number][] = [["firstName", 2], ["lastName", 2], ["password", 2]];
    req.forEach(([k, w]) => { total += w; if ((form as any)[k]?.trim()) filled += w; });
    // Email or phone (weight 2)
    total += 2; if (form.email.trim() || form.phone.trim()) filled += 2;
    // Roles (weight 1)
    total += 1; if (roles.length > 0) filled += 1;
    // Optional sections (weight 1 each)
    const opt: string[] = ["gender", "dateOfBirth", "department", "designation", "emergencyContactName",
      "basicSalary", "permDivision", "fatherName", "nationalId"];
    opt.forEach((k) => { total += 1; if ((form as any)[k]) filled += 1; });
    return Math.round((filled / total) * 100);
  }, [form, roles]);

  const set = useCallback((field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "permDivision") { next.permDistrict = ""; next.permThana = ""; next.permUnion = ""; next.permPostCode = ""; }
      if (field === "permDistrict") { next.permThana = ""; next.permUnion = ""; next.permPostCode = ""; }
      if (field === "permThana") { next.permUnion = ""; next.permPostCode = ""; }
      if (field === "presDivision") { next.presDistrict = ""; next.presThana = ""; next.presUnion = ""; next.presPostCode = ""; }
      if (field === "presDistrict") { next.presThana = ""; next.presUnion = ""; next.presPostCode = ""; }
      if (field === "presThana") { next.presUnion = ""; next.presPostCode = ""; }
      if (field === "bankingType") { next.bankingProvider = ""; next.bankName = ""; next.bankBranch = ""; next.bankAccountNumber = ""; }
      if (field === "bankName") { next.bankBranch = ""; }
      return next;
    });
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const age = useMemo(() => calculateAge(form.dateOfBirth), [form.dateOfBirth]);

  /* Permanent Address Cascading */
  const permSelectedDivision: Division | undefined = useMemo(
    () => bangladeshLocations.find((d) => d.name === form.permDivision),
    [form.permDivision],
  );
  const permDistricts = useMemo(
    () => (permSelectedDivision ? permSelectedDivision.districts.map((d) => d.name) : []),
    [permSelectedDivision],
  );
  const permSelectedDistrict = useMemo(
    () => permSelectedDivision?.districts.find((d) => d.name === form.permDistrict),
    [permSelectedDivision, form.permDistrict],
  );
  const permThanas = useMemo(
    () => (permSelectedDistrict ? permSelectedDistrict.thanas.map((t) => t.name) : []),
    [permSelectedDistrict],
  );
  const permSelectedThana = useMemo(
    () => permSelectedDistrict?.thanas.find((t) => t.name === form.permThana),
    [permSelectedDistrict, form.permThana],
  );
  const permUnions = useMemo(() => (permSelectedThana ? permSelectedThana.unions : []), [permSelectedThana]);
  const permAutoPostCode = permSelectedThana?.postCode ?? "";

  /* Present Address Cascading */
  const presSelectedDivision: Division | undefined = useMemo(
    () => bangladeshLocations.find((d) => d.name === form.presDivision),
    [form.presDivision],
  );
  const presDistricts = useMemo(
    () => (presSelectedDivision ? presSelectedDivision.districts.map((d) => d.name) : []),
    [presSelectedDivision],
  );
  const presSelectedDistrict = useMemo(
    () => presSelectedDivision?.districts.find((d) => d.name === form.presDistrict),
    [presSelectedDivision, form.presDistrict],
  );
  const presThanas = useMemo(
    () => (presSelectedDistrict ? presSelectedDistrict.thanas.map((t) => t.name) : []),
    [presSelectedDistrict],
  );
  const presSelectedThana = useMemo(
    () => presSelectedDistrict?.thanas.find((t) => t.name === form.presThana),
    [presSelectedDistrict, form.presThana],
  );
  const presUnions = useMemo(() => (presSelectedThana ? presSelectedThana.unions : []), [presSelectedThana]);
  const presAutoPostCode = presSelectedThana?.postCode ?? "";

  /* Bank branches */
  const selectedBank: Bank | undefined = useMemo(
    () => bangladeshBanks.find((b) => b.name === form.bankName),
    [form.bankName],
  );
  const bankBranches = useMemo(
    () => (selectedBank ? selectedBank.branches.map((b) => b.name) : []),
    [selectedBank],
  );

  /* Salary calculations */
  const grossSalary = useMemo(() => {
    const b = Number(form.basicSalary) || 0;
    const h = Number(form.houseRent) || 0;
    const m = Number(form.medicalAllowance) || 0;
    const t = Number(form.transportAllowance) || 0;
    const o = Number(form.otherAllowance) || 0;
    return b + h + m + t + o;
  }, [form.basicSalary, form.houseRent, form.medicalAllowance, form.transportAllowance, form.otherAllowance]);

  const totalDeductions = useMemo(() => {
    const tax = Number(form.taxDeduction) || 0;
    const pf = Number(form.providentFund) || 0;
    const od = Number(form.otherDeduction) || 0;
    return tax + pf + od;
  }, [form.taxDeduction, form.providentFund, form.otherDeduction]);

  const netSalary = useMemo(() => Math.max(0, grossSalary - totalDeductions), [grossSalary, totalDeductions]);

  /* Present address sync */
  function toggleSameAsPresent(checked: boolean) {
    setForm((prev) => {
      if (checked) {
        return {
          ...prev,
          sameAsPresent: true,
          presCountry: prev.permCountry,
          presDivision: prev.permDivision,
          presDistrict: prev.permDistrict,
          presThana: prev.permThana,
          presUnion: prev.permUnion,
          presPostCode: prev.permPostCode,
          presAddress: prev.permAddress,
        };
      }
      return { ...prev, sameAsPresent: false };
    });
  }

  /* Role multi-select */
  function toggleRole(roleValue: string) {
    setRoles((prev) => {
      if (prev.includes(roleValue)) return prev.filter((r) => r !== roleValue);
      return [...prev, roleValue];
    });
  }
  function removeRole(roleValue: string) {
    setRoles((prev) => prev.filter((r) => r !== roleValue));
  }

  /* Education CRUD */
  function addEducation() {
    setEducations((prev) => [...prev, {
      id: crypto.randomUUID(),
      degree: "", institution: "", subject: "", passingYear: "", result: "",
    }]);
  }
  function updateEducation(id: string, field: string, value: string) {
    setEducations((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  }
  function removeEducation(id: string) {
    setEducations((prev) => prev.filter((e) => e.id !== id));
  }

  /* Experience CRUD */
  function addExperience() {
    setExperiences((prev) => [...prev, {
      id: crypto.randomUUID(),
      company: "", designation: "", department: "", employmentType: "full_time",
      startDate: "", endDate: "", currentlyWorking: false, responsibilities: "",
    }]);
  }
  function updateExperience(id: string, field: string, value: string | boolean) {
    setExperiences((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  }
  function removeExperience(id: string) {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
  }

  /* Skills */
  function addSkill() {
    const name = newSkillName.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Skill already added");
      return;
    }
    setSkills((prev) => [...prev, { id: crypto.randomUUID(), name, level: newSkillLevel }]);
    setNewSkillName("");
  }
  function removeSkill(id: string) {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  }

  /* Documents CRUD */
  function addDocument() {
    setStaffDocuments((prev) => [...prev, {
      id: crypto.randomUUID(),
      documentType: "", documentName: "", fileUrl: "", expiryDate: "", notes: "", status: "active",
    }]);
  }
  function updateDocument(id: string, field: string, value: string) {
    setStaffDocuments((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  }
  function removeDocument(id: string) {
    setStaffDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  /* Image handling */
  function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    const src = URL.createObjectURL(file);
    setRawImageSrc(src);
    setCropModalOpen(true);
  }

  function handleCropApply(blob: Blob) {
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setCropModalOpen(false);
    setRawImageSrc(null);
  }

  /* Validation */
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
    if (roles.length === 0) e.role = "Select at least one role";
    if (form.emergencyContactName && !form.emergencyContactPhone) e.emergencyContactPhone = "Phone is required";
    if (form.emergencyContactPhone && !isValidBdPhone(form.emergencyContactPhone)) e.emergencyContactPhone = "Enter a valid BD mobile";
    if (form.bankingType === "mobile_banking" && !form.bankingProvider) e.bankingProvider = "Provider is required";
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
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: roles.length === 1 ? roles[0] : roles,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName || undefined,
        nidType: form.nidType || undefined,
        nationalId: form.nationalId || undefined,
        department: form.department || undefined,
        designation: form.designation || undefined,
        employmentType: form.employmentType || undefined,
        joiningDate: form.joiningDate || undefined,
        emergencyContactRelationship: form.emergencyContactRelationship || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        basicSalary: form.basicSalary ? Number(form.basicSalary) : undefined,
        houseRent: form.houseRent ? Number(form.houseRent) : undefined,
        medicalAllowance: form.medicalAllowance ? Number(form.medicalAllowance) : undefined,
        transportAllowance: form.transportAllowance ? Number(form.transportAllowance) : undefined,
        otherAllowance: form.otherAllowance ? Number(form.otherAllowance) : undefined,
        overtimeRate: form.overtimeRate ? Number(form.overtimeRate) : undefined,
        taxDeduction: form.taxDeduction ? Number(form.taxDeduction) : undefined,
        providentFund: form.providentFund ? Number(form.providentFund) : undefined,
        otherDeduction: form.otherDeduction ? Number(form.otherDeduction) : undefined,
        bonusType: form.bonusType || undefined,
        bonusCalcType: form.bonusCalcType || undefined,
        bonusAmount: form.bonusAmount ? Number(form.bonusAmount) : undefined,
        bonusFrequency: form.bonusFrequency || undefined,
        bonusEligibility: form.bonusEligibility || undefined,
        bonusNotes: form.bonusNotes || undefined,
        bankingType: form.bankingType || undefined,
        bankingProvider: form.bankingType === "mobile_banking" ? form.bankingProvider || undefined : undefined,
        bankName: form.bankingType === "bank_account" ? form.bankName || undefined : undefined,
        bankBranch: form.bankingType === "bank_account" ? form.bankBranch || undefined : undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        permCountry: form.permCountry || undefined,
        permDivision: form.permDivision || undefined,
        permDistrict: form.permDistrict || undefined,
        permThana: form.permThana || undefined,
        permUnion: form.permUnion || undefined,
        permPostCode: form.permPostCode || permAutoPostCode || undefined,
        permAddress: form.permAddress || undefined,
        presCountry: form.sameAsPresent ? form.permCountry : form.presCountry,
        presDivision: form.sameAsPresent ? form.permDivision : form.presDivision,
        presDistrict: form.sameAsPresent ? form.permDistrict : form.presDistrict,
        presThana: form.sameAsPresent ? form.permThana : form.presThana,
        presUnion: form.sameAsPresent ? form.permUnion : form.presUnion,
        presPostCode: form.sameAsPresent ? (form.permPostCode || permAutoPostCode) : (form.presPostCode || presAutoPostCode),
        presAddress: form.sameAsPresent ? form.permAddress : form.presAddress,
        sameAsPresent: form.sameAsPresent,
        education: educations.length > 0 ? educations.map(({ id: _, ...rest }) => rest) : undefined,
        experience: experiences.length > 0 ? experiences.map(({ id: _, currentlyWorking, ...rest }) => ({
          ...rest,
          endDate: currentlyWorking ? "" : rest.endDate,
          currentlyWorking,
        })) : undefined,
        skills: skills.length > 0 ? skills.map(({ id: _, ...rest }) => rest) : undefined,
        documents: staffDocuments.length > 0 ? staffDocuments.map(({ id: _, ...rest }) => rest) : undefined,
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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Add New Staff</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Fill in the details to create a new staff account</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{completionPct}% complete</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${completionPct}%`,
              background: completionPct === 100
                ? "linear-gradient(90deg, #22c55e, #10b981)"
                : completionPct > 60
                  ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                  : "linear-gradient(90deg, #f97316, #f59e0b)",
            }}
          />
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 1: Profile Photo & Basic Info (blue)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Profile Photo & Basic Info" icon={<Camera className="h-4 w-4" />} color="blue">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-28 w-28 rounded-full bg-white dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-400 dark:group-hover:border-brand group-hover:shadow-lg group-hover:shadow-brand-500/10">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="h-8 w-8 text-gray-300 dark:text-slate-600 group-hover:text-brand-400 dark:group-hover:text-brand transition-colors" />
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors">Click to upload</span>
                  </div>
                )}
              </div>
              {previewUrl && (
                <button onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <X className="h-3 w-3" />
                </button>
              )}
              {/* Camera badge */}
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-brand-600 dark:bg-brand text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-3.5 w-3.5" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePictureChange} className="hidden" />
            <p className="text-[10px] text-gray-400 dark:text-slate-500">JPG, PNG, WebP. Max 2 MB.</p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <PasswordInput value={form.password} onChange={(v) => set("password", v)} placeholder="Min. 6 characters" className={inputCls} />
              <FieldError k="password" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel label="Date of Birth" />
              <div className="flex items-center gap-3">
                <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} max={new Date().toISOString().split("T")[0]} className={inputCls} />
                {age && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 shrink-0">
                    <CalendarDays className="h-3.5 w-3.5 text-brand-500" />
                    <span>Age: <strong className="text-gray-700 dark:text-slate-200">{age.years}Y {age.months}M {age.days}D</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 2: Personal Info (purple)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Personal Info" icon={<User className="h-4 w-4" />} color="purple">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel label="Father's Name" />
            <input value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} placeholder="Enter father's name" className={inputCls} />
          </div>
          <div>
            <FieldLabel label="Mother's Name" />
            <input value={form.motherName} onChange={(e) => set("motherName", e.target.value)} placeholder="Enter mother's name" className={inputCls} />
          </div>
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
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 3: Employment Details (green)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Employment Details" icon={<Briefcase className="h-4 w-4" />} color="green">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-500" />
            <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Employee ID</span>
            <p className="text-sm font-mono font-bold text-brand-600 dark:text-brand">Auto-generated</p>
          </div>
          <div>
            <FieldLabel label="Role" required />
            <div className="flex flex-wrap gap-1.5 mb-1.5 min-h-[28px]">
              {roles.map((r) => {
                const roleObj = STAFF_ROLES.find((sr) => sr.value === r);
                const roleColors: Record<string, string> = {
                  INSTRUCTOR: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
                  SUPER_ADMIN: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
                  EDITOR: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
                  MARKETING_OFFICER: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
                  ACCOUNTANT: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
                };
                return (
                  <span key={r} className={`inline-flex items-center gap-1 rounded-lg text-xs px-2.5 py-1 font-medium transition-all ${roleColors[r] ?? "bg-brand-100 text-brand-700 dark:bg-brand/20 dark:text-brand"}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    {roleObj?.label ?? r}
                    <button type="button" onClick={() => removeRole(r)} className="ml-0.5 hover:text-red-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            <Select
              value=""
              onChange={(v) => { if (v && !roles.includes(v)) toggleRole(v); }}
              options={[{ value: "", label: "+ Add role..." }, ...STAFF_ROLES.filter((r) => !roles.includes(r.value))]}
            />
            <FieldError k="role" />
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

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 4: Emergency Contact (rose)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Emergency Contact" icon={<Heart className="h-4 w-4" />} color="rose">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 5: Payroll (emerald)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Payroll" icon={<CreditCard className="h-4 w-4" />} color="emerald">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <FieldLabel label="Basic Salary (BDT)" />
              <input type="number" value={form.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <FieldLabel label="House Rent (BDT)" />
              <input type="number" value={form.houseRent} onChange={(e) => set("houseRent", e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <FieldLabel label="Medical Allowance (BDT)" />
              <input type="number" value={form.medicalAllowance} onChange={(e) => set("medicalAllowance", e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <FieldLabel label="Transport Allowance (BDT)" />
              <input type="number" value={form.transportAllowance} onChange={(e) => set("transportAllowance", e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <FieldLabel label="Other Allowance (BDT)" />
              <input type="number" value={form.otherAllowance} onChange={(e) => set("otherAllowance", e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500" />
              <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Gross Salary</span>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{"\u09F3"} {grossSalary.toLocaleString()}</p>
            </div>
            <div>
              <FieldLabel label="Overtime Rate (BDT/hr)" />
              <input type="number" value={form.overtimeRate} onChange={(e) => set("overtimeRate", e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
          </div>

          <div className="border-t border-emerald-100 dark:border-emerald-500/10 pt-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Deductions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <FieldLabel label="Tax / Deduction (BDT)" />
                <input type="number" value={form.taxDeduction} onChange={(e) => set("taxDeduction", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <FieldLabel label="Provident Fund (BDT)" />
                <input type="number" value={form.providentFund} onChange={(e) => set("providentFund", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <FieldLabel label="Other Deduction (BDT)" />
                <input type="number" value={form.otherDeduction} onChange={(e) => set("otherDeduction", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-100 dark:border-emerald-500/10 pt-3 flex flex-col sm:flex-row gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 flex-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-red-400" />
              <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Total Deductions</span>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{"\u09F3"} {totalDeductions.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-brand-50 dark:bg-brand/10 border border-brand-200 dark:border-brand/20 p-3 flex-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-500" />
              <span className="block text-[10px] font-semibold text-brand-600 dark:text-brand uppercase tracking-wider mb-0.5">Net Salary</span>
              <p className="text-sm font-bold text-brand-700 dark:text-brand">{"\u09F3"} {netSalary.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 6: Bonus (yellow)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Bonus" icon={<Award className="h-4 w-4" />} color="yellow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <FieldLabel label="Bonus Type" />
            <Select value={form.bonusType} onChange={(v) => set("bonusType", v)} options={[{ value: "", label: "Select bonus type" }, ...BONUS_TYPES]} />
          </div>
          <div>
            <FieldLabel label="Bonus Calculation" />
            <Select value={form.bonusCalcType} onChange={(v) => set("bonusCalcType", v)} options={BONUS_CALC_TYPES} />
          </div>
          <div>
            <FieldLabel label={form.bonusCalcType === "percentage" ? "Percentage (%)" : "Amount (BDT)"} />
            <input type="number" value={form.bonusAmount} onChange={(e) => set("bonusAmount", e.target.value)} placeholder={form.bonusCalcType === "percentage" ? "e.g. 10" : "e.g. 5000"} className={inputCls} />
          </div>
          <div>
            <FieldLabel label="Bonus Frequency" />
            <Select value={form.bonusFrequency} onChange={(v) => set("bonusFrequency", v)} options={[{ value: "", label: "Select frequency" }, ...BONUS_FREQUENCIES]} />
          </div>
          <div>
            <FieldLabel label="Bonus Eligibility" />
            <Select value={form.bonusEligibility} onChange={(v) => set("bonusEligibility", v)} options={BONUS_ELIGIBILITY} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <FieldLabel label="Bonus Notes" />
            <textarea value={form.bonusNotes} onChange={(e) => set("bonusNotes", e.target.value)} placeholder="Any additional notes about bonus..." rows={2} className={inputCls + " resize-none"} />
          </div>
        </div>
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 7: Banking (teal)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Banking" icon={<Building2 className="h-4 w-4" />} color="teal">
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
            <button type="button" onClick={() => set("bankingType", "mobile_banking")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${form.bankingType === "mobile_banking" ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"}`}>
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="h-4 w-4" />
                Mobile Banking
              </div>
            </button>
            <button type="button" onClick={() => set("bankingType", "bank_account")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${form.bankingType === "bank_account" ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"}`}>
              <div className="flex items-center justify-center gap-2">
                <Building2 className="h-4 w-4" />
                Bank Account
              </div>
            </button>
          </div>

          {form.bankingType === "mobile_banking" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>
          )}

          {form.bankingType === "bank_account" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            </div>
          )}

          {!form.bankingType && (
            <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-2">Select a banking type above to continue</p>
          )}
        </div>
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 8: Permanent Address (amber)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Permanent Address" icon={<MapPin className="h-4 w-4" />} color="amber">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <FieldLabel label="Country" />
            <Select value={form.permCountry} onChange={(v) => set("permCountry", v)} options={countries.map((c) => ({ value: c, label: c }))} />
          </div>
          <div>
            <FieldLabel label="Division" />
            <Select value={form.permDivision} onChange={(v) => set("permDivision", v)} options={[{ value: "", label: "Select division" }, ...bangladeshLocations.map((d) => ({ value: d.name, label: d.name }))]} />
          </div>
          <div>
            <FieldLabel label="District" />
            {form.permDivision ? (
              <Select value={form.permDistrict} onChange={(v) => set("permDistrict", v)} options={[{ value: "", label: "Select district" }, ...permDistricts.map((d) => ({ value: d, label: d }))]} />
            ) : <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select division first</option></select>}
          </div>
          <div>
            <FieldLabel label="Thana / Upazila" />
            {form.permDistrict ? (
              <Select value={form.permThana} onChange={(v) => set("permThana", v)} options={[{ value: "", label: "Select thana" }, ...permThanas.map((t) => ({ value: t, label: t }))]} />
            ) : <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select district first</option></select>}
          </div>
          <div>
            <FieldLabel label="Union" />
            {form.permThana ? (
              <Select value={form.permUnion} onChange={(v) => set("permUnion", v)} options={[{ value: "", label: "Select union" }, ...permUnions.map((u) => ({ value: u, label: u }))]} />
            ) : <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select thana first</option></select>}
          </div>
          <div>
            <FieldLabel label="Post Code" />
            <input value={form.permPostCode || permAutoPostCode} onChange={(e) => set("permPostCode", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={permAutoPostCode || "Auto-filled"} className={inputCls} readOnly={!!permAutoPostCode && !form.permPostCode} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <FieldLabel label="Address Details" />
            <textarea value={form.permAddress} onChange={(e) => set("permAddress", e.target.value)} placeholder="Street, area, house no." rows={2} className={inputCls + " resize-none"} />
          </div>
        </div>
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 9: Present Address (sky)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Present Address" icon={<MapPin className="h-4 w-4" />} color="sky">
        <div className="space-y-4">
          <label className={`flex items-center gap-3 cursor-pointer select-none rounded-xl border px-4 py-3 transition-all ${form.sameAsPresent ? "border-sky-200 dark:border-sky-500/20 bg-sky-50/50 dark:bg-sky-500/5" : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}>
            <input type="checkbox" checked={form.sameAsPresent} onChange={(e) => toggleSameAsPresent(e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500" />
            <div className="flex items-center gap-2">
              {form.sameAsPresent ? (
                <CheckCircle2 className="h-4 w-4 text-sky-500" />
              ) : (
                <MapPin className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              )}
              <span className="text-sm text-gray-600 dark:text-slate-300">Same as Permanent Address</span>
            </div>
          </label>

          {!form.sameAsPresent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <FieldLabel label="Country" />
                <Select value={form.presCountry} onChange={(v) => set("presCountry", v)} options={countries.map((c) => ({ value: c, label: c }))} />
              </div>
              <div>
                <FieldLabel label="Division" />
                <Select value={form.presDivision} onChange={(v) => set("presDivision", v)} options={[{ value: "", label: "Select division" }, ...bangladeshLocations.map((d) => ({ value: d.name, label: d.name }))]} />
              </div>
              <div>
                <FieldLabel label="District" />
                {form.presDivision ? (
                  <Select value={form.presDistrict} onChange={(v) => set("presDistrict", v)} options={[{ value: "", label: "Select district" }, ...presDistricts.map((d) => ({ value: d, label: d }))]} />
                ) : <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select division first</option></select>}
              </div>
              <div>
                <FieldLabel label="Thana / Upazila" />
                {form.presDistrict ? (
                  <Select value={form.presThana} onChange={(v) => set("presThana", v)} options={[{ value: "", label: "Select thana" }, ...presThanas.map((t) => ({ value: t, label: t }))]} />
                ) : <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select district first</option></select>}
              </div>
              <div>
                <FieldLabel label="Union" />
                {form.presThana ? (
                  <Select value={form.presUnion} onChange={(v) => set("presUnion", v)} options={[{ value: "", label: "Select union" }, ...presUnions.map((u) => ({ value: u, label: u }))]} />
                ) : <select disabled className={inputCls + " opacity-50 cursor-not-allowed"}><option>Select thana first</option></select>}
              </div>
              <div>
                <FieldLabel label="Post Code" />
                <input value={form.presPostCode || presAutoPostCode} onChange={(e) => set("presPostCode", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={presAutoPostCode || "Auto-filled"} className={inputCls} readOnly={!!presAutoPostCode && !form.presPostCode} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <FieldLabel label="Address Details" />
                <textarea value={form.presAddress} onChange={(e) => set("presAddress", e.target.value)} placeholder="Street, area, house no." rows={2} className={inputCls + " resize-none"} />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 10: Education (indigo)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Education" icon={<GraduationCap className="h-4 w-4" />} color="indigo">
        <div className="space-y-4">
          {educations.length === 0 && (
            <div className="text-center py-6 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5">
              <GraduationCap className="h-8 w-8 text-indigo-300 dark:text-indigo-500/40 mx-auto mb-2" />
              <p className="text-xs text-indigo-500 dark:text-indigo-400">No education records yet</p>
              <p className="text-[10px] text-indigo-400 dark:text-indigo-500/60 mt-0.5">Click the button below to add education details</p>
            </div>
          )}
          {educations.map((edu, idx) => (
            <div key={edu.id} className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3 relative border-l-4 border-l-indigo-400 dark:border-l-indigo-500/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Education #{idx + 1}</span>
                <button type="button" onClick={() => removeEducation(edu.id)} className="text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <FieldLabel label="Degree" />
                  <input value={edu.degree} onChange={(e) => updateEducation(edu.id, "degree", e.target.value)} placeholder="e.g. B.Sc in CSE" className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="Institution" />
                  <input value={edu.institution} onChange={(e) => updateEducation(edu.id, "institution", e.target.value)} placeholder="University name" className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="Subject" />
                  <input value={edu.subject} onChange={(e) => updateEducation(edu.id, "subject", e.target.value)} placeholder="e.g. Computer Science" className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="Passing Year" />
                  <input type="number" value={edu.passingYear} onChange={(e) => updateEducation(edu.id, "passingYear", e.target.value)} placeholder="e.g. 2023" className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="Result" />
                  <input value={edu.result} onChange={(e) => updateEducation(edu.id, "result", e.target.value)} placeholder="e.g. CGPA 3.80" className={inputCls} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addEducation} className="flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-500/30 px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-colors">
            <Plus className="h-4 w-4" /> Add Education
          </button>
        </div>
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 11: Experience (cyan)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Experience" icon={<BriefcaseBusiness className="h-4 w-4" />} color="cyan">
        <div className="space-y-4">
          {experiences.length === 0 && (
            <div className="text-center py-6 rounded-xl border border-dashed border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/30 dark:bg-cyan-500/5">
              <BriefcaseBusiness className="h-8 w-8 text-cyan-300 dark:text-cyan-500/40 mx-auto mb-2" />
              <p className="text-xs text-cyan-500 dark:text-cyan-400">No work experience yet</p>
              <p className="text-[10px] text-cyan-400 dark:text-cyan-500/60 mt-0.5">Add professional experience to build a complete profile</p>
            </div>
          )}
          {experiences.map((exp, idx) => (
            <div key={exp.id} className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3 relative border-l-4 border-l-cyan-400 dark:border-l-cyan-500/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">Experience #{idx + 1}</span>
                <button type="button" onClick={() => removeExperience(exp.id)} className="text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <FieldLabel label="Company" />
                  <input value={exp.company} onChange={(e) => updateExperience(exp.id, "company", e.target.value)} placeholder="Company name" className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="Designation" />
                  <input value={exp.designation} onChange={(e) => updateExperience(exp.id, "designation", e.target.value)} placeholder="e.g. Senior Developer" className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="Department" />
                  <input value={exp.department} onChange={(e) => updateExperience(exp.id, "department", e.target.value)} placeholder="e.g. Engineering" className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="Employment Type" />
                  <Select value={exp.employmentType} onChange={(v) => updateExperience(exp.id, "employmentType", v)} options={EMPLOYMENT_TYPES} />
                </div>
                <div>
                  <FieldLabel label="Start Date" />
                  <input type="date" value={exp.startDate} onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="End Date" />
                  <input type="date" value={exp.endDate} onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)} className={inputCls} disabled={exp.currentlyWorking} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={exp.currentlyWorking} onChange={(e) => { updateExperience(exp.id, "currentlyWorking", e.target.checked); if (e.target.checked) updateExperience(exp.id, "endDate", ""); }} className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500" />
                    <span className="text-sm text-gray-600 dark:text-slate-300">Currently Working</span>
                  </label>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <FieldLabel label="Responsibilities" />
                  <textarea value={exp.responsibilities} onChange={(e) => updateExperience(exp.id, "responsibilities", e.target.value)} placeholder="Key responsibilities and achievements..." rows={2} className={inputCls + " resize-none"} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addExperience} className="flex items-center gap-1.5 rounded-xl border border-dashed border-cyan-300 dark:border-cyan-500/30 px-4 py-2.5 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/5 transition-colors">
            <Plus className="h-4 w-4" /> Add Experience
          </button>
        </div>
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 12: Skills (pink)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Skills" icon={<Sparkles className="h-4 w-4" />} color="pink">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Enter skill name..." className={inputCls} />
            </div>
            <div className="w-full sm:w-44">
              <Select value={newSkillLevel} onChange={(v) => setNewSkillLevel(v)} options={SKILL_LEVELS} />
            </div>
            <button type="button" onClick={addSkill} className="rounded-xl bg-pink-600 dark:bg-pink-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors shrink-0">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1.5 rounded-lg bg-pink-100 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300 text-xs px-3 py-1.5 font-medium">
                  {s.name}
                  <span className="text-[10px] text-pink-500 dark:text-pink-400">({s.level})</span>
                  <button type="button" onClick={() => removeSkill(s.id)} className="hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {skills.length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500">No skills added yet</p>}
        </div>
      </SectionCard>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 13: Documents (slate)
          ═════════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Documents" icon={<FileText className="h-4 w-4" />} color="slate">
        <div className="space-y-4">
          {staffDocuments.length === 0 && (
            <div className="text-center py-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-600/30 bg-slate-50/30 dark:bg-slate-500/5">
              <FileText className="h-8 w-8 text-slate-300 dark:text-slate-500/40 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No documents uploaded</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500/60 mt-0.5">Upload NID, certificates, or other important documents</p>
            </div>
          )}
          {staffDocuments.map((doc, idx) => (
            <div key={doc.id} className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3 relative border-l-4 border-l-slate-400 dark:border-l-slate-500/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Document #{idx + 1}</span>
                <button type="button" onClick={() => removeDocument(doc.id)} className="text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <FieldLabel label="Document Type" />
                  <Select value={doc.documentType} onChange={(v) => updateDocument(doc.id, "documentType", v)} options={[{ value: "", label: "Select type" }, ...DOCUMENT_TYPES]} />
                </div>
                <div>
                  <FieldLabel label="Document Name" />
                  <input value={doc.documentName} onChange={(e) => updateDocument(doc.id, "documentName", e.target.value)} placeholder="e.g. NID Front Page" className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="File URL" />
                  <input value={doc.fileUrl} onChange={(e) => updateDocument(doc.id, "fileUrl", e.target.value)} placeholder="https://..." className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="Expiry Date" />
                  <input type="date" value={doc.expiryDate} onChange={(e) => updateDocument(doc.id, "expiryDate", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="Status" />
                  <Select value={doc.status} onChange={(v) => updateDocument(doc.id, "status", v)} options={DOC_STATUS_OPTIONS} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <FieldLabel label="Notes" />
                  <input value={doc.notes} onChange={(e) => updateDocument(doc.id, "notes", e.target.value)} placeholder="Additional notes..." className={inputCls} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addDocument} className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Plus className="h-4 w-4" /> Add Document
          </button>
        </div>
      </SectionCard>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 mt-4 py-3 bg-gradient-to-t from-white dark:from-slate-900 via-white dark:via-slate-900 to-transparent">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
              <div className="flex items-center gap-1">
                <div className={`h-1.5 w-1.5 rounded-full ${form.firstName && form.lastName ? "bg-green-500" : "bg-gray-300 dark:bg-slate-600"}`} />
                <span>Basic</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`h-1.5 w-1.5 rounded-full ${roles.length > 0 ? "bg-green-500" : "bg-gray-300 dark:bg-slate-600"}`} />
                <span>Role</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`h-1.5 w-1.5 rounded-full ${form.basicSalary ? "bg-green-500" : "bg-gray-300 dark:bg-slate-600"}`} />
                <span>Payroll</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`h-1.5 w-1.5 rounded-full ${form.permDivision ? "bg-green-500" : "bg-gray-300 dark:bg-slate-600"}`} />
                <span>Address</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} disabled={isPending} className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-all disabled:opacity-60 shadow-sm hover:shadow-md hover:shadow-brand-500/20">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {isPending ? "Creating Staff..." : "Create Staff Member"}
            </button>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {rawImageSrc && (
        <ImageCropModal
          open={cropModalOpen}
          imageSrc={rawImageSrc}
          onClose={() => { setCropModalOpen(false); setRawImageSrc(null); }}
          onCrop={handleCropApply}
        />
      )}
    </div>
  );
}

/* ─── Shared Styles ────────────────────────────────────────────────────────── */

const inputCls = "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600";

/* ─── Helper Components ────────────────────────────────────────────────────── */

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return <span className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>;
}

function SectionCard({ title, icon, color = "blue" as string, children }: { title: string; icon: React.ReactNode; color?: string; children: React.ReactNode }) {
  const colorMap: Record<string, { border: string; bg: string; iconBg: string; iconText: string }> = {
    blue: { border: "border-blue-100 dark:border-blue-500/20", bg: "bg-blue-50/40 dark:bg-blue-500/5", iconBg: "bg-blue-100 dark:bg-blue-500/15", iconText: "text-blue-600 dark:text-blue-400" },
    purple: { border: "border-purple-100 dark:border-purple-500/20", bg: "bg-purple-50/40 dark:bg-purple-500/5", iconBg: "bg-purple-100 dark:bg-purple-500/15", iconText: "text-purple-600 dark:text-purple-400" },
    green: { border: "border-emerald-100 dark:border-emerald-500/20", bg: "bg-emerald-50/40 dark:bg-emerald-500/5", iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconText: "text-emerald-600 dark:text-emerald-400" },
    rose: { border: "border-rose-100 dark:border-rose-500/20", bg: "bg-rose-50/40 dark:bg-rose-500/5", iconBg: "bg-rose-100 dark:bg-rose-500/15", iconText: "text-rose-600 dark:text-rose-400" },
    emerald: { border: "border-emerald-100 dark:border-emerald-500/20", bg: "bg-emerald-50/40 dark:bg-emerald-500/5", iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconText: "text-emerald-600 dark:text-emerald-400" },
    yellow: { border: "border-yellow-100 dark:border-yellow-500/20", bg: "bg-yellow-50/40 dark:bg-yellow-500/5", iconBg: "bg-yellow-100 dark:bg-yellow-500/15", iconText: "text-yellow-600 dark:text-yellow-400" },
    teal: { border: "border-teal-100 dark:border-teal-500/20", bg: "bg-teal-50/40 dark:bg-teal-500/5", iconBg: "bg-teal-100 dark:bg-teal-500/15", iconText: "text-teal-600 dark:text-teal-400" },
    amber: { border: "border-amber-100 dark:border-amber-500/20", bg: "bg-amber-50/40 dark:bg-amber-500/5", iconBg: "bg-amber-100 dark:bg-amber-500/15", iconText: "text-amber-600 dark:text-amber-400" },
    sky: { border: "border-sky-100 dark:border-sky-500/20", bg: "bg-sky-50/40 dark:bg-sky-500/5", iconBg: "bg-sky-100 dark:bg-sky-500/15", iconText: "text-sky-600 dark:text-sky-400" },
    indigo: { border: "border-indigo-100 dark:border-indigo-500/20", bg: "bg-indigo-50/40 dark:bg-indigo-500/5", iconBg: "bg-indigo-100 dark:bg-indigo-500/15", iconText: "text-indigo-600 dark:text-indigo-400" },
    cyan: { border: "border-cyan-100 dark:border-cyan-500/20", bg: "bg-cyan-50/40 dark:bg-cyan-500/5", iconBg: "bg-cyan-100 dark:bg-cyan-500/15", iconText: "text-cyan-600 dark:text-cyan-400" },
    pink: { border: "border-pink-100 dark:border-pink-500/20", bg: "bg-pink-50/40 dark:bg-pink-500/5", iconBg: "bg-pink-100 dark:bg-pink-500/15", iconText: "text-pink-600 dark:text-pink-400" },
    slate: { border: "border-slate-200 dark:border-slate-600/20", bg: "bg-slate-50/40 dark:bg-slate-500/5", iconBg: "bg-slate-200 dark:bg-slate-500/15", iconText: "text-slate-600 dark:text-slate-400" },
  };
  const fallback = colorMap.blue!;
  const c = colorMap[color] ?? fallback;
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4 mb-4`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${c.iconBg} ${c.iconText}`}>{icon}</div>
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
