// Stałe ambientowe tło (globalne, root layout) — "zaparowana szyba z
// przechodzącymi światłami". Trzy warstwy, position:fixed, pełny viewport,
// nie scrolluje się z treścią:
//  1. Światła — 4 duże, mocno rozmyte plamy (cyan + chłodny błękit/fiolet),
//     każda z osobnym powolnym dryfem po elipsie.
//  2. Szyba — półprzezroczysta warstwa z backdrop-filter (blur+saturate),
//     rozmywa światła w matową łunę zamiast ostrych okręgów.
//  3. Ziarno — bardzo subtelna tekstura SVG (feTurbulence), żeby uniknąć
//     banding-u na gradientach.
// Dryf świateł wyłączony pod prefers-reduced-motion — patrz globals.css.
export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden>
      <div className="ambient-light ambient-light-1" />
      <div className="ambient-light ambient-light-2" />
      <div className="ambient-light ambient-light-3" />
      <div className="ambient-light ambient-light-4" />
      <div className="ambient-glass" />
      <div className="ambient-noise" />
    </div>
  )
}
