import Link from "next/link";
import { Card, CardBody, Badge, buttonStyles } from "@/components/ui";
import { Reveal, StaggerGroup } from "@/components/motion/reveal";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/site/section-heading";
import { ProjectCard } from "@/components/site/project-card";
import { siteConfig } from "@/lib/site-config";
import { setting, type SiteSettings } from "@/lib/queries/content";
import type { Project } from "@/types/content";

export function AboutPreview({ settings }: { settings: SiteSettings | null }) {
  const ownerName = setting(settings, "owner_name", siteConfig.owner);
  const bio = setting(
    settings,
    "about_bio",
    "Building digital worlds inspired by anime storytelling and game UX. Code, design, music, and Japanese culture — mixed into one universe.",
  );
  const skills = setting<string[]>(settings, "about_focus", [
    "TypeScript",
    "Next.js",
    "Supabase",
    "UI/UX",
    "Motion Design",
    "Music",
  ]);

  const PROFILE = {
    name: ownerName,
    bio,
    skills,
    socials: ["GitHub", "X", "Instagram"],
  };
  return (
    <Section id="about" className="relative overflow-hidden bg-night-950">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(124,58,237,0.18),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(255,212,0,0.08),transparent_40%)]"
      />
      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <Reveal>
            <div className="flex flex-col gap-3">
              <p className="text-kicker uppercase text-gold-400">About</p>
              <h2 className="font-display text-h1 uppercase leading-tight tracking-tight text-paper-50">
                Who is{" "}
                <span className="[-webkit-text-stroke:1.5px_var(--color-gold-400)] text-transparent">
                  Reiutarou
                </span>
                ?
              </h2>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-ink-300">
                REIUTAROU is the digital universe of{" "}
                <span className="font-medium text-paper-100">{PROFILE.name}</span>. A space where
                personal projects, an anime community, and a store live side by side.
              </p>
              <div className="mt-6">
                <Link href="/about" className={buttonStyles({ variant: "outline" })}>
                  More about me
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <Card className="relative overflow-hidden">
              <CardBody className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-display text-2xl text-ink-950 shadow-gold">
                  MR
                </div>
                <h3 className="mt-4 font-display text-h3 uppercase text-paper-50">
                  {PROFILE.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-300">{PROFILE.bio}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {PROFILE.skills.map((skill) => (
                    <Badge key={skill} variant="neon">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="mt-6 flex justify-center gap-3">
                  {PROFILE.socials.map((label) => (
                    <a
                      key={label}
                      href="#"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-700 text-xs font-semibold text-paper-200 transition-colors duration-200 hover:border-gold-400 hover:text-gold-400"
                    >
                      {label[0]}
                    </a>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export function FeaturedProjects({ projects }: { projects: Project[] }) {
  return (
    <Section id="featured" className="relative overflow-hidden bg-ink-950">
      <Container>
        <SectionHeading
          kicker="Featured Work"
          title="Selected Projects"
          description="A curated look at what I am building — full archive lives on the projects page."
          align="left"
        />
        {projects.length > 0 ? (
          <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </StaggerGroup>
        ) : (
          <Reveal className="mt-10">
            <div className="rounded-2xl border border-dashed border-ink-700 px-6 py-14 text-center">
              <p className="text-sm text-paper-200">Belum ada project ditampilkan.</p>
              <p className="mt-1 text-xs text-ink-400">
                Admin dapat menambahkan di Project Manager.
              </p>
            </div>
          </Reveal>
        )}
        <Reveal className="mt-8 flex justify-center">
          <Link href="/projects" className={buttonStyles({ variant: "ghost" })}>
            View all projects →
          </Link>
        </Reveal>
      </Container>
    </Section>
  );
}
