import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { PostComposer } from "@/components/community/post-composer";
import { getCategories } from "@/lib/queries/community";
import { getCurrentUser } from "@/lib/auth/session";
import { glassCard } from "@/lib/utils";

export const metadata: Metadata = { title: "Buat Post — Reiutaro" };

export default async function NewPostPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/community/new");

  const categories = await getCategories();

  return (
    <Section id="new-post" className="bg-ink-950">
      <Container className="pt-28 sm:pt-36">
        <Link href="/community" className="text-sm text-ink-400 transition-colors hover:text-gold-400">
          ← Kembali ke komunitas
        </Link>
        <h1 className="mt-4 font-display text-h1 uppercase text-paper-50">Buat post</h1>

        <div className={`mt-8 ${glassCard} p-6`}>
          <PostComposer categories={categories ?? []} />
        </div>
      </Container>
    </Section>
  );
}