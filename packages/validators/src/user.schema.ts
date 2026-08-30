// packages/validators/src/user.schema.ts
import { z } from "zod";
import { UserRoleSchema, UserStatusSchema } from "./auth.schema.js";

export const UserSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  avatar: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type UserDto = z.infer<typeof UserSchema>;

export const PublicUserSchema = UserSchema.omit({ createdAt: true, updatedAt: true });
export type PublicUser = z.infer<typeof PublicUserSchema>;
