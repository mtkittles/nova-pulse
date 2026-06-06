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
    <main className="min-h-screen overflow-hidden bg-[var(--bg)] text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-[var(--glow-1)] blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-[var(--glow-2)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <AppNav loggedIn={loggedIn} isAdmin={isAdmin} />

      <div className="mx-auto max-w-7xl px-6 pb-28 pt-10 lg:pb-14">{children}</div>
    </main>
  )
}
