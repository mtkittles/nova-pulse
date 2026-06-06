import { Trophy } from "lucide-react"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { ComingSoon } from "@/components/coming-soon"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  return (
    <AppShell loggedIn={Boolean(session)}>
      <ComingSoon
        icon={Trophy}
        title="Ligi"
        desc="Tabele ligowe, listy strzelców i forma drużyn. Podłączymy do endpointów Oracle (/team/{id}/form, standings) w kolejnej fazie."
      />
    </AppShell>
  )
}
