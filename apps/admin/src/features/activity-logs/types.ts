export interface ActivityLogRow {
  id:             number;
  action:         string;
  entity:         string | null;
  entityId:       number | null;
  meta:           Record<string, unknown> | null;
  createdAt:      string | null;
  // Admin actor
  adminUserId:    number | null;
  adminFirstName: string | null;
  adminLastName:  string | null;
  adminEmail:     string | null;
  adminRole:      string | null;
  adminAvatar:    string | null;
  // User (student) actor
  userId:         number | null;
  userFirstName:  string | null;
  userLastName:   string | null;
  userEmail:      string | null;
  userAvatar:     string | null;
}

export interface ActivityLogsResponse {
  data: ActivityLogRow[];
  pagination: {
    total:        number;
    per_page:     number;
    current_page: number;
    last_page:    number;
    from:         number;
    to:           number;
  };
  stats: {
    total:        number;
    adminActions: number;
    userActions:  number;
  };
}

// Human-readable labels for common action verbs
export const ACTION_LABELS: Record<string, string> = {
  // Auth
  login:                           "Logged in",
  logout:                          "Logged out",
  // Users
  user_suspended:                  "Suspended user",
  user_activated:                  "Activated user",
  user_role_changed:               "Changed user role",
  user_updated:                    "Updated user",
  user_password_reset:             "Reset user password",
  user_deleted:                    "Deleted user",
  // Enrollments
  enrollment_created:              "Manually enrolled student",
  enrollment_deleted:              "Removed enrollment",
  live_enrollment_deleted:         "Removed live enrollment",
  enrollment_suspend_toggled:      "Toggled enrollment suspension",
  live_enrollment_suspend_toggled: "Toggled live enrollment suspension",
  enrollment_expiry_updated:       "Updated enrollment expiry",
  live_enrollment_expiry_updated:  "Updated live enrollment expiry",
  // Admin users
  admin_user_created:              "Created admin user",
  admin_role_updated:              "Updated admin role",
  admin_user_updated:              "Updated admin user",
  admin_password_reset:            "Reset admin password",
  admin_status_toggled:            "Toggled admin status",
  admin_user_deleted:              "Deleted admin user",
  // Teachers
  teacher_updated:                 "Updated teacher",
  teacher_status_toggled:          "Toggled teacher status",
  teacher_deleted:                 "Deleted teacher",
  // Students
  student_updated:                 "Updated student",
  student_status_toggled:          "Toggled student status",
  student_deleted:                 "Deleted student",
  // Courses
  course_created:                  "Created course",
  course_updated:                  "Updated course",
  course_deleted:                  "Deleted course",
  course_published:                "Published course",
  course_unpublished:              "Unpublished course",
  course_status_updated:           "Updated course status",
  course_featured_toggled:         "Toggled course featured",
  // Live courses
  live_course_created:             "Created live course",
  live_course_updated:             "Updated live course",
  live_course_publish_toggled:     "Toggled live course publish",
  live_course_deleted:             "Deleted live course",
  // Coupons
  coupon_created:                  "Created coupon",
  coupon_updated:                  "Updated coupon",
  coupon_deleted:                  "Deleted coupon",
  coupon_toggled:                  "Toggled coupon status",
  // Categories
  category_created:                "Created category",
  category_updated:                "Updated category",
  category_deleted:                "Deleted category",
  category_toggled:                "Toggled category status",
  // Blog
  blog_post_created:               "Created blog post",
  blog_post_updated:               "Updated blog post",
  blog_post_deleted:               "Deleted blog post",
  // Certificates
  certificate_claimed:             "Claimed certificate",
  certificate_issued_manually:     "Issued certificate manually",
  // Orders & Payments
  order_created:                   "Created order",
  payment_confirmed_bkash:         "Confirmed bKash payment",
  // Announcements
  announcement_created:            "Created announcement",
  announcement_updated:            "Updated announcement",
  announcement_toggled:            "Toggled announcement",
  announcement_deleted:            "Deleted announcement",
  // Leads
  lead_updated:                    "Updated lead",
  lead_deleted:                    "Deleted lead",
};
