"use server";

import {
  backupApi,
  type BackupJob,
  type BackupTable,
  type BackupCategory,
  type ImportPreview,
} from "./api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getBackupHistoryAction(page = 1, limit = 20) {
  try {
    const res = await backupApi.list(page, limit);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function getBackupCategoriesAction() {
  try {
    const res = await backupApi.listCategories();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function getBackupTablesAction() {
  try {
    const res = await backupApi.listTables();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function triggerFullBackupAction() {
  try {
    const res = await backupApi.triggerFull();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function triggerCategoryBackupAction(categoryId: string) {
  try {
    const res = await backupApi.triggerCategory(categoryId);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function triggerSelectiveBackupAction(tables: string[]) {
  try {
    const res = await backupApi.triggerSelective(tables);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function dryRunImportAction(backupId: number) {
  try {
    const res = await backupApi.dryRun(backupId);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function importBackupAction(backupId: number, conflictStrategy: string) {
  try {
    const res = await backupApi.importBackup(backupId, conflictStrategy);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteBackupAction(id: number) {
  try {
    await backupApi.delete(id);
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
