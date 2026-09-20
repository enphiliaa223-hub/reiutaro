import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/site/section-heading";
import { buttonStyles } from "@/components/ui";
import { PostCard } from "@/components/site/post-card";
import { EmptyState } from "@/components/site/empty-state";
import { FeedPagination } from "@/components/community/feed-pagination";
import { getCategories, getFeedPosts } from "@/lib/queries/community";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Community — Reiutaro" };
export const revalidate = 60;

const PER_PAGE = 12;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  const [categories, feed] = await Promise.all([
    getCategories(),
    getFeedPosts({ categorySlug: category, page, perPage: PER_PAGE }),
  ]);

  const totalPages = feed ? Math.max(1, Math.ceil(feed.total / PER_PAGE)) : 1;

  return (
    <Section id="community" className="bg-ink-950">
      <Container className="pt-28 sm:pt-36">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker="Community"
            title="Anime Community"
            description="Thread, diskusi, dan karya dari seluruh pengunjung Reiutaro."
            align="left"
          />
          <Link href="/community/new" className={buttonStyles({ variant: "primary", size: "md" })}>
            Buat post
          </Link>
        </div>

        {/* Filter kategori */}
        {categories && categories.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/community"
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
                  href={`/community?category=${c.slug}`}
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

        <div className="mt-8 space-y-4">
          {feed && feed.posts.length > 0 ? (
            feed.posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              message={
                feed === null
                  ? "Database belum dikonfigurasi"
                  : category
                    ? "Belum ada post di kategori ini."
                    : "Belum ada post. Jadilah yang pertama!"
              }
              hint={
                feed === null
                  ? "Isi kredensial Supabase. Lihat docs/SUPABASE_SETUP.md."
                  : undefined
              }
            />
          )}
        </div>

        {feed && feed.total > PER_PAGE ? (
          <FeedPagination page={page} totalPages={totalPages} />
        ) : null}
      </Container>
    </Section>
  );
}