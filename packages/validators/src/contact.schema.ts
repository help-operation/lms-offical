// packages/validators/src/contact.schema.ts
import { z } from "zod";

export const ContactMessageSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  subject: z
    .string()
    .trim()
    .max(150, "Subject must be at most 150 characters")
    .optional()
    .or(z.literal("")),
  message: z
    .string({ required_error: "Message is required" })
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be at most 2000 characters"),
});
export type ContactMessageInput = z.infer<typeof ContactMessageSchema>;
