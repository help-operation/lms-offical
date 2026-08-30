"use server";

import { apiRequest, ApiError } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
import { DEFAULT_HOME_TEMPLATE_ID } from "./registry";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

function parseTemplateColors(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export async function getHomeTemplateSettingsAction() {
  try {
    const res = await apiRequest<Record<string, string>>("/system-settings");
    const s = res.data ?? {};
    return {
      success: true as const,
      data: {
        selectedTemplate: s.general_home_template || DEFAULT_HOME_TEMPLATE_ID,
        colors: parseTemplateColors(s.general_home_template_colors),
      },
    };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

/** Sets (or clears, when `color` is "") a single template's default color. */
export async function updateHomeTemplateColorAction(templateId: string, color: string) {
  try {
    const res = await apiRequest<Record<string, string>>("/system-settings");
    const colors = parseTemplateColors(res.data?.general_home_template_colors);
    if (color) {
      colors[templateId] = color;
    } else {
      delete colors[templateId];
    }
    await apiRequest<Record<string, string>>("/system-settings", {
      method: "PUT",
      body: JSON.stringify({ general_home_template_colors: JSON.stringify(colors) }),
    });
    revalidatePath("/admin/content/home-templates");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateHomeTemplateAction(templateId: string) {
  try {
    await apiRequest<Record<string, string>>("/system-settings", {
      method: "PUT",
      body: JSON.stringify({ general_home_template: templateId }),
    });
    revalidatePath("/admin/content/home-templates");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
