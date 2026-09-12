"use client";

import { useState, useRef, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Lock, Mail, Phone, MapPin, GraduationCap, Briefcase,
  Wrench, AlertTriangle, Camera, Loader2, CheckCircle2, Plus, Trash2,
  Edit3, Eye, EyeOff, ChevronDown, ChevronUp, X, Save,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { toast } from "@repo/ui/sonner";
import { ApiError } from "@/lib/api-client-browser";
import {
  settingsApiBrowser,
  type AddressData,
  type EmergencyContactData,
  type EducationRecord,
  type ExperienceRecord,
  type SkillRecord,
} from "@/features/settings/api/browser";
import type { AccountProfile } from "@/features/settings/api";

// ─── Shared styles ──────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";
const dangerBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-500/10";

// ─── Section shell ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// ─── Profile Photo Section ──────────────────────────────────────────────────

function ProfilePhotoSection({
  profile,
  onAvatarChange,
}: {
  profile: AccountProfile;
  onAvatarChange: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropData, setCropData] = useState({ x: 0, y: 0 });

  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setCropOpen(true);
      setCropZoom(1);
      setCropData({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  }

  async function handleCropSave() {
    if (!cropImage) return;
    setUploading(true);
    setCropOpen(false);
    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = cropImage;
      });

      const size = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - size) / 2;
      const sy = (img.naturalHeight - size) / 2;

      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9)
      );

      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const { data: uploadData } = await settingsApiBrowser.avatarUploadUrl("image/jpeg");
      await fetch(uploadData.presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "image/jpeg" },
      });
      await settingsApiBrowser.updateAvatar(uploadData.publicUrl);
      onAvatarChange(uploadData.publicUrl);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      setCropImage(null);
    }
  }

  return (
    <>
      <Section icon={Camera} title="Profile Photo" description="Upload a profile picture. Square images work best.">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-24 w-24 shrink-0">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar ?? undefined} alt={`${profile.firstName} ${profile.lastName}`} />
              <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand-solid text-white shadow-md transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              JPG, PNG, or WebP. Max 5MB. Square 1:1 ratio recommended.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 text-sm font-semibold text-brand hover:text-brand-hover"
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
          </div>
        </div>
      </Section>

      {/* Crop Modal */}
      {cropOpen && cropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onKeyDown={(e) => { if (e.key === "Escape") { setCropOpen(false); setCropImage(null); } }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Crop Photo</h3>
              <button onClick={() => { setCropOpen(false); setCropImage(null); }} aria-label="Close crop modal" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              <img src={cropImage} alt="Crop preview" className="h-full w-full object-cover" />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={cropZoom}
                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => { setCropOpen(false); setCropImage(null); }} className={secondaryBtn}>Cancel</button>
              <button onClick={handleCropSave} disabled={uploading} className={primaryBtn}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Personal Info Section ──────────────────────────────────────────────────

function PersonalInfoSection({
  profile,
  onSaved,
}: {
  profile: AccountProfile;
  onSaved: (firstName: string, lastName: string, gender: "male" | "female" | "other" | null) => void;
}) {
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [pending, start] = useTransition();

  const dirty = firstName !== profile.firstName || lastName !== profile.lastName || gender !== (profile.gender ?? "");

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    start(async () => {
      try {
        await settingsApiBrowser.updateProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: (gender as "male" | "female" | "other") || undefined,
        });
        toast.success("Profile updated");
        onSaved(firstName.trim(), lastName.trim(), (gender || null) as "male" | "female" | "other" | null);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to update profile");
      }
    });
  }

  return (
    <Section icon={User} title="Personal Information" description="Update your name and gender.">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>First name *</label>
            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Last name</label>
            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Gender</label>
            <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Student ID</label>
            <input className={inputClass} value={`SK-${String(profile.id).padStart(5, "0")}`} disabled />
          </div>
        </div>
        <button type="submit" className={primaryBtn} disabled={pending || !dirty}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
        </button>
      </form>
    </Section>
  );
}

// ─── Contact Info Section ───────────────────────────────────────────────────

function ContactInfoSection({
  email,
  phone,
  onUpdated,
}: {
  email: string | null;
  phone: string | null;
  onUpdated: (profile: AccountProfile) => void;
}) {
  return (
    <Section icon={Mail} title="Contact Information" description="Your verified email and phone number.">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{email ?? "Not set"}</span>
          </div>
          {email && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{phone ?? "Not set"}</span>
          </div>
          {phone && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          To update your email or phone, please visit the <a href="/dashboard/settings" className="text-brand hover:underline">Settings</a> page.
        </p>
      </div>
    </Section>
  );
}

// ─── Address Section ────────────────────────────────────────────────────────

const BD_DIVISIONS: Record<string, string[]> = {
  Bangladesh: ["Barisal", "Chittagong", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"],
};

function AddressSection() {
  const [address, setAddress] = useState<AddressData>({});
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<"permanent" | "present" | null>("permanent");

  useEffect(() => {
    settingsApiBrowser.getAddress()
      .then((res) => {
        const d = res.data;
        setAddress({
          permanentCountry: d.permanentCountry ?? "",
          permanentDivision: d.permanentDivision ?? "",
          permanentDistrict: d.permanentDistrict ?? "",
          permanentThana: d.permanentThana ?? "",
          permanentUnion: d.permanentUnion ?? "",
          permanentPostCode: d.permanentPostCode ?? "",
          permanentAddress: d.permanentAddress ?? "",
          presentCountry: d.presentCountry ?? "",
          presentDivision: d.presentDivision ?? "",
          presentDistrict: d.presentDistrict ?? "",
          presentThana: d.presentThana ?? "",
          presentUnion: d.presentUnion ?? "",
          presentPostCode: d.presentPostCode ?? "",
          presentAddress: d.presentAddress ?? "",
        });
        setSameAsPermanent(!!d.sameAsPermanent);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateField(field: string, value: string) {
    setAddress((prev) => {
      const next = { ...prev, [field]: value };
      if (sameAsPermanent && field.startsWith("permanent")) {
        const presentField = field.replace("permanent", "present");
        next[presentField] = value;
      }
      return next;
    });
  }

  function toggleSameAsPermanent(checked: boolean) {
    setSameAsPermanent(checked);
    if (checked) {
      setAddress((prev) => ({
        ...prev,
        sameAsPermanent: true,
        presentCountry: prev.permanentCountry,
        presentDivision: prev.permanentDivision,
        presentDistrict: prev.permanentDistrict,
        presentThana: prev.permanentThana,
        presentUnion: prev.permanentUnion,
        presentPostCode: prev.permanentPostCode,
        presentAddress: prev.permanentAddress,
      }));
    } else {
      setAddress((prev) => ({ ...prev, sameAsPermanent: false }));
    }
  }

  function save() {
    setSaving(true);
    settingsApiBrowser.updateAddress({ ...address, sameAsPermanent })
      .then(() => toast.success("Address updated"))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to update address"))
      .finally(() => setSaving(false));
  }

  if (loading) return <Section icon={MapPin} title="Address" description="Your permanent and present address."><div className="animate-pulse space-y-4"><div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" /></div></Section>;

  const divisions = BD_DIVISIONS["Bangladesh"] ?? [];

  function renderAddressFields(prefix: "permanent" | "present", disabled: boolean) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Country</label>
          <input className={inputClass} value={(address as any)[`${prefix}Country`] ?? ""} onChange={(e) => updateField(`${prefix}Country`, e.target.value)} disabled={disabled} placeholder="Bangladesh" />
        </div>
        <div>
          <label className={labelClass}>Division</label>
          <select className={inputClass} value={(address as any)[`${prefix}Division`] ?? ""} onChange={(e) => updateField(`${prefix}Division`, e.target.value)} disabled={disabled}>
            <option value="">Select Division</option>
            {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>District</label>
          <input className={inputClass} value={(address as any)[`${prefix}District`] ?? ""} onChange={(e) => updateField(`${prefix}District`, e.target.value)} disabled={disabled} />
        </div>
        <div>
          <label className={labelClass}>Thana / Upazila</label>
          <input className={inputClass} value={(address as any)[`${prefix}Thana`] ?? ""} onChange={(e) => updateField(`${prefix}Thana`, e.target.value)} disabled={disabled} />
        </div>
        <div>
          <label className={labelClass}>Union</label>
          <input className={inputClass} value={(address as any)[`${prefix}Union`] ?? ""} onChange={(e) => updateField(`${prefix}Union`, e.target.value)} disabled={disabled} />
        </div>
        <div>
          <label className={labelClass}>Post Code</label>
          <input className={inputClass} value={(address as any)[`${prefix}PostCode`] ?? ""} onChange={(e) => updateField(`${prefix}PostCode`, e.target.value)} disabled={disabled} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Full Address</label>
          <input className={inputClass} value={(address as any)[`${prefix}Address`] ?? ""} onChange={(e) => updateField(`${prefix}Address`, e.target.value)} disabled={disabled} placeholder="House #, Road #, Area" />
        </div>
      </div>
    );
  }

  return (
    <Section icon={MapPin} title="Address" description="Your permanent and present address.">
      <div className="space-y-5">
        {/* Permanent Address */}
        <div>
          <button type="button" onClick={() => setExpanded(expanded === "permanent" ? null : "permanent")} className="flex w-full items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span>Permanent Address</span>
            {expanded === "permanent" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expanded === "permanent" && <div className="mt-3">{renderAddressFields("permanent", false)}</div>}
        </div>

        {/* Same as permanent */}
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={sameAsPermanent} onChange={(e) => toggleSameAsPermanent(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
          Present address is same as permanent
        </label>

        {/* Present Address */}
        {!sameAsPermanent && (
          <div>
            <button type="button" onClick={() => setExpanded(expanded === "present" ? null : "present")} className="flex w-full items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span>Present Address</span>
              {expanded === "present" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expanded === "present" && <div className="mt-3">{renderAddressFields("present", false)}</div>}
          </div>
        )}

        <button onClick={save} className={primaryBtn} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Address
        </button>
      </div>
    </Section>
  );
}

// ─── Emergency Contact Section ──────────────────────────────────────────────

const RELATIONSHIPS = ["Father", "Mother", "Brother", "Sister", "Husband", "Wife", "Son", "Daughter", "Other"];

function EmergencyContactSection() {
  const [contact, setContact] = useState<EmergencyContactData>({ emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApiBrowser.getEmergencyContact()
      .then((res) => setContact({
          emergencyContactName: res.data.emergencyContactName ?? "",
          emergencyContactPhone: res.data.emergencyContactPhone ?? "",
          emergencyContactRelationship: res.data.emergencyContactRelationship ?? "",
        }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function save() {
    if (!contact.emergencyContactName.trim()) { toast.error("Contact name is required"); return; }
    if (!contact.emergencyContactPhone.trim()) { toast.error("Phone number is required"); return; }
    setSaving(true);
    settingsApiBrowser.updateEmergencyContact(contact)
      .then(() => toast.success("Emergency contact updated"))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to update"))
      .finally(() => setSaving(false));
  }

  if (loading) return <Section icon={AlertTriangle} title="Emergency Contact" description="Person to contact in case of emergency."><div className="animate-pulse h-24 rounded-xl bg-gray-200 dark:bg-gray-700" /></Section>;

  return (
    <Section icon={AlertTriangle} title="Emergency Contact" description="Person to contact in case of emergency.">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Relationship</label>
            <select className={inputClass} value={contact.emergencyContactRelationship ?? ""} onChange={(e) => setContact((p) => ({ ...p, emergencyContactRelationship: e.target.value }))}>
              <option value="">Select relationship</option>
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Contact Name *</label>
            <input className={inputClass} value={contact.emergencyContactName} onChange={(e) => setContact((p) => ({ ...p, emergencyContactName: e.target.value }))} placeholder="Full name" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Mobile Number *</label>
          <input className={inputClass} value={contact.emergencyContactPhone} onChange={(e) => setContact((p) => ({ ...p, emergencyContactPhone: e.target.value }))} placeholder="01XXXXXXXXX" />
        </div>
        <button onClick={save} className={primaryBtn} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Contact
        </button>
      </div>
    </Section>
  );
}

// ─── Education Section ──────────────────────────────────────────────────────

function EducationSection() {
  const [records, setRecords] = useState<EducationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ degree: "", institution: "", subject: "", passingYear: "", result: "" });
  const [pending, start] = useTransition();

  useEffect(() => {
    settingsApiBrowser.listEducation()
      .then((res) => setRecords(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setForm({ degree: "", institution: "", subject: "", passingYear: "", result: "" });
  }

  function startEdit(r: EducationRecord) {
    setEditing(r.id);
    setAdding(false);
    setForm({
      degree: r.degree ?? "",
      institution: r.institution ?? "",
      subject: r.subject ?? "",
      passingYear: r.passingYear?.toString() ?? "",
      result: r.result ?? "",
    });
  }

  function saveRecord() {
    start(async () => {
      try {
        const data = { ...form, passingYear: form.passingYear ? parseInt(form.passingYear) : undefined };
        if (editing) {
          const res = await settingsApiBrowser.updateEducation(editing, data);
          setRecords((prev) => prev.map((r) => (r.id === editing ? res.data : r)));
          toast.success("Education updated");
        } else {
          const res = await settingsApiBrowser.createEducation(data);
          setRecords((prev) => [...prev, res.data]);
          toast.success("Education added");
        }
        setAdding(false);
        setEditing(null);
        setForm({ degree: "", institution: "", subject: "", passingYear: "", result: "" });
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to save");
      }
    });
  }

  function deleteRecord(id: number) {
    start(async () => {
      try {
        await settingsApiBrowser.deleteEducation(id);
        setRecords((prev) => prev.filter((r) => r.id !== id));
        toast.success("Education removed");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to delete");
      }
    });
  }

  if (loading) return <Section icon={GraduationCap} title="Education" description="Your educational qualifications."><div className="animate-pulse space-y-3"><div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700" /></div></Section>;

  return (
    <Section icon={GraduationCap} title="Education" description="Your educational qualifications.">
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            {editing === r.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div><label className={labelClass}>Degree</label><input className={inputClass} value={form.degree} onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))} /></div>
                  <div><label className={labelClass}>Institution</label><input className={inputClass} value={form.institution} onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))} /></div>
                  <div><label className={labelClass}>Subject</label><input className={inputClass} value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} /></div>
                  <div><label className={labelClass}>Passing Year</label><input className={inputClass} type="number" value={form.passingYear} onChange={(e) => setForm((p) => ({ ...p, passingYear: e.target.value }))} /></div>
                  <div><label className={labelClass}>Result</label><input className={inputClass} value={form.result} onChange={(e) => setForm((p) => ({ ...p, result: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveRecord} className={primaryBtn} disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
                  <button onClick={() => { setEditing(null); setAdding(false); }} className={secondaryBtn}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{r.degree || "Degree"}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{r.institution || "Institution"}{r.subject ? ` - ${r.subject}` : ""}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{r.passingYear ? `Passed ${r.passingYear}` : ""}{r.result ? ` - ${r.result}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(r)} aria-label={`Edit ${r.degree || "education record"}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => deleteRecord(r.id)} aria-label={`Delete ${r.degree || "education record"}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-brand-500/5">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className={labelClass}>Degree</label><input className={inputClass} value={form.degree} onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))} placeholder="e.g. B.Sc" /></div>
                <div><label className={labelClass}>Institution</label><input className={inputClass} value={form.institution} onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))} placeholder="University name" /></div>
                <div><label className={labelClass}>Subject</label><input className={inputClass} value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} /></div>
                <div><label className={labelClass}>Passing Year</label><input className={inputClass} type="number" value={form.passingYear} onChange={(e) => setForm((p) => ({ ...p, passingYear: e.target.value }))} /></div>
                <div><label className={labelClass}>Result</label><input className={inputClass} value={form.result} onChange={(e) => setForm((p) => ({ ...p, result: e.target.value }))} placeholder="e.g. CGPA 3.5" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveRecord} className={primaryBtn} disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
                <button onClick={() => setAdding(false)} className={secondaryBtn}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {!adding && (
          <button onClick={startAdd} className={secondaryBtn}>
            <Plus className="h-4 w-4" /> Add Education
          </button>
        )}
      </div>
    </Section>
  );
}

// ─── Experience Section ─────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contractual", "Freelance", "Internship"];

function ExperienceSection() {
  const [records, setRecords] = useState<ExperienceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ company: "", designation: "", department: "", employmentType: "", startDate: "", endDate: "", currentlyWorking: false, responsibilities: "" });
  const [pending, start] = useTransition();

  useEffect(() => {
    settingsApiBrowser.listExperience()
      .then((res) => setRecords(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function startAdd() {
    setAdding(true); setEditing(null);
    setForm({ company: "", designation: "", department: "", employmentType: "", startDate: "", endDate: "", currentlyWorking: false, responsibilities: "" });
  }

  function startEdit(r: ExperienceRecord) {
    setEditing(r.id); setAdding(false);
    setForm({ company: r.company ?? "", designation: r.designation ?? "", department: r.department ?? "", employmentType: r.employmentType ?? "", startDate: r.startDate ? r.startDate.split("T")[0] : "", endDate: r.endDate ? r.endDate.split("T")[0] : "", currentlyWorking: !!r.currentlyWorking, responsibilities: r.responsibilities ?? "" });
  }

  function saveRecord() {
    start(async () => {
      try {
        if (editing) {
          const res = await settingsApiBrowser.updateExperience(editing, form);
          setRecords((prev) => prev.map((r) => (r.id === editing ? res.data : r)));
          toast.success("Experience updated");
        } else {
          const res = await settingsApiBrowser.createExperience(form);
          setRecords((prev) => [...prev, res.data]);
          toast.success("Experience added");
        }
        setAdding(false); setEditing(null);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to save");
      }
    });
  }

  function deleteRecord(id: number) {
    start(async () => {
      try {
        await settingsApiBrowser.deleteExperience(id);
        setRecords((prev) => prev.filter((r) => r.id !== id));
        toast.success("Experience removed");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to delete");
      }
    });
  }

  if (loading) return <Section icon={Briefcase} title="Experience" description="Your work experience."><div className="animate-pulse h-20 rounded-xl bg-gray-200 dark:bg-gray-700" /></Section>;

  function renderForm() {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><label className={labelClass}>Company</label><input className={inputClass} value={form.company as string} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} /></div>
          <div><label className={labelClass}>Designation</label><input className={inputClass} value={form.designation as string} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} /></div>
          <div><label className={labelClass}>Department</label><input className={inputClass} value={form.department as string} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /></div>
          <div>
            <label className={labelClass}>Employment Type</label>
            <select className={inputClass} value={form.employmentType as string} onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}>
              <option value="">Select type</option>
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>Start Date</label><input className={inputClass} type="date" value={form.startDate as string} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></div>
          <div>
            <label className={labelClass}>End Date</label>
            <input className={inputClass} type="date" value={form.endDate as string} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} disabled={!!form.currentlyWorking} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={!!form.currentlyWorking} onChange={(e) => setForm((p) => ({ ...p, currentlyWorking: e.target.checked, endDate: e.target.checked ? "" : (p.endDate as string) }))} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
          Currently working here
        </label>
        <div><label className={labelClass}>Responsibilities</label><textarea className={inputClass} rows={3} value={form.responsibilities as string} onChange={(e) => setForm((p) => ({ ...p, responsibilities: e.target.value }))} /></div>
        <div className="flex gap-2">
          <button onClick={saveRecord} className={primaryBtn} disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
          <button onClick={() => { setAdding(false); setEditing(null); }} className={secondaryBtn}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <Section icon={Briefcase} title="Experience" description="Your work experience history.">
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            {editing === r.id ? renderForm() : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{r.designation || "Designation"}{r.company ? ` at ${r.company}` : ""}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{r.department || ""}{r.employmentType ? ` - ${r.employmentType}` : ""}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{r.startDate ? new Date(r.startDate).toLocaleDateString() : ""}{r.currentlyWorking ? " - Present" : r.endDate ? ` - ${new Date(r.endDate).toLocaleDateString()}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(r)} aria-label={`Edit ${r.designation || "experience record"}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => deleteRecord(r.id)} aria-label={`Delete ${r.designation || "experience record"}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-brand-500/5">{renderForm()}</div>}

        {!adding && (
          <button onClick={startAdd} className={secondaryBtn}>
            <Plus className="h-4 w-4" /> Add Experience
          </button>
        )}
      </div>
    </Section>
  );
}

// ─── Skills Section ─────────────────────────────────────────────────────────

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;

function SkillsSection() {
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState("");
  const [newLevel, setNewLevel] = useState<string>("intermediate");
  const [pending, start] = useTransition();

  useEffect(() => {
    settingsApiBrowser.listSkills()
      .then((res) => setSkills(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function addSkill() {
    if (!newSkill.trim()) return;
    start(async () => {
      try {
        const res = await settingsApiBrowser.addSkill({ skillName: newSkill.trim(), level: newLevel });
        setSkills((prev) => [...prev, res.data]);
        setNewSkill("");
        toast.success("Skill added");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to add skill");
      }
    });
  }

  function removeSkill(id: number) {
    start(async () => {
      try {
        await settingsApiBrowser.removeSkill(id);
        setSkills((prev) => prev.filter((s) => s.id !== id));
        toast.success("Skill removed");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to remove skill");
      }
    });
  }

  if (loading) return <Section icon={Wrench} title="Skills" description="Your technical and professional skills."><div className="animate-pulse h-16 rounded-xl bg-gray-200 dark:bg-gray-700" /></Section>;

  const levelColor: Record<string, string> = {
    beginner: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
    advanced: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    expert: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  };

  return (
    <Section icon={Wrench} title="Skills" description="Your technical and professional skills.">
      <div className="space-y-4">
        {/* Add skill */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className={`${inputClass} flex-1`} value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill (e.g. JavaScript)" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
          <select className={`${inputClass} w-full sm:w-40`} value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
            {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
          <button onClick={addSkill} disabled={pending || !newSkill.trim()} className={primaryBtn}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </div>

        {/* Skills list */}
        {skills.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No skills added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {s.skillName}
                {s.level && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${levelColor[s.level] ?? ""}`}>{s.level}</span>}
                <button onClick={() => removeSkill(s.id)} className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" aria-label={`Remove ${s.skillName}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Password Section ───────────────────────────────────────────────────────

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [hasPwd, setHasPwd] = useState(hasPassword);
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPass !== confirm) { toast.error("Passwords do not match"); return; }
    start(async () => {
      try {
        await settingsApiBrowser.changePassword({ currentPassword: hasPwd ? current : undefined, newPassword: newPass });
        toast.success(hasPwd ? "Password changed" : "Password set");
        setHasPwd(true); setCurrent(""); setNewPass(""); setConfirm("");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to update password");
      }
    });
  }

  return (
    <Section icon={Lock} title={hasPwd ? "Change Password" : "Set a Password"} description={hasPwd ? "Update the password used to sign in." : "Add a password to sign in without OTP."}>
      <form onSubmit={submit} className="space-y-4">
        {hasPwd && (
          <div>
            <label className={labelClass}>Current password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type={showCurrent ? "text" : "password"} className={`${inputClass} pl-10 pr-10`} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} aria-label={showCurrent ? "Hide current password" : "Show current password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>New password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type={showNew ? "text" : "password"} className={`${inputClass} pl-10 pr-10`} value={newPass} onChange={(e) => setNewPass(e.target.value)} autoComplete="new-password" />
              <button type="button" onClick={() => setShowNew((v) => !v)} aria-label={showNew ? "Hide new password" : "Show new password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type={showNew ? "text" : "password"} className={`${inputClass} pl-10`} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
        </div>
        <button type="submit" className={primaryBtn} disabled={pending || !newPass || !confirm}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} {hasPwd ? "Change Password" : "Set Password"}
        </button>
      </form>
    </Section>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function StudentProfileClient({ initialProfile }: { initialProfile: AccountProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);

  const handleAvatarChange = useCallback((url: string) => {
    setProfile((prev: AccountProfile) => ({ ...prev, avatar: url }));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal information and settings.</p>
      </div>

      <ProfilePhotoSection profile={profile} onAvatarChange={handleAvatarChange} />

      <PersonalInfoSection
        profile={profile}
        onSaved={(f: string, l: string, g: "male" | "female" | "other" | null) => setProfile((prev: AccountProfile) => ({ ...prev, firstName: f, lastName: l, gender: g }))}
      />

      <ContactInfoSection email={profile.email} phone={profile.phone} onUpdated={setProfile} />

      <AddressSection />

      <EmergencyContactSection />

      <EducationSection />

      <ExperienceSection />

      <SkillsSection />

      <PasswordSection hasPassword={profile.hasPassword} />
    </div>
  );
}
