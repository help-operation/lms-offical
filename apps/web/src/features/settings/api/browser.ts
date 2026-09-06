import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { AccountProfile } from "./index";

export interface AddressData {
  [key: string]: string | boolean | undefined;
  permanentCountry?: string;
  permanentDivision?: string;
  permanentDistrict?: string;
  permanentThana?: string;
  permanentUnion?: string;
  permanentPostCode?: string;
  permanentAddress?: string;
  sameAsPermanent?: boolean;
  presentCountry?: string;
  presentDivision?: string;
  presentDistrict?: string;
  presentThana?: string;
  presentUnion?: string;
  presentPostCode?: string;
  presentAddress?: string;
}

export interface EmergencyContactData {
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship?: string;
}

export interface EducationRecord {
  id: number;
  userId: number;
  degree: string | null;
  institution: string | null;
  subject: string | null;
  passingYear: number | null;
  result: string | null;
  order: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ExperienceRecord {
  id: number;
  userId: number;
  company: string | null;
  designation: string | null;
  department: string | null;
  employmentType: string | null;
  startDate: string | null;
  endDate: string | null;
  currentlyWorking: boolean | null;
  responsibilities: string | null;
  order: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SkillRecord {
  id: number;
  userId: number;
  skillName: string;
  level: string | null;
  order: number | null;
  createdAt: string | null;
}

export const settingsApiBrowser = {
  // ── Profile ───────────────────────────────────────────────────────────────

  updateProfile: (data: { firstName: string; lastName: string; gender?: "male" | "female" | "other" }) =>
    apiRequestBrowser<AccountProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  avatarUploadUrl: (contentType: string) =>
    apiRequestBrowser<{ presignedUrl: string; publicUrl: string; key: string }>(
      "/profile/avatar/upload-url",
      {
        method: "POST",
        body: JSON.stringify({ contentType }),
      },
    ),

  updateAvatar: (avatar: string) =>
    apiRequestBrowser<AccountProfile>("/profile/avatar", {
      method: "PATCH",
      body: JSON.stringify({ avatar }),
    }),

  updateNotifications: (emailNotifications: boolean) =>
    apiRequestBrowser<AccountProfile>("/profile/notifications", {
      method: "PATCH",
      body: JSON.stringify({ emailNotifications }),
    }),

  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    apiRequestBrowser<{ success: boolean }>("/profile/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  sendContactOtp: (data: { type: "email" | "phone"; value: string }) =>
    apiRequestBrowser<null>("/profile/contact/send-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyContact: (data: { type: "email" | "phone"; value: string; code: string }) =>
    apiRequestBrowser<AccountProfile>("/profile/contact/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ── Address ───────────────────────────────────────────────────────────────

  getAddress: () =>
    apiRequestBrowser<AddressData>("/profile/address"),

  updateAddress: (data: AddressData) =>
    apiRequestBrowser<AccountProfile>("/profile/address", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ── Emergency Contact ─────────────────────────────────────────────────────

  getEmergencyContact: () =>
    apiRequestBrowser<EmergencyContactData>("/profile/emergency-contact"),

  updateEmergencyContact: (data: EmergencyContactData) =>
    apiRequestBrowser<AccountProfile>("/profile/emergency-contact", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ── Education ─────────────────────────────────────────────────────────────

  listEducation: () =>
    apiRequestBrowser<EducationRecord[]>("/profile/education"),

  createEducation: (data: Partial<EducationRecord>) =>
    apiRequestBrowser<EducationRecord>("/profile/education", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateEducation: (id: number, data: Partial<EducationRecord>) =>
    apiRequestBrowser<EducationRecord>(`/profile/education/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteEducation: (id: number) =>
    apiRequestBrowser<null>(`/profile/education/${id}`, {
      method: "DELETE",
    }),

  // ── Experience ────────────────────────────────────────────────────────────

  listExperience: () =>
    apiRequestBrowser<ExperienceRecord[]>("/profile/experience"),

  createExperience: (data: Partial<ExperienceRecord>) =>
    apiRequestBrowser<ExperienceRecord>("/profile/experience", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateExperience: (id: number, data: Partial<ExperienceRecord>) =>
    apiRequestBrowser<ExperienceRecord>(`/profile/experience/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteExperience: (id: number) =>
    apiRequestBrowser<null>(`/profile/experience/${id}`, {
      method: "DELETE",
    }),

  // ── Skills ────────────────────────────────────────────────────────────────

  listSkills: () =>
    apiRequestBrowser<SkillRecord[]>("/profile/skills"),

  addSkill: (data: { skillName: string; level?: string }) =>
    apiRequestBrowser<SkillRecord>("/profile/skills", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removeSkill: (id: number) =>
    apiRequestBrowser<null>(`/profile/skills/${id}`, {
      method: "DELETE",
    }),
};
