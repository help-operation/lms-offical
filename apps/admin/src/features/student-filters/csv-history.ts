/**
 * CSV Import History — localStorage-based persistence for saved CSV uploads.
 */
import type { CsvRecipient } from "./csv-parser";

export type SavedCsv = {
  id: string;
  fileName: string;
  uploadedAt: string; // ISO date
  totalRows: number;
  validRecipients: number;
  duplicateCount: number;
  recipients: CsvRecipient[];
};

const STORAGE_KEY = "lms_csv_import_history";

export function getSavedCsvs(): SavedCsv[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCsvEntry(entry: Omit<SavedCsv, "id">): SavedCsv {
  const saved: SavedCsv = {
    ...entry,
    id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const existing = getSavedCsvs();
  existing.unshift(saved); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return saved;
}

export function deleteSavedCsv(id: string): void {
  const existing = getSavedCsvs();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter((s) => s.id !== id)));
}

export function getSavedCsvById(id: string): SavedCsv | undefined {
  return getSavedCsvs().find((s) => s.id === id);
}
