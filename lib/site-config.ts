/**
 * Konfigurasi situs default (Phase 3).
 * TODO Phase 10 — diganti oleh data dari tabel `site_settings` (Visual Editor),
 * sehingga admin bisa mengubah tanpa source code.
 */
export const siteConfig = {
  brand: "REIUTAROU",
  owner: "Muhammad Reinaldi",
  tagline: "Welcome to my digital universe.",
  hero: {
    kicker: "PERSONAL DIGITAL UNIVERSE",
    description:
      "Anime-inspired community, projects, store, and music — crafted by Muhammad Reinaldi.",
  },
  opening: {
    enabled: true,
    /** Durasi (ms) sampai otomatis masuk ke homepage. */
    duration: 4600,
    title: "REIUTAROU",
    subtitle: "YOUR DIGITAL WORLD",
    showSkip: true,
  },
} as const;
