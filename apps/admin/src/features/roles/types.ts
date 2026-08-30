export type AdminRole   = "SUPER_ADMIN" | "INSTRUCTOR";
export type AdminStatus = "active" | "suspended";

export interface AdminUser {
  id:        number;
  firstName: string;
  lastName:  string;
  email:     string;
  role:      AdminRole;
  roleId:    number | null;
  roleName:  string | null;
  status:    AdminStatus;
  avatar:    string | null;
  createdAt: string | null;
}

// ─── Dynamic roles & permissions ───────────────────────────────────────────────

export type PermissionType = "page" | "api";

export interface Permission {
  id:    number;
  name:  string;
  slug:  string;
  group: string;
  type:  PermissionType;
}

export interface PermissionGroup {
  group:       string;
  label:       string;
  permissions: Permission[];
}

export interface Role {
  id:                     number;
  name:                   string;
  slug:                   string;
  description:            string | null;
  isSystem:               boolean;
  permissionIds:          number[];
  /** Recorded-course ids this role may edit under `edit_assigned_courses`. */
  assignedCourseIds:      number[];
  /** Live-course ids this role may edit under `edit_assigned_live_courses`. */
  assignedLiveCourseIds:  number[];
  usersCount:             number;
  createdAt:              string | null;
  updatedAt:              string | null;
}

// ─── Course assignment picker ──────────────────────────────────────────────────

export interface CourseOption {
  id:    number;
  title: string;
}

export interface CourseOptions {
  courses:     CourseOption[];
  liveCourses: CourseOption[];
}

export interface AdminUsersResponse {
  data: AdminUser[];
  pagination: {
    total:        number;
    per_page:     number;
    current_page: number;
    last_page:    number;
    from:         number;
    to:           number;
  };
  stats: {
    total:       number;
    superAdmins: number;
    instructors: number;
  };
}

// Permission matrix — what each role can do
export interface PermissionMatrix {
  feature:    string;
  superAdmin: boolean;
  instructor: boolean;
}

export const PERMISSION_MATRIX: PermissionMatrix[] = [
  { feature: "View Dashboard",         superAdmin: true,  instructor: true  },
  { feature: "Manage Users",           superAdmin: true,  instructor: false },
  { feature: "Create Courses",         superAdmin: true,  instructor: true  },
  { feature: "Publish Courses",        superAdmin: true,  instructor: false },
  { feature: "Delete Courses",         superAdmin: true,  instructor: false },
  { feature: "Manage Categories",      superAdmin: true,  instructor: false },
  { feature: "Manage Coupons",         superAdmin: true,  instructor: false },
  { feature: "View Revenue",           superAdmin: true,  instructor: false },
  { feature: "View Enrollments",       superAdmin: true,  instructor: true  },
  { feature: "View Student Progress",  superAdmin: true,  instructor: true  },
  { feature: "Manage Blog",            superAdmin: true,  instructor: true  },
  { feature: "Manage Support",         superAdmin: true,  instructor: true  },
  { feature: "Manage Live Courses",    superAdmin: true,  instructor: true  },
  { feature: "Manage Announcements",   superAdmin: true,  instructor: false },
  { feature: "Issue Certificates",     superAdmin: true,  instructor: false },
  { feature: "Manage Media",           superAdmin: true,  instructor: true  },
  { feature: "Manage Content/Pages",   superAdmin: true,  instructor: false },
  { feature: "System Settings",        superAdmin: true,  instructor: false },
  { feature: "View Activity Log",      superAdmin: true,  instructor: false },
  { feature: "Manage Admin Users",     superAdmin: true,  instructor: false },
];

export const ROLE_META: Record<AdminRole, { label: string; bg: string; text: string }> = {
  SUPER_ADMIN: { label: "Super Admin", bg: "bg-brand-100 dark:bg-brand/15", text: "text-brand-700 dark:text-brand" },
  INSTRUCTOR:  { label: "Instructor",  bg: "bg-blue-100 dark:bg-blue-500/15",   text: "text-blue-700 dark:text-blue-400"   },
};
