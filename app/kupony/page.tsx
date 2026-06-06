import { Ticket } from "lucide-react"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { ComingSoon } from "@/components/coming-soon"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  return (
    <AppShell loggedIn={Boolean(session)}>
      <ComingSoon
        icon={Ticket}
        title="Kupony"
        desc="Budowniczy kuponów AKO i propozycje kuponu dnia od bota. Wkrótce."
      />
    </AppShell>
  )
}
