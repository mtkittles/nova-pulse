import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { DEMO_MODE } from "@/lib/demo-mode"
import { AmbientBackground } from "@/components/ambient-background"
import { CursorGlow } from "@/components/cursor-glow"
import { ClickSoundListener } from "@/components/click-sound-listener"

// Tekst UI — Inter; nagłówki/wyświetlanie — Space Grotesk (max 2 rodziny).
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-space-grotesk",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nova-pulse-sage.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LUPUS PRED — Analiza, nie przeczucie",
    template: "%s · LUPUS PRED",
  },
  description:
    "Silnik łączy model goli Poissona/Dixon-Coles, kalibrację prawdopodobieństw i własny Q-Score. Typy z przewagą nad bukmacherem.",
  applicationName: "LUPUS PRED",
  authors: [{ name: "LUPUS PRED" }],
  icons: {
    icon: "/brand/wolf-icon.png",
    apple: "/brand/wolf-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "LUPUS PRED",
    url: SITE_URL,
    title: "LUPUS PRED — Analiza, nie przeczucie",
    description:
      "Silnik łączy model goli Poissona/Dixon-Coles, kalibrację prawdopodobieństw i własny Q-Score. Typy z przewagą nad bukmacherem.",
    // Obraz OG: dynamiczny app/opengraph-image.tsx (konwencja Next, auto-dołączany).
  },
  twitter: {
    card: "summary_large_image",
    title: "LUPUS PRED — Analiza, nie przeczucie",
    description:
      "Silnik łączy model goli Poissona/Dixon-Coles, kalibrację prawdopodobieństw i własny Q-Score. Typy z przewagą nad bukmacherem.",
  },
}

export const viewport: Viewport = {
  themeColor: "#05070b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // safe-area (notch/home indicator)
}

// Tylko ciemny motyw (Graphite Night) — brak przełącznika, brak migotania.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      {/* isolate: body dostaje własny stacking context, żeby AmbientBackground
          (position:fixed, z-index:-1) malował się MIĘDZY tłem body a treścią —
          bez tego przeglądarka "promuje" solidne tło body na kanwę viewportu,
          która maluje się PONIŻEJ potomków o ujemnym z-index (klasyczna
          pułapka CSS), więc ambient byłby całkowicie niewidoczny mimo
          poprawnych stylów. */}
      <body className="isolate bg-[var(--bg-0)] text-[color:var(--text-primary)] antialiased">
        <AmbientBackground />
        <CursorGlow />
        <ClickSoundListener />
        {DEMO_MODE && (
          <div className="flex h-8 items-center justify-center gap-2 border-b border-amber-400/20 bg-amber-400/10 px-4 text-center text-xs font-medium text-amber-300">
            🔍 Tryb demonstracyjny — dane przykładowe, profil mockowy
          </div>
        )}
        {children}
      </body>
    </html>
  )
}
