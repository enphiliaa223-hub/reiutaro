import Link from "next/link";
import { buttonStyles } from "@/components/ui";
import { Reveal, StaggerGroup } from "@/components/motion/reveal";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/site/section-heading";
import { EmptyState } from "@/components/site/empty-state";
import { PostCard } from "@/components/site/post-card";
import { ProductCard } from "@/components/site/product-card";
import type { Post, Product } from "@/types/content";

export function CommunityPreview({ posts }: { posts: Post[] }) {
  return (
    <Section id="community" className="relative overflow-hidden bg-night-950">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,212,0,0.08),transparent_40%),radial-gradient(circle_at_90%_90%,rgba(124,58,237,0.15),transparent_50%)]"
      />
      <Container className="relative">
        <SectionHeading
          kicker="Community"
          title="Latest From The Feed"
          description="What the community is talking about right now."
        />
        {posts.length > 0 ? (
          <StaggerGroup className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </StaggerGroup>
        ) : (
          <Reveal className="mt-10">
            <EmptyState
              message="Belum ada postingan."
              hint="Jadilah yang pertama berbagi di community."
            />
          </Reveal>
        )}
        <Reveal className="mt-8 flex justify-center">
          <Link href="/community" className={buttonStyles({ variant: "ghost" })}>
            Join the community →
          </Link>
        </Reveal>
      </Container>
    </Section>
  );
}

export function StorePreview({ products }: { products: Product[] }) {
  return (
    <Section id="store" className="relative overflow-hidden bg-ink-950">
      <Container>
        <SectionHeading
          kicker="Store"
          title="Featured Goods"
          description="Digital products, top-up, and merch from the REIUTAROU universe."
        />
        {products.length > 0 ? (
          <StaggerGroup className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </StaggerGroup>
        ) : (
          <Reveal className="mt-10">
            <EmptyState message="Belum ada produk." hint="Produk dan master akan segera hadir." />
          </Reveal>
        )}
        <Reveal className="mt-8 flex justify-center">
          <Link href="/store" className={buttonStyles({ variant: "ghost" })}>
            Visit the store →
          </Link>
        </Reveal>
      </Container>
    </Section>
  );
}
