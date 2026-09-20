import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/site/section-heading";
import { TrackList } from "@/components/music/track-list";

export const metadata: Metadata = { title: "Music — Reiutarou" };
export const revalidate = 60;

export default function MusicPage() {
  return (
    <Section id="music" className="bg-ink-950">
      <Container>
        <SectionHeading
          kicker="Music"
          title="Ambience & Tracks"
          description="Musik ambient untuk menemani bekerja, belajar, dan menjelajah universum Reiutarou. Player floating muncul di kanan bawah layar."
          align="left"
        />
        <div className="mt-10 max-w-3xl">
          <TrackList />
        </div>
      </Container>
    </Section>
  );
}