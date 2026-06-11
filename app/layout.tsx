import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
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
  themeColor: "#070812",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // safe-area (notch/home indicator)
}

// Ustawia motyw z cookie PRZED pierwszym malowaniem — brak migotania. Domyślny: ciemny.
const themeScript = `
try {
  var m = document.cookie.match(/(?:^|; )theme=(dark|light)/);
  document.documentElement.dataset.theme = m ? m[1] : 'dark';
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" data-theme="dark" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[var(--bg)] text-[color:var(--text)] antialiased">{children}</body>
    </html>
  )
}
