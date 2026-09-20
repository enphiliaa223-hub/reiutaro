import { Hero } from "@/components/site/hero";
import { AboutPreview, FeaturedProjects } from "@/components/site/about-preview";
import { CommunityPreview, StorePreview } from "@/components/site/community-preview";
import { getFeaturedProjects, getSiteSettings } from "@/lib/queries/content";
import { normalizeSettings } from "@/lib/settings";
import type { Post, Product } from "@/types/content";

export const revalidate = 300;

export default async function Home() {
  const [featured, settings] = await Promise.all([getFeaturedProjects(3), getSiteSettings()]);
  const normalized = normalizeSettings(settings);

  // TODO Phase 7/8 — ambil dari Supabase. Belum ada → empty state.
  const posts: Post[] = [];
  const products: Product[] = [];

  return (
    <>
      <Hero settings={normalized} />
      <AboutPreview settings={settings} />
      <FeaturedProjects projects={featured ?? []} />
      <CommunityPreview posts={posts} />
      <StorePreview products={products} />
    </>
  );
}