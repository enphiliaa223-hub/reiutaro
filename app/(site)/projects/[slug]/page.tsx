import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/site/empty-state";
import { getProjectBySlug } from "@/lib/queries/content";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} — Reiutaro` };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (project === null) notFound();

  const coverUrl = project.cover;
  const createdYear = new Date(project.createdAt).getFullYear();

  return (
    <Section id="project" className="bg-ink-950">
      <Container className="pt-28 sm:pt-36">
        <Link
          href="/projects"
          className="text-sm text-ink-400 transition-colors hover:text-gold-400"
        >
          ← Semua project
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/70 shadow-raise">
          <div className="relative aspect-[21/9] w-full bg-ink-800">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={project.title}
                fill
                sizes="(max-width: 1024px) 100vw, 1280px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-night-700),var(--color-ink-900))]"
              />
            )}
          </div>

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {project.category ? (
                  <p className="text-kicker uppercase text-gold-400">{project.category}</p>
                ) : null}
                <h1 className="mt-2 font-display text-h1 uppercase text-paper-50">
                  {project.title}
                </h1>
                <p className="mt-2 text-sm text-ink-400">Selesai · {createdYear}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {project.demoUrl ? (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-gold-400 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
                  >
                    Live demo
                  </a>
                ) : null}
                {project.githubUrl ? (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-ink-600 px-5 py-2.5 text-sm font-medium text-paper-100 transition-colors hover:border-gold-400 hover:text-gold-400"
                  >
                    GitHub
                  </a>
                ) : null}
              </div>
            </div>

            {project.description ? (
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink-200">
                {project.description}
              </p>
            ) : null}

            {project.tech.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <Badge key={t} variant="neon">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {project.body ? (
          <article className="prose-invert mt-10 max-w-3xl whitespace-pre-line text-base leading-relaxed text-ink-200">
            {project.body}
          </article>
        ) : null}

        {project.images.length > 0 ? (
          <div className="mt-10">
            <h2 className="font-display text-h3 uppercase text-paper-50">Gallery</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {project.images.map((img, i) => (
                <div
                  key={`${img.url}-${i}`}
                  className="relative aspect-video overflow-hidden rounded-xl border border-ink-800 bg-ink-800"
                >
                  <Image
                    src={img.url}
                    alt={`${project.title} — galeri ${i + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 512px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {project.body === null && project.images.length === 0 ? (
          <div className="mt-10">
            <EmptyState message="Detail lengkap akan menyusul." />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}