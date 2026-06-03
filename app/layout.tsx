import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Nova-Pulse — Panel typów Lupus Bot",
  description:
    "Web-interfejs bota Lupus: predykcje piłkarskie BTTS, Over 1.5 i Mix z oceną jakości Q-Score.",
  authors: [{ name: "mtkittles" }],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Nova-Pulse — Panel typów Lupus Bot",
    description: "Predykcje piłkarskie BTTS, Over 1.5 i Mix napędzane silnikiem Lupus Bot.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className="bg-[#070812] text-white">{children}</body>
    </html>
  )
}
