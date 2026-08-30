"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Loader2, Mail, Phone, CheckCircle2, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { toast } from "@repo/ui/sonner";
import { ApiError } from "@/lib/api-client-browser";
import { settingsApiBrowser } from "./api/browser";
import type { AccountProfile } from "./api";

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
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
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

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass =
  "mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60";

// ─── Profile overview ─────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function ProfileOverview({
  profile,
  firstName,
  lastName,
  onAvatarChange,
}: {
  profile: AccountProfile;
  firstName: string;
  lastName: string;
  onAvatarChange: (url: string) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setUploading(true);
    try {
      const { data: uploadData } = await settingsApiBrowser.avatarUploadUrl(file.type);
      await fetch(uploadData.presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      await settingsApiBrowser.updateAvatar(uploadData.publicUrl);
      onAvatarChange(uploadData.publicUrl);
      toast.success("Profile photo updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Profile Details</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal learner information.</p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="relative h-20 w-20 shrink-0">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar ?? undefined} />
            <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand-solid text-white shadow-md transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Name" value={`${firstName} ${lastName}`.trim() || "—"} />
          <InfoItem label="ID" value={`SK-${String(profile.id).padStart(5, "0")}`} />
          <InfoItem label="Email" value={profile.email ?? "—"} />
          <InfoItem
            label="Gender"
            value={profile.gender ? profile.gender[0]!.toUpperCase() + profile.gender.slice(1) : "—"}
          />
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Role</p>
            <Badge variant="outline" className="mt-0.5">{profile.role}</Badge>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Edit profile ─────────────────────────────────────────────────────────────

function EditProfileSection({
  initialFirst,
  initialLast,
  initialGender,
  onSaved,
}: {
  initialFirst: string;
  initialLast: string;
  initialGender: "male" | "female" | "other" | null;
  onSaved: (firstName: string, lastName: string, gender: "male" | "female" | "other" | null) => void;
}) {
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [gender, setGender] = useState<"male" | "female" | "other" | "">(initialGender ?? "");
  const [pending, start] = useTransition();

  const dirty = firstName !== initialFirst || lastName !== initialLast || gender !== (initialGender ?? "");

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    start(async () => {
      try {
        await settingsApiBrowser.updateProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: gender || undefined,
        });
        toast.success("Profile updated");
        onSaved(firstName.trim(), lastName.trim(), (gender || null) as "male" | "female" | "other" | null);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to update profile");
      }
    });
  }

  return (
    <Section icon={User} title="Edit profile" description="Update the name shown across your dashboard.">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>First name</label>
            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Last name</label>
            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Gender</label>
          <select
            className={inputClass}
            value={gender}
            onChange={(e) => setGender(e.target.value as "male" | "female" | "other" | "")}
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit" className={primaryBtn} disabled={pending || !dirty}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </form>
    </Section>
  );
}

// ─── Password ───────────────────────────────────────────────────────────────

function PasswordSection({ hasPassword: initialHasPassword }: { hasPassword: boolean }) {
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    start(async () => {
      try {
        await settingsApiBrowser.changePassword({
          currentPassword: hasPassword ? current : undefined,
          newPassword: next,
        });
        toast.success(hasPassword ? "Password changed" : "Password set");
        setHasPassword(true);
        setCurrent("");
        setNext("");
        setConfirm("");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to update password");
      }
    });
  }

  return (
    <Section
      icon={Lock}
      title={hasPassword ? "Change password" : "Set a password"}
      description={
        hasPassword
          ? "Update the password used to sign in."
          : "You sign in with a one-time code. Add a password to also sign in with it."
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {hasPassword && (
          <div>
            <label className={labelClass}>Current password</label>
            <input
              type="password"
              className={inputClass}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>New password</label>
            <input
              type="password"
              className={inputClass}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={labelClass}>Confirm new password</label>
            <input
              type="password"
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <button type="submit" className={primaryBtn} disabled={pending || !next || !confirm}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {hasPassword ? "Change password" : "Set password"}
        </button>
      </form>
    </Section>
  );
}

// ─── Contact details (add email/phone, OTP-verified) ──────────────────────────

function ContactRow({
  type,
  value,
  onAdded,
}: {
  type: "email" | "phone";
  value: string | null;
  onAdded: (profile: AccountProfile) => void;
}) {
  const isEmail = type === "email";
  const Icon = isEmail ? Mail : Phone;
  const label = isEmail ? "Email" : "Phone";

  const [stage, setStage] = useState<"idle" | "otp">("idle");
  const [input, setInput] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pending, start] = useTransition();

  // Already set — show it read-only (add-only policy).
  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{value}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
        </span>
      </div>
    );
  }

  function sendCode() {
    if (!input.trim()) {
      toast.error(`Enter your ${isEmail ? "email" : "phone number"}`);
      return;
    }
    start(async () => {
      try {
        await settingsApiBrowser.sendContactOtp({ type, value: input.trim() });
        setStage("otp");
        toast.success(`Code sent to your ${isEmail ? "email" : "phone"}`);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Couldn't send code");
      }
    });
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 3) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  function verify() {
    const code = otp.join("");
    if (code.length !== 4) {
      toast.error("Enter the 4-digit code");
      return;
    }
    start(async () => {
      try {
        const res = await settingsApiBrowser.verifyContact({ type, value: input.trim(), code });
        toast.success(`${label} added`);
        onAdded(res.data);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Verification failed");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Icon className="h-4 w-4 text-brand" /> Add {label.toLowerCase()}
      </p>

      {stage === "idle" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputClass}
            type={isEmail ? "email" : "tel"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isEmail ? "you@example.com" : "01XXXXXXXXX"}
          />
          <button type="button" className={`${primaryBtn} whitespace-nowrap`} onClick={sendCode} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send code
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter the 4-digit code sent to <span className="font-semibold">{input.trim()}</span>
          </p>
          <div className="flex gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="h-12 w-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className={primaryBtn} onClick={verify} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify &amp; save
            </button>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
              onClick={() => {
                setStage("idle");
                setOtp(["", "", "", ""]);
              }}
            >
              ← Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactSection({
  email,
  phone,
  onUpdated,
}: {
  email: string | null;
  phone: string | null;
  onUpdated: (profile: AccountProfile) => void;
}) {
  return (
    <Section
      icon={Mail}
      title="Contact details"
      description="Add a verified email or phone so you can sign in with either."
    >
      <div className="space-y-3">
        <ContactRow type="email" value={email} onAdded={onUpdated} />
        <ContactRow type="phone" value={phone} onAdded={onUpdated} />
      </div>
    </Section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsClient({ initial }: { initial: AccountProfile }) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [gender, setGender] = useState(initial.gender);

  return (
    <div className="space-y-6">
      <ProfileOverview
        profile={{ ...initial, email, avatar, gender }}
        firstName={firstName}
        lastName={lastName}
        onAvatarChange={setAvatar}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EditProfileSection
          initialFirst={initial.firstName}
          initialLast={initial.lastName}
          initialGender={initial.gender}
          onSaved={(f, l, g) => {
            setFirstName(f);
            setLastName(l);
            setGender(g);
          }}
        />
        <PasswordSection hasPassword={initial.hasPassword} />
        <ContactSection
          email={email}
          phone={phone}
          onUpdated={(p) => {
            setEmail(p.email);
            setPhone(p.phone);
          }}
        />
      </div>
    </div>
  );
}
