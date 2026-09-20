import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui";
import { AddToCart } from "@/components/store/add-to-cart";
import { getProductBySlug } from "@/lib/queries/store";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/content";

const TYPE_LABELS: Record<Product["type"], string> = {
  digital: "Digital",
  topup: "Top Up",
  merchandise: "Merch",
  service: "Service",
  other: "Other",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product ? `${product.name} — Reiutaro Store` : "Produk — Reiutaro" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, user] = await Promise.all([getProductBySlug(slug), getCurrentUser()]);
  if (!product) notFound();

  const outOfStock = product.stock <= 0;

  return (
    <Section className="bg-ink-950">
      <Container className="pt-28 sm:pt-36">
        <Link href="/store" className="text-sm text-ink-400 transition-colors hover:text-gold-400">
          ← Kembali ke market
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          {/* Galeri */}
          <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
            {product.images.length > 0 ? (
              <div className="relative aspect-square">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-[linear-gradient(160deg,var(--color-night-700),var(--color-ink-900)_65%)]" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{TYPE_LABELS[product.type]}</Badge>
              {product.categoryName ? <Badge variant="ink">{product.categoryName}</Badge> : null}
              {outOfStock ? (
                <Badge variant="danger">Stok habis</Badge>
              ) : product.stock <= 10 ? (
                <Badge variant="danger">Sisa {product.stock}</Badge>
              ) : (
                <Badge variant="success">Stok tersedia</Badge>
              )}
            </div>

            <h1 className="font-display text-4xl uppercase leading-tight tracking-tight text-paper-50 sm:text-5xl">
              {product.name}
            </h1>

            <p className="text-3xl font-semibold text-gold-400">
              {formatCurrency(product.price, product.currency)}
            </p>

            {product.description ? (
              <div className="space-y-3 text-sm leading-relaxed text-ink-300">
                {product.description.split(/\n+/).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            <div className="mt-2 border-t border-ink-800 pt-6">
              <AddToCart
                productId={product.id}
                stock={product.stock}
                slug={product.slug}
                isAuthed={Boolean(user)}
              />
            </div>

            <p className="text-xs text-ink-500">
              Harga final dihitung ulang di server saat checkout. Setelah pesanan dibuat, statusnya{" "}
              <span className="text-ink-300">menunggu pembayaran</span> dan akan dikonfirmasi admin.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}