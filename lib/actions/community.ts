"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerClientScoped } from "@/lib/supabase/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  createCommentSchema,
  createPostSchema,
  createReportSchema,
} from "@/lib/validations/community";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

type Authed =
  | { kind: "auth"; message: string }
  | { kind: "ok"; user: User; supabase: SupabaseClient };

async function authedClient(): Promise<Authed> {
  const user = await getCurrentUser();
  if (!user) return { kind: "auth", message: "Kamu harus login dulu." };
  const supabase = await createServerClientScoped();
  return { kind: "ok", user, supabase };
}

export async function createPost(input: unknown): Promise<ActionResult> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const auth = await authedClient();
  if (auth.kind !== "ok") return { ok: false, error: auth.message };

  if (!(await rateLimit(`post:${auth.user.id}`, 5, 60))) {
    return { ok: false, error: "Terlalu banyak post. Coba lagi nanti." };
  }

  // Hanya terima gambar dari storage project sendiri (cegah URL asing/abuse).
  const imageUrl = parsed.data.imageUrl?.trim() ?? "";
  if (imageUrl !== "" && !/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/community\//.test(imageUrl)) {
    return { ok: false, error: "URL gambar tidak valid." };
  }

  const { error, data } = await auth.supabase
    .from("posts")
    .insert({
      author_id: auth.user.id,
      title: parsed.data.title && parsed.data.title.trim() !== "" ? parsed.data.title : null,
      content: parsed.data.content,
      category_id: parsed.data.categoryId || null,
      image_url: imageUrl || null,
      status: "published",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: "Gagal membuat post." };
  return { ok: true, id: data.id };
}

export async function createComment(input: unknown): Promise<ActionResult> {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const auth = await authedClient();
  if (auth.kind !== "ok") return { ok: false, error: auth.message };

  if (!(await rateLimit(`comment:${auth.user.id}`, 12, 60))) {
    return { ok: false, error: "Terlalu banyak komentar. Coba lagi nanti." };
  }

  const { error, data } = await auth.supabase
    .from("comments")
    .insert({
      post_id: parsed.data.postId,
      parent_id: parsed.data.parentId || null,
      author_id: auth.user.id,
      content: parsed.data.content,
      status: "published",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: "Gagal menambahkan komentar." };
  return { ok: true, id: data.id };
}

export async function toggleLike(
  postId: string,
): Promise<{ ok: boolean; liked: boolean; likes: number; error?: string }> {
  const auth = await authedClient();
  if (auth.kind !== "ok") return { ok: false, liked: false, likes: 0, error: auth.message };

  const { data: existing } = await auth.supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await auth.supabase.from("post_likes").delete().eq("id", existing.id);
  } else {
    await auth.supabase.from("post_likes").insert({ user_id: auth.user.id, post_id: postId });
  }

  const { count } = await auth.supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("id", postId);
  return { ok: true, liked: !existing, likes: count ?? 0 };
}

const REPORT_REASONS = [
  "spam",
  "harassment",
  "nsfw",
  "hate_speech",
  "impersonation",
  "other",
] as const;

export async function createReport(input: unknown): Promise<ActionResult> {
  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const auth = await authedClient();
  if (auth.kind !== "ok") return { ok: false, error: auth.message };

  if (!(await rateLimit(`report:${auth.user.id}`, 5, 3600))) {
    return { ok: false, error: "Terlalu banyak laporan. Coba lagi nanti." };
  }

  const { error } = await auth.supabase.from("reports").insert({
    reporter_id: auth.user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    detail: parsed.data.detail || null,
    status: "open",
  });

  if (error) return { ok: false, error: "Gagal mengirim laporan." };
  return { ok: true };
}

/** Soft-delete post: owner atau moderator/admin. */
export async function deletePost(id: string): Promise<ActionResult> {
  const auth = await authedClient();
  if (auth.kind !== "ok") return { ok: false, error: auth.message };
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Sesi tidak valid." };

  const { data: post } = await auth.supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .maybeSingle();
  if (!post) return { ok: false, error: "Post tidak ditemukan." };

  const canModerate = profile.role === "admin" || profile.role === "moderator";
  if (post.author_id !== auth.user.id && !canModerate) {
    return { ok: false, error: "Kamu tidak berhak menghapus post ini." };
  }

  const { error } = await auth.supabase
    .from("posts")
    .update({ status: "deleted" })
    .eq("id", id);
  if (error) return { ok: false, error: "Gagal menghapus post." };
  return { ok: true };
}

/** Soft-delete komentar: owner atau moderator/admin. */
export async function deleteComment(id: string): Promise<ActionResult> {
  const auth = await authedClient();
  if (auth.kind !== "ok") return { ok: false, error: auth.message };
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Sesi tidak valid." };

  const { data: comment } = await auth.supabase
    .from("comments")
    .select("author_id")
    .eq("id", id)
    .maybeSingle();
  if (!comment) return { ok: false, error: "Komentar tidak ditemukan." };

  const canModerate = profile.role === "admin" || profile.role === "moderator";
  if (comment.author_id !== auth.user.id && !canModerate) {
    return { ok: false, error: "Kamu tidak berhak menghapus komentar ini." };
  }

  const { error } = await auth.supabase
    .from("comments")
    .update({ status: "deleted" })
    .eq("id", id);
  if (error) return { ok: false, error: "Gagal menghapus komentar." };
  return { ok: true };
}

export { REPORT_REASONS };