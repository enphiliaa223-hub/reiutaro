import type { Metadata } from "next";
import Link from "next/link";
import { getAdminProducts } from "@/lib/queries/admin";
import { getProductCategories } from "@/lib/queries/store";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Produk — Admin" };

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getProductCategories(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl text-white">Produk</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
        >
          + Produk baru
        </Link>
      </div>

      {categories && categories.length > 0 ? (
        <p className="mt-2 text-xs text-ink-500">
          Kategori: {categories.map((c) => c.name).join(", ")}
        </p>
      ) : null}

      {!products || products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-10 text-center">
          <p className="text-sm text-ink-400">
            {products === null ? "DB belum terhubung." : "Belum ada produk."}
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/admin/products/${product.id}/edit`}
              className="flex items-center justify-between gap-4 bg-ink-900/40 p-4 transition-colors hover:bg-ink-900"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-paper-50">{product.name}</p>
                <p className="truncate text-xs text-ink-400">
                  {product.categoryName ?? "—"} · {product.type}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm text-ink-400">stok {product.stock}</span>
                <span className="font-semibold text-gold-400">
                  {formatCurrency(product.price, "USD")}
                </span>
                <Badge variant={product.status === "active" ? "success" : "ink"}>
                  {product.status}
                </Badge>
                {product.featured ? <Badge variant="gold">Featured</Badge> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}