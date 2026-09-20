import { createPublicClient } from "@/lib/supabase/public";
import { createServerClientScoped } from "@/lib/supabase/server";
import type { Product } from "@/types/content";
import type { CategoryRow } from "@/lib/queries/community";

function pub() {
  try {
    return createPublicClient();
  } catch {
    return null;
  }
}

export async function getProductCategories(): Promise<CategoryRow[] | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c
    .from("categories")
    .select("id, name, slug, description, type")
    .eq("type", "product")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data && data.length > 0 ? (data as CategoryRow[]) : [];
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  type: Product["type"];
  featured: boolean;
  images: { url: string }[] | null;
}

const PRODUCT_SELECT =
  "id, name, slug, description, price, stock, type, featured, images:product_images(url)";

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    currency: "IDR",
    cover: row.images?.[0]?.url ?? null,
    stock: Number(row.stock),
    type: row.type,
    featured: row.featured,
  };
}

export async function getProducts(categorySlug?: string | null): Promise<Product[] | null> {
  const c = pub();
  if (!c) return null;

  let query = c.from("products").select(PRODUCT_SELECT).eq("status", "active");

  if (categorySlug) {
    const { data: cat } = await c
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .eq("type", "product")
      .maybeSingle();
    if (cat) query = query.eq("category_id", cat.id);
  }

  const { data } = await query
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (!data) return null;
  const rows = data as unknown as ProductRow[];
  return rows.map(toProduct);
}

export interface ProductDetail extends Product {
  categoryName: string | null;
  images: string[];
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const c = pub();
  if (!c) return null;
  const { data } = await c
    .from("products")
    .select(
      PRODUCT_SELECT + ", category:categories!products_category_id_fkey(name)",
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as ProductRow & {
    category: { name: string } | null;
  };
  return {
    ...toProduct(row),
    categoryName: row.category?.name ?? null,
    images: (row.images ?? []).map((i) => i.url),
  };
}

export interface CartItemView {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  quantity: number;
  stock: number;
  subtotal: number;
  cover: string | null;
}

interface CartDbRow {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    images: { url: string }[] | null;
  };
}

/** Ringkasan cart user (session) dengan perhitungan subtotal server-side. */
export async function getCartSummary(): Promise<{ items: CartItemView[]; subtotal: number } | null> {
  try {
    const supabase = await createServerClientScoped();
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .maybeSingle();
    if (!cart) return { items: [], subtotal: 0 };

    const { data } = await supabase
      .from("cart_items")
      .select(
        "id, quantity, product:products(id, name, slug, price, stock, images:product_images(url))",
      )
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: false } as never);

    if (!data) return null;

    const rows = data as unknown as CartDbRow[];
    const items: CartItemView[] = rows
      .filter((r) => r.product)
      .map((r) => ({
        id: r.id,
        productId: r.product.id,
        name: r.product.name,
        slug: r.product.slug,
        price: Number(r.product.price),
        currency: "IDR",
        quantity: r.quantity,
        stock: Number(r.product.stock),
        subtotal: Math.round((Number(r.product.price) * r.quantity) * 100) / 100,
        cover: r.product.images?.[0]?.url ?? null,
      }));

    const subtotal = Math.round(items.reduce((sum, i) => sum + i.subtotal, 0) * 100) / 100;
    return { items, subtotal };
  } catch {
    return null;
  }
}

interface OrderDb {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  currency: string;
  created_at: string;
  items: { id: string; product_name: string; unit_price: number; quantity: number; subtotal: number }[];
}

async function serverClient() {
  return createServerClientScoped();
}

export async function getMyOrders() {
  try {
    const supabase = await serverClient();
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, currency, created_at")
      .order("created_at", { ascending: false });
    if (!data) return null;
    return data.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      status: r.status,
      paymentStatus: r.payment_status,
      total: Number(r.total),
      currency: r.currency ?? "USD",
      createdAt: r.created_at,
    }));
  } catch {
    return null;
  }
}

export async function getMyOrder(id: string) {
  try {
    const supabase = await serverClient();
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, customer_name, customer_email, customer_phone, customer_address, notes, subtotal, total, currency, created_at, " +
          "items:order_items(product_name, unit_price, quantity, subtotal)",
      )
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    const row = data as unknown as OrderDb & {
      customer_name: string | null;
      customer_email: string | null;
      customer_phone: string | null;
      customer_address: string | null;
      notes: string | null;
      subtotal: number;
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
  } catch {
    return null;
  }
}