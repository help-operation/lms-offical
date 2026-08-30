export interface AdminCertificate {
  id: number;
  certificateCode: string;
  certificateUrl: string | null;
  issuedAt: string | null;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userEmail: string | null;
  userAvatar: string | null;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
}

export interface CertificateStats {
  total: number;
  thisMonth: number;
}

export interface CertificatesResponse {
  data: AdminCertificate[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  stats: CertificateStats;
}

// ─── Pickers for the "Issue Manually" modal ────────────────────────────────────

export interface UserOption {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  avatar: string | null;
}

export interface CourseOption {
  id: number;
  title: string;
  thumbnail: string | null;
}
