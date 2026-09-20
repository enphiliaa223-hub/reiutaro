import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui";
import { glassCard } from "@/lib/utils";
import {
  getOwnerProfile,
  getSiteSettings,
  getSiteStats,
  setting,
} from "@/lib/queries/content";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "About — Reiutaro" };
export const revalidate = 300;

export default async function AboutPage() {
  const [settings, profile, stats] = await Promise.all([
    getSiteSettings(),
    getOwnerProfile(),
    getSiteStats(),
  ]);

  const ownerName = setting(settings, "owner_name", siteConfig.owner);
  const bio = setting(
    settings,
    "about_bio",
    "Building digital worlds inspired by anime storytelling and game UX.",
  );
  const smallIntro = setting(settings, "about_intro", "");
  const focus = setting<string[]>(settings, "about_focus", ["Code", "Design", "Community", "Music"]);

  const skills = profile?.skills && profile.skills.length > 0 ? profile.skills : focus;
  const interests = profile?.interests ?? [];
  const socialLinks = profile?.social_links ?? {};

  const statItems = [
    { label: "Projects", value: stats?.projects },
    { label: "Community posts", value: stats?.posts },
    { label: "Products", value: stats?.products },
    { label: "Music tracks", value: stats?.music },
  ];

  return (
    <>
      <Section className="relative overflow-hidden bg-ink-950">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.18),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(255,212,0,0.08),transparent_40%)]"
        />
        <Container className="relative pt-28 sm:pt-36">
          <SectionHeading
            kicker={setting(settings, "about_kicker", "About")}
            title={`Who is ${ownerName.split(" ")[0]}${settings ? ` ${ownerName.split(" ")[1] ?? ""}` : " Reiutarou"}?`}
            description={smallIntro || `The digital universe of ${ownerName}.`}
            align="left"
          />

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
            <Reveal>
              <div className="space-y-6 text-base leading-relaxed text-ink-200">
                <p className="text-lg">
                  {bio}
                </p>
                <p>
                  REIUTAROU is a personal digital universe — a place where{" "}
                  <span className="font-medium text-paper-100">personal projects</span>, an{" "}
                  <span className="font-medium text-paper-100">anime community</span>, a{" "}
                  <span className="font-medium text-paper-100">store</span>, and{" "}
                  <span className="font-medium text-paper-100">music</span> live side by side.
                  Everything here is crafted, collected, and curated — no noise, no filler.
                </p>
                <p>
                  Dari kode sampai komposisi musik, pembatas antara &ldquo;kerja&rdquo; dan
                  &ldquo;hobi&rdquo; sengaja dihapus. What you see here is one continuous universe.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="neon">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {interests.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                      Interests
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {interests.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                    Sosial
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {Object.keys(socialLinks).length > 0 ? (
                      Object.entries(socialLinks).map(([label, url]) => (
                        <a
                          key={label}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neon-300 underline-offset-4 hover:underline"
                        >
                          {label}
                        </a>
                      ))
                    ) : (
                      <p className="text-xs text-ink-500">
                        {settings ? "Belum ada tautan sosial." : "Database belum dikonfigurasi."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className={glassCard + " p-6"}>
                <div className="flex flex-col items-center text-center">
                  <Avatar
                    name={profile?.display_name ?? ownerName}
                    src={profile?.avatar_url ?? undefined}
                    size="xl"
                  />
                  <h3 className="mt-4 font-display text-h3 uppercase text-paper-50">
                    {profile?.display_name ?? ownerName}
                  </h3>
                  {profile ? (
                    <p className="mt-1 text-sm text-neon-300">@{profile.username}</p>
                  ) : null}
                  {settings ? null : (
                    <p className="mt-2 rounded-lg bg-ink-800/70 px-3 py-1.5 text-xs text-ink-400">
                      Database belum dikonfigurasi — data profil dari seed.
                    </p>
                  )}
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-3">
                  {statItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-ink-800 bg-ink-900/60 p-4 text-center"
                    >
                      <dt className="text-[0.7rem] font-medium uppercase tracking-wider text-ink-400">
                        {item.label}
                      </dt>
                      <dd className="mt-1 font-display text-2xl text-gold-400">
                        {item.value ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-12">
            <Card className="p-8 text-center sm:p-12">
              <CardBody className="p-0">
                <h2 className="font-display text-h2 uppercase text-paper-50">
                  Let’s build together
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-ink-300">
                  Terhubung untuk kolaborasi, proyek, atau sekadar ngobrol soal anime.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/community"
                    className="rounded-md bg-gold-400 px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
                  >
                    Masuk komunitas
                  </Link>
                  <Link
                    href="/projects"
                    className="rounded-md border border-ink-600 px-6 py-2.5 text-sm font-medium text-paper-100 transition-colors hover:border-gold-400 hover:text-gold-400"
                  >
                    Lihat project
                  </Link>
                </div>
              </CardBody>
            </Card>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}