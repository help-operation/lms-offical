export type MediaType = "image" | "video" | "audio" | "document" | "other";

export type MediaSortField = "created_at" | "filename" | "size" | "type";
export type MediaSortDirection = "asc" | "desc";

export interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  caption: string | null;
  uploadedBy: number | null;
  createdAt: string;
  updatedAt: string;
  formattedSize: string;
}

export interface MediaPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface MediaSummary {
  total_files: number;
  total_size: number;
  total_images: number;
  total_videos: number;
  total_documents: number;
}

export interface MediaListResponse {
  data: MediaFile[];
  pagination: MediaPagination;
  summary: MediaSummary;
}

export interface MediaListParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: MediaType | "all";
  sortField?: MediaSortField;
  sortDirection?: MediaSortDirection;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function getMediaTypeFromMime(mime: string): MediaType {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime === "application/pdf" ||
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("spreadsheet") ||
    mime.includes("powerpoint") ||
    mime.includes("presentation") ||
    mime.includes("opendocument") ||
    mime === "text/plain" ||
    mime === "text/csv"
  )
    return "document";
  return "other";
}
