import { Activity, CheckCircle2, Cpu, type LucideIcon } from "lucide-react"

export type HowItWorksStep = { icon: LucideIcon; title: string; text: string }

// Trzy kroki modelu — źródło współdzielone przez sekcję "Jak działa model"
// (landing-page.tsx) i rotujący opis w hero (hero-kinetic.tsx).
export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    icon: Activity,
    title: "Dane i forma",
    text: "Zbieramy wyniki, formę drużyn i historię H2H z dziesiątek lig.",
  },
  {
    icon: Cpu,
    title: "Model goli + kalibracja + Q-Score",
    text: "Silnik łączy model goli Poissona/Dixon-Coles, kalibrację prawdopodobieństw i własny Q-Score.",
  },
  {
    icon: CheckCircle2,
    title: "Automatyczna weryfikacja na żywo",
    text: "Aktualizujemy wynik na żywo i rozliczamy typy po zakończeniu meczu.",
  },
]
