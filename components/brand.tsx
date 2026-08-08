import Link from "next/link"
import Image from "next/image"

// Sygnet (głowa wilka) — nagłówek, favicon-zastępnik.
export function OgarMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/brand/wolf-icon.png"
      width={size}
      height={size}
      alt="Lupus Pred"
      priority
      className="object-contain"
    />
  )
}

// Pełny lockup (głowa + napis + tagline) — hero, share, emaile.
export function OgarHorizontal({ height = 48 }: { height?: number }) {
  return (
    <Image
      src="/brand/lupus-pred-full.png"
      width={height}
      height={height}
      alt="Lupus Pred"
      priority
      className="object-contain"
    />
  )
}

// Sam sygnet w większym rozmiarze — karty, social media.
export function OgarStacked({ width = 200 }: { width?: number }) {
  return (
    <Image
      src="/brand/wolf-icon.png"
      width={width}
      height={width}
      alt="Lupus Pred"
      priority
      className="object-contain"
    />
  )
}

// Lockup nagłówka: sygnet w kwadracie + napis.
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur transition group-hover:scale-105 md:h-11 md:w-11">
        <OgarMark size={36} />
      </span>
      <span className="text-xl font-semibold tracking-tight text-white">
        LUPUS <span className="text-[color:var(--accent)]">PRED</span>
      </span>
    </Link>
  )
}
