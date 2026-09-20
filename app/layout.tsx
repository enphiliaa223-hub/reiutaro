import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import { ToastProvider } from "@/components/ui";
import { MusicProvider } from "@/components/provider/music-provider";
import { OpeningScreen } from "@/components/layout/opening-screen";
import { getActiveTracks, getSiteSettings } from "@/lib/queries/content";
import { normalizeSettings } from "@/lib/settings";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "REIUTAROU — Your Digital Universe",
    template: "%s | REIUTAROU",
  },
  description:
    "REIUTAROU — personal digital universe by Muhammad Reinaldi. Projects, anime community, store, and music.",
  applicationName: "REIUTAROU",
  formatDetection: { telephone: false },
  other: {
    // Cegah browser/Chrome menerjemahkan nama brand secara otomatis.
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050507",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [settings, tracks] = await Promise.all([getSiteSettings(), getActiveTracks()]);
  const normalized = normalizeSettings(settings);

  return (
    <html
      lang="en"
      translate="no"
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} notranslate h-full antialiased`}
    >
      <body className="min-h-full">
        <MusicProvider initialTracks={tracks}>
          <ToastProvider>{children}</ToastProvider>
          <OpeningScreen settings={normalized.opening} />
        </MusicProvider>
      </body>
    </html>
  );
}
