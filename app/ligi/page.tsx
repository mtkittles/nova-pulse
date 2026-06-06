import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { LigiView } from "@/components/ligi-view"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  return (
    <AppShell loggedIn={Boolean(session)}>
      <LigiView />
    </AppShell>
  )
}
