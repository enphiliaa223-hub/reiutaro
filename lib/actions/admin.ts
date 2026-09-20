"use server";

import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth/session";
import { createServerClientScoped } from "@/lib/supabase/server";
import { createAdminClientIfConfigured } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

async function adminSession() {
  await requireAdmin();
  return createServerClientScoped();
}

/** Admin ATAU seller — untuk sesi kelola produk. */
async function staffSession() {
  await requireStaff();
  return createServerClientScoped();
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const ORDER_STATUSES = ["pending", "awaiting_payment", "paid", "processing", "completed", "cancelled", "refunded"] as const;

export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return { ok: false, error: "Status tidak valid." };
  }
  const supabase = await adminSession();

  const { data: order } = await supabase
    .from("orders")
    .select("payment_status")
    .eq("id", orderId)
    .maybeSingle();

  // Dekrement stok HANYA pada transisi pertama ke status "paid".
  if (status === "paid" && order && order.payment_status !== "paid") {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);
    for (const item of items ?? []) {
      await supabase.rpc("app.adjust_stock", {
        p_product_id: item.product_id,
        p_delta: -item.quantity,
      });
    }
  }

  const paymentStatus =
    status === "paid" || status === "completed" ? "paid"
    : status === "cancelled" || status === "refunded" ? "void"
    : status === "awaiting_payment" ? "pending"
    : "pending";

  const { error } = await supabase
    .from("orders")
    .update({ status, payment_status: paymentStatus })
    .eq("id", orderId);
  if (error) return { ok: false, error: "Gagal memperbarui pesanan." };
  return { ok: true, message: "Status pesanan diperbarui." };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const productStatusEnum = z.enum(["active", "inactive"]);

const PRODUCT_TYPES = ["digital", "topup", "merchandise", "service", "other"] as const;

function stripEmpty(v: string | null | undefined): string | null {
  return typeof v === "string" && v.trim() === "" ? null : (v ?? null);
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createServerClientScoped>>, base: string, excludeId?: string) {
  let candidate = slugify(base) || "item";
  let n = 2;
  while (true) {
    const { data } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!data || (excludeId && data.id === excludeId)) return candidate;
    candidate = `${slugify(base) || "item"}-${n}`;
    n += 1;
  }
}

export async function saveProduct(input: {
  id?: string;
  name: string;
  description?: string;
  categoryId?: string | null;
  price: number;
  stock: number;
  status: string;
  featured: boolean;
  type: string;
  images: string[];
}): Promise<ActionResult> {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Nama produk minimal 2 karakter." };
  if (!Number.isFinite(input.price) || input.price < 0) return { ok: false, error: "Harga tidak valid." };
  if (!Number.isInteger(input.stock) || input.stock < 0) return { ok: false, error: "Stok tidak valid." };
  if (!productStatusEnum.safeParse(input.status).success || !PRODUCT_TYPES.includes(input.type as (typeof PRODUCT_TYPES)[number])) {
    return { ok: false, error: "Status/tipe tidak valid." };
  }

  const supabase = await staffSession();

  if (input.id) {
    const { error } = await supabase
      .from("products")
      .update({
        name,
        description: stripEmpty(input.description),
        category_id: input.categoryId || null,
        price: Math.round(input.price * 100) / 100,
        stock: input.stock,
        status: input.status,
        featured: input.featured,
        type: input.type,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: "Gagal menyimpan produk." };
    await replaceImages(supabase, "product_images", "product_id", input.id, input.images);
    return { ok: true, message: "Produk diperbarui." };
  }

  const slug = await uniqueSlug(supabase, name);
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      description: stripEmpty(input.description),
      category_id: input.categoryId || null,
      price: Math.round(input.price * 100) / 100,
      stock: input.stock,
      status: input.status,
      featured: input.featured,
      type: input.type,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Gagal membuat produk." };
  await replaceImages(supabase, "product_images", "product_id", data.id, input.images);
  return { ok: true, message: "Produk dibuat." };
}

async function replaceImages(
  supabase: Awaited<ReturnType<typeof createServerClientScoped>>,
  table: "product_images" | "project_images",
  fk: "product_id" | "project_id",
  id: string,
  urls: string[],
) {
  await supabase.from(table).delete().eq(fk, id);
  if (urls.length > 0) {
    await supabase.from(table).insert(urls.map((url, i) => ({ [fk]: id, url, sort_order: i })));
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await staffSession();
  const { error } = await supabase.from("products").update({ status: "inactive" }).eq("id", id);
  if (error) return { ok: false, error: "Gagal menonaktifkan produk." };
  return { ok: true, message: "Produk dinonaktifkan." };
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const PROJECT_STATUSES = ["draft", "published", "archived"] as const;

export async function saveProject(input: {
  id?: string;
  title: string;
  description?: string;
  body?: string;
  category?: string;
  technology: string[];
  githubUrl?: string;
  demoUrl?: string;
  coverImage?: string;
  featured: boolean;
  status: string;
  sortOrder?: number;
  images: string[];
}): Promise<ActionResult> {
  const title = input.title.trim();
  if (title.length < 2) return { ok: false, error: "Judul minimal 2 karakter." };
  if (!PROJECT_STATUSES.includes(input.status as (typeof PROJECT_STATUSES)[number])) {
    return { ok: false, error: "Status tidak valid." };
  }
  const supabase = await adminSession();
  const data = {
    title,
    slug: input.id ? undefined : slugify(title) || "project",
    description: stripEmpty(input.description),
    body: stripEmpty(input.body),
    category: stripEmpty(input.category),
    technology: input.technology.filter(Boolean),
    github_url: stripEmpty(input.githubUrl),
    demo_url: stripEmpty(input.demoUrl),
    cover_image: stripEmpty(input.coverImage),
    featured: input.featured,
    status: input.status,
    sort_order: input.sortOrder ?? 0,
  };

  if (input.id) {
    const { error } = await supabase.from("projects").update(data).eq("id", input.id);
    if (error) return { ok: false, error: "Gagal menyimpan proyek." };
    await replaceImages(supabase, "project_images", "project_id", input.id, input.images);
    return { ok: true, message: "Proyek diperbarui." };
  }
  const { data: created, error } = await supabase.from("projects").insert(data).select("id").single();
  if (error) return { ok: false, error: "Gagal membuat proyek." };
  await replaceImages(supabase, "project_images", "project_id", created.id, input.images);
  return { ok: true, message: "Proyek dibuat." };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const supabase = await adminSession();
  const { error } = await supabase.from("projects").update({ status: "archived" }).eq("id", id);
  if (error) return { ok: false, error: "Gagal mengarsipkan proyek." };
  return { ok: true, message: "Proyek diarsipkan." };
}

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------

export async function saveTrack(input: {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  audioUrl?: string;
  durationSeconds?: number;
  active: boolean;
  sortOrder?: number;
}): Promise<ActionResult> {
  if (input.title.trim().length < 1 || input.artist.trim().length < 1) {
    return { ok: false, error: "Judul & artis wajib diisi." };
  }
  const supabase = await adminSession();
  const data: {
    title: string;
    artist: string;
    cover_url: string | null;
    audio_url: string | null;
    duration: number | null;
    active: boolean;
    sort_order: number;
  } = {
    title: input.title.trim(),
    artist: input.artist.trim(),
    cover_url: stripEmpty(input.coverUrl),
    audio_url: stripEmpty(input.audioUrl),
    duration: input.durationSeconds && input.durationSeconds > 0 ? Math.round(input.durationSeconds) : null,
    active: input.active,
    sort_order: input.sortOrder ?? 0,
  };
  const { error } = input.id
    ? await supabase.from("music_tracks").update(data).eq("id", input.id)
    : await supabase.from("music_tracks").insert(data);
  if (error) return { ok: false, error: "Gagal menyimpan lagu." };
  return { ok: true, message: input.id ? "Lagu diperbarui." : "Lagu ditambahkan." };
}

export async function deleteTrack(id: string): Promise<ActionResult> {
  const supabase = await adminSession();
  const { error } = await supabase.from("music_tracks").delete().eq("id", id);
  if (error) return { ok: false, error: "Gagal menghapus lagu." };
  return { ok: true, message: "Lagu dihapus." };
}

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export async function deletePost(id: string): Promise<ActionResult> {
  const supabase = await adminSession();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return { ok: false, error: "Gagal menghapus post." };
  return { ok: true, message: "Post dihapus." };
}

export async function deleteComment(id: string): Promise<ActionResult> {
  const supabase = await adminSession();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return { ok: false, error: "Gagal menghapus komentar." };
  return { ok: true, message: "Komentar dihapus." };
}

export async function resolveReport(id: string): Promise<ActionResult> {
  const supabase = await adminSession();
  const { error } = await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
  if (error) return { ok: false, error: "Gagal menutup laporan." };
  return { ok: true, message: "Laporan ditandai selesai." };
}

// ---------------------------------------------------------------------------
// Settings (upsert whitelist, nilai disimpan sebagai JSON valid)
// ---------------------------------------------------------------------------

const SETTING_KEYS: Record<string, "string" | "boolean" | "number"> = {
  brand: "string",
  owner_name: "string",
  hero_kicker: "string",
  hero_tagline: "string",
  hero_description: "string",
  opening_enabled: "boolean",
  opening_duration: "number",
  opening_title: "string",
  opening_subtitle: "string",
  opening_show_skip: "boolean",
  about_bio: "string",
  footer_socials: "string",
  maintenance_mode: "boolean",
};

export async function saveSettings(entries: { key: string; value: string }[]): Promise<ActionResult> {
  const supabase = await adminSession();
  const cooked: { key: string; value: unknown }[] = [];
  for (const entry of entries) {
    if (!(entry.key in SETTING_KEYS)) continue;
    const type = SETTING_KEYS[entry.key];
    let value: unknown;
    if (type === "boolean") {
      value = entry.value === "true";
    } else if (type === "number") {
      const n = Number(entry.value);
      value = Number.isFinite(n) ? n : "";
    } else {
      // string: simpan apa adanya (bukan JSON.parse agar "2026" tetap string).
      value = entry.value;
    }
    cooked.push({ key: entry.key, value });
  }
  if (cooked.length === 0) return { ok: false, error: "Tidak ada setting valid." };

  // upsert manual (bulk upsert PostgREST lewat ranges cukup repot; per-baris ok di admin).
  for (const item of cooked) {
    const { error } = await supabase.from("site_settings").upsert(item, { onConflict: "key" });
    if (error) return { ok: false, error: `Gagal menyimpan ${item.key}.` };
  }
  return { ok: true, message: "Pengaturan disimpan." };
}

// ---------------------------------------------------------------------------
// Kelola akun (ADMIN ONLY — butuh service role untuk akses auth.users)
// ---------------------------------------------------------------------------

const USER_ROLES = ["user", "moderator", "seller", "admin"] as const;
const USER_STATUSES = ["active", "suspended", "banned"] as const;

/** Admin yang sedang login via session biasa (audit + cegah self-action). */
async function adminActor() {
  const profile = await requireAdmin();
  return profile;
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  const actor = await adminActor();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Email tidak valid." };
  if (password.length < 8) return { ok: false, error: "Password minimal 8 karakter." };
  if (username.length < 2) return { ok: false, error: "Username minimal 2 karakter." };
  if (displayName.length < 1) return { ok: false, error: "Nama tampilan wajib diisi." };
  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) return { ok: false, error: "Role tidak valid." };
  if (role === "admin" && actor.role !== "admin") return { ok: false, error: "Tidak diizinkan." };

  const admin = createAdminClientIfConfigured();
  if (!admin) return { ok: false, error: "Fitur belum tersedia (SERVICE ROLE belum dikonfigurasi)." };

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName },
  });
  if (authError) return { ok: false, error: authError.message };

  const { error: profileError } = await admin
    .from("profiles")
    .insert({
      id: authUser.user.id,
      username,
      display_name: displayName,
      role,
      status: "active",
    });
  if (profileError) {
    // Rollback auth user bila insert profil gagal (mis. username bentrok).
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { ok: false, error: "Gagal membuat profil (username mungkin sudah dipakai)." };
  }
  return { ok: true, message: `Akun ${username} dibuat.` };
}

export async function setUserRole(formData: FormData): Promise<ActionResult> {
  const actor = await adminActor();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId) return { ok: false, error: "Pengguna tidak valid." };
  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
    return { ok: false, error: "Role tidak valid." };
  }
  if (userId === actor.id) return { ok: false, error: "Tidak bisa mengubah role kamu sendiri." };

  const supabase = await createServerClientScoped();
  if (role !== "admin") {
    // Cegah demote admin terakhir.
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) return { ok: false, error: "Minimal harus ada satu admin." };
  }
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: "Gagal mengubah role." };
  return { ok: true, message: "Role diperbarui." };
}

export async function setUserStatus(formData: FormData): Promise<ActionResult> {
  const actor = await adminActor();
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!userId) return { ok: false, error: "Pengguna tidak valid." };
  if (!USER_STATUSES.includes(status as (typeof USER_STATUSES)[number])) {
    return { ok: false, error: "Status tidak valid." };
  }
  if (userId === actor.id) return { ok: false, error: "Tidak bisa memblokir akun kamu sendiri." };

  const admin = createAdminClientIfConfigured();
  if (!admin) return { ok: false, error: "Fitur belum tersedia (SERVICE ROLE belum dikonfigurasi)." };

  // Sinkronkan banned terhadap akun auth agar sesi yang aktif ikut diusir.
  const banError = status === "banned"
    ? (await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" })).error
    : (await admin.auth.admin.updateUserById(userId, { ban_duration: "none" })).error;
  if (banError) return { ok: false, error: "Gagal memperbarui status auth." };

  const supabase = await createServerClientScoped();
  const { error: profileError } = await supabase.from("profiles").update({ status }).eq("id", userId);
  if (profileError) return { ok: false, error: "Gagal memperbarui status profil." };
  return { ok: true, message: status === "banned" ? "Akun diblokir." : "Status akun diperbarui." };
}