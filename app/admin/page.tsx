import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { AdminPanel } from "@/components/admin-panel"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  if (!session?.isAdmin) redirect("/")

  return (
    <AppShell loggedIn isAdmin>
      <AdminPanel name={session.name || session.username || `ID ${session.uid}`} />
    </AppShell>
  )
}
