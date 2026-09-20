import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui";
import { Container, Section } from "@/components/ui/container";
import { searchContent, type SearchResult } from "@/lib/queries/content";
import { formatCurrency } from "@/lib/utils";

function SearchGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-4 w-4 shrink-0 text-ink-400"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export const metadata: Metadata = { title: "Cari — Reiutarou" };
export const revalidate = 60;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results: SearchResult | null = query ? await searchContent(query) : null;

  const total = results
    ? results.projects.length + results.posts.length + results.products.length
    : 0;

  return (
    <Section className="bg-ink-950">
      <Container>
        <h1 className="font-display text-h2 uppercase text-paper-50">Cari</h1>

        <form method="get" action="/search" className="mt-6 flex max-w-xl gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-ink-700 bg-ink-900/60 px-3 focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400/40">
            <SearchGlyph />
            <input
              name="q"
              defaultValue={query}
              placeholder="Proyek, postingan, atau produk…"
              className="w-full bg-transparent py-2.5 text-sm text-paper-50 placeholder:text-ink-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
          >
            Cari
          </button>
        </form>

        {!query ? (
          <p className="mt-8 text-sm text-ink-400">
            Ketik kata kunci untuk mencari di seluruh situs.
          </p>
        ) : results === null ? (
          <p className="mt-8 text-sm text-ink-400">
            Pencarian tidak tersedia saat DB belum terhubung.
          </p>
        ) : total === 0 ? (
          <p className="mt-8 text-sm text-ink-400">
            Tidak ada hasil untuk “{query}”.
          </p>
        ) : (
          <div className="mt-8 space-y-8">
            {results.projects.length > 0 && (
              <ResultGroup title={`Proyek (${results.projects.length})`}>
                {results.projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.slug}`}
                    className="block py-3 transition-colors hover:text-gold-400"
                  >
                    <p className="font-medium text-paper-100">{p.title}</p>
                    <p className="text-xs text-ink-400">{p.description}</p>
                  </Link>
                ))}
              </ResultGroup>
            )}

            {results.posts.length > 0 && (
              <ResultGroup title={`Postingan komunitas (${results.posts.length})`}>
                {results.posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/post/${post.id}`}
                    className="block py-3 transition-colors hover:text-gold-400"
                  >
                    <p className="font-medium text-paper-100">{post.title}</p>
                  </Link>
                ))}
              </ResultGroup>
            )}

            {results.products.length > 0 && (
              <ResultGroup title={`Produk (${results.products.length})`}>
                {results.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/store/product/${product.slug}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-gold-400"
                  >
                    <span className="font-medium text-paper-100">{product.name}</span>
                    <span className="text-xs text-gold-400">
                      {formatCurrency(product.price)}
                    </span>
                  </Link>
                ))}
              </ResultGroup>
            )}
          </div>
        )}
      </Container>
    </Section>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <p className="text-kicker uppercase text-gold-400">{title}</p>
        <div className="mt-2 divide-y divide-ink-800">{children}</div>
      </CardBody>
    </Card>
  );
}