import { redirect } from "next/navigation"
import { Newspaper } from "lucide-react"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { ComingSoon } from "@/components/coming-soon"

export const dynamic = "force-dynamic"

export const metadata = { title: "Newsy", description: "Aktualności i analizy meczów." }


export default async function Page() {
  const session = await getSession()
  if (!session) redirect("/login")
  return (
    <AppShell loggedIn isAdmin={session.isAdmin}>
      <ComingSoon
        icon={Newspaper}
        title="Newsy"
        desc="Aktualności, analizy i podsumowania meczów (AI). Sekcja w przygotowaniu."
      />
    </AppShell>
  )
}
