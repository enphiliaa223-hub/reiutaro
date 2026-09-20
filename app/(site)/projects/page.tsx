import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/site/section-heading";
import { StaggerGroup, Reveal } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/site/project-card";
import { EmptyState } from "@/components/site/empty-state";
import { getPublishedProjects } from "@/lib/queries/content";

export const metadata: Metadata = { title: "Projects — Reiutaro" };
export const revalidate = 300;

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <Section id="projects">
      <Container>
        <SectionHeading
          kicker="Portfolio"
          title="All Projects"
          description="Semua yang sedang dan pernah saya bangun — eksperimen, produk, dan hal-hal yang dibuat karena penasaran."
          align="left"
        />

        {projects && projects.length > 0 ? (
          <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </StaggerGroup>
        ) : (
          <Reveal className="mt-12">
            <EmptyState
              message={
                projects === null ? "Database belum dikonfigurasi" : "Belum ada project"
              }
              hint={
                projects === null
                  ? "Isi kredensial Supabase untuk menampilkan konten. Lihat docs/SUPABASE_SETUP.md."
                  : "Project akan ditampilkan di sini setelah dipublikasikan."
              }
            />
          </Reveal>
        )}
      </Container>
    </Section>
  );
}