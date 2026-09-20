import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().trim().max(150, "Judul maksimal 150 karakter").optional().or(z.literal("")),
  content: z.string().trim().min(1, "Konten wajib diisi").max(12000, "Maksimal 12.000 karakter"),
  categoryId: z.string().uuid("Kategori tidak valid").optional().or(z.literal("")),
  imageUrl: z.string().url("URL gambar tidak valid").max(500).optional().or(z.literal("")),
});

export const createCommentSchema = z.object({
  postId: z.string().uuid("Post tidak valid"),
  parentId: z.string().uuid().optional().or(z.literal("")),
  content: z.string().trim().min(1, "Komentar wajib diisi").max(4000, "Maksimal 4.000 karakter"),
});

export const createReportSchema = z.object({
  targetType: z.enum(["post", "comment", "user", "product"]),
  targetId: z.string().uuid("Target tidak valid"),
  reason: z.string().trim().min(1, "Pilih alasan").max(100),
  detail: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const deletePostSchema = z.object({ id: z.string().uuid() });
export const deleteCommentSchema = z.object({ id: z.string().uuid() });
export const likePostSchema = z.object({ postId: z.string().uuid() });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;