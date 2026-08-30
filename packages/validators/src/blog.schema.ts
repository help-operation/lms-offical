// packages/validators/src/blog.schema.ts
import { z } from "zod";

export const BlogStatusSchema = z.enum(["draft", "published"]);
export type BlogStatus = z.infer<typeof BlogStatusSchema>;

export const CreateBlogCategorySchema = z.object({
  name: z
    .string({ required_error: "Category name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
});
export type CreateBlogCategoryInput = z.infer<typeof CreateBlogCategorySchema>;

export const CreateBlogPostSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(5, "Title must be at least 5 characters")
    .max(255, "Title must be at most 255 characters"),
  content: z.string().optional(),
  thumbnail: z.string().url("Invalid thumbnail URL").optional(),
  categoryId: z.number().int().positive().optional(),
  status: BlogStatusSchema.default("draft"),
});
export type CreateBlogPostInput = z.infer<typeof CreateBlogPostSchema>;

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial();
export type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostSchema>;
