export interface AdminEnrollmentCourse {
  id: number;
  courseType: "recorded" | "live";
  courseTitle: string;
  status: "active" | "completed" | "suspended" | "refunded" | string;
  enrolledAt: string | null;
  completedAt: string | null;
  amount: string | null;
  paymentMethod: string | null;
}

export interface AdminEnrollment {
  key: string;
  userId: number | null;
  userFirstName: string;
  userLastName: string;
  userEmail: string | null;
  userPhone: string | null;
  userAvatar: string | null;
  lastEnrolledAt: string | null;
  courseCount: number;
  courses: AdminEnrollmentCourse[];
}

export interface StudentEnrollmentEntry {
  id: number;
  courseType: "recorded" | "live";
  status: string;
  statusReason: string | null;
  enrolledAt: string | null;
  expiresAt: string | null;
  courseId: number;
  courseTitle: string;
  courseSlug: string | null;
  feeAmount: string | null;
  totalPaid: string;
  dueAmount: string;
  paymentStatus: "due" | "partial" | "paid" | null;
}

export interface EnrollmentPaymentRecord {
  id: number;
  amount: string;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string | null;
  displayInvoiceNumber: string | null;
}

export interface EnrollmentPaymentSummary {
  feeAmount: string | null;
  totalPaid: string;
  dueAmount: string;
  paymentStatus: "due" | "partial" | "paid" | null;
  payments: EnrollmentPaymentRecord[];
}

export interface StudentEnrollmentsData {
  student: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  enrollments: StudentEnrollmentEntry[];
}

export interface EnrollmentStats {
  total: number;
  active: number;
  completed: number;
  thisMonth: number;
}

// ── Manual enrollment (admin) ──────────────────────────────────────────────

export interface EnrollUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
}

export interface EnrollCourseOption {
  id: number;
  title: string;
  price: string;
  discountPrice?: string | null;
}

export interface EnrollLiveOption {
  id: number;
  title: string;
  price: string;
}

export interface EnrollBatchOption {
  id: number;
  batchName: string;
  startDate: string | null;
  schedule: string | null;
  status: string;
}

export interface ManualEnrollPayload {
  userId?: number;
  newUser?: { firstName: string; lastName?: string; phone?: string; email?: string };
  leadId?: number;
  accountOnly?: boolean;
  fulfillOrder?: boolean;
  courseType?: "recorded" | "live";
  courseId?: number;
  liveCourseId?: number;
  batchId?: number;
  paid: boolean;
  feeAmount?: number;
  amountReceived?: number;
  bkashTrxId?: string;
  payerPhone?: string;
  expiresAt?: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
}

// Minimal lead context passed to the modal when launched from a lead row.
export interface EnrollLeadContext {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  orderPaid: boolean;
  courseIds?: number[]; // recorded course(s) the lead referenced — pre-selected
}

export interface EnrollmentsResponse {
  data: AdminEnrollment[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  stats: EnrollmentStats;
}
