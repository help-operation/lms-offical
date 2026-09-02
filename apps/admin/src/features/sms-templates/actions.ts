"use server";

import { apiRequest } from "@/lib/api-client";
import type { SmsTemplate, CreateTemplateInput } from "./types";

export async function getSmsTemplatesAction() {
  try {
    const res = await apiRequest<SmsTemplate[]>("/sms-templates");
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch SMS templates" };
  }
}

export async function createSmsTemplateAction(data: CreateTemplateInput) {
  try {
    const res = await apiRequest<SmsTemplate>("/sms-templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to create template" };
  }
}

export async function updateSmsTemplateAction(
  eventType: string,
  data: { body: string; name?: string },
) {
  try {
    const res = await apiRequest<SmsTemplate>(`/sms-templates/${eventType}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to update template" };
  }
}

export async function toggleSmsTemplateAction(eventType: string) {
  try {
    const res = await apiRequest<SmsTemplate>(`/sms-templates/${eventType}/toggle`, {
      method: "PATCH",
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to toggle template" };
  }
}

export async function deleteSmsTemplateAction(eventType: string) {
  try {
    await apiRequest(`/sms-templates/${eventType}`, { method: "DELETE" });
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to delete template" };
  }
}

export async function sendTestSmsAction(eventType: string, phone: string) {
  try {
    const res = await apiRequest<{ sent: boolean }>(`/sms-templates/${eventType}/test`, {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to send test SMS" };
  }
}

export async function getBroadcastCountsAction() {
  try {
    const res = await apiRequest<Record<string, number>>("/sms-broadcast/counts");
    return { success: true as const, data: res.data ?? {} };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch counts" };
  }
}

export async function sendBroadcastAction(segment: string, message: string) {
  try {
    const res = await apiRequest<{ total: number; sent: number; failed: number }>(
      "/sms-broadcast",
      { method: "POST", body: JSON.stringify({ segment, message }) },
    );
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to send broadcast" };
  }
}

/** Global kill switch for automatic/event-triggered SMS (OTP is always exempt). */
export async function getAutoSmsEnabledAction() {
  try {
    const res = await apiRequest<Record<string, string>>(
      "/system-settings/public?keys=sms_auto_notifications_enabled",
    );
    return { success: true as const, data: res.data?.sms_auto_notifications_enabled === "true" };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch setting" };
  }
}

export async function setAutoSmsEnabledAction(enabled: boolean) {
  try {
    await apiRequest("/system-settings/sms_auto_notifications_enabled", {
      method: "PUT",
      body: JSON.stringify({ value: String(enabled) }),
    });
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to update setting" };
  }
}
