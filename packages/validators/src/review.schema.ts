// packages/validators/src/review.schema.ts
import { z } from "zod";

export const ReviewTypeSchema = z.enum(["text", "video"]);
export type ReviewType = z.infer<typeof ReviewTypeSchema>;

export const ReviewSourceSchema = z.enum(["student", "admin_curated"]);
export type ReviewSource = z.infer<typeof ReviewSourceSchema>;

/**
 * Admin — create a curated review for a course.
 * `text` type requires comment; `video` type requires videoUrl.
 */
export const CreateCuratedReviewSchema = z
  .object({
    rating:         z.coerce.number().int().min(1).max(5),
    reviewType:     ReviewTypeSchema,
    displayName:    z.string().min(1).max(255),
    displayRole:    z.string().max(100).optional().nullable(),
    displayAvatar:  z.string().max(1000).optional().nullable(),
    comment:        z.string().max(5000).optional().nullable(),
    videoUrl:       z.string().max(1000).optional().nullable(),
    videoThumbnail: z.string().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.reviewType === "text" && (!data.comment || data.comment.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Text reviews require a comment",
        path: ["comment"],
      });
    }
    if (data.reviewType === "video" && (!data.videoUrl || data.videoUrl.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Video reviews require a videoUrl",
        path: ["videoUrl"],
      });
    }
  });
export type CreateCuratedReviewInput = z.infer<typeof CreateCuratedReviewSchema>;

/** Admin — partial update for a curated review. */
export const UpdateCuratedReviewSchema = z.object({
  rating:         z.coerce.number().int().min(1).max(5).optional(),
  reviewType:     ReviewTypeSchema.optional(),
  displayName:    z.string().min(1).max(255).optional(),
  displayRole:    z.string().max(100).optional().nullable(),
  displayAvatar:  z.string().max(1000).optional().nullable(),
  comment:        z.string().max(5000).optional().nullable(),
  videoUrl:       z.string().max(1000).optional().nullable(),
  videoThumbnail: z.string().max(1000).optional().nullable(),
});
export type UpdateCuratedReviewInput = z.infer<typeof UpdateCuratedReviewSchema>;
