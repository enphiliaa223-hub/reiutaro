import { createPublicClient } from "@/lib/supabase/public";
import type { Project } from "@/types/content";

/**
 * Helper query untuk konten publik.
 * Respons safety: env Supabase belum diisi / DB tidak terhubung → return null,
 * halaman menampilkan empty state (tidak crash).
 */

function pub() {
  try {
    return createPublicClient();
  } catch {
    return null;
  }
}

export type SiteSettings = Record<string, unknown>;

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c.from("site_settings").select("key, value");
  if (!data) return null;
  return Object.fromEntries(data.map((r) => [r.key, r.value]));
}

/** Ambil nilai setting dengan fallback jika belum ada. */
export function setting<T>(settings: SiteSettings | null, key: string, fallback: T): T {
  if (!settings) return fallback;
  const value = settings[key];
  return (value as T) ?? fallback;
}

interface ProjectRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  technology: string[] | null;
  github_url: string | null;
  demo_url: string | null;
  featured: boolean;
  created_at: string;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    cover: row.cover_image,
    tech: row.technology ?? [],
    githubUrl: row.github_url,
    demoUrl: row.demo_url,
    featured: row.featured,
    createdAt: row.created_at,
  };
}

const PROJECT_COLUMNS =
  "id, title, slug, description, cover_image, technology, github_url, demo_url, featured, created_at";

export async function getPublishedProjects(limit = 50): Promise<Project[] | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data && data.length > 0 ? data.map(toProject) : [];
}

export async function getFeaturedProjects(limit = 3): Promise<Project[] | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("status", "published")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (data && data.length > 0) return data.map(toProject);
  // Tidak ada featured → fallback ke project terbaru.
  const { data: latest } = await c
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  return latest && latest.length > 0 ? latest.map(toProject) : [];
}

export interface ProjectDetail extends Project {
  body: string | null;
  category: string | null;
  images: { url: string }[];
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c
    .from("projects")
    .select("id, title, slug, category, description, body, technology, github_url, demo_url, cover_image, featured, created_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;

  const { data: images } = await c
    .from("project_images")
    .select("url")
    .eq("project_id", data.id)
    .order("sort_order", { ascending: true });

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    cover: data.cover_image,
    tech: data.technology ?? [],
    githubUrl: data.github_url,
    demoUrl: data.demo_url,
    featured: data.featured,
    createdAt: data.created_at,
    body: data.body,
    category: data.category,
    images: (images ?? []).map((i: { url: string }) => ({ url: i.url })),
  };
}

export interface OwnerProfile {
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  interests: string[] | null;
  social_links: Record<string, string> | null;
  created_at: string;
}

/** Profil pemilik situs (akun admin pertama). */
export async function getOwnerProfile(): Promise<OwnerProfile | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c
    .from("profiles")
    .select("username, display_name, avatar_url, bio, skills, interests, social_links, created_at")
    .eq("role", "admin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return (data as OwnerProfile | null) ?? null;
}

export interface SiteStats {
  projects: number;
  posts: number;
  products: number;
  music: number;
}

export async function getSiteStats(): Promise<SiteStats | null> {
  const c = pub();
  if (!c) return null;
  const { count: projects } = await c
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  const { count: posts } = await c
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  const { count: products } = await c
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  const { count: music } = await c
    .from("music_tracks")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  return {
    projects: projects ?? 0,
    posts: posts ?? 0,
    products: products ?? 0,
    music: music ?? 0,
  };
}

/** Track musik aktif untuk player global. Return [] saat DB off. */
export async function getActiveTracks() {
  const c = pub();
  if (!c) return [];
  const { data } = await c
    .from("music_tracks")
    .select("id, title, artist, audio_url, cover_url, duration")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (!data) return [];
  return data.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    src: t.audio_url ?? "",
    cover: t.cover_url,
  }));
}

export interface SearchResult {
  projects: Project[];
  posts: { id: string; title: string; created_at: string }[];
  products: { id: string; name: string; slug: string; price: number }[];
}

/** Cari lintas proyek, postingan komunitas, dan produk. Return null saat DB off. */
export async function searchContent(q: string): Promise<SearchResult | null> {
  const c = pub();
  if (!c) return null;
  const term = `%${q.replace(/[%_]/g, "")}%`;

  const [projects, posts, products] = await Promise.all([
    c
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("status", "published")
      .or(`title.ilike.${term},description.ilike.${term},technology.ilike.${term}`)
      .order("sort_order", { ascending: true })
      .limit(6),
    c
      .from("posts")
      .select("id, title, created_at")
      .eq("status", "published")
      .or(`title.ilike.${term},content.ilike.${term}`)
      .order("created_at", { ascending: false })
      .limit(6),
    c
      .from("products")
      .select("id, name, slug, price")
      .eq("status", "active")
      .or(`name.ilike.${term},description.ilike.${term}`)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return {
    projects: projects?.data?.map(toProject) ?? [],
    posts: posts?.data ?? [],
    products: products?.data ?? [],
  };
}