import { getStats, getSettledTips } from "@/lib/stats"
import { getSession } from "@/lib/auth"
import { mockStats } from "@/lib/mock-stats"
import { isPreviewDemoMode } from "@/lib/preview-mode"
import { AppShell } from "@/components/app-shell"
import { StatsView } from "@/components/stats-view"

export const dynamic = "force-dynamic"

export default async function StatsPage() {
  const previewDemo = isPreviewDemoMode()
  const [data, session, settledTips] = await Promise.all([
    previewDemo
      ? Promise.resolve({ ...mockStats, source: "mock" as const, source_message: "DEMO / Preview data — logowanie Telegram jest wyłączone dla QA." })
      : getStats("30"),
    getSession(),
    previewDemo ? Promise.resolve([]) : getSettledTips(15),
  ])
  const loggedIn = Boolean(session) || previewDemo
  return (
      <AppShell loggedIn={loggedIn} isAdmin={session?.isAdmin}>
      {previewDemo && (
        <div className="mb-6 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] px-5 py-4 text-sm text-amber-100/85">
          DEMO / Preview: widok odblokowany bez Telegram login, dane są mockowe.
        </div>
      )}
      <StatsView
        initial={data}
        initialPeriod="30"
        initialSource={data.source}
        initialSourceMessage={data.source_message}
        loggedIn={loggedIn}
        settledTips={settledTips}
      />
      </AppShell>
    )
}
