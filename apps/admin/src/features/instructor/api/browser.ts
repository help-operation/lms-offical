import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { LiveClass } from "./index";

export const liveClassAdminApiBrowser = {
  create: (data: {
    title: string;
    description?: string;
    scheduledAt: string;
    meetingUrl?: string;
    courseId?: number;
  }) => apiRequestBrowser<LiveClass>("/live-classes", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: number,
    data: {
      title?: string;
      description?: string;
      scheduledAt?: string;
      meetingUrl?: string;
      status?: "scheduled" | "live" | "ended" | "cancelled";
    }
  ) => apiRequestBrowser<LiveClass>(`/live-classes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};
