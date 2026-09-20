"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createServerClientScoped } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export type ActionResult = { ok: true; orderId?: string } | { ok: false; error: string };

async function authedSession() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createServerClientScoped();
  return { user, supabase };
}

async function ensureCart(supabase: Awaited<ReturnType<typeof createServerClientScoped>>, userId: string) {
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (cart) return cart.id;
  const { data: created } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  return created?.id ?? null;
}

export async function addToCart(productId: string, quantity: number): Promise<ActionResult> {
  const session = await authedSession();
  if (!session) return { ok: false, error: "Kamu harus login dulu." };
  if (!(await rateLimit(`cart:${session.user.id}`, 10, 60))) {
    return { ok: false, error: "Terlalu cepat. Coba lagi sebentar." };
  }
  const qty = Math.min(99, Math.max(1, Math.round(quantity)));

  const cartId = await ensureCart(session.supabase, session.user.id);
  if (!cartId) return { ok: false, error: "Gagal menyiapkan cart." };

  // Ambil info produk (public read OK dengan scoped client).
  const { data: product } = await session.supabase
    .from("products")
    .select("id, stock, status")
    .eq("id", productId)
    .maybeSingle();
  if (!product || product.status !== "active") {
    return { ok: false, error: "Produk tidak tersedia." };
  }
  if ((product.stock ?? 0) <= 0) {
    return { ok: false, error: "Stok habis." };
  }

  const { data: existing } = await session.supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const totalQty = existing.quantity + qty;
    if (totalQty > (product.stock ?? 0)) {
      return { ok: false, error: "Stok tidak mencukupi." };
    }
    await session.supabase
      .from("cart_items")
      .update({ quantity: totalQty })
      .eq("id", existing.id);
  } else {
    if (qty > (product.stock ?? 0)) {
      return { ok: false, error: "Stok tidak mencukupi." };
    }
    await session.supabase
      .from("cart_items")
      .insert({ cart_id: cartId, product_id: productId, quantity: qty });
  }

  return { ok: true };
}

export async function updateCartItem(cartItemId: string, quantity: number): Promise<ActionResult> {
  const session = await authedSession();
  if (!session) return { ok: false, error: "Kamu harus login dulu." };
  const qty = Math.min(99, Math.max(1, Math.round(quantity)));
  const { error } = await session.supabase
    .from("cart_items")
    .update({ quantity: qty })
    .eq("id", cartItemId);
  if (error) return { ok: false, error: "Gagal memperbarui cart." };
  return { ok: true };
}

export async function removeCartItem(cartItemId: string): Promise<ActionResult> {
  const session = await authedSession();
  if (!session) return { ok: false, error: "Kamu harus login dulu." };
  const { error } = await session.supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) return { ok: false, error: "Gagal menghapus item." };
  return { ok: true };
}

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(120),
  email: z.string().trim().email("Email tidak valid"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

/**
 * Checkout — total SELALU dihitung server-side via RPC app.create_order.
 * Client hanya mengirim data pelanggan; harga diambil ulang dari DB.
 */
export async function checkout(input: unknown): Promise<ActionResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const session = await authedSession();
  if (!session) return { ok: false, error: "Kamu harus login dulu." };

  if (!(await rateLimit(`checkout:${session.user.id}`, 3, 300))) {
    return { ok: false, error: "Terlalu banyak percobaan checkout. Coba lagi nanti." };
  }

  const { data, error } = await session.supabase.rpc("create_order", {
    p_customer_name: parsed.data.name,
    p_customer_email: parsed.data.email,
    p_customer_phone: parsed.data.phone || null,
    p_customer_address: parsed.data.address || null,
    p_notes: parsed.data.notes || null,
  });

  if (error) {
    const message = error.message;
    if (message.startsWith("E_STOCK")) return { ok: false, error: "Stok produk tidak mencukupi." };
    if (message.startsWith("E_CART_EMPTY")) return { ok: false, error: "Cart kosong." };
    if (message.startsWith("E_NOT_AUTHENTICATED")) return { ok: false, error: "Login dulu." };
    return { ok: false, error: "Checkout gagal. Coba lagi." };
  }

  const result = data as { order_id: string } | null;
  return { ok: true, orderId: result?.order_id };
}