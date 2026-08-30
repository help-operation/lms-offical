import { apiRequest } from "@/lib/api-client";

export interface MyCertificate {
  id: number;
  certificateCode: string;
  certificateUrl: string | null;
  issuedAt: string | null;
  courseId: number | null;
  liveCourseId: number | null;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string | null;
}

export interface ClaimedCertificate {
  id: number;
  userId: number;
  courseId: number;
  certificateCode: string;
  certificateUrl: string | null;
  issuedAt: string | null;
}

export const certificatesApi = {
  mine: () => apiRequest<MyCertificate[]>("/certificates/mine"),
};
