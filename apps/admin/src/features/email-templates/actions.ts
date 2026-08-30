"use server";

import { apiRequest } from "@/lib/api-client";
import type { EmailTemplate } from "./types";

export async function getEmailTemplatesAction() {
  try {
    const res = await apiRequest<EmailTemplate[]>("/admin/email-templates");
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch templates" };
  }
}

export async function getEmailTemplateAction(eventType: string) {
  try {
    const res = await apiRequest<EmailTemplate>(`/admin/email-templates/${eventType}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch template" };
  }
}

export async function updateEmailTemplateAction(
  eventType: string,
  data: { subject: string; htmlBody: string },
) {
  try {
    const res = await apiRequest<EmailTemplate>(`/admin/email-templates/${eventType}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to update template" };
  }
}

export async function toggleEmailTemplateAction(eventType: string) {
  try {
    const res = await apiRequest<EmailTemplate>(`/admin/email-templates/${eventType}/toggle`, {
      method: "POST",
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to toggle template" };
  }
}

export async function sendTestEmailAction(eventType: string, email: string) {
  try {
    const res = await apiRequest<{ sent: boolean }>(`/admin/email-templates/${eventType}/test`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to send test email" };
  }
}
