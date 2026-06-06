import Link from "next/link"
import { ArrowLeft, Goal } from "lucide-react"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, getSession()])

  return (
    <AppShell loggedIn={Boolean(session)}>
      <Link
        href="/typy"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do typów
      </Link>

      <div className="grid min-h-[40vh] place-items-center">
        <div className="max-w-md rounded-[2rem] border border-white/12 bg-white/[0.05] p-10 text-center backdrop-blur">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 text-[color:var(--accent)]">
            <Goal className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Szczegóły meczu</h1>
          <p className="mt-3 leading-7 text-white/55">
            Tu pojawi się analiza meczu: forma drużyn, H2H, prawdopodobieństwa i predykcje
            (endpoint <code className="text-white/70">/match/{id}</code>). Wypełnimy w Fazie B.
          </p>
          <p className="mt-4 text-xs text-white/35">event_id: {id}</p>
        </div>
      </div>
    </AppShell>
  )
}
