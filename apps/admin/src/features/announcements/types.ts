export type AnnouncementType = "info" | "success" | "warning" | "error";

export interface Announcement {
  id:        number;
  title:     string;
  body:      string;
  type:      AnnouncementType;
  isActive:  boolean;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AnnouncementsResponse {
  data: Announcement[];
  pagination: {
    total:        number;
    per_page:     number;
    current_page: number;
    last_page:    number;
    from:         number;
    to:           number;
  };
  stats: { total: number; active: number };
}

export const TYPE_META: Record<AnnouncementType, { label: string; bg: string; text: string; border: string }> = {
  info:    { label: "Info",    bg: "bg-blue-50",   text: "text-blue-700",  border: "border-blue-200"  },
  success: { label: "Success", bg: "bg-green-50",  text: "text-green-700", border: "border-green-200" },
  warning: { label: "Warning", bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-200" },
  error:   { label: "Error",   bg: "bg-red-50",    text: "text-red-700",   border: "border-red-200"   },
};
