import { apiRequest } from "@/lib/api-client";

export interface BackupJob {
  id: number;
  type: string;
  format: string;
  status: string;
  tables: string[] | null;
  fileUrl: string | null;
  fileSize: number | null;
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

export const backupApi = {
  list: (page = 1, limit = 20) =>
    apiRequest<{ data: BackupJob[]; total: number }>(`/admin/backup?page=${page}&limit=${limit}`),

  getOne: (id: number) =>
    apiRequest<BackupJob>(`/admin/backup/${id}`),

  listTables: () =>
    apiRequest<BackupTable[]>("/admin/backup/tables"),

  triggerFull: () =>
    apiRequest<BackupJob>("/admin/backup/full", { method: "POST" }),

  triggerSelective: (tables: string[]) =>
    apiRequest<BackupJob>("/admin/backup/selective", {
      method: "POST",
      body: JSON.stringify({ tables }),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/admin/backup/${id}`, { method: "DELETE" }),
};
