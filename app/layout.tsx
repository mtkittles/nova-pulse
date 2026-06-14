import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"

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
    default: "LUPUS BETS — predykcje piłkarskie napędzane modelem",
    template: "%s · LUPUS BETS",
  },
  description:
    "Mądrzejsze typy zamiast przeczucia. Predykcje BTTS, Over 1.5, Mix i Thriller z oceną Q-Score i automatycznie weryfikowaną skutecznością. Napędzane silnikiem Lupus Bot.",
  applicationName: "LUPUS BETS",
  authors: [{ name: "LUPUS BETS" }],
  icons: {
    icon: "/brand/lupus-bets-mark.png",
    apple: "/brand/lupus-bets-mark.png",
  },
  openGraph: {
    type: "website",
    siteName: "LUPUS BETS",
    title: "LUPUS BETS — predykcje piłkarskie napędzane modelem",
    description: "Predykcje BTTS, Over 1.5, Mix i Thriller z oceną Q-Score i realną skutecznością.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LUPUS BETS",
    description: "Predykcje piłkarskie napędzane modelem Dixon-Coles.",
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
      <body className="bg-[var(--bg-0)] text-[color:var(--text-primary)] antialiased">{children}</body>
    </html>
  )
}
