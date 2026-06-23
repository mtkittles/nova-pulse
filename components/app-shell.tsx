import type { ReactNode } from "react"
import { AppNav } from "./app-nav"

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
    <main className="signal-bg min-h-screen overflow-hidden text-[color:var(--text-primary)]">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-[-140px] top-[-140px] h-96 w-96 rounded-full bg-[var(--glow-1)] blur-3xl" />
        <div className="absolute right-[-120px] top-40 hidden h-96 w-96 rounded-full bg-[var(--glow-2)] blur-3xl sm:block" />
        <div className="signal-grid absolute inset-0" />
      </div>

      <AppNav loggedIn={loggedIn} isAdmin={isAdmin} />

      <div className="signal-bottom-safe mx-auto max-w-7xl px-5 pt-8 sm:px-6 sm:pt-10 lg:pb-14">{children}</div>
    </main>
  )
}
