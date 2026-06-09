import { redirect } from "next/navigation"
import { Ticket } from "lucide-react"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { ComingSoon } from "@/components/coming-soon"

export const dynamic = "force-dynamic"

export const metadata = { title: "Kupony", description: "Budowniczy kuponów AKO i kupon dnia." }


export default async function Page() {
  const session = await getSession()
  if (!session) redirect("/login")
  const premium = session.tier === "premium"
  return (
    <AppShell loggedIn isAdmin={session.isAdmin}>
      <ComingSoon
        icon={Ticket}
        title="Kupony"
        desc={
          premium
            ? "Budowniczy kuponów AKO i kupon dnia od bota. Wkrótce (Faza D)."
            : "Budowniczy kuponów i AI to funkcje premium. Wkrótce udostępnimy (Faza D)."
        }
      />
    </AppShell>
  )
}
