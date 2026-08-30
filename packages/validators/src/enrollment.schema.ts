// packages/validators/src/enrollment.schema.ts
import { z } from "zod";

// ─── Admin manual enrollment ────────────────────────────────────────────────
// An admin enrolls a person into a recorded or live course. The person may not
// have an account yet (create new), may be a guest, or already a student.

export const ManualEnrollmentSchema = z
  .object({
    // Target user: either an existing user id, OR details for a new/looked-up one.
    userId: z.number().int().positive().optional(),
    newUser: z
      .object({
        firstName: z.string().min(1, "First name is required").max(100),
        lastName: z.string().max(100).optional(),
        phone: z.string().max(20).optional(),
        email: z.string().email("Invalid email").max(150).optional(),
      })
      .optional(),

    // Optional link to a lead being fulfilled. When set, the lead is marked
    // complete and its convertedUserId is set after provisioning.
    leadId: z.number().int().positive().optional(),
    // Account-only: provision the account, do not enroll into any course.
    accountOnly: z.boolean().default(false),
    // Fulfil the lead's existing paid order (enroll into its items, reuse the
    // order — no new invoice). Requires leadId with a paid order.
    fulfillOrder: z.boolean().default(false),

    // What to enroll into (ignored when accountOnly or fulfillOrder).
    courseType: z.enum(["recorded", "live"]).optional(),
    courseId: z.number().int().positive().optional(), // recorded
    liveCourseId: z.number().int().positive().optional(), // live
    batchId: z.number().int().positive().optional(), // live (optional)

    // Payment — when `paid` is false this is a free enrollment with no invoice.
    paid: z.boolean().default(false),
    // Course fee (the invoiced amount) and what was actually received. Received
    // may be less than the fee (Partial) or 0 (Due) — payment status is derived
    // from comparing the two, never chosen manually.
    feeAmount: z.number().nonnegative().optional(),
    amountReceived: z.number().nonnegative().optional(),
    bkashTrxId: z.string().max(100).optional(),
    payerPhone: z.string().max(20).optional(),

    // Optional access expiry (ISO datetime string). Null = permanent access.
    expiresAt: z.string().datetime({ offset: true }).nullable().optional(),

    notifyEmail: z.boolean().default(true),
    notifySms: z.boolean().default(true),
  })
  .superRefine((d, ctx) => {
    if (!d.userId && !d.newUser) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select an existing user or enter new user details",
        path: ["userId"],
      });
    }
    if (d.newUser && !d.newUser.phone && !d.newUser.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A new user needs a phone number or an email",
        path: ["newUser", "phone"],
      });
    }
    if (d.fulfillOrder && !d.leadId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fulfillOrder requires a leadId",
        path: ["leadId"],
      });
    }

    // Course is only required for a normal enrollment (not account-only and not
    // fulfilling an existing paid order).
    const needsCourse = !d.accountOnly && !d.fulfillOrder;
    if (needsCourse) {
      if (!d.courseType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Choose a course type",
          path: ["courseType"],
        });
      }
      if (d.courseType === "live" && d.newUser && !d.newUser.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Live course enrollment requires an email",
          path: ["newUser", "email"],
        });
      }
      if (d.courseType === "recorded" && !d.courseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a recorded course",
          path: ["courseId"],
        });
      }
      if (d.courseType === "live" && !d.liveCourseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a live course",
          path: ["liveCourseId"],
        });
      }
      if (d.paid && (d.feeAmount == null || d.feeAmount <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Course fee is required",
          path: ["feeAmount"],
        });
      }
    }
  });

export type ManualEnrollmentInput = z.infer<typeof ManualEnrollmentSchema>;

// ─── Record a payment against an existing enrollment ───────────────────────
// Installment payments recorded by an admin after the fact — see
// AdminService#recordEnrollmentPayment.

export const RecordPaymentSchema = z.object({
  amount: z.number().positive("Enter the amount received"),
  method: z.enum(["bkash", "nagad", "rocket", "upay", "card"]).default("bkash"),
  bkashTrxId: z.string().max(100).optional(),
  payerPhone: z.string().max(20).optional(),
});

export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
