import { Hero } from "@/components/site/hero";
import { AboutPreview, FeaturedProjects } from "@/components/site/about-preview";
import { CommunityPreview, StorePreview } from "@/components/site/community-preview";
import { getFeaturedProjects, getSiteSettings } from "@/lib/queries/content";
import { getFeedPosts } from "@/lib/queries/community";
import { getProducts } from "@/lib/queries/store";
import { normalizeSettings } from "@/lib/settings";

export const revalidate = 300;

export default async function Home() {
  const [featured, settings, feed, store] = await Promise.all([
    getFeaturedProjects(3),
    getSiteSettings(),
    getFeedPosts({ perPage: 3 }),
    getProducts(),
  ]);
  const normalized = normalizeSettings(settings);
  const posts = feed?.posts ?? [];
  const products = store ?? [];

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