import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { LigiView } from "@/components/ligi-view"

export const dynamic = "force-dynamic"

export const metadata = { title: "Ligi", description: "Tabele ligowe, strzelcy i forma drużyn." }


export default async function Page() {
  const session = await getSession()
  if (!session) redirect("/login")
  return (
    <AppShell loggedIn isAdmin={session.isAdmin}>
      <LigiView />
    </AppShell>
  )
}
