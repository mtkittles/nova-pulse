import { Newspaper } from "lucide-react"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { ComingSoon } from "@/components/coming-soon"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  return (
    <AppShell loggedIn={Boolean(session)}>
      <ComingSoon
        icon={Newspaper}
        title="Newsy"
        desc="Aktualności, analizy i podsumowania meczów (AI). Sekcja w przygotowaniu."
      />
    </AppShell>
  )
}
