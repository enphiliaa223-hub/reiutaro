import { createServerClientScoped } from "@/lib/supabase/server";

async function scoped() {
  try {
    return await createServerClientScoped();
  } catch {
    return null;
  }
}

interface DashboardStats {
  users: number;
  products: number;
  orders: number;
  revenue: number;
  pendingReports: number;
  posts: number;
  revenueToday: number;
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await scoped();
  if (!supabase) return null;

  const [users, products, orders, reports, posts, revenueRows, todayRows] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("total")
      .in("payment_status", ["paid", "completed"]),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", new Date(Date.now() - 86400000).toISOString())
      .in("payment_status", ["paid", "completed"]),
  ]);

  const revenue = (revenueRows.data ?? []).reduce((sum, r) => sum + Number(r.total ?? 0), 0);
  const revenueToday = (todayRows.data ?? []).reduce((sum, r) => sum + Number(r.total ?? 0), 0);

  return {
    users: users.count ?? 0,
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    revenue,
    pendingReports: reports.count ?? 0,
    posts: posts.count ?? 0,
    revenueToday,
  };
}

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  userName: string;
  itemCount: number;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export async function getAdminOrders(): Promise<AdminOrderRow[] | null> {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_email, status, payment_status, total, currency, created_at, items:order_items(id)",
    )
    .order("created_at", { ascending: false })
    .limit(200) as never;

  if (!data) return null;
  return (data as unknown as Array<{
    id: string;
    order_number: string;
    customer_email: string | null;
    status: string;
    payment_status: string;
    total: number;
    currency: string | null;
    created_at: string;
    items: unknown[];
  }>).map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    userName: r.customer_email ?? "",
    itemCount: (r.items ?? []).length,
    total: Number(r.total),
    currency: r.currency ?? "USD",
    status: r.status,
    paymentStatus: r.payment_status,
    createdAt: r.created_at,
  }));
}

export async function getAdminOrder(id: string) {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_status, customer_name, customer_email, customer_phone, customer_address, notes, subtotal, total, currency, created_at, " +
        "items:order_items(product_name, unit_price, quantity, subtotal)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    customer_address: string | null;
    notes: string | null;
    subtotal: number;
    total: number;
    currency: string | null;
    created_at: string;
    items: { id: string; product_name: string; unit_price: number; quantity: number; subtotal: number }[];
  };
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    notes: row.notes,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    currency: row.currency ?? "USD",
    createdAt: row.created_at,
    items: (row.items ?? []).map((i) => ({
      id: i.id,
      productName: i.product_name,
      unitPrice: Number(i.unit_price),
      quantity: i.quantity,
      subtotal: Number(i.subtotal),
    })),
  };
}

export async function getAdminProducts() {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, stock, status, featured, type, " +
        "category:categories!products_category_id_fkey(name), images:product_images(url)",
    )
    .order("created_at", { ascending: false }) as never;
  if (!data) return null;

  return (data as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    status: string;
    featured: boolean;
    type: string;
    category: { name: string } | null;
    images: { url: string }[] | null;
  }>).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    price: Number(r.price),
    stock: Number(r.stock),
    status: r.status,
    featured: Boolean(r.featured),
    type: r.type,
    categoryName: r.category?.name ?? null,
    cover: r.images?.[0]?.url ?? null,
  }));
}

export async function getAdminProduct(id: string) {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price, stock, status, featured, type, category_id, " +
        "images:product_images(url)",
    )
    .eq("id", id)
    .maybeSingle() as never;
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    status: string;
    featured: boolean;
    type: string;
    category_id: string | null;
    images: { url: string }[] | null;
  };
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    stock: Number(row.stock),
    status: row.status,
    featured: Boolean(row.featured),
    type: row.type,
    categoryId: row.category_id,
    images: (row.images ?? []).map((i) => i.url),
  };
}

export async function getAdminProject(id: string) {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("projects")
    .select(
      "id, title, description, body, category, technology, github_url, demo_url, cover_image, featured, status, sort_order, " +
        "images:project_images(url)",
    )
    .eq("id", id)
    .maybeSingle() as never;
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    title: string;
    description: string | null;
    body: string | null;
    category: string | null;
    technology: string[] | null;
    github_url: string | null;
    demo_url: string | null;
    cover_image: string | null;
    featured: boolean;
    status: string;
    sort_order: number;
    images: { url: string }[] | null;
  };
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    body: row.body,
    category: row.category,
    technology: row.technology ?? [],
    githubUrl: row.github_url,
    demoUrl: row.demo_url,
    coverImage: row.cover_image,
    featured: Boolean(row.featured),
    status: row.status,
    sortOrder: row.sort_order,
    images: (row.images ?? []).map((i) => i.url),
  };
}

export async function getAdminPosts() {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, slug, status, is_pinned, created_at, likes:post_likes(id), " +
        "author:profiles!posts_author_id_fkey(username, display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(300) as never;
  if (!data) return null;
  return (data as unknown as Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    is_pinned: boolean;
    created_at: string;
    likes: unknown[];
    author: { username: string; display_name: string } | null;
  }>).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    isPinned: Boolean(r.is_pinned),
    createdAt: r.created_at,
    likes: (r.likes ?? []).length,
    authorUsername: r.author?.username ?? "?",
    authorName: r.author?.display_name ?? "",
  }));
}

export async function getAdminComments() {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("comments")
    .select(
      "id, content, created_at, " +
        "author:profiles!comments_author_id_fkey(username), post:posts!comments_post_id_fkey(title)",
    )
    .order("created_at", { ascending: false })
    .limit(300) as never;
  if (!data) return null;
  return (data as unknown as Array<{
    id: string;
    content: string;
    created_at: string;
    author: { username: string } | null;
    post: { title: string } | null;
  }>).map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.created_at,
    authorUsername: r.author?.username ?? "?",
    postTitle: r.post?.title ?? "(unknown)",
  }));
}

export async function getAdminReports() {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("reports")
    .select(
      "id, target_type, target_id, reason, status, created_at, " +
        "reporter:profiles!reports_reporter_id_fkey(username)",
    )
    .eq("status", "open")
    .order("created_at", { ascending: true }) as never;
  if (!data) return null;
  return (data as unknown as Array<{
    id: string;
    target_type: string;
    target_id: string;
    reason: string;
    status: string;
    created_at: string;
    reporter: { username: string } | null;
  }>).map((r) => ({
    id: r.id,
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    reporterUsername: r.reporter?.username ?? "?",
  }));
}

export async function getAdminTracks() {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("music_tracks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false }) as never;
  if (!data) return null;
  return data as unknown as Array<{
    id: string;
    title: string;
    artist: string;
    album: string | null;
    cover_url: string | null;
    audio_url: string | null;
    duration: number | null;
    active: boolean;
    sort_order: number;
    created_at: string;
  }>;
}

export async function getAdminTrack(id: string) {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase
    .from("music_tracks")
    .select("*")
    .eq("id", id)
    .maybeSingle() as never;
  if (!data) return null;
  return data as unknown as {
    id: string;
    title: string;
    artist: string;
    album: string | null;
    cover_url: string | null;
    audio_url: string | null;
    duration: number | null;
    active: boolean;
    sort_order: number;
    created_at: string;
  };
}

export interface AdminSettingRow {
  key: string;
  value: unknown;
}

export async function getAdminSettings(): Promise<AdminSettingRow[] | null> {
  const supabase = await scoped();
  if (!supabase) return null;
  const { data } = await supabase.from("site_settings").select("key, value").order("key");
  if (!data) return null;
  return data.map((r) => ({ key: r.key, value: r.value }));
}