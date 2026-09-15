import { apiRequest } from "@/lib/api-client";

export interface BackupJob {
  id: number;
  type: string;
  format: string;
  status: string;
  category: string | null;
  tables: string[] | null;
  manifest: BackupManifest | null;
  importStatus: string | null;
  conflictStrategy: string | null;
  importedTables: string[] | null;
  fileUrl: string | null;
  fileSize: number | null;
  preview: ImportPreview | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: number | null;
  createdAt: string | null;
}

export interface BackupTable {
  name: string;
  rowCount: number;
}

export interface BackupCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
  tables: string[];
  dependencies: string[];
}

export interface BackupManifest {
  version: number;
  backupType: string;
  category?: string;
  createdAt: string;
  tables: { table: string; rowCount: number; columns: string[] }[];
  recordCounts: Record<string, number>;
  dependencies: string[];
  checksum: string;
}

export interface TableConflict {
  table: string;
  existingCount: number;
  incomingCount: number;
  strategy: string;
}

export interface ImportPreview {
  manifest: BackupManifest;
  conflicts: TableConflict[];
  totalRecords: number;
}

export const backupApi = {
  list: (page = 1, limit = 20) =>
    apiRequest<{ data: BackupJob[]; total: number }>(`/admin/backup?page=${page}&limit=${limit}`),

  getOne: (id: number) =>
    apiRequest<BackupJob>(`/admin/backup/${id}`),

  listCategories: () =>
    apiRequest<BackupCategory[]>("/admin/backup/categories"),

  listTables: () =>
    apiRequest<BackupTable[]>("/admin/backup/tables"),

  triggerFull: () =>
    apiRequest<BackupJob>("/admin/backup/full", { method: "POST" }),

  triggerCategory: (categoryId: string) =>
    apiRequest<BackupJob>("/admin/backup/category", {
      method: "POST",
      body: JSON.stringify({ categoryId }),
    }),

  triggerSelective: (tables: string[]) =>
    apiRequest<BackupJob>("/admin/backup/selective", {
      method: "POST",
      body: JSON.stringify({ tables }),
    }),

  dryRun: (id: number) =>
    apiRequest<ImportPreview>(`/admin/backup/${id}/dry-run`, { method: "POST" }),

  importBackup: (id: number, conflictStrategy: string) =>
    apiRequest<BackupJob>(`/admin/backup/${id}/import`, {
      method: "POST",
      body: JSON.stringify({ conflictStrategy }),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/admin/backup/${id}`, { method: "DELETE" }),
};
