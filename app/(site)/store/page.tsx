import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/site/section-heading";
import { ProductCard } from "@/components/site/product-card";
import { EmptyState } from "@/components/site/empty-state";
import { getProductCategories, getProducts } from "@/lib/queries/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Store — Reiutaro" };
export const revalidate = 120;

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, products] = await Promise.all([
    getProductCategories(),
    getProducts(category),
  ]);

  return (
    <Section id="store" className="bg-ink-950">
      <Container className="pt-28 sm:pt-36">
        <SectionHeading
          kicker="Store"
          title="Reiutaro Market"
          description="Produk digital, top up, hingga merch eksklusif. Total dihitung server-side setiap checkout."
          align="left"
        />

        {categories && categories.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/store"
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                !category
                  ? "border-gold-400 bg-gold-400 text-ink-950"
                  : "border-ink-700 text-paper-200 hover:border-gold-400 hover:text-gold-400",
              )}
            >
              Semua
            </Link>
            {categories.map((c) => {
              const active = category === c.slug;
              return (
                <Link
                  key={c.id}
                  href={`/store?category=${c.slug}`}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition-colors",
                    active
                      ? "border-gold-400 bg-gold-400 text-ink-950"
                      : "border-ink-700 text-paper-200 hover:border-gold-400 hover:text-gold-400",
                  )}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products && products.length > 0 ? (
            products.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                message={
                  products === null
                    ? "Database belum dikonfigurasi"
                    : "Belum ada produk di kategori ini."
                }
                hint={products === null ? "Isi kredensial Supabase. Lihat docs/SUPABASE_SETUP.md." : undefined}
              />
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}