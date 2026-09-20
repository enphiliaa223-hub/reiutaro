/**
 * Normalisasi `site_settings` (tabel site_settings, key/value) menjadi
 * objek bertipe. Dipakai server component & client (props), bukan hardcoded.
 */
import type { SiteSettings } from "@/lib/queries/content";

export interface OpeningSettings {
  enabled: boolean;
  duration: number;
  title: string;
  subtitle: string;
  showSkip: boolean;
}

export interface HeroSettings {
  kicker: string;
  tagline: string;
  description: string;
}

export interface FooterSocial {
  label: string;
  url: string;
}

export interface NormalizedSettings {
  brand: string;
  ownerName: string;
  hero: HeroSettings;
  opening: OpeningSettings;
  aboutBio: string;
  footerSocials: FooterSocial[];
  maintenanceMode: boolean;
}

export const DEFAULT_SETTINGS: NormalizedSettings = {
  brand: "REIUTAROU",
  ownerName: "Muhammad Reinaldi",
  hero: {
    kicker: "PERSONAL DIGITAL UNIVERSE",
    tagline: "Welcome to my digital universe.",
    description:
      "Anime-inspired community, projects, store, and music — crafted by Muhammad Reinaldi.",
  },
  opening: {
    enabled: true,
    duration: 4600,
    title: "REIUTAROU",
    subtitle: "YOUR DIGITAL WORLD",
    showSkip: true,
  },
  aboutBio: "Creating digital worlds inspired by anime and game UX.",
  footerSocials: [
    { label: "GitHub", url: "" },
    { label: "X", url: "" },
    { label: "Instagram", url: "" },
  ],
  maintenanceMode: false,
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeSettings(settings: SiteSettings | null): NormalizedSettings {
  if (!settings) return DEFAULT_SETTINGS;

  const rawSocials = settings.footer_socials;
  let footerSocials = DEFAULT_SETTINGS.footerSocials;
  if (Array.isArray(rawSocials)) {
    const parsed = (rawSocials as unknown[])
      .filter((item): item is { label: string; url: string } => {
        const s = item as { label?: unknown; url?: unknown };
        return typeof s?.label === "string" && typeof s?.url === "string";
      })
      .map((s) => ({ label: s.label, url: s.url }));
    if (parsed.length > 0) footerSocials = parsed;
  }

  return {
    brand: asString(settings.brand, DEFAULT_SETTINGS.brand),
    ownerName: asString(settings.owner_name, DEFAULT_SETTINGS.ownerName),
    hero: {
      kicker: asString(settings.hero_kicker, DEFAULT_SETTINGS.hero.kicker),
      tagline: asString(settings.hero_tagline, DEFAULT_SETTINGS.hero.tagline),
      description: asString(settings.hero_description, DEFAULT_SETTINGS.hero.description),
    },
    opening: {
      enabled: asBool(settings.opening_enabled, DEFAULT_SETTINGS.opening.enabled),
      duration: asNumber(settings.opening_duration, DEFAULT_SETTINGS.opening.duration),
      title: asString(settings.opening_title, DEFAULT_SETTINGS.opening.title),
      subtitle: asString(settings.opening_subtitle, DEFAULT_SETTINGS.opening.subtitle),
      showSkip: asBool(settings.opening_show_skip, DEFAULT_SETTINGS.opening.showSkip),
    },
    aboutBio: asString(settings.about_bio ?? settings.hero_description, DEFAULT_SETTINGS.aboutBio),
    footerSocials,
    maintenanceMode: asBool(settings.maintenance_mode, false),
  };
}