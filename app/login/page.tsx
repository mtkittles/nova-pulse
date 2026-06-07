import Link from "next/link"
import { redirect } from "next/navigation"
import { randomUUID } from "crypto"
import { ArrowLeft, Mail } from "lucide-react"
import { Brand } from "@/components/brand"
import { DeepLinkLogin } from "@/components/deep-link-login"
import { getSession } from "@/lib/auth"
import { createPendingToken } from "@/lib/login-tokens"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect("/stats")

  const token = randomUUID()
  await createPendingToken(token)

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[var(--bg)] px-6 text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-[var(--glow-1)] blur-3xl" />
        <div className="absolute right-[-120px] bottom-10 h-96 w-96 rounded-full bg-[var(--glow-2)] blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Strona główna
        </Link>

        <div className="rounded-[2rem] border border-white/12 bg-white/[0.06] p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-6">
            <Brand />
          </div>

          <h1 className="text-2xl font-semibold">Zaloguj się</h1>
          <p className="mt-3 mb-6 text-sm leading-6 text-white/55">
            Logowanie odblokowuje pełne statystyki, historię i filtry — za darmo.
            Kliknij przycisk poniżej, naciśnij{" "}
            <strong className="text-white/80">START</strong> w Telegramie i wróć na tę stronę.
          </p>

          <DeepLinkLogin token={token} redirectTo="/stats" />

          <div className="my-6 flex items-center gap-3 text-xs text-white/35">
            <span className="h-px flex-1 bg-white/10" />
            email wkrótce
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid gap-4 opacity-60">
            <label className="grid gap-2">
              <span className="text-sm text-white/55">Email</span>
              <input
                type="email"
                disabled
                placeholder="twoj@email.com"
                className="rounded-2xl border border-white/10 bg-[var(--bg)]/70 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />
            </label>
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)]"
            >
              <Mail className="h-4 w-4" />
              Zaloguj przez email
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/30">
          Logując się, akceptujesz, że typy to predykcje statystyczne, a nie
          gwarancja wygranej. 18+ · graj odpowiedzialnie.
        </p>
      </div>
    </main>
  )
}
