// packages/validators/src/order.schema.ts
import { z } from "zod";

export const PaymentMethodSchema = z.enum(["bkash", "card", "free"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const OrderStatusSchema = z.enum(["pending", "paid", "cancelled"]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const PaymentStatusSchema = z.enum(["pending", "completed", "failed", "refunded"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const CouponTypeSchema = z.enum(["percentage", "fixed"]);
export type CouponType = z.infer<typeof CouponTypeSchema>;

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const AddToCartSchema = z.object({
  courseId: z.number({ required_error: "Course ID is required" }).int().positive(),
});
export type AddToCartInput = z.infer<typeof AddToCartSchema>;

export const ApplyCouponSchema = z.object({
  code: z
    .string({ required_error: "Coupon code is required" })
    .min(1, "Coupon code is required")
    .max(50, "Invalid coupon code"),
});
export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;

// ─── Coupon ───────────────────────────────────────────────────────────────────

export const CreateCouponSchema = z.object({
  code: z
    .string({ required_error: "Code is required" })
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be at most 50 characters")
    .toUpperCase(),
  type: CouponTypeSchema,
  value: z.number({ required_error: "Value is required" }).positive("Value must be positive"),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});
export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;

// ─── Order / Checkout ─────────────────────────────────────────────────────────

export const CreateOrderSchema = z.object({
  couponCode: z.string().optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const ProcessPaymentSchema = z.object({
  method: PaymentMethodSchema,
  bkashTrxId: z.string().optional(),
});
export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;

// ─── Review ───────────────────────────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  rating: z
    .number({ required_error: "Rating is required" })
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(2000, "Comment must be at most 2000 characters").optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

export const UpdateReviewSchema = CreateReviewSchema.partial();
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
