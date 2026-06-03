import Link from "next/link"
import { ArrowLeft, Mail, Send, Sparkles } from "lucide-react"

// Placeholder pod Etap 4 (logowanie Telegram + email/JWT).
// Na razie wyłącznie UI — bez realnego uwierzytelniania.
export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[#070812] px-6 text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute right-[-120px] bottom-10 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
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
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10">
              <Sparkles className="h-5 w-5 text-cyan-300" />
            </div>
            <span className="text-xl font-semibold">Zaloguj się</span>
          </div>

          <p className="mb-6 text-sm leading-6 text-white/55">
            Logowanie (Telegram + email) zostanie podłączone w kolejnym etapie.
            Poniżej widać docelowy interfejs.
          </p>

          <button
            type="button"
            disabled
            className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#229ED9] px-6 py-3 font-semibold text-white opacity-70"
          >
            <Send className="h-4 w-4" />
            Zaloguj przez Telegram
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-white/35">
            <span className="h-px flex-1 bg-white/10" />
            albo
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid gap-4 opacity-70">
            <label className="grid gap-2">
              <span className="text-sm text-white/55">Email</span>
              <input
                type="email"
                disabled
                placeholder="twoj@email.com"
                className="rounded-2xl border border-white/10 bg-[#090a15]/70 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-white/55">Hasło</span>
              <input
                type="password"
                disabled
                placeholder="••••••••"
                className="rounded-2xl border border-white/10 bg-[#090a15]/70 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />
            </label>
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3 font-semibold text-[#070812]"
            >
              <Mail className="h-4 w-4" />
              Zaloguj przez email
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
