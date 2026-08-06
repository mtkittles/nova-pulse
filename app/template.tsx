// Re-montuje się przy KAŻDEJ nawigacji (w odróżnieniu od layout.tsx, który
// przeżywa całą sesję) — właśnie to robi App Router dla `template.tsx`, więc
// to jedyne miejsce, gdzie prosty CSS mount-fade daje efekt przejścia między
// stronami bez View Transitions API (eksperymentalne w Next 15 pod App
// Routerem, ryzykowne bez możliwości pełnego przetestowania na wszystkich
// trasach). Czysty CSS (.page-transition w globals.css) — zero JS-owego
// stanu, działa też bez hydratacji.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>
}
