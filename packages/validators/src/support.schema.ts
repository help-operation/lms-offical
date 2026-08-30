// packages/validators/src/support.schema.ts
import { z } from "zod";

export const TicketStatusSchema = z.enum(["open", "in_progress", "resolved", "closed"]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export const TicketCategorySchema = z.enum([
  "billing",
  "technical",
  "course_content",
  "certificate",
  "refund",
  "other",
]);
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  billing:        "Billing & Payment",
  technical:      "Technical Issue",
  course_content: "Course Content",
  certificate:    "Certificate",
  refund:         "Refund Request",
  other:          "Other",
};

export const AttachmentSchema = z.object({
  url:  z.string().url(),
  name: z.string().min(1),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const CreateTicketSchema = z.object({
  subject: z
    .string({ required_error: "Subject is required" })
    .min(5, "Subject must be at least 5 characters")
    .max(255, "Subject must be at most 255 characters"),
  message: z
    .string({ required_error: "Message is required" })
    .min(10, "Message must be at least 10 characters"),
  category: TicketCategorySchema.default("other"),
  priority: TicketPrioritySchema.default("medium"),
});
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const ReplyTicketSchema = z.object({
  message: z
    .string({ required_error: "Message is required" })
    .min(1, "Message cannot be empty"),
  isInternal:  z.boolean().default(false),
  attachments: z.array(AttachmentSchema).optional(),
});
export type ReplyTicketInput = z.infer<typeof ReplyTicketSchema>;

export const UpdateTicketSchema = z.object({
  status:   TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
});
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;

export const AssignTicketSchema = z.object({
  adminId: z.number().int().positive().nullable(),
});
export type AssignTicketInput = z.infer<typeof AssignTicketSchema>;
