import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Cpu, Layers3, Menu, Sparkles, X, Zap } from "lucide-react"

const cards = [
  {
    icon: Cpu,
    title: "Nowoczesny stack",
    text: "React, Vite i Tailwind jako szybka baza pod stronę, portfolio albo aplikację.",
  },
  {
    icon: Layers3,
    title: "Responsywny layout",
    text: "Układ przygotowany pod komputer, tablet i telefon od samego początku.",
  },
  {
    icon: Zap,
    title: "Animacje",
    text: "Subtelne przejścia i efekty, które dodają stronie życia bez przesady.",
  },
]
const navItems = [
  { label: "Start", href: "#start" },
  { label: "Funkcje", href: "#features" },
  { label: "Design", href: "#design" },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen overflow-hidden bg-[#070812] text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>
<header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
  <a href="#start" className="flex items-center gap-3">
    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
      <Sparkles className="h-5 w-5 text-cyan-300" />
    </div>
    <span className="text-xl font-semibold">NovaPulse</span>
  </a>

  <nav className="hidden gap-8 text-sm text-white/60 md:flex">
    {navItems.map((item) => (
      <a key={item.href} href={item.href} className="transition hover:text-white">
        {item.label}
      </a>
    ))}
  </nav>

  <a
    href="#features"
    className="hidden rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/15 md:block"
  >
    Zobacz projekt
  </a>

  <button
    type="button"
    onClick={() => setMenuOpen((value) => !value)}
    className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur md:hidden"
    aria-label="Otwórz menu"
  >
    {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
  </button>

  {menuOpen && (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="absolute left-6 right-6 top-20 rounded-3xl border border-white/15 bg-[#10111d]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden"
    >
      <nav className="grid gap-2">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            className="rounded-2xl px-4 py-3 text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </a>
        ))}

        <a
          href="#features"
          onClick={() => setMenuOpen(false)}
          className="mt-2 rounded-2xl bg-cyan-300 px-4 py-3 text-center font-semibold text-[#070812]"
        >
          Zobacz projekt
        </a>
      </nav>
    </motion.div>
  )}
</header>
      <section
        id="start"
        className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-6 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            Experimental web concept 2026
          </div>

          <h1 className="text-5xl font-semibold tracking-[-0.06em] sm:text-6xl lg:text-7xl">
            Strona, która wygląda jak nowoczesny produkt cyfrowy.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
            To pierwszy projekt strony internetowej: ciemny klimat, gradienty,
            szkło, animacje, duża typografia i układ gotowy pod dalszą rozbudowę.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#features"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#070812] transition hover:scale-105"
            >
              Zaczynamy
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>

            <a
              href="#design"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/15"
            >
              Zobacz layout
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-cyan-400/25 via-violet-500/20 to-transparent blur-2xl" />

          <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.075] p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0b0c18]/90 p-6">
              <p className="text-sm text-white/45">Live preview</p>
              <h2 className="mt-2 text-3xl font-semibold">Control Panel</h2>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-sm text-white/45">Design quality</p>
                  <p className="mt-3 text-4xl font-semibold">92%</p>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-cyan-300"
                      initial={{ width: 0 }}
                      animate={{ width: "92%" }}
                      transition={{ duration: 1.2, delay: 0.4 }}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-400/20 to-white/[0.05] p-5">
                  <p className="text-sm text-white/45">Layout</p>
                  <p className="mt-3 text-3xl font-semibold">PC + Mobile</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <p className="mb-4 font-medium">Etapy projektu</p>

                {["Hero section", "Feature cards", "Mobile layout"].map(
                  (item) => (
                    <div
                      key={item}
                      className="mb-3 flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-white/70 last:mb-0"
                    >
                      {item}
                      <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                        ready
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">
            Funkcje
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Prosty projekt, ale z efektem strony premium.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = card.icon

            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-[2rem] border border-white/12 bg-white/[0.06] p-7 shadow-2xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.09]"
              >
                <div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-cyan-200">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="mt-3 leading-7 text-white/60">{card.text}</p>
              </motion.article>
            )
          })}
        </div>
      </section>

      <section id="design" className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2.4rem] border border-white/12 bg-gradient-to-br from-white/[0.10] to-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">
            Następny krok
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Teraz możemy zrobić z tego prawdziwą stronę.
          </h2>

          <p className="mt-6 max-w-2xl leading-8 text-white/60">
            W kolejnym etapie dodamy menu mobilne, więcej sekcji, animacje przy
            scrollowaniu, lepsze fonty, własną paletę kolorów i później
            wdrożenie online.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
