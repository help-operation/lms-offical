import { apiRequest } from "@/lib/api-client";

export interface LiveClass {
  id: number;
  title: string;
  description: string | null;
  scheduledAt: string;
  status: string;
  meetingUrl: string | null;
  courseId: number | null;
  instructorId: number;
}

export const liveClassAdminApi = {
  mine: () => apiRequest<LiveClass[]>("/live-classes/mine"),
  create: (data: {
    title: string;
    description?: string;
    scheduledAt: string;
    meetingUrl?: string;
    courseId?: number;
  }) => apiRequest<LiveClass>("/live-classes", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: number,
    data: {
      title?: string;
      description?: string;
      scheduledAt?: string;
      meetingUrl?: string;
      status?: "scheduled" | "live" | "ended" | "cancelled";
    }
  ) => apiRequest<LiveClass>(`/live-classes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};
