"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

const ITEMS: { q: string; a: string }[] = [
  {
    q: "Czym jest LUPUS BETS?",
    a: "To interfejs nad silnikiem predykcji piłkarskich Lupus Bot. Silnik (model Dixon-Coles) liczy prawdopodobieństwa, a my pokazujemy gotowe typy: BTTS, Over 1.5, Mix oraz tryb Thriller (dokładny wynik 3:2/2:3).",
  },
  {
    q: "Czy strona liczy typy na żywo?",
    a: "Nie. Typy liczy silnik bota wcześniej i zapisuje do bazy. Strona tylko serwuje gotowe rekordy — dzięki temu jest szybka, a silnik nie jest obciążany.",
  },
  {
    q: "Co oznacza Q-Score?",
    a: "Q-Score (0–100) to złożony wskaźnik jakości typu. Łączy prawdopodobieństwo modelu, edge (przewagę nad kursem) i kalibrację. Im wyższy, tym pewniejszy typ — co widać na wykresie kalibracji w statystykach.",
  },
  {
    q: "Czym jest edge?",
    a: "Edge to przewaga modelu nad kursem bukmachera — różnica między prawdopodobieństwem modelu a tym zaszytym w kursie. Dodatni edge oznacza wartość (value bet).",
  },
  {
    q: "Czy typy gwarantują wygraną?",
    a: "Nie. Żadne typy nie dają gwarancji. To predykcje statystyczne obarczone ryzykiem. Tryb Thriller jest szczególnie wysokiego ryzyka. Graj odpowiedzialnie i tylko za pieniądze, które możesz stracić.",
  },
  {
    q: "Ile to kosztuje?",
    a: "Na start wszystko jest darmowe. Logowanie (przez Telegram) odblokowuje pełne statystyki, historię i filtry — również bez opłat.",
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="grid gap-3">
      {ITEMS.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-[1.4rem] border border-white/12 bg-white/[0.05] backdrop-blur"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/[0.03]"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-white">{item.q}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-[color:var(--accent)] transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <p className="px-6 pb-5 leading-7 text-white/60">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
