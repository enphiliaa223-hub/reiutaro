import Image from "next/image";
import Link from "next/link";
import { Card, CardBody, CardMedia, Badge } from "@/components/ui";
import { StaggerItem } from "@/components/motion/reveal";
import type { Project } from "@/types/content";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <StaggerItem className="h-full">
      <Link href={`/projects/${project.slug}`} className="block h-full">
        <Card interactive className="flex h-full flex-col overflow-hidden">
          <CardMedia>
            {project.cover ? (
              <Image
                src={project.cover}
                alt={project.title}
                fill
                sizes="(max-width: 1024px) 100vw, 512px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-night-700),var(--color-ink-900))]" />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-gold-500)_15%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-gold-500)_15%,transparent)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60"
                />
              </>
            )}
            <div className="absolute bottom-3 left-3">
              {project.featured ? <Badge variant="gold">Featured</Badge> : null}
            </div>
          </CardMedia>
          <CardBody className="flex flex-1 flex-col">
            <h3 className="font-display text-lg uppercase tracking-tight text-paper-50">
              {project.title}
            </h3>
            {project.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-ink-300">{project.description}</p>
            ) : null}
            {project.tech.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.tech.slice(0, 3).map((t) => (
                  <Badge key={t} variant="ink">
                    {t}
                  </Badge>
                ))}
                {project.tech.length > 3 ? (
                  <Badge variant="ink">+{project.tech.length - 3}</Badge>
                ) : null}
              </div>
            ) : null}
            <span className="mt-auto pt-5 text-xs font-medium uppercase tracking-widest text-gold-400">
              View Project →
            </span>
          </CardBody>
        </Card>
      </Link>
    </StaggerItem>
  );
}
