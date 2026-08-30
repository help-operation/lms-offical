"use server";

import { revalidatePath } from "next/cache";
import { codeSnippetsApi, type CreateSnippetInput, type UpdateSnippetInput } from "./api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error)    return err.message;
  return "Something went wrong";
}

export async function getCodeSnippetsAction() {
  try {
    const res = await codeSnippetsApi.getAll();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function createCodeSnippetAction(data: CreateSnippetInput) {
  try {
    const res = await codeSnippetsApi.create(data);
    revalidatePath("/admin/settings/code-snippets");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateCodeSnippetAction(id: number, data: UpdateSnippetInput) {
  try {
    const res = await codeSnippetsApi.update(id, data);
    revalidatePath("/admin/settings/code-snippets");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteCodeSnippetAction(id: number) {
  try {
    await codeSnippetsApi.remove(id);
    revalidatePath("/admin/settings/code-snippets");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
