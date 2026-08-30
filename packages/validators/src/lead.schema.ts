// packages/validators/src/lead.schema.ts
import { z } from "zod";

// Lead lifecycle is a two-state workflow: pending -> complete. Legacy values
// (paid/converted/cancelled) are still accepted so historical rows validate,
// but the app only ever writes pending/complete.
export const LeadStatusSchema = z.enum([
  "pending",
  "complete",
  "paid",
  "converted",
  "cancelled",
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LeadSourceSchema = z.enum([
  "checkout",
  "interest_box",
  "callback_widget",
  "manual",
  "failed_payment",
  "abandoned_checkout",
  "checkout_visit",
]);
export type LeadSource = z.infer<typeof LeadSourceSchema>;

/**
 * Public — global "Request a Callback" floating widget on public pages.
 * Collects full contact info (name/email/phone) but no course context —
 * admin treats these as warm-but-undirected leads.
 */
export const CreateCallbackLeadSchema = z.object({
  name:  z.string({ required_error: "Name is required" }).min(2).max(255),
  email: z.string({ required_error: "Email is required" }).email().max(255),
  phone: z.string({ required_error: "Phone is required" }).min(7).max(30),
});
export type CreateCallbackLeadInput = z.infer<typeof CreateCallbackLeadSchema>;

/**
 * Public — soft capture from the course detail page sidebar.
 * Only the phone number is required; admin follows up to gather the rest.
 */
export const CreateInterestLeadSchema = z.object({
  phone:    z.string({ required_error: "Phone is required" }).min(7).max(30),
  courseId: z.number().int().positive(),
});
export type CreateInterestLeadInput = z.infer<typeof CreateInterestLeadSchema>;

/**
 * Public — what the guest checkout form sends when "Complete Payment" is clicked.
 * Created BEFORE the payment gateway redirect so we don't lose the lead if the
 * user abandons the payment screen.
 */
export const CreateLeadSchema = z.object({
  name:           z.string({ required_error: "Name is required" }).min(2, "Name must be at least 2 characters").max(255),
  email:          z.string({ required_error: "Email is required" }).email("Invalid email").max(255),
  phone:          z.string({ required_error: "Phone is required" }).min(7, "Phone must be at least 7 digits").max(30),
  courseIds:      z.array(z.number().int().positive()).min(1, "At least one course is required"),
  couponCode:     z.string().max(100).optional().nullable(),
  subtotal:       z.coerce.number().min(0).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  finalAmount:    z.coerce.number().min(0).default(0),
  paymentMethod:  z.string().max(50).optional().nullable(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

/**
 * Silent capture — guest filled the checkout form but paused without clicking
 * "Complete Payment". Fires after a 1.5s debounce when all 3 fields are valid.
 */
export const CreateAbandonedCheckoutLeadSchema = z.object({
  name:           z.string().min(2).max(255),
  email:          z.string().email().max(255),
  phone:          z.string().min(7).max(30),
  courseIds:      z.array(z.number().int().positive()).min(1),
  subtotal:       z.coerce.number().min(0).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  finalAmount:    z.coerce.number().min(0).default(0),
});
export type CreateAbandonedCheckoutLeadInput = z.infer<typeof CreateAbandonedCheckoutLeadSchema>;

/**
 * Silent capture — logged-in user visited the checkout page with courses but
 * did not submit. The JWT provides the user identity; only courseIds are in
 * the body.
 */
export const CreateCheckoutVisitLeadSchema = z.object({
  courseIds: z.array(z.number().int().positive()).min(1),
});
export type CreateCheckoutVisitLeadInput = z.infer<typeof CreateCheckoutVisitLeadSchema>;

/**
 * Admin — partial update (status changes, notes, etc.).
 * Phase 2/3 will reuse this to flip status to 'paid' or 'converted'.
 */
export const UpdateLeadSchema = z.object({
  status:          LeadStatusSchema.optional(),
  notes:           z.string().max(5000).optional().nullable(),
  paymentMethod:   z.string().max(50).optional().nullable(),
  convertedUserId: z.number().int().positive().optional().nullable(),
  orderId:         z.number().int().positive().optional().nullable(),
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
