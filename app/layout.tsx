import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "LUPUS BETS — predykcje piłkarskie napędzane modelem",
  description:
    "Mądrzejsze typy zamiast przeczucia. Predykcje BTTS, Over 1.5, Mix i Thriller z oceną Q-Score i automatycznie weryfikowaną skutecznością. Napędzane silnikiem Lupus Bot.",
  authors: [{ name: "LUPUS BETS" }],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "LUPUS BETS — predykcje piłkarskie napędzane modelem",
    description:
      "Predykcje BTTS, Over 1.5, Mix i Thriller z oceną Q-Score i realną skutecznością.",
    type: "website",
  },
}

// Ustawia motyw z localStorage PRZED pierwszym malowaniem — brak migotania.
const themeScript = `
try {
  var t = localStorage.getItem('lupus-theme');
  if (t !== 'nova' && t !== 'lupus') t = 'nova';
  document.documentElement.dataset.theme = t;
} catch (e) {}
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" data-theme="nova">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[var(--bg)] text-white">{children}</body>
    </html>
  )
}
