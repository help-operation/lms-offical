export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  avatar: string | null;
  createdAt: string | null;
  bio: string | null;
  profession: string | null;
}

export interface StudentEnrollment {
  id: number;
  status: string;
  enrolledAt: string | null;
  completedAt: string | null;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string | null;
  totalLessons: number;
  completedLessons: number;
}

export interface StudentDetail extends Student {
  socialLinks: Record<string, string> | null;
  enrollments: StudentEnrollment[];
}
