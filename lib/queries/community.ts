import { createPublicClient } from "@/lib/supabase/public";
import { createServerClientScoped } from "@/lib/supabase/server";
import type { Post } from "@/types/content";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "forum" | "community" | "product";
}

function pub() {
  try {
    return createPublicClient();
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<CategoryRow[] | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c
    .from("categories")
    .select("id, name, slug, description, type")
    .in("type", ["forum", "community"])
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data && data.length > 0 ? (data as CategoryRow[]) : [];
}

interface FeedPostRow {
  id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  category: { name: string } | null;
}

function toPost(row: FeedPostRow): Post {
  const author = row.author;
  return {
    id: row.id,
    author: {
      username: author?.username ?? "deleted",
      displayName: author?.display_name ?? "User Terhapus",
      avatarUrl: author?.avatar_url ?? null,
    },
    title: row.title,
    content: row.content,
    imageUrl: row.image_url,
    categoryName: row.category?.name ?? null,
    likes: row.likes_count,
    comments: row.comments_count,
    createdAt: row.created_at,
  };
}

const POST_SELECT =
  "id, title, content, image_url, created_at, likes_count, comments_count, " +
  "author:profiles!posts_author_id_fkey(username, display_name, avatar_url), " +
  "category:categories!posts_category_id_fkey(name, slug)";

export async function getFeedPosts(opts: {
  categorySlug?: string | null;
  page?: number;
  perPage?: number;
}): Promise<{ posts: Post[]; total: number } | null> {
  const c = pub();
  if (!c) return null;
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(50, Math.max(1, opts.perPage ?? 12));

  let query = c
    .from("posts")
    .select(POST_SELECT, { count: "exact" })
    .eq("status", "published");

  if (opts.categorySlug) {
    const { data: cat } = await c
      .from("categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle();
    if (cat) query = query.eq("category_id", cat.id);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (!data) return null;
  const rows = data as unknown as FeedPostRow[];
  return {
    posts: rows.map(toPost),
    total: count ?? 0,
  };
}

export interface PostDetail extends Post {
  body: string;
  authorId: string;
}

interface PostDetailDbRow extends FeedPostRow {
  author_id: string;
}

export async function getPostById(id: string): Promise<PostDetail | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c
    .from("posts")
    .select(
      POST_SELECT + ", author_id",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as PostDetailDbRow;
  return { ...toPost(row), body: row.content, authorId: row.author_id };
}

export interface CommentRow {
  id: string;
  authorId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface CommentDbRow {
  id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export async function getComments(postId: string): Promise<CommentRow[] | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c
    .from("comments")
    .select(
      "id, author_id, parent_id, content, created_at, " +
        "author:profiles!comments_author_id_fkey(username, display_name, avatar_url)",
    )
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (!data) return null;
  const rows = data as unknown as CommentDbRow[];
  return rows.map((r) => ({
    id: r.id,
    authorId: r.author_id,
    parentId: r.parent_id,
    content: r.content,
    createdAt: r.created_at,
    author: r.author,
  }));
}

/** Apakah user (dari session cookie) sudah like post ini? null = env belum siap. */
export async function getMyLikeState(postId: string, userId?: string | null) {
  if (!userId) return { liked: false } as const;
  try {
    const supabase = await createServerClientScoped();
    const { data } = await supabase
      .from("post_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle();
    return { liked: Boolean(data) } as const;
  } catch {
    return { liked: false } as const;
  }
}