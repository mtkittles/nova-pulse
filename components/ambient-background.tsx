// Stałe ambientowe tło (globalne, root layout) — trzy rozmyte plamy --cyan
// ułożone po przekątnej (góra-prawo / środek / dół-lewo), jak w Cerebrium.
// position:fixed — nie scrolluje się z treścią, cały czas widoczne za stronami.
// Bardzo niska opacity (3-6%): efekt ma być zauważalny w przerwach między
// sekcjami, nie konkurować z kartami/danymi. Powolny dryf (CSS, 24-30s pętla)
// wyłączony pod prefers-reduced-motion — patrz globals.css.
export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden>
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />
    </div>
  )
}
