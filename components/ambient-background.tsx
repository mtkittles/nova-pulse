// Stałe ambientowe tło (globalne, root layout) — siatka linii + trzy rozmyte
// plamy --cyan ułożone po przekątnej (góra-prawo / środek / dół-lewo), jak
// w Cerebrium. position:fixed — nie scrolluje się z treścią, cały czas
// widoczne za stronami (wszystkimi, nie tylko landingiem — siatka wcześniej
// żyła lokalnie tylko w app-shell.tsx). Powolny dryf plam (CSS, 24-30s pętla)
// wyłączony pod prefers-reduced-motion — patrz globals.css.
export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden>
      <div className="ambient-grid" />
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />
    </div>
  )
}
