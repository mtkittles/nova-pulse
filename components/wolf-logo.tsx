// Geometryczne logo wilka (Lupus). Kolory z motywu (zmienne CSS),
// więc mark zmienia się razem z przełącznikiem motywu.
export function WolfLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path
        d="M32 58 L18 44 L22 33 L12 31 L16 15 L26 24 L32 20 L38 24 L48 15 L52 31 L42 33 L46 44 Z"
        fill="var(--accent)"
      />
      {/* oczy (negatyw w kolorze tła) */}
      <path d="M24 30 L29.5 31.5 L25 34 Z" fill="var(--bg)" />
      <path d="M40 30 L34.5 31.5 L39 34 Z" fill="var(--bg)" />
      {/* nos */}
      <path d="M32 50 L29 45 L35 45 Z" fill="var(--accent-2)" />
    </svg>
  )
}
