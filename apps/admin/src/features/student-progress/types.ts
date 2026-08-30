export interface StudentProgressRow {
  enrollmentId:     number;
  enrollmentStatus: "active" | "completed" | "refunded";
  enrolledAt:       string | null;
  completedAt:      string | null;
  userId:           number;
  userFirstName:    string;
  userLastName:     string;
  userEmail:        string | null;
  userAvatar:       string | null;
  courseId:         number;
  courseTitle:      string;
  courseSlug:       string;
  totalLessons:     number;
  completedLessons: number;
  lastActivity:     string | null;
}

export interface ProgressStats {
  active:    number;
  completed: number;
  atRisk:    number;
}

export interface ProgressResponse {
  data: StudentProgressRow[];
  pagination: {
    total:        number;
    per_page:     number;
    current_page: number;
    last_page:    number;
    from:         number;
    to:           number;
  };
  stats: ProgressStats;
}
