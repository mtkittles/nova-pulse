import type { ReactNode } from "react"
import { SiteHeader } from "./site-header"
import { MobileTabBar } from "./mobile-tab-bar"

// Wspólna powłoka stron aplikacji: tło, nawigacja (header + dolny tab-bar),
// margines dolny pod tab-bar na mobile.
export function AppShell({
  loggedIn,
  isAdmin = false,
  children,
}: {
  loggedIn: boolean
  isAdmin?: boolean
  children: ReactNode
}) {
  return (
    <main className="min-h-screen text-white">
      {/* tło samo w sobie przezroczyste — ambientowe tło z root layout
          (siatka + plamy --cyan) musi być widoczne w przerwach */}
      <SiteHeader loggedIn={loggedIn} isAdmin={isAdmin} />

      <div className="mx-auto max-w-[1600px] px-[clamp(1.5rem,5vw,5rem)] pb-28 pt-10 lg:pb-14">{children}</div>

      <MobileTabBar />
    </main>
  )
}
