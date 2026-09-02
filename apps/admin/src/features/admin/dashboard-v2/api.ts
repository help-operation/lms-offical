import { apiRequestBrowser } from "@/lib/api-client-browser";

export interface DashboardFilters {
  period?: "today" | "week" | "month" | "year" | "custom";
  date_from?: string;
  date_to?: string;
  course_id?: string;
  course_type?: "recorded" | "live" | "all";
  instructor_id?: string;
  package_id?: string;
  location?: string;
  device?: "mobile" | "tablet" | "desktop" | "all";
  gender?: "male" | "female" | "other" | "all";
  source?: string;
}

interface WindowStat {
  count: number;
  change: number | null;
}

interface PeriodTotals {
  today: number;
  week: number;
  month: number;
  year: number;
  total: number;
  filtered: number;
}

export interface DashboardOverview {
  topStats: {
    today: WindowStat;
    week: WindowStat;
    month: WindowStat;
    year: WindowStat;
    total: WindowStat;
    filtered: WindowStat;
  };
  studentOverview: {
    totalStudents: number;
    activeStudents: number;
    totalCertified: number;
    liveCourseStudents: number;
    recordedCourseStudents: number;
    freeCourseStudents: number;
    dropoutStudents: number;
  };
  courseCount: { recorded: number; live: number; free: number; total: number };
  visitorSource: { bySource: Record<string, number>; total: number };
  leadOverview: PeriodTotals;
  revenueOverview: PeriodTotals;
  receivableOverview: PeriodTotals & { due: number };
  visitorActivity: {
    pageViews: number;
    uniqueVisitors: number;
    avgStaySeconds: number;
    liveChatMessages: number;
  };
  supportOverview: PeriodTotals & { avgSolutionSeconds: number };
  paymentMethods: Record<string, number>;
  paymentStatus: { completed: PeriodTotals; failed: PeriodTotals };
  location: {
    topCountries: { country: string | null; count: number }[];
    topBangladeshCities: { city: string | null; count: number }[];
  };
  devices: Record<string, number>;
  gender: Record<string, number>;
}

export interface PerCourseStudentRow {
  id: number;
  title: string;
  type: "recorded" | "live";
  students: number;
}

export interface SystemHealth {
  apiPingMs: number;
  storageBytes: number;
  storageGb: number;
  uptime: string;
  status: "healthy" | "degraded";
}

export interface DashboardFilterOptions {
  courses: { id: number; title: string; type: "recorded" | "live" }[];
  instructors: { id: number; firstName: string; lastName: string }[];
  packages: { id: number; title: string }[];
  locations: string[];
  devices: string[];
  genders: string[];
  sources: string[];
}

export interface EnrollmentTrendRow {
  label: string;
  recorded: number;
  live: number;
  total: number;
}

export interface RevenueByCourseRow {
  course: string;
  revenue: number;
}

export interface StudentGrowthRow {
  label: string;
  newStudents: number;
  totalStudents: number;
}

export interface RevenueTimeSeriesRow {
  label: string;
  recorded: number;
  live: number;
  total: number;
}

export interface CommunicationOverview {
  sms: {
    balance: number;
    today: number;
    week: number;
    month: number;
    year: number;
    totalSent: number;
    totalFailed: number;
  };
  email: {
    balance: number;
    today: number;
    week: number;
    month: number;
    year: number;
    totalSent: number;
    totalFailed: number;
  };
}

function buildQuery(filters: DashboardFilters): string {
  const q = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "all") q.set(k, String(v));
  });
  return q.toString() ? `?${q}` : "";
}

export const dashboardApi = {
  overview: (filters: DashboardFilters) =>
    apiRequestBrowser<DashboardOverview>(`/dashboard/overview${buildQuery(filters)}`),

  perCourseStudents: () =>
    apiRequestBrowser<PerCourseStudentRow[]>("/dashboard/per-course-students"),

  systemHealth: () =>
    apiRequestBrowser<SystemHealth>("/dashboard/system-health"),

  filters: () =>
    apiRequestBrowser<DashboardFilterOptions>("/dashboard/filters"),

  enrollmentTrend: (filters: DashboardFilters) =>
    apiRequestBrowser<EnrollmentTrendRow[]>(`/dashboard/enrollment-trend${buildQuery(filters)}`),

  revenueByCourse: (filters: DashboardFilters) =>
    apiRequestBrowser<RevenueByCourseRow[]>(`/dashboard/revenue-by-course${buildQuery(filters)}`),

  studentGrowth: (filters: DashboardFilters) =>
    apiRequestBrowser<StudentGrowthRow[]>(`/dashboard/student-growth${buildQuery(filters)}`),

  revenueTimeSeries: (filters: DashboardFilters) =>
    apiRequestBrowser<RevenueTimeSeriesRow[]>(`/dashboard/revenue-time-series${buildQuery(filters)}`),

  communication: () =>
    apiRequestBrowser<CommunicationOverview>("/dashboard/communication"),
};
